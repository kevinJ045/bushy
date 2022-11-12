var path = require('path');
var fs = require('fs');
var shell = require('child_process');
var help = require('./help');
var log = console.log;


var args = process.argv;
args.shift();
args.shift();

var arg = args[0];

function findPath(name){
	return path.resolve(path.join(__dirname, name))
}

function exit(text){
	console.log(text);
	process.exit(1);
}

var acts = {
	"theme": (args) => {
		var todo = "";
		if(args[0] == 'gui'){
			todo = "python3 "+findPath('theme/main.py')
		} else if(args[0] == 'custom'){
			todo = "gnome-tweaks"	
		} else {
			var a = shell.fork(findPath('theme/index.js'), process.argv);
			a.on('exit', (code) => {
				if(code) process.exit(1);
			});
			// todo = "node "+findPath('theme/index.js')+" "+args.join(" ");
			return 0;
		}
		// shell.spawn(todo);
		shell.exec(todo);
		// shell.exec(todo, (...e) => console.log(e));
		return 0;
	},
	"desk": (args) => {
		var a = shell.fork(findPath('desk/index.js'), process.argv);
		a.on('exit', (code) => {
			if(code) process.exit(1);
		});
	},
	"lang": (args) => {
		var a = shell.fork(findPath('lang/main.js'), process.argv);
		a.on('exit', (code) => {
			if(code) process.exit(1);
		});
	},
	"gui": (args) => {
		shell.exec("python3 "+findPath('gui/win.py'));
	},
	"find": (args) => {
		console.log(shell.execSync("java "+findPath('srch/main.java') + " " + args.join(' ')).toString().trim())
	}
}

acts["-h"] = acts["--help"] = acts["help"] = (args) => {
	help({
		'theme': {
			'args': ['[, args]'],
			'text': "Changes themes"
		},
		'desk': {
			'args': ['[, args]'],
			'text': "Changes desktop setup"
		},
	})
}

if(arg in acts){
	var act = args.shift();
	acts[arg](args);
} else {
	log('Dawg, don\'t you know the bushy commands?');
	process.exit(1);
}

