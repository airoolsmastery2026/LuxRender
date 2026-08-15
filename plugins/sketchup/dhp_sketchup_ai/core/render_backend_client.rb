require 'json'
require 'net/http'
require 'uri'

module DaiHaiPhat
  module SketchUpAI
    module RenderBackendClient
      module_function

      DEFAULT_URL = 'https://lux-render.vercel.app'.freeze
      OPEN_TIMEOUT = 10
      READ_TIMEOUT = 240

      def configured?
        !base_url.empty?
      end

      def config
        { configured: configured?, url: base_url, default: DEFAULT_URL }
      end

      def configure(url)
        normalized = normalize_url(url)
        normalized = DEFAULT_URL if normalized.empty?
        Sketchup.write_default(EXTENSION_ID, 'render_backend_url', normalized)
        config
      end

      def health
        request(:get, '/api/health')
      end

      def render_image(payload)
        request(:post, '/api/render', body: payload)
      end

      def base_url
        env = ENV['LUXRENDER_BACKEND_URL'].to_s.strip
        saved = Sketchup.read_default(EXTENSION_ID, 'render_backend_url', '').to_s.strip
        selected = if !env.empty?
                     env
                   elsif !saved.empty?
                     saved
                   else
                     DEFAULT_URL
                   end
        selected.sub(%r{/$}, '')
      end

      def normalize_url(value)
        url = value.to_s.strip.sub(%r{/$}, '')
        return '' if url.empty?
        uri = URI.parse(url)
        localhost = %w[127.0.0.1 localhost].include?(uri.host)
        raise ArgumentError, 'Backend phải dùng HTTPS (hoặc HTTP localhost).' unless uri.scheme == 'https' || (uri.scheme == 'http' && localhost)
        raise ArgumentError, 'Backend URL không hợp lệ.' if uri.host.to_s.empty?
        url
      rescue URI::InvalidURIError
        raise ArgumentError, 'Backend URL không hợp lệ.'
      end

      def request(method, path, body: nil)
        raise 'LuxRender AI backend chưa được cấu hình.' unless configured?
        uri = URI.join("#{base_url}/", path.sub(%r{^/}, ''))
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == 'https'
        http.open_timeout = OPEN_TIMEOUT
        http.read_timeout = READ_TIMEOUT
        req = method.to_sym == :get ? Net::HTTP::Get.new(uri.request_uri) : Net::HTTP::Post.new(uri.request_uri)
        req['Accept'] = 'application/json'
        req['Content-Type'] = 'application/json' if body
        token = ENV['LUXRENDER_CLIENT_TOKEN'].to_s.strip
        req['Authorization'] = "Bearer #{token}" unless token.empty?
        req.body = JSON.generate(body) if body
        response = http.request(req)
        parsed = response.body.to_s.empty? ? {} : JSON.parse(response.body)
        unless response.is_a?(Net::HTTPSuccess)
          message = parsed['error'] || "HTTP #{response.code}: #{response.message}"
          raise "LuxRender backend: #{message}"
        end
        parsed
      end
      private_class_method :request, :normalize_url
    end
  end
end
