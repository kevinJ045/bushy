var shell = require("child_process");
var fs = require('fs');
var path = require('path');
var theme = require('../theme/themes.js');
const help = require('../help');

var args = process.argv;
args.shift();
args.shift();


var act = args[0];
var name = args[1];

function findPath(name){
	return path.resolve(path.join(__dirname, name))
}

function exit(text, code){
	if(!code) code = 0;
	if(text == 1) code = 1;
	if(text == 1) text = null;
	// if(text) throw new Error(text);
	if(text) console.log(text);
	process.exitCode = code;
	process.exit(code);
}

var list = {};

fs.readdirSync(findPath("setups")).forEach(i => {
	var json = JSON.parse(fs.readFileSync(findPath("setups/"+i+"/data.json")).toString());
	list[i] = json;
});

function exec(et){
	return shell.execSync(et).toString().trim();
}

function extAct(...e){
	e = Array.from(e);
	var act = e.shift();
	e.forEach(i => {
		exec('gnome-extensions '+act+' '+i);
	});
}

function setupDesk(desk){
	if(!desk.enable) return;
	if(!desk.disable) return;
	if(!desk.theme) return;
	extAct('enable', ...desk.enable);
	extAct('disable', ...desk.disable);
	theme.exec('set '+desk.theme);
}

function ged(a){
	var c = '--enabled';
	if(a) c = '--disabled';
	return exec('gnome-extensions list '+c).split('\n');
}

if(act == 'help'){
	help({
		'help': "prints this help",
		'save': {
			'args': ['name:string', 'themeName:string'],
			'text': 'Saves the current desktop with theme',
		},
		'list': 'lists all available desktop setups',
		'set': {
			'args': ['name:string'],
			'text': 'Sets $name to the current desktop setup'
		}
	});
	exit();
}

if(act == 'list'){
	for(var i in list){
		console.log(i);
	}
	exit();
}

if(act == 'save'){
	if(!name) exit('name needed', 1);
	var enabled = ged();
	var disabled = ged(1);
	var a = name;
	if(!args[2]) exit('missing argument', 1);
	if(!theme.check(args[2])) exit('theme not existent', 1);
	if(fs.existsSync(findPath('setups/'+a))) exit('already exists', 1);
	fs.mkdirSync(findPath('setups/'+a));
	var data = { enabled, disabled, theme: args[2] };
	fs.writeFileSync(findPath('setups/'+a+'/data.json'), JSON.stringify(data));
	exit();
}

if(act == 'set'){
	if(!(name in list)){
		console.log('not exist');
		exit(1);
	} else {
		setupDesk(list[name]);
	}
	exit();
}

exit('sorry', 1);
