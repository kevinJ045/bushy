import subprocess
import sys
import os
import json
import datetime

import gi

gi.require_version("Gtk", "3.0")
from gi.repository import Gtk

UI_FILE = "/home/bushyice/projects/bin/exec/bushy/gui/temp.ui"

class Window:
	def __init__(self):
		self.builder = Gtk.Builder()
		self.builder.add_from_file(UI_FILE)
		self.builder.connect_signals(self)

		self.window = self.builder.get_object("window1")
		self.window.show_all()

	def destroy(self, window):
		Gtk.main_quit()

# class MainWin(Gtk.Window):
#     def __init__(self):
#         super().__init__(title="Bushy Gui")

def main():
	app = Window()
	Gtk.main()
	
if __name__ == "__main__":
	main()

# win = MainWin()
# win.connect("destroy", Gtk.main_quit)
# win.show_all()
# Gtk.main()