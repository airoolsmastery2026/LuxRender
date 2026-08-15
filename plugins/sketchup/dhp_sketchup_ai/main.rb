require 'sketchup.rb'
require 'json'
require_relative 'core/model_service'
require_relative 'core/dialog_service'
require_relative 'core/server_service'
require_relative 'core/control_plane_client'
require_relative 'core/render_backend_client'
require_relative 'core/local_runtime_service'

module DaiHaiPhat
  module SketchUpAI
    DEFAULT_APP_URL = 'local://studio'.freeze

    def self.app_url
      Sketchup.read_default(EXTENSION_ID, 'app_url', DEFAULT_APP_URL).to_s
    end

    def self.app_url=(value)
      normalized = value.to_s.strip
      normalized = DEFAULT_APP_URL if normalized.empty?
      Sketchup.write_default(EXTENSION_ID, 'app_url', normalized)
    end

    def self.show
      DialogService.show
    end

    unless file_loaded?(__FILE__)
      cmd = UI::Command.new('DHP SketchUp AI') { show }
      cmd.tooltip = 'Open LuxRender SketchUp adapter'
      cmd.status_bar_text = 'Open DHP SketchUp AI / LuxRender panel'
      UI.menu('Extensions').add_item(cmd)
      UI.menu('Extensions').add_item('Open LuxRender') { ServerService.launch_app }
      UI.menu('Extensions').add_item('Start LuxRender Local AI') do
        begin
          result = LocalRuntimeService.start
          UI.messagebox(result[:message].to_s)
        rescue => e
          UI.messagebox("LuxRender Local AI: #{e.message}")
        end
      end
      toolbar = UI::Toolbar.new('DHP SketchUp AI')
      toolbar.add_item(cmd)
      toolbar.restore
      file_loaded(__FILE__)
    end
  end
end
