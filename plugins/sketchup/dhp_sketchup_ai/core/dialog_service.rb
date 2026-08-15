require 'json'

module DaiHaiPhat
  module SketchUpAI
    module DialogService
      module_function

      def show
        if @dialog && @dialog.visible?
          @dialog.bring_to_front
          return
        end
        @dialog = UI::HtmlDialog.new(dialog_title: 'DHP SketchUp AI', preferences_key: 'dhp_sketchup_ai.panel', scrollable: true, resizable: true, width: 430, height: 720, min_width: 360, min_height: 520, style: UI::HtmlDialog::STYLE_DIALOG)
        @dialog.set_file(File.join(__dir__, '..', 'ui', 'index.html'))
        @dialog.add_action_callback('dhp_rpc') { |_ctx, json| handle_rpc(json) }
        @dialog.set_on_closed { @dialog = nil }
        @dialog.show
      end

      def show_studio
        if @studio_dialog && @studio_dialog.visible?
          @studio_dialog.bring_to_front
          return { mode: 'native-dialog', visible: true }
        end

        @studio_dialog = UI::HtmlDialog.new(
          dialog_title: 'LuxRender Local Studio',
          preferences_key: 'dhp_sketchup_ai.luxrender_studio',
          scrollable: true,
          resizable: true,
          width: 1180,
          height: 780,
          min_width: 760,
          min_height: 560,
          style: UI::HtmlDialog::STYLE_DIALOG
        )
        @studio_dialog.set_file(File.join(__dir__, '..', 'local_studio', 'index.html'))
        @studio_dialog.add_action_callback('lux_rpc') { |_ctx, json| handle_studio_rpc(json) }
        @studio_dialog.set_on_closed { @studio_dialog = nil }
        @studio_dialog.show
        { mode: 'native-dialog', visible: true }
      end

      def handle_rpc(json)
        request = JSON.parse(json.to_s)
        id = request['id']
        result = dispatch(request['method'].to_s, request['params'] || {})
        reply(id, true, result)
      rescue => e
        reply(id, false, { message: e.message, type: e.class.name }) if id
      end

      # HtmlDialog callbacks already execute on SketchUp's main thread. Never route
      # these calls through ServerService.run_on_main, otherwise the main thread
      # waits on a queue that only the same main thread can drain.
      def handle_studio_rpc(json)
        request = JSON.parse(json.to_s)
        id = request['id']
        result = native_dispatch(request['method'].to_s, request['params'] || {})
        studio_reply(id, true, result)
      rescue => e
        studio_reply(id, false, { message: e.message, type: e.class.name }) if id
      end

      def native_dispatch(method, params)
        case method
        when 'lux_bootstrap'
          {
            status: ServerService.status,
            model: ModelService.model_info,
            camera: ModelService.camera,
            control_plane: { configured: ControlPlaneClient.configured? }
          }
        when 'lux_status' then ServerService.status
        when 'lux_get_scenes' then ModelService.scenes
        when 'lux_get_scene_previews' then ModelService.scene_previews(params.fetch('width', 360), params.fetch('height', 220))
        when 'lux_capture_scene' then { dataUrl: ModelService.capture_scene(params['name'], params['aspectRatio']) }
        when 'lux_get_model_info' then ModelService.model_info
        when 'lux_get_camera' then ModelService.camera
        when 'lux_set_aspect_ratio' then ModelService.set_aspect_ratio(params['value'])
        when 'lux_set_field_of_view' then ModelService.set_field_of_view(params['value'])
        when 'lux_get_selection' then ModelService.selection
        when 'lux_get_materials' then ModelService.materials
        when 'lux_get_context' then { selection: ModelService.selection, materials: ModelService.materials }
        when 'lux_pick_dir' then ModelService.pick_dir
        when 'lux_save_image' then ModelService.save_image(params)
        when 'lux_control_plane_status' then { configured: ControlPlaneClient.configured? }
        else raise ArgumentError, "Method không hỗ trợ: #{method}"
        end
      end

      def dispatch(method, params)
        case method
        when 'get_model_info' then ModelService.model_info
        when 'get_scenes' then ModelService.scenes
        when 'get_camera' then ModelService.camera
        when 'activate_scene' then ModelService.activate_scene(params['name'])
        when 'get_selection' then ModelService.selection
        when 'get_materials' then ModelService.materials
        when 'capture_view' then { dataUrl: ModelService.capture_view(params['width'] || 1600, params['height'] || 900) }
        when 'pick_dir' then ModelService.pick_dir
        when 'save_image' then ModelService.save_image(params)
        when 'get_app_url' then DaiHaiPhat::SketchUpAI.app_url
        when 'set_app_url' then DaiHaiPhat::SketchUpAI.app_url = params['url']; DaiHaiPhat::SketchUpAI.app_url
        when 'start_sync' then ServerService.launch_app
        when 'server_status' then ServerService.status
        else raise ArgumentError, "Method không hỗ trợ: #{method}"
        end
      end

      def reply(id, ok, payload)
        return unless @dialog
        json = JSON.generate({ id: id, ok: ok, payload: payload })
        @dialog.execute_script("window.DHPBridge && window.DHPBridge._resolve(#{JSON.generate(json)})")
      end

      def studio_reply(id, ok, payload)
        return unless @studio_dialog
        json = JSON.generate({ id: id, ok: ok, payload: payload })
        @studio_dialog.execute_script("window.LuxNativeResolve && window.LuxNativeResolve(#{JSON.generate(json)})")
      end
    end
  end
end
