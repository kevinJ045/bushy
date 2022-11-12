const fs = require("fs");
const path = require("path");
const col = require("./lib/col");
const shell = require("child_process");
const cla = require("command-line-args");
const _eval = require("./eval");

const getScript = src => fs.readFileSync(path.resolve(src)).toString();

const getPkgName = (name, vars) => {
	if(vars[name]) name = name+"-rep";
	else name = name;
	return vars[name] ? getPkgName(name, vars) : name;
}

const options = [
	{ name: 'src', multiple: true, defaultOption: true, type: String},
	{ name: 'arg', alias: 'a', multiple: true, type: String},
	{ name: 'verbose', alias: 'v', type: Boolean},
	{ name: 'renamevars', alias: 'r', type: Boolean},
	{ name: 'help', alias: 'h', type: Boolean}
];

var mkRegEx = function(str,flags){
  var that = this;
  if(!flags) flags = 'mg';
  return new RegExp(str.replace(/\%([A-Za-z0-9_]+)/g,function(a,b){
    return RegexSet[b];
  }),flags);
};

function trimWordStype(string){
  return string ? string.replace('<','').replace('>','') : "";
}

function ext(a){
  return a.match(".") ? a.split(".").pop() : "";
}

function extend(obj1, obj2){
	var obj = obj2;
	for(var i in obj1){
		obj[i] = obj1[i];
	}
	return obj;
}

var RegexSet = {
  "any": "([\\s\\S]*)",
  "wordcc": "([A-Za-z0-9_ ]+)",
  "wordvar": "([A-Za-z0-9_.]+)",
  "wordstype": "([A-Za-z0-9_<> ]+)",
  "wordstype2": "([A-Za-z0-9_<>: ]+)",
  "worddot": "([A-Za-z0-9_.()[\\]{} ]+)",
  "nums": "([0-9 ]+)",
  "numscalc": "([$0-9-+\\\\*.^% ]+)",
  "linebreak": "([\\n\\r\\t ]*)",
  "nums_1": "([0-9 ]+|)",
  "nums_brace": "([0-9[\\] ]+)",
  "any_s": "(\\s+)",
  "constructor": "([A-Z])([A-Za-z0-9_ ]+)"
};

var patterns = {
	"con1": {
		reg: "#%worddot %wordcc\\(%any\\)",
		type: "con"
	},
	"set1": {
		reg: "@set %wordcc as %any",
		type: "var"
	},
	"set2": {
		reg: "@v %wordcc = %any",
		type: "var"
	},
	"def": {
		reg: "@def %wordcc > %any",
		type: "def"
	},
	"pkg": {
		reg: "@pkg %wordcc",
		type: "pkg"
	},
	"i": {
		reg: "@i %any",
		type: "i"
	},
	"i2": {
		reg: "@i %any as %wordcc",
		type: "i"
	},
	"state": {
		reg: "@state(%any) > %any",
		type: "state",
		states: {
			"equals": "%any == %any",
			"not_null": "&%any",
			"is_null": "!%any"
		}
	}
}

var multiline = {
	"def": {
		reg: "@def %wordcc{%any}",
		type: "def"
	}
};

function addGui(){
	
}

var GUI = {
	btn: (_an, text) => {
		if(!text) text = "Button";
		addGui("",text, _an);
	},
	init: (_an) => {
		console.log(_an);
	}
}

var functions = {
	"put": (line, vars) => {
		vars["@exports"] = parseValue(line.value.replace('put ', ''));
		return vars["@exports"];	
	},
	"gui": (line, vars) => {
		line = line.value.replace('gui ', '');
		var cmds = line.match(" ") ? line.split(" ") : [line];
		var cmd = cmds.shift();
		if(cmd == "make"){
			vars.__gui__ = {
				child: []
			};
		} else {
			if(!vars.__gui__) return error(5, 0, 'GUI is not made!!');
			if(cmd in GUI){
				GUI[cmd](vars.__gui__, ...cmds);
			} else {
				error(5, 0, 'GUI Component '+cmd+' does not exist;');
			}
		}
	},
	"opt": (line) => {
		if(params.verbose) console.log(col.green.bold('# Loading custom config for script...'));
		line = line.value.replace("opt ", "");
		var json = JSON.parse(JSON.parse(JSON.stringify(line)));
		if(json.rmv != null){
			params.renamevars = json.rmv;
		}
		if(json.gui){
			params.gui = json.gui;
		}
	},
	"exec": (line) => {
		line = line.value.replace("exec ", "");
		try{
			var c = line.match(' ') ? line.split(' ') : [line];
			var d = c.shift();
			var args = c.join(" ");
			var a = shell.spawnSync(d, [c], {stdio: 'inherit'});	
			//console.log(a);
			// if(a.error) throw new Error(a.error);
			//console.log(a.toString().trim());
		} catch(e){
			error(2, 0, e);
		}
	},
	"log": (args) => {
		console.log(args.value);
	}
}

