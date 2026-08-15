require 'json'
require 'net/http'
require 'uri'
require 'fileutils'

module DaiHaiPhat
  module SketchUpAI
    module LocalRuntimeService
      module_function

      BRIDGE_URL = 'http://127.0.0.1:8787'.freeze
      COMFY_URL = 'http://127.0.0.1:8188'.freeze

      def status
        bridge = get_json("#{BRIDGE_URL}/api/health", 1.5)
        return normalize_bridge_status(bridge) if bridge

        {
          ready: false,
          bridge_running: false,
          comfy_running: tcp_http_alive?(COMFY_URL),
          node: node_command,
          message: 'Local Bridge chưa chạy.'
        }
      end

      def start
        current = status
        return current.merge(started: false) if current[:ready]

        node = node_command
        raise 'Không tìm thấy Node.js 18+. Hãy cài Node.js rồi thử lại.' unless node

        bridge_file = File.expand_path(File.join(__dir__, '..', 'local_runtime', 'server.mjs'))
        raise 'Thiếu Local Bridge trong gói cài. Hãy cài lại RBZ v0.7.1.' unless File.file?(bridge_file)

        log_dir = File.join(ENV['LOCALAPPDATA'].to_s.empty? ? Dir.tmpdir : ENV['LOCALAPPDATA'], 'DaiHaiPhat', 'LuxRender')
        FileUtils.mkdir_p(log_dir)
        log_file = File.join(log_dir, 'local-runtime.log')
        log = File.open(log_file, 'a')
        log.sync = true

        pid = Process.spawn(
          node,
          bridge_file,
          chdir: File.dirname(bridge_file),
          out: log,
          err: log,
          new_pgroup: true
        )
        Process.detach(pid)
        Sketchup.write_default(EXTENSION_ID, 'local_runtime_pid', pid)
        Sketchup.write_default(EXTENSION_ID, 'local_runtime_log', log_file)

        12.times do
          sleep 0.2
          bridge = get_json("#{BRIDGE_URL}/api/health", 1.0)
          return normalize_bridge_status(bridge).merge(started: true, pid: pid, log: log_file) if bridge
        end

        {
          ready: false,
          bridge_running: false,
          comfy_running: tcp_http_alive?(COMFY_URL),
          node: node,
          started: true,
          pid: pid,
          log: log_file,
          message: 'Bridge đang khởi động nhưng health-check chưa phản hồi. Xem log Local Runtime.'
        }
      ensure
        log.close if defined?(log) && log && !log.closed?
      end

      def stop
        pid = Sketchup.read_default(EXTENSION_ID, 'local_runtime_pid', nil)
        if pid
          begin
            Process.kill('TERM', pid.to_i)
          rescue Errno::ESRCH, Errno::EINVAL
            # Process already stopped.
          end
        end
        Sketchup.write_default(EXTENSION_ID, 'local_runtime_pid', nil)
        { stopped: true, ready: false, message: 'Đã dừng LuxRender Local Bridge.' }
      end

      def open_log
        path = Sketchup.read_default(EXTENSION_ID, 'local_runtime_log', '').to_s
        return { opened: false, message: 'Chưa có log Local Runtime.' } if path.empty? || !File.file?(path)
        UI.openURL("file:///#{path.tr('\\', '/')}")
        { opened: true, path: path }
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

      def normalize_bridge_status(payload)
        comfy = payload['comfy'] || {}
        checkpoint = payload['checkpoint']
        ready = !!payload['ok']
        {
          ready: ready,
          bridge_running: true,
          comfy_running: !!(comfy['ok'] || payload['comfyReady']),
          checkpoint: checkpoint,
          provider: payload['provider'] || 'comfyui-local',
          message: ready ? 'Local AI Ready.' : (payload['error'] || 'Bridge chạy nhưng ComfyUI/checkpoint chưa sẵn sàng.'),
          raw: payload
        }
      end

      def tcp_http_alive?(base)
        !!get_json("#{base}/system_stats", 0.8)
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
