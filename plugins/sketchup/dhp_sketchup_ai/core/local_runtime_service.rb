require 'json'
require 'net/http'
require 'uri'
require 'fileutils'
require 'tmpdir'
require 'socket'

module DaiHaiPhat
  module SketchUpAI
    module LocalRuntimeService
      module_function

      BRIDGE_URL = 'http://127.0.0.1:8787'.freeze
      COMFY_URL = 'http://127.0.0.1:8188'.freeze

      def status
        bridge = get_json("#{BRIDGE_URL}/api/health", 1.2)
        return normalize_bridge_status(bridge) if bridge

        bridge_running = port_alive?('127.0.0.1', 8787)
        comfy_running = port_alive?('127.0.0.1', 8188)
        launcher = comfy_launcher
        {
          ready: false,
          bridge_running: bridge_running,
          comfy_running: comfy_running,
          comfy_launcher: launcher,
          node: node_command,
          message: if bridge_running && !comfy_running
                     launcher ? 'Local Bridge đang chạy; ComfyUI đang khởi động hoặc chưa sẵn sàng.' : 'Local Bridge đang chạy; chưa tìm thấy ComfyUI trên máy.'
                   elsif bridge_running
                     'Local Bridge + ComfyUI đã chạy nhưng chưa có checkpoint tương thích.'
                   elsif !comfy_running && !launcher
                     'Chưa tìm thấy ComfyUI. Cài ComfyUI + checkpoint một lần để dùng Local AI.'
                   else
                     'Local Bridge chưa chạy.'
                   end
        }
      end

      def diagnostics
        node = node_command
        node_version = command_output(node ? [node, '--version'] : nil)
        comfy_stats = get_json("#{COMFY_URL}/system_stats", 1.2)
        bridge_health = get_json("#{BRIDGE_URL}/api/health", 1.2)
        launcher = comfy_launcher

        checks = [
          check('node', !node.nil?, node ? "Node #{node_version.empty? ? 'detected' : node_version}" : 'Không tìm thấy Node.js 18+.', node),
          check('bridge_bundle', File.file?(bridge_file), File.file?(bridge_file) ? 'Local Bridge có trong RBZ.' : 'Thiếu server.mjs trong RBZ.', bridge_file),
          check('comfy_install', !launcher.nil? || !comfy_stats.nil?, launcher || comfy_stats ? 'Đã tìm thấy ComfyUI.' : 'Chưa tìm thấy ComfyUI.', launcher),
          check('comfy_api', !comfy_stats.nil?, comfy_stats ? 'ComfyUI API :8188 phản hồi.' : 'ComfyUI API :8188 chưa phản hồi.', COMFY_URL),
          check('checkpoint', !bridge_health.nil?, bridge_health ? "Checkpoint: #{bridge_health['checkpoint']}" : 'Chưa xác nhận checkpoint. Khởi động Local AI để kiểm tra.', bridge_health && bridge_health['checkpoint']),
          check('bridge_api', !bridge_health.nil?, bridge_health ? 'Local Bridge :8787 sẵn sàng.' : 'Local Bridge :8787 chưa sẵn sàng.', BRIDGE_URL)
        ]

        required = checks.select { |item| %w[node bridge_bundle comfy_install comfy_api checkpoint bridge_api].include?(item[:id]) }
        ready = required.all? { |item| item[:ok] }
        {
          ready: ready,
          checks: checks,
          summary: ready ? 'Local AI diagnostics PASS.' : 'Local AI chưa hoàn tất. Xem các mục FAIL bên dưới.',
          status: status
        }
      end

      def start
        current = status
        return current.merge(started: false) if current[:ready]

        comfy_launch = start_comfyui_if_available unless current[:comfy_running]

        unless current[:bridge_running]
          node = node_command
          raise 'Không tìm thấy Node.js 18+. Hãy cài Node.js rồi thử lại.' unless node
          raise 'Thiếu Local Bridge trong gói cài. Hãy cài lại RBZ v0.7.2.' unless File.file?(bridge_file)

          log_dir = File.join(ENV['LOCALAPPDATA'].to_s.empty? ? Dir.tmpdir : ENV['LOCALAPPDATA'], 'DaiHaiPhat', 'LuxRender')
          FileUtils.mkdir_p(log_dir)
          @log_file = File.join(log_dir, 'local-runtime.log')
          log = File.open(@log_file, 'a')
          log.sync = true

          @pid = Process.spawn(node, bridge_file, chdir: File.dirname(bridge_file), out: log, err: log, new_pgroup: true)
          Process.detach(@pid)
        end

        60.times do
          sleep 0.5
          bridge = get_json("#{BRIDGE_URL}/api/health", 0.8)
          return normalize_bridge_status(bridge).merge(started: true, pid: @pid, log: @log_file) if bridge
          break if comfy_launch && comfy_launch[:found] == false && port_alive?('127.0.0.1', 8787)
        end

        status.merge(started: true, pid: @pid, log: @log_file)
      ensure
        log.close if defined?(log) && log && !log.closed?
      end

      def stop
        if @pid
          begin
            Process.kill('KILL', @pid.to_i)
          rescue Errno::ESRCH, Errno::EINVAL
          end
        end
        @pid = nil
        { stopped: true, ready: false, message: 'Đã dừng LuxRender Local Bridge.' }
      end

      def open_log
        path = @log_file.to_s
        return { opened: false, message: 'Chưa có log Local Runtime.' } if path.empty? || !File.file?(path)
        UI.openURL("file:///#{path.tr('\\', '/')}")
        { opened: true, path: path }
      end

      def bridge_file
        File.expand_path(File.join(__dir__, '..', 'local_runtime', 'server.mjs'))
      end

      def node_command
        configured = ENV['LUXRENDER_NODE_PATH'].to_s.strip
        return configured if !configured.empty? && File.file?(configured)

        candidates = []
        program_files = ENV['ProgramFiles'].to_s
        candidates << File.join(program_files, 'nodejs', 'node.exe') unless program_files.empty?
        local = ENV['LOCALAPPDATA'].to_s
        candidates << File.join(local, 'Programs', 'nodejs', 'node.exe') unless local.empty?
        found = candidates.find { |path| File.file?(path) }
        return found if found

        output = `where node 2>NUL`.to_s.lines.first.to_s.strip
        output.empty? ? nil : output
      rescue
        nil
      end

      def comfy_launcher
        configured = ENV['LUXRENDER_COMFY_LAUNCHER'].to_s.strip
        return configured if !configured.empty? && File.file?(configured)

        home = ENV['USERPROFILE'].to_s
        local = ENV['LOCALAPPDATA'].to_s
        candidates = [
          File.join(home, 'ComfyUI_windows_portable', 'run_nvidia_gpu.bat'),
          File.join(home, 'ComfyUI_windows_portable', 'run_cpu.bat'),
          File.join(home, 'Desktop', 'ComfyUI_windows_portable', 'run_nvidia_gpu.bat'),
          File.join(home, 'Downloads', 'ComfyUI_windows_portable', 'run_nvidia_gpu.bat'),
          File.join(home, 'Downloads', 'ComfyUI_windows_portable', 'run_cpu.bat'),
          File.join(local, 'Programs', 'ComfyUI', 'ComfyUI.exe'),
          File.join(local, 'ComfyUI', 'ComfyUI.exe')
        ]
        candidates.find { |path| !path.empty? && File.file?(path) }
      end

      def start_comfyui_if_available
        return { started: false, running: true } if port_alive?('127.0.0.1', 8188)
        launcher = comfy_launcher
        return { started: false, running: false, found: false } unless launcher

        if File.extname(launcher).downcase == '.bat'
          pid = Process.spawn('cmd.exe', '/c', "\"#{launcher}\"", chdir: File.dirname(launcher), out: File::NULL, err: File::NULL, new_pgroup: true)
        else
          pid = Process.spawn(launcher, chdir: File.dirname(launcher), out: File::NULL, err: File::NULL, new_pgroup: true)
        end
        Process.detach(pid)
        @comfy_pid = pid
        { started: true, running: false, found: true, launcher: launcher, pid: pid }
      rescue => e
        { started: false, running: false, found: true, launcher: launcher, error: e.message }
      end

      def normalize_bridge_status(payload)
        {
          ready: true,
          bridge_running: true,
          comfy_running: true,
          checkpoint: payload['checkpoint'],
          provider: payload['provider'] || 'comfyui-local',
          message: 'Local AI Ready.',
          raw: payload
        }
      end

      def check(id, ok, message, detail = nil)
        { id: id, ok: !!ok, message: message, detail: detail }
      end

      def command_output(argv)
        return '' unless argv && argv.first
        IO.popen(argv, err: File::NULL, &:read).to_s.strip
      rescue
        ''
      end

      def port_alive?(host, port)
        socket = Socket.tcp(host, port, connect_timeout: 0.5)
        socket.close
        true
      rescue
        false
      end

      def get_json(url, timeout)
        uri = URI(url)
        http = Net::HTTP.new(uri.host, uri.port)
        http.open_timeout = timeout
        http.read_timeout = timeout
        response = http.get(uri.request_uri)
        return nil unless response.is_a?(Net::HTTPSuccess)
        JSON.parse(response.body)
      rescue
        nil
      end
    end
  end
end
