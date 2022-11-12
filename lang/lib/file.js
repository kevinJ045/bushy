var path = require("path");

module.exports = class File{

    constructor(file){
        var name = path.resolve(file);
        this.fullpath = name;
        this.path = path.dirname(file);
        this.name = path.basename(file);
    }
	
}