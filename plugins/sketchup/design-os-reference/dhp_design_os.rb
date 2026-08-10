# frozen_string_literal: true

require 'sketchup.rb'
require 'extensions.rb'

module DaiHaiPhat
  module DesignOS
    EXTENSION_NAME = 'DHP Design OS'
    EXTENSION_VERSION = '0.1.0'

    unless file_loaded?(__FILE__)
      extension = SketchupExtension.new(EXTENSION_NAME, 'dhp_design_os/extension')
      extension.description = 'Local-first design workflow for Đại Hải Phát.'
      extension.version = EXTENSION_VERSION
      extension.creator = 'Đại Hải Phát'
      extension.copyright = 'Copyright 2026 Đại Hải Phát'
      Sketchup.register_extension(extension, true)
      file_loaded(__FILE__)
    end
  end
end