var _arg_ = "";

var doi = {
	vars: { functions , _arg_ },
	"var": (line, index, lines, vars) => {
		if(!vars) vars = doi.vars;
		var words = line.split(" ");
		words.shift();
		var name = words.shift();
		words.shift();
		var value = parseValue(words.join(" "), vars);
		vars[name] = value;
	},
	"def": (line, index, lines, vars) => {
		var args = line.split('>');
		var name = args[0].split("@def")[1].trim();
		var func = args[1];
		func = func.match('|') ? func.split('|') : [func];
		if(!vars.functions) vars.functions = {};
		vars.functions[name] = (...args) => {
			args = Array.from(args);
			if(args[0].value.trim().match(' ')) args = args[0].value.split(' ');
			var obj = {};
			args.forEach((i, ind) => {
				obj[ind] = i.value ? i : parseValue(i,extend(vars, obj));
			});
			obj["_"] = parseValue(args.filter(i => i.split ? i : "")
						.join(" "), extend(vars, obj));
			var s = parse(func.join("\n"), extend(vars, obj));
			if(s.vars["@exports"]) return s.vars["@exports"].value;
			return "";
		}
	},
	pkg: (line, index, lines) => {
		line = line.replace("@pkg ", "");
		lines.name = line;
	},
	i: (line, index, lines, vars) => {
		if(!vars) vars = doi.vars;
		line = line.replace("@i ", "");
		var _name;
		if(line.match(mkRegEx('as %wordcc'))){
			_name = line.split(mkRegEx('as %wordcc'))[1].trim();
			line = line.split(mkRegEx('as %wordcc'))[0].trim();
		}
		var file = line;
		var obj = {imported: parseValue(1)};
		var p = parse(getScript(file), obj);
		var name = p.name || line;
		if(params.renamevars && vars[name]) name = getPkgName((p.name || line), vars);
		if(_name) name = _name;
		if(params.renamevars && vars[name]) name = getPkgName(_name, vars);
		if(vars[name]) error(3, index, name);
		vars[name] = obj;
	},
	state: (line, index, lines, vars) => {
		var a = line.split("(");
		var b = a[1].split(")");
		var c = b[0];
		var d = b[1].split('>')[1].trim();
		var g;
		var els = false;
		if(d.match('@else')) {
			els = true;
			g = d.split('@else')[1];
			d = d.split('@else')[0];
		}
		var _state;
		var states = [];
		states = c.match("||") ? c.split("||") : [c];
		if(c.match('&&')) c.concat(c.split("&&"));
		var OR = true;
		states.forEach((u) => {
			if(u.match(mkRegEx(patterns.state.states.equals))){
				var f = parseVar(u.split("==")[0]).toString().trim();
				var e = parseVar(u.split("==")[1]).toString().trim();
				if(f == e) _state = OR ? _state || true : _state && true;
			}
			if(u.match(mkRegEx(patterns.state.states.not_null))){
				var f = u.split("&")[1];
				if(parseVar(f) != "@null" && parseVar(f) != null) _state = OR ? _state || true : _state && true;
			}
			if(c.match(mkRegEx(patterns.state.states.is_null))){
				var f = u.split("!")[1];
				if(parseVar(f) == "@null" || parseVar(f) == null) _state = OR ? _state || true : _state && true;
			}
		});
		var e = parseValue(c).value;
		e = e.match("@null") ? "null" : e;
		// e = e.replace(mkRegEx('%wordstype'), (a, b) => {
			// return "\"" + b + "\"";
		// })
		try{
			if(_eval(e)) _state = true;
		} catch(e) {
			error(4, '');
		}
		if(_state) {
			parseLine(d, index, lines, vars);
		} else{
			if(els && g){
				parseLine(g, index, lines, vars);
			} 
		}
	}
}

var errs = {
	1: {
		type: "Reference",
		text: (text) => {
			return "Function "+text+" doesn't exist.";
		}
	},
	2: {
		type: "Execute",
		text: (text) => {
			return "Command Failed: \n"+text;
		}
	},
	3: {
		type: "Reference",
		text: (text) => {
			return "Package "+text+" already exists!!.";
		}
	},
	4: {
		type: "State",
		text: (text) => {
			return "If statement error...";
		}
	},
	5: {
		type: "GUI",
		text: (t) => {
			return t;
		}
	}
}

