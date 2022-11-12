# from tkinter import *
# from tkinter import ttk
# from tkinter import messagebox
import subprocess
import sys
import os
import json
import datetime

import gi

gi.require_version("Gtk", "3.0")
from gi.repository import Gtk

dir_path = os.path.dirname(os.path.realpath(__file__))

f = open(dir_path+"/data.json", "r")

themes = json.loads(f.read())

def setTheme(t):
    global themes
    theme = themes[t]
    answer = 1
    # answer = messagebox.askyesno(title="Set theme?", message="Set theme to "+theme['name']+"?")
    if answer:
        os.system('bushy theme set '+t)
    
# def addTheme():
    # # a = os.system('bushy-theme current')
    # a = subprocess.check_output(['bushy theme', 'current'])
    # answer = messagebox.askyesno(title="Add theme?", message=str(a)+"\nAdd this theme?")
    # if answer:
        # print('haha')
    
# json.dumps(x)

# print(dir_path)

# lambda: setTheme(theme)
# 
# root = Tk()
# frm = ttk.Frame(root, padding=10)
# frm.grid()
# # ttk.Label(frm, text="Hello World!").grid(column=0, row=0)
# c = 0
# r = 0
# for i in themes:
    # theme = themes[i]
    # nm = theme['name']
    # btn = ttk.Button(frm, text=nm, command= lambda t=i : setTheme(t)).grid(column=c, row=r)
    # c = c + 1
    # if c == 3:
        # c = 0
        # r = r + 1
   # 
# 
# ttk.Button(frm, text="Add", command=addTheme).grid(column=c, row=r)
# ttk.Button(frm, text="Quit", command=root.destroy).grid(column=0, row=r+1)
# root.mainloop()

def showDialog(self, text = '', title = '!!', show = True):
    dialog = Gtk.MessageDialog(self, 0, Gtk.MessageType.INFO,
                Gtk.ButtonsType.OK, title)
    dialog.format_secondary_text(text)
    if show: 
        dialog.run()
    return dialog

class MainWin(Gtk.Window):
    def __init__(self):
        super().__init__(title="Bushy themes")

        self.do_save_bg = False

        self.init_ui()

        self.set_default_size(350, 250)
        
        # self.button.connect("clicked", self.on_button_clicked)
        
    def init_ui(self):

        box = Gtk.Box.new(Gtk.Orientation.VERTICAL, spacing=6)
        box.set_margin_start(5)
        box.set_margin_top(5)
        box.set_margin_right(5)

        themes_list = Gtk.ListStore(str, str)
    
        
            # btn = Gtk.Button(label=nm)
            # btn.set_size(70, 50);
            # box.add(btn)
        # for i in themes:
            # theme = themes[i]
            # nm = theme['name']
            # themes_list.append([i, nm])
            
        sel = Gtk.ComboBoxText()
        self.sel = sel
        for i in themes:
            theme = themes[i]
            nm = theme['name']
            sel.append_text(nm+","+i)

        box.add(sel)

        sel.set_active(0)
        sel.connect('changed', self.set_theme)

        hbox = Gtk.Box.new(Gtk.Orientation.HORIZONTAL, spacing=6)
        box.add(hbox)

        self.entry_tn = Gtk.Entry()
        hbox.add(self.entry_tn)

        bave = Gtk.CheckButton(label="Save Wallpaper")
        bave.connect("toggled", self.bave)
        hbox.add(bave)

        btn = Gtk.Button(label="Add")
        btn.connect('clicked', self.add_theme)
        hbox.add(btn)

        btn2 = Gtk.Button(label="Remove")
        btn2.connect('clicked', self.rm_theme)
        hbox.add(btn2)
        
        # self.entry_tn.set_text("Hello World")
        # box.pack_start(self.entry, True, True, 0)
        
        self.add(box)


    def set_theme(self, wid):
        tex = wid.get_active_text()
        t = tex.split(',')[1]
        setTheme(t)

    def bave(self, wid):
        if wid.get_active():
            self.do_save_bg = True
        else:
            self.do_save_bg = False

    def add_theme(self, wid):
        # dt = str(datetime.datetime.now()).split(".")[1]
        # os.system('bushy-theme mk '+dt)
        val = self.entry_tn.get_text().strip().replace(" ", "")
        if len(val) < 4:
            showDialog(self, 'Put theme pack name pls, should consist 4 chars').destroy()
        elif val in themes:
            showDialog(self, 'Theme already exists dude, no overwritting unless in cli').destroy()
        else:
            to_do = "bushy theme mk "+val
            if self.do_save_bg:
                to_do = to_do + " yes"
            os.system(to_do)
            self.sel.append_text(val+","+val)
            self.entry_tn.set_text('')
            
    def rm_theme(self, wid):
        val = self.entry_tn.get_text().strip().replace(" ", "")
        if len(val) < 1:
            showDialog(self, 'Put theme name that you want to remove').destroy()
        else:
            to_do = "bushy theme rm "+val
            os.system(to_do)
            self.entry_tn.set_text('')
        

win = MainWin()
win.connect("destroy", Gtk.main_quit)
win.show_all()
Gtk.main()

