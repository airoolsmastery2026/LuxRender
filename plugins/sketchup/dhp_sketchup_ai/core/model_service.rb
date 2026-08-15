require 'base64'
require 'tmpdir'
require 'fileutils'
require 'open-uri'

module DaiHaiPhat
  module SketchUpAI
    module ModelService
      module_function

      ASPECT_RATIOS = {
        '16:9' => [16.0 / 9.0, 1600, 900],
        '1:1' => [1.0, 1400, 1400],
        '4:3' => [4.0 / 3.0, 1600, 1200],
        '4:5' => [4.0 / 5.0, 1280, 1600],
        '5:4' => [5.0 / 4.0, 1600, 1280]
      }.freeze

      def model_info
        model = Sketchup.active_model
        { title: model.title.to_s, path: model.path.to_s, version: Sketchup.version.to_s, scenes: scenes, active_scene: model.pages.selected_page&.name, selection_count: model.selection.length, materials_count: model.materials.length, aspect_ratio: current_aspect_ratio, fov: current_fov }
      end

      def scenes
        Sketchup.active_model.pages.map.with_index { |page, i| { name: page.name, index: i } }
      end

      def capture_scene(name, ratio = nil)
        activate_scene(name) unless name.to_s.empty?
        set_aspect_ratio(ratio) if ratio && !ratio.to_s.empty?
        _value, width, height = aspect_spec(current_aspect_ratio)
        view = Sketchup.active_model.active_view
        view.invalidate
        view.refresh
        capture_view(width, height)
      end

      def scene_previews(width = 360, height = 220)
        model = Sketchup.active_model
        pages = model.pages.to_a
        original_page = model.pages.selected_page
        original_camera = model.active_view.camera
        previews = []
        pages.each_with_index do |page, index|
          model.pages.selected_page = page
          if page.respond_to?(:use_camera?) && page.use_camera? && page.respond_to?(:camera)
            model.active_view.camera = page.camera
          end
          apply_aspect_to_view
          model.active_view.refresh
          previews << { index: index, name: page.name.to_s, dataUrl: capture_view(width, height) }
        end
        previews
      ensure
        if model
          model.pages.selected_page = original_page if original_page
          model.active_view.camera = original_camera if original_camera
          apply_aspect_to_view rescue nil
          model.active_view.refresh rescue nil
        end
      end

      def camera
        c = Sketchup.active_model.active_view.camera
        { eye: point(c.eye), target: point(c.target), up: vector(c.up), perspective: c.perspective?, fov: (c.fov rescue nil), aspect_ratio: (c.aspect_ratio rescue nil) }
      end

      def activate_scene(name)
        page = Sketchup.active_model.pages[name.to_s]
        return false unless page
        Sketchup.active_model.pages.selected_page = page
        if page.respond_to?(:use_camera?) && page.use_camera? && page.respond_to?(:camera)
          Sketchup.active_model.active_view.camera = page.camera
        end
        apply_aspect_to_view
        Sketchup.active_model.active_view.refresh
        true
      end

      def set_aspect_ratio(ratio)
        normalized = normalize_aspect_ratio(ratio)
        Sketchup.write_default(DaiHaiPhat::SketchUpAI::EXTENSION_ID, 'aspect_ratio', normalized)
        apply_aspect_to_view(normalized)
        { value: normalized }
      end

      def current_aspect_ratio
        normalize_aspect_ratio(Sketchup.read_default(DaiHaiPhat::SketchUpAI::EXTENSION_ID, 'aspect_ratio', '16:9').to_s)
      rescue StandardError
        '16:9'
      end

      def normalize_aspect_ratio(ratio)
        return ratio if ASPECT_RATIOS.key?(ratio)
        match = ratio.to_s.strip.match(/\A(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\z/)
        raise ArgumentError, 'Tỉ lệ phải có dạng rộng:cao' unless match
        width = match[1].to_f
        height = match[2].to_f
        value = width / height
        raise ArgumentError, 'Tỉ lệ chỉ hỗ trợ từ 1:5 đến 5:1' unless value.between?(0.2, 5.0)
        "#{format_ratio_number(width)}:#{format_ratio_number(height)}"
      end

      def aspect_spec(ratio)
        return ASPECT_RATIOS.fetch(ratio) if ASPECT_RATIOS.key?(ratio)
        width_part, height_part = ratio.split(':').map(&:to_f)
        value = width_part / height_part
        if value >= 1.0
          width = 1600
          height = (width / value).round
        else
          height = 1600
          width = (height * value).round
        end
        [value, width, height]
      end

      def apply_aspect_to_view(ratio = current_aspect_ratio)
        value = aspect_spec(ratio).first
        view = Sketchup.active_model.active_view
        camera = view.camera
        camera.aspect_ratio = value
        view.camera = camera
        view.refresh
        true
      end

      def current_fov
        camera = Sketchup.active_model.active_view.camera
        value = camera.fov.to_f
        value.between?(10.0, 120.0) ? value : 35.0
      rescue StandardError
        35.0
      end

      def set_field_of_view(value)
        value = [[value.to_f, 20.0].max, 90.0].min
        view = Sketchup.active_model.active_view
        camera = view.camera
        camera.perspective = true unless camera.perspective?
        camera.fov = value
        view.camera = camera
        view.refresh
        Sketchup.write_default(DaiHaiPhat::SketchUpAI::EXTENSION_ID, 'field_of_view', value)
        { value: value.round(1) }
      end

      def selection
        Sketchup.active_model.selection.map do |e|
          { entity_id: e.entityID, persistent_id: (e.persistent_id rescue nil), type: e.typename, name: (e.respond_to?(:name) ? e.name.to_s : ''), material: (e.respond_to?(:material) && e.material ? e.material.display_name : nil) }
        end
      end

      def materials
        Sketchup.active_model.materials.map { |m| { name: m.display_name, color: (m.color ? [m.color.red, m.color.green, m.color.blue] : nil), texture: (m.texture ? m.texture.filename.to_s : nil) } }
      end

      def capture_view(width = 1600, height = 900)
        path = File.join(Dir.tmpdir, "dhp_sketchup_#{(Time.now.to_f * 1000).to_i}.png")
        Sketchup.active_model.active_view.write_image(filename: path, width: width.to_i, height: height.to_i, antialias: true, transparent: false)
        data = File.binread(path)
        File.delete(path) if File.exist?(path)
        "data:image/png;base64,#{Base64.strict_encode64(data)}"
      end

      def pick_dir
        UI.select_directory(title: 'Chọn thư mục lưu ảnh DHP') || ''
      end

      def save_image(params)
        src = params['url'] || params['dataUrl'] || ''
        filename = File.basename(params['filename'] || "dhp_#{Time.now.to_i}.jpg").gsub(/[^0-9A-Za-z._\- ]/, '_')
        dir = params['dir'].to_s
        path = dir.empty? ? UI.savepanel('Lưu ảnh DHP', '', filename) : File.join(dir, filename)
        return { path: '' } unless path
        bytes = if src.start_with?('data:')
          Base64.decode64(src.split(',', 2)[1].to_s)
        elsif src.start_with?('https://')
          URI.open(src, read_timeout: 90, open_timeout: 20, 'User-Agent' => 'DHP-SketchUp-AI').read
        else
          raise ArgumentError, 'Chỉ hỗ trợ data URL hoặc HTTPS URL'
        end
        FileUtils.mkdir_p(File.dirname(path))
        File.binwrite(path, bytes)
        { path: path }
      end

      def open_external(url)
        target = url.to_s
        return false unless target.start_with?('https://') || target.start_with?('http://127.0.0.1') || target.start_with?('http://localhost')
        UI.openURL(target)
        true
      end

      def format_ratio_number(value)
        integer = value.round
        return integer.to_s if (value - integer).abs < 0.0001
        format('%.2f', value).sub(/0+\z/, '').sub(/\.\z/, '')
      end

      def point(p); [p.x.to_f, p.y.to_f, p.z.to_f]; end
      def vector(v); [v.x.to_f, v.y.to_f, v.z.to_f]; end
    end
  end
end
