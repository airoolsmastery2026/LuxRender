require 'socket'
require 'json'
require 'thread'
require 'uri'

module DaiHaiPhat
  module SketchUpAI
    module ServerService
      module_function

      STUDIO_ROOT = File.expand_path('../local_studio', __dir__).freeze
      MIME_TYPES = {
        '.html' => 'text/html; charset=utf-8',
        '.js' => 'application/javascript; charset=utf-8',
        '.css' => 'text/css; charset=utf-8',
        '.json' => 'application/json; charset=utf-8',
        '.svg' => 'image/svg+xml',
        '.png' => 'image/png',
        '.jpg' => 'image/jpeg',
        '.jpeg' => 'image/jpeg',
        '.webp' => 'image/webp'
      }.freeze

      def start
        return status if running?
        @server = TCPServer.new('127.0.0.1', 0)
        @port = @server.addr[1]
        @running = true
        @tasks = Queue.new
        @timer = UI.start_timer(0.03, true) { process_main_thread_tasks }
        @thread = Thread.new { serve_loop }
        @thread.abort_on_exception = false
        status
      rescue => e
        stop
        raise RuntimeError, "Không thể khởi động LuxRender bridge: #{e.message}"
      end

      def stop
        @running = false
        @server.close if @server && !@server.closed? rescue nil
        UI.stop_timer(@timer) if @timer rescue nil
        @thread = @server = @timer = @port = nil
        true
      end

      def running?
        !!(@running && @server && !@server.closed?)
      rescue StandardError
        false
      end

      def status
        { running: running?, port: @port, host: 'sketchup-ext', version: DaiHaiPhat::SketchUpAI::EXTENSION_VERSION, studio: local_studio_url }
      end

      def local_studio_url
        return nil unless @port
        "http://127.0.0.1:#{@port}/studio/"
      end

      def launch_app
        start unless running?
        configured = DaiHaiPhat::SketchUpAI.app_url

        if configured.empty? || configured == DaiHaiPhat::SketchUpAI::DEFAULT_APP_URL
          dialog = DialogService.show_studio
          return { url: local_studio_url, port: @port, embedded: true, mode: dialog[:mode] }
        end

        sep = configured.include?('?') ? '&' : '?'
        url = "#{configured}#{sep}host=sketchup-ext&syncPort=#{@port}"
        opened = ModelService.open_external(url)
        raise RuntimeError, 'Không thể mở LuxRender Studio.' unless opened
        { url: url, port: @port, embedded: false, mode: 'external' }
      end

      def serve_loop
        while @running
          begin
            client = @server.accept
            Thread.new(client) { |socket| handle_client(socket) }
          rescue IOError, Errno::EBADF
            break
          rescue => e
            puts "[DHP SketchUp AI] bridge error: #{e.class}: #{e.message}"
          end
        end
      end

      def handle_client(client)
        request_line = client.gets
        return unless request_line
        method, raw_path, _http = request_line.split(' ', 3)
        headers = {}
        while (line = client.gets)
          line = line.strip
          break if line.empty?
          key, value = line.split(':', 2)
          headers[key.to_s.downcase] = value.to_s.strip
        end

        path = request_path(raw_path)
        origin = allowed_origin(headers['origin'])
        return write_response(client, 204, '', origin) if method == 'OPTIONS'
        return serve_studio_asset(client, path) if method == 'GET' && studio_path?(path)
        return write_json(client, 405, { error: 'Method not allowed' }, origin) unless %w[GET POST].include?(method)
        return write_json(client, 200, status, origin) if method == 'GET'

        length = headers.fetch('content-length', '0').to_i
        raise ArgumentError, 'Payload quá lớn' if length > 25 * 1024 * 1024
        data = JSON.parse(length.positive? ? client.read(length).to_s : '{}')
        write_json(client, 200, dispatch(data['method'].to_s, data['params'] || {}), origin)
      rescue => e
        write_json(client, 200, { error: e.message }, nil) rescue nil
      ensure
        client.close rescue nil
      end

      def request_path(raw_path)
        URI.parse(raw_path.to_s).path.to_s
      rescue URI::InvalidURIError
        raw_path.to_s.split('?', 2).first.to_s
      end

      def studio_path?(path)
        path == '/studio' || path.start_with?('/studio/')
      end

      def serve_studio_asset(client, path)
        relative = path.sub(%r{\A/studio/?}, '')
        relative = 'index.html' if relative.empty?
        decoded = URI.decode_www_form_component(relative)
        raise ArgumentError, 'Đường dẫn không hợp lệ' if decoded.include?('..') || decoded.start_with?('/')
        file = File.expand_path(decoded, STUDIO_ROOT)
        raise ArgumentError, 'Đường dẫn không hợp lệ' unless file.start_with?(STUDIO_ROOT + File::SEPARATOR)
        return write_response(client, 404, 'Not Found', nil) unless File.file?(file)
        body = File.binread(file)
        mime = MIME_TYPES.fetch(File.extname(file).downcase, 'application/octet-stream')
        write_response(client, 200, body, nil, mime, cache: false)
      end

      def allowed_origin(origin)
        return nil if origin.nil? || origin.empty?
        local_origins = ["http://127.0.0.1:#{@port}", "http://localhost:#{@port}"]
        return origin if local_origins.include?(origin)

        base = DaiHaiPhat::SketchUpAI.app_url
        return nil if base == DaiHaiPhat::SketchUpAI::DEFAULT_APP_URL
        parsed = URI.parse(base)
        expected = "#{parsed.scheme}://#{parsed.host}"
        expected += ":#{parsed.port}" if parsed.port && ![80, 443].include?(parsed.port)
        origin == expected ? origin : nil
      rescue URI::InvalidURIError
        nil
      end

      # This dispatcher is only for requests coming from the background TCP server.
      # SketchUp model access is marshalled onto the UI thread via run_on_main.
      def dispatch(method, params)
        case method
        when 'lux_status' then status
        when 'lux_bootstrap'
          run_on_main do
            {
              status: status,
              model: ModelService.model_info,
              camera: ModelService.camera,
              control_plane: { configured: ControlPlaneClient.configured? }
            }
          end
        when 'lux_get_scenes', 'nbox_get_scenes' then run_on_main { ModelService.scenes }
        when 'lux_get_scene_previews' then run_on_main { ModelService.scene_previews(params.fetch('width', 360), params.fetch('height', 220)) }
        when 'lux_capture_scene', 'nbox_capture_scene' then run_on_main { { dataUrl: ModelService.capture_scene(params['name'], params['aspectRatio']) } }
        when 'lux_get_model_info' then run_on_main { ModelService.model_info }
        when 'lux_get_camera' then run_on_main { ModelService.camera }
        when 'lux_set_aspect_ratio' then run_on_main { ModelService.set_aspect_ratio(params['value']) }
        when 'lux_set_field_of_view' then run_on_main { ModelService.set_field_of_view(params['value']) }
        when 'lux_get_selection' then run_on_main { ModelService.selection }
        when 'lux_get_materials' then run_on_main { ModelService.materials }
        when 'lux_get_context' then run_on_main { { selection: ModelService.selection, materials: ModelService.materials } }
        when 'lux_pick_dir', 'nbox_pick_dir' then run_on_main { ModelService.pick_dir }
        when 'lux_save_image', 'nbox_save_image' then run_on_main { ModelService.save_image(params) }
        when 'lux_control_plane_status' then { configured: ControlPlaneClient.configured? }
        else { error: "method không hỗ trợ: #{method}" }
        end
      end

      def run_on_main(timeout = 180, &block)
        response = Queue.new
        @tasks << [block, response]
        deadline = Time.now + timeout
        loop do
          raise RuntimeError, 'SketchUp không phản hồi (timeout)' if Time.now >= deadline
          begin
            ok, value = response.pop(true)
            raise value unless ok
            return value
          rescue ThreadError
            sleep 0.01
          end
        end
      end

      def process_main_thread_tasks
        loop do
          task, response = @tasks.pop(true)
          response << [true, task.call]
        rescue ThreadError
          break
        rescue => e
          response << [false, e] if response
        end
      end

      def write_json(client, status_code, payload, origin)
        write_response(client, status_code, JSON.generate(payload), origin, 'application/json; charset=utf-8')
      end

      def write_response(client, status_code, body, origin, content_type = 'text/plain; charset=utf-8', cache: true)
        reason = { 200 => 'OK', 204 => 'No Content', 404 => 'Not Found', 405 => 'Method Not Allowed' }.fetch(status_code, 'OK')
        bytes = body.to_s.b
        client.write("HTTP/1.1 #{status_code} #{reason}\r\nContent-Type: #{content_type}\r\nContent-Length: #{bytes.bytesize}\r\n")
        client.write("Access-Control-Allow-Origin: #{origin}\r\nVary: Origin\r\n") if origin
        client.write("Access-Control-Allow-Headers: Content-Type\r\nAccess-Control-Allow-Methods: POST, GET, OPTIONS\r\n")
        client.write("Cache-Control: no-store\r\n") unless cache
        client.write("X-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n")
        client.write(bytes) unless bytes.empty?
      end
    end
  end
end
