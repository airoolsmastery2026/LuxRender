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
      COMFY_SETUP_URL = 'https://docs.comfy.org/installation/desktop/windows'.freeze

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
          gpu: gpu_info,
          model_dir: comfy_model_dir,
          message: if bridge_running && !comfy_running
                     launcher ? 'Local Bridge đang chạy; ComfyUI đang khởi động hoặc chưa sẵn sàng.' : 'Local Bridge đang chạy; chưa tìm thấy ComfyUI trên máy.'
                   elsif bridge_running
                     'Bridge + ComfyUI đã chạy nhưng chưa có checkpoint tương thích.'
                   elsif !comfy_running && !launcher
                     'Chưa tìm thấy ComfyUI. Dùng nút Cài ComfyUI để mở hướng dẫn chính thức.'
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
        checkpoint_names = bridge_health && Array(bridge_health['checkpoints'])
        gpu = gpu_info

        checks = [
          check('node', !node.nil?, node ? "Node #{node_version.empty? ? 'detected' : node_version}" : 'Không tìm thấy Node.js 18+.', node),
          check('bridge_bundle', File.file?(bridge_file), File.file?(bridge_file) ? 'Local Bridge có trong RBZ.' : 'Thiếu server.mjs trong RBZ.', bridge_file),
          check('gpu', true, gpu || 'Không đọc được GPU bằng nvidia-smi; CPU/driver khác vẫn có thể dùng nếu ComfyUI hỗ trợ.', gpu),
          check('comfy_install', !launcher.nil? || !comfy_stats.nil?, launcher || comfy_stats ? 'Đã tìm thấy ComfyUI.' : 'Chưa tìm thấy ComfyUI. Bấm Cài ComfyUI.', launcher),
          check('comfy_api', !comfy_stats.nil?, comfy_stats ? 'ComfyUI API :8188 phản hồi.' : 'ComfyUI API :8188 chưa phản hồi.', COMFY_URL),
          check('checkpoint', checkpoint_names && !checkpoint_names.empty?, checkpoint_names && !checkpoint_names.empty? ? "#{checkpoint_names.length} checkpoint: #{checkpoint_names.join(', ')}" : 'Chưa có checkpoint. Bấm Mở thư mục model rồi thêm checkpoint tương thích.', checkpoint_names),
          check('bridge_api', !bridge_health.nil?, bridge_health ? 'Local Bridge :8787 sẵn sàng.' : 'Local Bridge :8787 chưa sẵn sàng.', BRIDGE_URL)
        ]

        required_ids = %w[node bridge_bundle comfy_install comfy_api checkpoint bridge_api]
        ready = checks.select { |item| required_ids.include?(item[:id]) }.all? { |item| item[:ok] }
        {
          ready: ready,
          checks: checks,
          summary: ready ? 'Local AI diagnostics PASS.' : 'Local AI chưa hoàn tất. Dùng các nút sửa nhanh rồi chạy Self-Test lại.',
          status: status,
          actions: {
            comfy_setup: COMFY_SETUP_URL,
            model_dir: comfy_model_dir
          }
        }
      end

      def start
        current = status
        return current.merge(started: false) if current[:ready]

        comfy_launch = start_comfyui_if_available unless current[:comfy_running]

        unless current[:bridge_running]
          node = node_command
          raise 'Không tìm thấy Node.js 18+. Hãy cài Node.js rồi thử lại.' unless node
          raise 'Thiếu Local Bridge trong gói cài. Hãy cài lại RBZ v0.8.0.' unless File.file?(bridge_file)

          log_dir = File.join(ENV['LOCALAPPDATA'].to_s.empty? ? Dir.tmpdir : ENV['LOCALAPPDATA'], 'DaiHaiPhat', 'LuxRender')
          FileUtils.mkdir_p(log_dir)
          @log_file = File.join(log_dir, 'local-runtime.log')
          log = File.open(@log_file, 'a')
          log.sync = true
          @pid = Process.spawn(node, bridge_file, chdir: File.dirname(bridge_file), out: log, err: log, new_pgroup: true)
          Process.detach(@pid)
        end

        80.times do
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

      def open_comfy_setup
        UI.openURL(COMFY_SETUP_URL)
        { opened: true, url: COMFY_SETUP_URL }
      end

      def open_model_dir
        path = comfy_model_dir
        return { opened: false, message: 'Chưa xác định được thư mục model. Hãy cài ComfyUI trước.' } unless path
        FileUtils.mkdir_p(path)
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
        comfy_candidates.find { |path| !path.empty? && File.file?(path) }
      end

      def comfy_candidates
        home = ENV['USERPROFILE'].to_s
        local = ENV['LOCALAPPDATA'].to_s
        [
          File.join(home, 'ComfyUI_windows_portable', 'run_nvidia_gpu.bat'),
          File.join(home, 'ComfyUI_windows_portable', 'run_cpu.bat'),
          File.join(home, 'Desktop', 'ComfyUI_windows_portable', 'run_nvidia_gpu.bat'),
          File.join(home, 'Downloads', 'ComfyUI_windows_portable', 'run_nvidia_gpu.bat'),
          File.join(home, 'Downloads', 'ComfyUI_windows_portable', 'run_cpu.bat'),
          File.join(local, 'Programs', 'ComfyUI', 'ComfyUI.exe'),
          File.join(local, 'ComfyUI', 'ComfyUI.exe')
        ]
      end

      def comfy_model_dir
        launcher = comfy_launcher
        return nil unless launcher
        dir = File.dirname(launcher)
        if File.basename(dir).downcase == 'comfyui_windows_portable'
          return File.join(dir, 'ComfyUI', 'models', 'checkpoints')
        end
        portable_root = dir.split(/[\\\/]/).each_index.select { |i| dir.split(/[\\\/]/)[i].downcase == 'comfyui_windows_portable' }.first
        return File.join(dir, 'ComfyUI', 'models', 'checkpoints') if portable_root
        candidates = [
          File.join(dir, 'resources', 'ComfyUI', 'models', 'checkpoints'),
          File.join(dir, 'ComfyUI', 'models', 'checkpoints'),
          File.join(ENV['USERPROFILE'].to_s, 'ComfyUI', 'models', 'checkpoints')
        ]
        candidates.find { |path| File.directory?(File.dirname(path)) } || candidates.first
      rescue
        nil
      end

      def gpu_info
        output = command_output(['nvidia-smi', '--query-gpu=name,memory.total', '--format=csv,noheader'])
        output.empty? ? nil : output.lines.first.to_s.strip
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
          checkpoints: payload['checkpoints'] || [],
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
