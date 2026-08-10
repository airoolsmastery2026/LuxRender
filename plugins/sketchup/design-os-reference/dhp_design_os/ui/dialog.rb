# frozen_string_literal: true

require 'json'
require_relative '../control_plane_client'

module DaiHaiPhat
  module DesignOS
    module UI
      module Dialog
        module_function

        def show
          @dialog ||= build_dialog
          @dialog.show
          @dialog.bring_to_front
        end

        def build_dialog
          dialog = ::UI::HtmlDialog.new(
            dialog_title: 'DHP Design OS',
            preferences_key: 'com.daihaiphat.designos.drawer',
            scrollable: true,
            resizable: true,
            width: 380,
            height: 680,
            min_width: 320,
            min_height: 480,
            style: ::UI::HtmlDialog::STYLE_DIALOG
          )
          dialog.set_file(File.join(__dir__, 'index.html'))
          register_callbacks(dialog)
          dialog.set_on_closed { @dialog = nil }
          dialog
        end

        def register_callbacks(dialog)
          dialog.add_action_callback('dhpReady') do |_context|
            dialog.execute_script("window.DHP.receive(#{bootstrap_payload.to_json})")
          end

          dialog.add_action_callback('dhpCommand') do |_context, raw_payload|
            request_id = nil
            payload = JSON.parse(raw_payload)
            request_id = payload['requestId']
            result = dispatch(payload)
            dialog.execute_script("window.DHP.resolve(#{result.to_json})")
          rescue JSON::ParserError => e
            dialog.execute_script("window.DHP.reject(#{error_payload('invalid_json', e.message, request_id).to_json})")
          rescue StandardError => e
            dialog.execute_script("window.DHP.reject(#{error_payload('command_failed', e.message, request_id).to_json})")
          end
        end

        def dispatch(payload)
          command = payload.fetch('command')
          request_id = payload.fetch('requestId')
          args = payload['args'].is_a?(Hash) ? payload['args'] : {}
          data = case command
                 when 'ping' then { status: 'ok', sketchup_version: Sketchup.version }
                 when 'model_summary' then model_summary
                 when 'control_plane_health' then ControlPlaneClient.health
                 when 'control_plane_skills' then ControlPlaneClient.list_skills(args['capability'])
                 when 'control_plane_execute_skill' then ControlPlaneClient.execute_skill(args.fetch('skillId'), args['input'] || model_context)
                 when 'control_plane_create_media_job'
                   ControlPlaneClient.create_media_job(args['workflowId'] || 'sketchup-render', (args['payload'].is_a?(Hash) ? args['payload'] : {}).merge(model: model_context), idempotency_key: args['idempotencyKey'])
                 when 'control_plane_media_job' then ControlPlaneClient.get_media_job(args.fetch('jobId'))
                 when 'control_plane_run_media_stage' then ControlPlaneClient.run_media_stage(args.fetch('jobId'))
                 when 'control_plane_approve_media_job' then ControlPlaneClient.approve_media_job(args.fetch('jobId'))
                 else raise ArgumentError, "Lệnh không được hỗ trợ: #{command}"
                 end
          { requestId: request_id, data: data }
        end

        def bootstrap_payload
          { app: 'DHP Design OS', version: DaiHaiPhat::DesignOS::EXTENSION_VERSION, model: model_summary, controlPlane: { configured: ControlPlaneClient.configured? } }
        end

        def model_summary
          model = Sketchup.active_model
          { title: model.title.to_s.empty? ? 'Dự án chưa đặt tên' : model.title, path: model.path, selection_count: model.selection.length }
        end

        def model_context
          model = Sketchup.active_model
          { title: model.title.to_s.empty? ? 'Dự án chưa đặt tên' : model.title, path: model.path, selectionCount: model.selection.length, entityCount: model.entities.length, materialCount: model.materials.length, layerCount: model.layers.length, units: model.options['UnitsOptions']['LengthUnit'] }
        end

        def error_payload(code, message, request_id = nil)
          payload = { code: code, message: message }
          payload[:requestId] = request_id if request_id
          payload
        end
      end
    end
  end
end
