require 'sketchup.rb'
require 'extensions.rb'

module DaiHaiPhat
  module SketchUpAI
    EXTENSION_NAME = 'DHP SketchUp AI'.freeze
    EXTENSION_VERSION = '0.4.0'.freeze
    EXTENSION_ID = 'com.daihaiphat.sketchup_ai'.freeze

    unless file_loaded?(__FILE__)
      extension = SketchupExtension.new(EXTENSION_NAME, 'dhp_sketchup_ai/main')
      extension.description = 'Lightweight SketchUp adapter for LuxRender.'
      extension.version = EXTENSION_VERSION
      extension.creator = 'Dai Hai Phat'
      extension.copyright = '2026 Dai Hai Phat'
      Sketchup.register_extension(extension, true)
      file_loaded(__FILE__)
    end
  end
end
