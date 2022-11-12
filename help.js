var col = require('./colorom');
var log = console.log;
var { pickRandom } = require('./rand')

var ac = ['blue', 'yellow'];

function help(ins){
	for(var i in ins){
		var args = "";
		var text = ins[i];
		if(text.text) text = text.text;

		if(ins[i].args){
			ins[i].args.forEach((a) => args += " "+col[pickRandom(...ac)](a));
		}
	
		log(col.green(i), args.trim(),"|", col.white.bold(text));
	}
}
module.exports = help;
