require 'base64'
require 'tmpdir'
require 'fileutils'
require 'open-uri'

module DaiHaiPhat
  module SketchUpAI
    module ModelService
      module_function

      def model_info
        model = Sketchup.active_model
        { title: model.title.to_s, path: model.path.to_s, version: Sketchup.version.to_s, scenes: scenes, active_scene: model.pages.selected_page&.name, selection_count: model.selection.length, materials_count: model.materials.length }
      end

      def scenes
        Sketchup.active_model.pages.map.with_index { |page, i| { name: page.name, index: i } }
      end

      def capture_scene(name)
        activate_scene(name) unless name.to_s.empty?
        capture_view(1600, 900)
      end

      def camera
        c = Sketchup.active_model.active_view.camera
        { eye: point(c.eye), target: point(c.target), up: vector(c.up), perspective: c.perspective?, fov: (c.fov rescue nil) }
      end

      def activate_scene(name)
        page = Sketchup.active_model.pages[name.to_s]
        return false unless page
        Sketchup.active_model.pages.selected_page = page
        Sketchup.active_model.active_view.refresh
        true
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

      def point(p); [p.x.to_f, p.y.to_f, p.z.to_f]; end
      def vector(v); [v.x.to_f, v.y.to_f, v.z.to_f]; end
    end
  end
end
