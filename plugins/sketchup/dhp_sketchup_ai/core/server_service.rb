require 'socket'
require 'json'
require 'thread'

module DaiHaiPhat
  module SketchUpAI
    module ServerService
      module_function

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
        { running: running?, port: @port, host: 'sketchup-ext', version: DaiHaiPhat::SketchUpAI::EXTENSION_VERSION }
      end

      def launch_app
        start unless running?
        base = DaiHaiPhat::SketchUpAI.app_url
        sep = base.include?('?') ? '&' : '?'
        url = "#{base}#{sep}host=sketchup-ext&syncPort=#{@port}"
        ModelService.open_external(url)
        { url: url, port: @port }
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
        method, _path, _http = request_line.split(' ', 3)
        headers = {}
        while (line = client.gets)
          line = line.strip
          break if line.empty?
          key, value = line.split(':', 2)
          headers[key.to_s.downcase] = value.to_s.strip
        end
        origin = allowed_origin(headers['origin'])
        return write_response(client, 204, '', origin) if method == 'OPTIONS'
        return write_json(client, 405, { error: 'Method not allowed' }, origin) unless %w[GET POST].include?(method)
        return write_json(client, 200, status, origin) if method == 'GET'
        length = headers.fetch('content-length', '0').to_i
        data = JSON.parse(length.positive? ? client.read(length).to_s : '{}')
        write_json(client, 200, dispatch(data['method'].to_s, data['params'] || {}), origin)
      rescue => e
        write_json(client, 200, { error: e.message }, nil) rescue nil
      ensure
        client.close rescue nil
      end

      def allowed_origin(origin)
        return nil if origin.nil? || origin.empty?
        base = DaiHaiPhat::SketchUpAI.app_url
        return origin if base.start_with?(origin) || %w[http://127.0.0.1:3000 http://localhost:3000].include?(origin)
        nil
      end

      def dispatch(method, params)
        case method
        when 'lux_get_scenes', 'nbox_get_scenes' then run_on_main { ModelService.scenes }
        when 'lux_get_scene_previews' then run_on_main { ModelService.scene_previews(params.fetch('width', 360), params.fetch('height', 220)) }
        when 'lux_capture_scene', 'nbox_capture_scene' then run_on_main { { dataUrl: ModelService.capture_scene(params['name'], params['aspectRatio']) } }
        when 'lux_get_model_info' then run_on_main { ModelService.model_info }
        when 'lux_get_camera' then run_on_main { ModelService.camera }
        when 'lux_set_aspect_ratio' then run_on_main { ModelService.set_aspect_ratio(params['value']) }
        when 'lux_set_field_of_view' then run_on_main { ModelService.set_field_of_view(params['value']) }
        when 'lux_get_selection' then run_on_main { ModelService.selection }
        when 'lux_get_materials' then run_on_main { ModelService.materials }
        when 'lux_pick_dir', 'nbox_pick_dir' then run_on_main { ModelService.pick_dir }
        when 'lux_save_image', 'nbox_save_image' then run_on_main { ModelService.save_image(params) }
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

      def write_response(client, status_code, body, origin, content_type = 'text/plain; charset=utf-8')
        reason = { 200 => 'OK', 204 => 'No Content', 405 => 'Method Not Allowed' }.fetch(status_code, 'OK')
        bytes = body.to_s.b
        client.write("HTTP/1.1 #{status_code} #{reason}\r\nContent-Type: #{content_type}\r\nContent-Length: #{bytes.bytesize}\r\n")
        client.write("Access-Control-Allow-Origin: #{origin}\r\nVary: Origin\r\n") if origin
        client.write("Access-Control-Allow-Headers: Content-Type\r\nAccess-Control-Allow-Methods: POST, GET, OPTIONS\r\nConnection: close\r\n\r\n")
        client.write(bytes) unless bytes.empty?
      end
    end
  end
end
