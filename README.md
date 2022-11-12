# bushy

idrk what i'm supposed to do here but..

Bushy is a program i made for myself to make things easier for me... For example tasks such as searching, changing gnome themes and enabling/disabling extensions and so.

i think u know what i am trying to say... 

Mostly it only works for gnome, but i think other than theme management things will work on other DEs too... **I Think**

## Install
```bash
git clone https://github.com/kevinJ045/bushy.git
cd bushy
```

## Requirements
You can install these for any distro with the default package manager
* [nodejs](https://nodejs.org/en/download/package-manager/)
* [python3](https://www.geeksforgeeks.org/how-to-install-pygtk-in-python-on-linux/) (optional)
* [Java](https://www.java.com/en/download/)

### nodejs requirements
* just do `$ npm i`

### Python requirements
* [PyGtk](https://www.geeksforgeeks.org/how-to-install-pygtk-in-python-on-linux/)

### Java requirements
* No idea

## How to do the things

There are various sub-commands and it's kind of tiring to write them all down but i will anyways... if i remember correctly...

### Theming..

Listing themes:
```bash
./bushy.sh theme list
```
Listing all available themes:
```bash
./bushy.sh theme list all
```
Listing all available **icon** themes
```bash
./bushy.sh theme list icons
```


Setting themes:
```bash
./bushy.sh theme set [ThemeName]
```
Setting specific themes:
```bash
./bushy.sh theme set shell=[ThemeName],legacy=[ThemeName],icons=[IconThemeName],bg=/path/to/bg
```

Adding the current Shell, Application and Icon themes to data.json as a template:
```bash
./bushy.sh theme mk [ThemeName]
```
Optionally save wallpaper as well:
```bash
./bushy.sh theme mk [ThemeName] yes
```

Removal:
```bash
./bushy.sh theme rm [ThemeName]
```

To fk up(Randomize themes):
```bash
./bushy.sh theme rand
```

Also i think there is a GUI
```bash
./bushy.sh theme gui
```

### Desk (Extension Manager)
This sub command lets you save your current enabled extensions as a template... idk how to explain i hope u get it

Examples:

Setting:
```bash
./bushy.sh desk set [SetUpName]
```

Saving:
```bash
./bushy.sh desk save [SetUpName] [ThemeName]
```
**[ThemeName]** here should be a valid theme from bushy themes.

Listing:
```bash
./bushy.sh desk list 
```

### FSRCH/File Search
This is actually independent, you can use it to quickly(i think) search files... i guess... i'm sorry i'm just not good at explaining... 

Example:

```bash
./bushy.sh find -p [filePath] -f [StringToFind]
```

to search inside text files
```bash
./bushy.sh find -p [filePath] -f [StringToFind] -c
```


And well that's just it, good luck. try not to fk up


