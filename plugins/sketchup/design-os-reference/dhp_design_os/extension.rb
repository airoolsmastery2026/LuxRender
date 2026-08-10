# frozen_string_literal: true

require 'sketchup.rb'
require_relative 'ui/dialog'

module DaiHaiPhat
  module DesignOS
    module Extension
      module_function

      def show_dialog
        UI::Dialog.show
      rescue StandardError => e
        Sketchup.write_default('DHP Design OS', 'last_error', e.message)
        ::UI.messagebox("DHP Design OS không thể mở giao diện: #{e.message}")
      end

      unless file_loaded?(__FILE__)
        command = ::UI::Command.new('DHP Design OS') { show_dialog }
        command.tooltip = 'Mở DHP Design OS'
        command.status_bar_text = 'Mở bảng thiết kế Đại Hải Phát'
        menu = ::UI.menu('Extensions')
        menu.add_item(command)
        toolbar = ::UI::Toolbar.new('DHP Design OS')
        toolbar.add_item(command)
        toolbar.restore
        file_loaded(__FILE__)
      end
    end
  end
end
