const shell = require('child_process');
const fs = require('fs');
const path = require('path');
const help = require('../help');
const { pickRandom } = require('../rand');
// const cla = require("command-line-args");
// 
// const options = [
	// { name: 'theme', multiple: true, defaultOption: true, type: String}
// ];
// 
// var params = cla(options);

var args = process.argv;
args.shift();
args.shift();

var act = process.argv[0];
var theme = process.argv[1];
var themes = JSON.parse(fs.readFileSync(__dirname+"/data.json").toString());

var pattern = /([A-Z]+)\=(.+)/i

function exit(text, code){
	if(!code) code = 0;
	if(text == 1) code = 1;
	if(text == 1) text = null;
	// if(text) throw new Error(text);
	if(text) console.log(text);
	process.exitCode = code;
	process.exit(code);
}

function getTheme(){
	var gshell = shell.execSync('gsettings get org.gnome.shell.extensions.user-theme name').toString().trim();
	var legacy = shell.execSync('gsettings get org.gnome.desktop.interface gtk-theme').toString().trim();
	var icons = shell.execSync('gsettings get org.gnome.desktop.interface icon-theme').toString().trim();
	return { shell: gshell, legacy, icons };
}

function setTheme(t){
	if(t.legacy) shell.execSync('gsettings set org.gnome.desktop.interface gtk-theme \''+ t.legacy+'\'');
	if(t.shell) shell.execSync('gsettings set org.gnome.desktop.wm.preferences theme \''+ t.shell+'\'');
	if(t.shell) shell.execSync('gsettings set org.gnome.shell.extensions.user-theme name \''+ t.shell+'\'');
	if((t.icons || t.icon )) shell.execSync('gsettings set org.gnome.desktop.interface icon-theme \''+ (t.icons || t.icon ) +'\'');
	if(t.bg){
		setBg(t.bg);
	}
}

function getAll(a){
	var themes_1 = shell.execSync('ls /usr/share/'+a).toString().trim().split('\n');
	var themes_2 = shell.execSync('ls $HOME/.'+a).toString().trim().split('\n');
	themes_1 = themes_1.filter(i => themeFileExists(a, i));
	themes_2 = themes_2.filter(i => themeFileExists(a, i));
	var the = themes_1.concat(themes_2);
	return the;
}

function themeFileExists(type, file){
	var a = fs.existsSync('/usr/share/'+type+'/'+file+'/index.theme');
	var b = fs.existsSync('$HOME/.'+type+'/'+file+'/index.theme');
	if(a || b) return true;
	return false;
}

function setBg(file){
	if(fs.existsSync(path.resolve(file))){
		shell.execSync('cp \''+path.resolve(file)+'\' '+ process.env.HOME + '/.config/background');
	}
}

function parse(theme){
	var l = theme.match(",") ? theme.split(",") : [theme];
	var props = {
		'shell': null,
		'legacy': null,
		'icons': null,
		'bg': null
	};
	l.forEach(ia => {
		if(!ia.match(pattern)) return;
		var i = ia.split('=')[0];
		var v = ia.split('=')[1];
		if(i in props){
			if(i != 'bg'){
				if(themeFileExists( (i == 'icons' ? 'icons' : 'themes'), v )){
					props[i] = v;		
				}
			} else {
				props[i] = v;
			}
		}
	});
	Object.keys(props).forEach(i => props[i] == null ? delete props[i] : i);
	setTheme(props);
	console.log('Done... did it fk up?');
	exit();
}

if(act == 'gui'){
	// shell.fork('echo hi');
	// shell.fork('python3 main.py');
	//shell.spawn('python3', [__dirname+'/main.py']);
	// shell.exec('python3 '+__dirname+'/main.py', (error, stdout, stderr) => {
		// if (error) {
		    // console.error(`exec error: ${error}`);
		    // return;
		  // }
		  // console.log(`stdout: No. of directories = ${stdout}`);
		  // if (stderr!= "")
		  // console.error(`stderr: ${stderr}`);
	// });
}

if(!act){
	exit('Put in theme dude, or just do \'help\'', 1);
}

if(act == 'help'){
	// console.log('COMMAND                                       ACT');
	// console.log('=======                                       ===');
	// console.log('');
	// console.log('help:                                         prints this help');
	// console.log('list:                                         lists all saved theme packs');
	// console.log('mk [name:string] [?savebg:boolean]:           save the current theme, optionally with the current desktop background');
	// console.log('set [name:string]:                            set the theme to one of the current theme packs');
	// console.log('rm [name:string]:                             remove theme from pack');
	help({
		help: 'prints this help',
		list: 'lists all saved theme packs',
		mk: {
			'args': ['[name:string]','[?savebg:boolean]'],
			'text': 'save the current theme, optionally with the current desktop background'
		},
		'set': {
			'args': ['[name:string]'],
			'text': 'set the theme to one of the current theme packs'
		},
		'rm': {
			'args': ['[name:string]'],
			'text': 'remove theme from pack'
		}
	})
	exit();
}

if(act == 'list'){
	if(theme){
		if(theme == 'icons' || theme == 'i'){
			console.log(getAll('icons').join('\n'));
		} else {
			console.log(getAll('themes').join('\n'));
		}
		exit();
	}
	for(var j in themes){
		console.log('Theme '+j+': ');
		for(var i in themes[j]){
			console.log('\t'+i + ": "+ themes[j][i]);
		}
	}
	exit();
}

if(act == 'rand'){
	console.log('Get ready for fkups...');
	var the = getAll('themes');
	var ic = getAll('icons');
	var a = pickRandom(...the);
	var b = pickRandom(...the);
	var c = pickRandom(...ic);
	console.log('Shell: ' +a);
	console.log('Legacy: ' +b);
	console.log('Icons: ' +c);
	setTheme({
		shell: a,
		legacy: b,
		icons: c
	});
	exit();
}

if(act == 'mk'){
	var th = getTheme();
	if(theme){

		if(args[2]) th.bg = process.env.HOME + '/Pictures/wallpapers/themes/'+theme+'.png';
		
		if(th.bg && !fs.existsSync(path.resolve(th.bg))) shell.execSync('cp \''+ process.env.HOME + '/.config/background\' '+ '\''+ th.bg +'\'');

		th.name = theme;
		
		themes[theme] = th;	

		for(var i in themes[process.argv[3]]){
			console.log('\t'+i + ": "+ themes[theme][i]);
		}

		fs.writeFileSync(__dirname+"/data.json", JSON.stringify(themes));
		
	} else {
		console.log('Gotta put the theme name lol');
	}
	exit();
}

if(act == 'rm'){
	if(!theme || !themes[theme]) process.exit(1);
	if('default' in themes[theme]) process.exit(1);
	delete themes[theme];
	fs.writeFileSync(__dirname+"/data.json", JSON.stringify(themes));
}

if(act == 'current'){
	console.log('Shell: '+getTheme().shell);
	console.log('Legacy: '+getTheme().legacy);
	console.log('Icons: '+getTheme().icons);
	exit();
}

if(act == 'set'){
	if(!theme){
		exit('Theme is required!!', 1);
	}
	if(theme.match(pattern)){
		parse(theme);
	}
	if(!(theme in themes)){
		exit('Theme does\'t exist!!', 1);
	}
	if(theme in themes) {
		var t = themes[theme];
		setTheme(t);
	}
	exit();
}

if(act == 'check'){ 
	if(theme in themes) {
		console.log(true);
	} else {
		console.log(false);
	}
}

exit(1);
// process.exit(1);
