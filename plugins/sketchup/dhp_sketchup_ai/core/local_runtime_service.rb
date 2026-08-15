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
        {
          ready: false,
          bridge_running: bridge_running,
          comfy_running: comfy_running,
          node: node_command,
          message: if bridge_running && !comfy_running
                     'Local Bridge đang chạy; ComfyUI chưa chạy ở 127.0.0.1:8188.'
                   elsif bridge_running
                     'Local Bridge + ComfyUI đang chạy nhưng chưa có checkpoint tương thích.'
                   else
                     'Local Bridge chưa chạy.'
                   end
        }
      end

      def start
        current = status
        return current.merge(started: false) if current[:ready]
        return current.merge(started: false) if current[:bridge_running]

        node = node_command
        raise 'Không tìm thấy Node.js 18+. Hãy cài Node.js rồi thử lại.' unless node

        bridge_file = File.expand_path(File.join(__dir__, '..', 'local_runtime', 'server.mjs'))
        raise 'Thiếu Local Bridge trong gói cài. Hãy cài lại RBZ v0.7.1.' unless File.file?(bridge_file)

        log_dir = File.join(ENV['LOCALAPPDATA'].to_s.empty? ? Dir.tmpdir : ENV['LOCALAPPDATA'], 'DaiHaiPhat', 'LuxRender')
        FileUtils.mkdir_p(log_dir)
        @log_file = File.join(log_dir, 'local-runtime.log')
        log = File.open(@log_file, 'a')
        log.sync = true

        @pid = Process.spawn(
          node,
          bridge_file,
          chdir: File.dirname(bridge_file),
          out: log,
          err: log,
          new_pgroup: true
        )
        Process.detach(@pid)

        15.times do
          sleep 0.2
          bridge = get_json("#{BRIDGE_URL}/api/health", 0.8)
          return normalize_bridge_status(bridge).merge(started: true, pid: @pid, log: @log_file) if bridge
          if port_alive?('127.0.0.1', 8787)
            current = status
            return current.merge(started: true, pid: @pid, log: @log_file)
          end
        end

        {
          ready: false,
          bridge_running: port_alive?('127.0.0.1', 8787),
          comfy_running: port_alive?('127.0.0.1', 8188),
          node: node,
          started: true,
          pid: @pid,
          log: @log_file,
          message: 'Bridge đã được khởi động nhưng chưa sẵn sàng. Bấm Kiểm tra Local AI hoặc xem log.'
        }
      ensure
        log.close if defined?(log) && log && !log.closed?
      end

      def stop
        if @pid
          begin
            Process.kill('KILL', @pid.to_i)
          rescue Errno::ESRCH, Errno::EINVAL
            # Process already stopped.
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