function error(num, ln, text){
	var err = errs[num];
	console.log(col.red(err.type+"Error: "+err.text(text)));
	process.exit();
}

function findName(name, vars){
	// console.log(vars);
	if(name.match('.')){
		var names = name.split('.');
		name = names.pop();
		names.forEach((i) => {
			if(!vars[i]) return;
			vars = vars[i];	
		});
	}
	
	return {name, vars};
}

function findVal(name, vars){
	if(!vars) vars = doi.vars;
	var a = findName(name, vars);
	name = a.name;
	vars = a.vars;
	
	if(vars[name]){
		return vars[name].value;
	} else {
		return "@null"
	}
}

function parseVar(_var){
	return _var.replace(mkRegEx("\\$%wordvar"), (a, b, c) => {
		return findVal(b);
	});
}

function parseValue(val, vars){
	if(!vars) vars = doi.vars;
	var type = isNaN(Number(val)) ? "string" : "number";
	var _val = {
		type: type,
		value: ""
	};
	if(val.match && val.match(mkRegEx("calc\\(%any\\)"))){
		val = val.replace(mkRegEx("\\$%wordvar"), (a, b, c) => {
			return findVal(b, vars);
		}).replace(mkRegEx("calc\\(%numscalc\\)"), (a, b, c) => {
			return _eval(b);
		}).replace(mkRegEx("\\$%wordvar\\(%any\\)"), (a, b, c) => {
			return console.log(a,b,c);
		});
	}
	type = _val.type = isNaN(Number(val)) ? "string" : "number";
	if(type == "string" && val.replace){
		_val.value = val.replace(mkRegEx("\\$%wordvar"), (a, b, c) => {
			return findVal(b, vars);
		});
	}  else {
		_val.value = Number(val);
	}
	_val.value = _val.value.replace ? _val.value.replace(mkRegEx("\\$%wordvar\\(%any\\)"), (a, b, c) => {
		if(vars.functions[b]) return vars.functions[b](parseValue(c));
	}) : _val.value;
	return _val;
}

function execFunction(line, lineno, lines, vars){
	var words = line.split(" ");
	var name = words.shift();
	var args = words.join(" ");

	var a = findName(name, vars);
	name = a.name;
	vars = a.vars;
	
	if(vars[name] || vars.functions[name] != null){
		var val = parseValue(args, vars);
		if(val.value.replace) val.value = val.value.replace(/\\n/g, "\n");
		return (vars[name] || vars.functions[name])(val, vars);
	} else {
		error(1, lineno, name);
	}
}

function parseLine(line, index, lines, vars){
	var pattern;
	if(line[0] == "#") return;
	if(line.trim() == "") return;
	line.no = index+1;
	line = line.trim();
	for(var i in patterns){
		if(line.match(mkRegEx(patterns[i].reg))){
			pattern = {
				_v: patterns[i],
				type: "pattern"
			}
			break;
		}
	}
	line = line.replace(mkRegEx("\\$%wordvar\\(%any\\)"), (a, b, c) => {
		if(vars.functions[b]) return vars.functions[b](parseValue(c));
	});
	if(!pattern) pattern = {
		_v: null,
		type: "expression"
	}
	if(pattern.type == "pattern"){
		for(var i in doi){
			var type = pattern._v.type;
			if(type == i){
				doi[i](line, index, lines, vars);
			}
		}
	} else {
		execFunction(line, index, lines, vars);		
	}
}

function lineExtends(line){
	if(line[0] == "^") return true;
}

function parse(src, vars){
	if(!vars) vars = doi.vars;
	var lines = src.replace(/\n\^/g, ' ').split("\n");

	lines = lines.filter((it) => {
		return it[0] != "#" && it.trim() != "";
	});

	// for(var i in multiline){
		// if(lines.match(mkRegEx(multiline[i].reg))){
			// console.log('hahaha')
		// }
	// }

	lines.forEach((line, index) => {
		parseLine(line, index, lines, vars);
	});

	return { name: (lines.name ? lines.name : ""), vars: vars, lines: lines }
}


function main(a){
	var parsed = parse(getScript(a));
}

var params = cla(options);

if(params.help){
	process.exit();
}

if(params.arg) _arg_ = doi.vars._arg_ = parseValue(params.arg.join(' '), {});

if(params.src && params.src[0]){
	params.src.forEach((e) => {
		main(e);
	});	
}
