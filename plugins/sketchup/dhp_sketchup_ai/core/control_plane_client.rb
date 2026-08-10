require 'json'
require 'net/http'
require 'securerandom'
require 'uri'

module DaiHaiPhat
  module SketchUpAI
    module ControlPlaneClient
      module_function

      DEFAULT_URL = 'http://127.0.0.1:8787'.freeze
      OPEN_TIMEOUT = 5
      READ_TIMEOUT = 30

      def configured?
        !api_secret.empty?
      end

      def health
        request(:get, '/health', authenticated: false)
      end

      def create_media_job(workflow_id, payload = {}, idempotency_key: nil)
        request(:post, '/v1/media/jobs', body: {
          workflowId: workflow_id,
          payload: payload,
          idempotencyKey: idempotency_key || "sketchup-#{SecureRandom.uuid}"
        })
      end

      def get_media_job(job_id)
        request(:get, "/v1/media/jobs/#{escape_path(job_id)}")
      end

      def run_media_stage(job_id)
        request(:post, "/v1/media/jobs/#{escape_path(job_id)}/run", body: {})
      end

      def request(method, path, body: nil, authenticated: true)
        raise 'DHP Control Plane chưa được cấu hình secret.' if authenticated && !configured?
        uri = URI.join("#{base_url}/", path.sub(%r{^/}, ''))
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == 'https'
        http.open_timeout = OPEN_TIMEOUT
        http.read_timeout = READ_TIMEOUT
        req = (method.to_sym == :get ? Net::HTTP::Get : Net::HTTP::Post).new(uri.request_uri)
        req['Accept'] = 'application/json'
        req['Authorization'] = "DHP-Key #{key_id}:#{api_secret}" if authenticated
        if body
          req['Content-Type'] = 'application/json'
          req.body = JSON.generate(body)
        end
        response = http.request(req)
        parsed = response.body.to_s.empty? ? {} : JSON.parse(response.body)
        raise "Control Plane HTTP #{response.code}: #{response.message}" unless response.is_a?(Net::HTTPSuccess)
        parsed
      end

      def base_url
        (ENV['DHP_CONTROL_PLANE_URL'] || DEFAULT_URL).to_s.strip.sub(%r{/$}, '')
      end

      def key_id
        (ENV['DHP_CONTROL_PLANE_KEY_ID'] || 'sketchup').to_s.strip
      end

      def api_secret
        ENV['DHP_CONTROL_PLANE_SECRET'].to_s.strip
      end

      def escape_path(value)
        URI.encode_www_form_component(value.to_s)
      end
      private_class_method :request, :base_url, :key_id, :api_secret, :escape_path
    end
  end
end
