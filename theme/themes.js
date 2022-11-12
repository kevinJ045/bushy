var fs = require('fs');
var path = require('path');
var shell = require('child_process');

var themes = JSON.parse(fs.readFileSync(__dirname+"/data.json").toString());

module.exports = {
	check: (e) => {
		return e in themes;
	},
	exec: (args) => {
		shell.fork((__dirname+'/index.js'), args.split(' '));
	}
}
