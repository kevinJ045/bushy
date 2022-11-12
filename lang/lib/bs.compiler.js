const { v4: uuidV4 } = require('uuid');
const fs = require('fs');
const getScript_exec = require('../main');
(function SingleModule(main_object){

  function Json(json_string){
    return JSON.parse(JSON.parse(JSON.stringify(json_string)));
  }
  function JsonStr(json){
    return JSON.stringify(json);
  }

  function trimWordStype(string){
    return string ? string.replace('<','').replace('>','') : "";
  }

  function readFile(src){
    return fs.readFileSync(path.resolve(src)).toString();
  }

  function readFile(filename){
    return new Promise(function(resolve,reject){
      var FM = new Bitso.FileManager(null,null,$.m.Main.utils.app);
      FM.fileExists(filename,function(fs,fileEntry){
        FM.readTextFile(fileEntry,fs,function(raw){
          resolve(raw.target.result)
        });
      },function(){
        reject("File Does Not Exist.");
      });
    });
  }

  function readFileSync(filename){
    filename = filename.replace(/\/\//g,'/');
    if(filename[0] == "/") filename = filename.replace("/","");
    var path = cordova.file.externalRootDirectory+filename;
    var gotten = new Bitso.http().get(path);
    return gotten;
  }

  var RegexSet = {
    "any": "([\\s\\S]*)",
    "wordcc": "([A-Za-z0-9_ ]+)",
    "wordstype": "([A-Za-z0-9_<> ]+)",
    "wordstype2": "([A-Za-z0-9_<>: ]+)",
    "worddot": "([A-Za-z0-9_.()[\\]{} ]+)",
    "nums": "([0-9 ]+)",
    "linebreak": "([\\n\\r\\t ]*)",
    "nums_1": "([0-9 ]+|)",
    "nums_brace": "([0-9[\\] ]+)",
    "any_s": "(\\s+)",
    "constructor": "([A-Z])([A-Za-z0-9_ ]+)"
  };
  var BasicSyntaxReplacers = [{
    "name": "@uses Expression 1",
    "regex": "@uses (namespace|interface) %wordstype;",
    callback: function(str,a,b){this.Use(str);}
  },{
    "name": "@uses Expression 2",
    "regex": "@uses %wordstype;",
    callback: function(str,a){this.Use(str);}
  },{
    "name": "@include Expression 1",
    "regex": "@include %wordstype2 as %wordstype;",
    callback: function(str,a,b){return this.Include(str);}
  },{
    "name": "@include Expression 2",
    "regex": "@include %wordstype2;",
    callback: function(str,a){return this.Include(str);}
  }];
  var Replacers = [{
    "name": "no bracket function caller",
    "regex": "@#([A-Za-z0-9_]+) %any;",
    "replacer": function(){
      return "$(#){1}(${2});";
    }
  },{
    "name": "Hash constructors",
    "regex": "#%worddot %wordcc\\(%any\\);",
    "replacer": function(){
      return "var ${2} = new ${1}(${3});";
    }
  },{
    "name": "Set Declaration",
    "regex": "@set %wordcc as %any;",
    "replacer": function(){
      return "var ${1} = ${2};";
    }
  }];
  var BuiltInFunctions = {
    throws: function(drw,ctx){
      return function Throw(err){
        var printable, linenoreg = /<anonymous>\:([0-9]+)\:([0-9]+)/gm;
        if(!err.constructor || !err.constructor.name.match('Error')){
          err = new Error(err);
        }
        drw.trigger('error:cpl',{error: err});
        var e = err;
        var msg = e.message || e.toString();
        var stack = e.stack.split('at')[1].trim().split(' ')[0];
        var lineno = (function(){
          var str = e.stack.match(linenoreg) ? e.stack.match(linenoreg)[0].replace('<anonymous>','') : "";
          if(!str) return "";
          var lns = str.split(':');
          var lnno = (Number(lns[1])-1);
          lns[1]=lnno;
          return lns.join(':');
        })();
        if(stack == "eval") stack = "Global.global";
        var name = e.name || "Error";
        printable = name+": "+msg + " at "+stack + " in "+ctx.ctx.file + lineno;
        return drw.print(printable);
      }
    },
    Json: function(drw,ctx){
      return function Json(json_string){
        return JSON.parse(JSON.parse(JSON.stringify(json_string)));
      }
    },
    JsonStr: function(drw,ctx){
      return function JsonStr(json){
        return JSON.stringify(json);
      }
    },
    print: function(drw,ctx){
      return function Print(){
        return drw.print.apply(drw,arguments);
      }
    },
    require: function(drw,ctx){
      return function Require(){
        var args = Array.from(arguments);
        if(args.length == 0) return null;
        if(args.length > 1){
          var toReturn = {};
          args.forEach(function(module){
            toReturn[module] = drw.Modules[module];
          });
          return toReturn;
        } else {
          return drw.Modules[args[0]];
        }
      }
    },
    define: function(drw,ctx,global){
      return function Define(module,dependencies,fn){
        if(typeof module != "string"){
          throw new TypeError("Define takes the first argument as a string, which is not a string now.");
        }
        if(typeof dependencies != "object" && !dependencies instanceof Array){
          throw new TypeError("Define takes the second argument as an Array, which is not an Array now.");
        }
        if(typeof fn != "function"){
          throw new TypeError("Define takes the third argument as a Function, which is not a Function now.");
        }
        var deps = [], fulfilleddeps = [];
        if (dependencies) {deps = dependencies};
        deps.forEach(function(module){
          fulfilleddeps.push(global.require(module));
        });
        drw.Modules[module] = fn.apply(global,fulfilleddeps);
      }
    },
    module: function(drw,ctx,global){
      function Module(name){
        this.name = name;
      }
      Module.prototype = {
        exports: function Exports(exports){ctx.exported = exports;},
        require: global.require,
        define: global.define
      }
      drw.builtInFn(Module);
      drw.builtInFn(Module.prototype.exports);
      drw.defineBuiltInModules(ctx,global,global.define,global.require);
      var module = new Module(ctx.ctx.file);
      return module;
    },
    include: function(drw,ctx){
      return function Import(file,type){
        return ctx.ctx.include(file,type);
      }
    },
    export: function(drw,ctx){
      return function Export(){
        var ind = 0;
        if(arguments.length < 2){
          ctx.ctx.exported = arguments[0];
          return Array.from(arguments);
        } else {
          ctx.ctx.exported = {};
          ctx.ctx.exported.push = function(fn){
            ctx.ctx.exported[ind] = fn;
            ind++;
          }
          Array.from(arguments).forEach(function(module){
            if(typeof module == "function"){
              ctx.ctx.exported[module.name] = module;
              return;
            };
            ctx.ctx.exported.push(module);
          });
          delete ctx.ctx.exported.push;
          return Array.from(arguments);
        }
      }
    },
    exports: function(drw){
      return BuiltInFunctions.export;
    },
    each: function(){
      function Each(s,cb){
        if(typeof s != 'object') throw new TypeError("The first argument must be an object");
        if(typeof cb != 'function') throw new TypeError("The second argument must be a function");
        for(var i in s){
          cb(s[i],i);
        }
      };
      Each.__stringify__ = "@f Each(Object obj, Function fn)";
      return Each;
    },
    repeat: function(){
      return function Repeat(cb,num,start){
        if(start == null) start = 0;
        for (var i = start; i < num; i++) {
          cb(i);
        }
      }
    },
    template: function(){
      return function Template(string,object){
        if(typeof string != "string") throw new TypeError("The first argument must be String!!"); 
        if(typeof object != "object") throw new TypeError("The second argument must be Object!!"); 
        return Bitso.BitsoTemplate(string,object);
      }
    },
    alert: function(drw,ctx){
      return function Dialog(msg,title){
        drw.f7_app.$app.dialog.alert(msg,title); 
      }
    },
    prompt: function(drw,ctx){
      return function Dialog(msg,callback,title){
        if(typeof callback != "function") callback = function(){};
        drw.f7_app.$app.dialog.prompt(msg,callback,title); 
      }
    },
    confirm: function(drw,ctx){
      return function Dialog(msg,callback,title){
        if(typeof callback != "function") callback = function(){};
        drw.f7_app.$app.dialog.confirm(msg,callback,title); 
      }
    },
    $: function(drw,ctx,global){
      return function $(){
        if(arguments.length <= 1) throw new TypeError("$: There should be more than 1 parameter in the $-template function");
        var args = Array.from(arguments);
        var a = args.shift();
        if(typeof a == "string" && typeof args[0] == "object"){
          return global.template(a,args[0]);
        }
        if(typeof a != "object") throw new TypeError("$: The first argument should be an object!!");
        var obj = Object.create(a);
        args.forEach(function(prop,index){
          var argno = ":argument "+index;
          if(!prop.val) throw new ReferenceError("$: The property should have a value, try val: something"+argno);
          if(!prop.key && !prop.value.name) throw new ReferenceError("$: The object property should have name, try key: \"name\""+argno);
          var name = prop.key || prop.value.name;
          try{
            Object.defineProperty(obj,name,{
              value: prop.val,
              writable: prop.readonly ? false : true,
              enumerable: prop.enum || false
            });
          } catch(e){
            global.throws(e);
          }
        });
        return obj;
      };
    },
    localStorage: function(drw,ctx,global){
      var lsm = drw.LSM;
      function LSM(){};
      LSM.prototype = {
        get: function(){
          return lsm.get.apply(lsm,arguments);
        },
        set: function(){
          return lsm.set.apply(lsm,arguments);
        },
        remove: function(){
          return lsm.remove.apply(lsm,arguments);
        }
      };
      drw.builtInFn(LSM);
      for(var i in LSM.prototype) drw.builtInFn(LSM.prototype[i]);
      return new LSM();
    }
  };
  var HelperFuncions = {
    Component: function Component(tht,el,type,params,onclick,onhold){
      var e = el,
        pars = $.extend({},{
          click: true,
          hold: true,
          appendable: true,
          removable: true,
          prototypes: {},
          accepttypes: "*",
          emptyable: true
        },params);

      if(typeof pars.prototypes != "object") pars.prototypes = {};

      if(!type) type = "node";

      tht.init_width = $(e).width() || 0;
      tht.init_height = $(e).height() || 0;
      tht.init_text = $(e).text() || "";
      tht.type = type || "node";
      tht.nodeid = Bitso.generateRandUID();
      tht.__proto__ = new (function Component(){});
      var that = tht.__proto__;
      that.__proto__._onclick = function(){};
      that.__proto__._onHold = function(){};
      if(pars.appendable){
        that.appendTo = that.addTo = function(el){
          if(el.base_appendable) $(el.base_appendable).append(e);
          else if(el.append && el.setText) el.append(tht);
          else if(el.append) el.append(e);
          else e.appendTo(el);
        }
      }
      for(var i in pars.prototypes){
        that[i] = pars.prototypes[i];
      }
      that.setText = function(text){
        return $(e).text(text);
      }
      that.getText = function(){
        return $(e).text();
      }
      that.setWidth = function(width){
        return $(e).width(width);
      }
      that.setHeight = function(height){
        return $(e).height(height);
      }
      that.getWidth = function(){
        return $(e).width();
      }
      that.getHeight = function(){
        return $(e).height();
      }
      that.show = function(){
        $(e).show();
      };
      that.hide = function(){
        $(e).hide();
      };
      that.getChildren = function(){
        var children = [];
        Array.from($(e).children()).forEach(function(child){
          children.push(child.component__drw || Component({},child));
        });
        return children;
      };
      that.getChild = function(id){
        var chlds = that.getChildren(), chld = null;
        if(id){
          chlds.forEach(function(cld){
            if(cld.getId() == id) chld = cld;
          });
        } else {}
        return chld;
      };
      that.onClick = function(callback){
        if(typeof callback == "function") that._onclick = callback;
      }
      that.onHold = function(callback){
        if(typeof callback == "function") that._onHold = callback;
      }
      that.setId = function(id){
        e.id = id;
        return id;
      }
      that.getId = function(){
        return e.id;
      }
      if(pars.removable){
        that.remove = function(){
          $(e).remove();
        }
        that.removeChild = function(id){
          $(e).remove("#"+id);
        }
      }
      if(pars.emptyable){
        that.empty = function(){
          $(e).empty();
        }
      }
      that.gridable = function(size){
        if(typeof size != "number" || isNaN(parseInt(size)) || size > 100) size = 100;
        $(e).addClass('col col-'+size.toString());
      }
      that.append = that.add = function(){
        Array.from(arguments).forEach(function(node){
          if(pars.accepttypes != "*") {
            if(node.base && !$(node.base).hasClass(pars.accepttypes)) $(node.base).addClass(pars.accepttypes);
          }
          if(node.base) $(e).append(node.base);
        });
      }
      if(pars.click){
        $(el).on('click',function(){
          var p = onclick ? onclick(this) : [];
          that._onclick.apply(el,p);
        });
      };
      if(pars.hold){
        $(el).on('contextmenu',function(e){
          e.preventDefault();
          var p = onhold ? onhold(this) : [];
          that._onHold.apply(el,p);
        });
      }
      e.component__drw = tht;
      if(tht.autoAdd) that.addTo(tht.drw.parent);
      return tht;
    }
  };

  function bitscript(file,path,drw){
    this.drw = drw || new drw();
    this.file = file;
    this.path = path;
    this.uses = new (function Uses(){this.namespaces = {}; this.interfaces = {};})();
    this.includes = new (function Includes(){})();
  };

  bitscript.prototype = {
    path: "",
    file: "",
    exported: null,
    parent: {},
    navbar: {},
    getSrc: function(src){
      var path = this.path +"/"+ src;
      if(src[0] == "/") path = src;
      return path;
    },

    exports: function(){
      return this.exported;
    },

    include: function(src,type){
      var sc = this.getSrc(src);
      var file = this.drw.getBaseName(sc).name,path = this.drw.getBaseName(sc).path;
      var imported = readFileSync(sc) || "";
      if(type == "module"){
        var script = imported;
        var scriptExports = this.drw.script(script,sc,this.drw.global,
        this.parent,this.navbar);
        return scriptExports.main.ctx.exports();
      } else {
        var txt = imported;
        return txt;
      }
    },
    Include: function(line,name){
      var includes = this.includes;
      var that = this;
      var l = line.replace('@include ','').replace(';','');
      var ls = l.match(' ') ? l.split(' ') : [l];
      var included = function(f,n){
        var name = n ? (n.match('<') ? trimWordStype(n) : n) : "includes_"+trimWordStype(f);
        
        if(trimWordStype(f)[0] == ":"){
          var fname = trimWordStype(f).replace(":",'');
          var src = './'+fname+'.drw';
          var sc = that.getSrc(src);
          var script = readFile(src);
          console.log(getScript_exec);
          var scriptExports = new getScript_exec(src);
          var s = scriptExports.main.ctx.exports();
          includes[fname] = s;
          return;
        }

        if(f[0] == '<' || that.drw.ext(f) == "drw"){
          var fname = trimWordStype(f)+(f[0] == '<' ? ".drw" : ""), type = 'module';
        } else {
          var fname = trimWordStype(f), type = 'unknown';
        }
        if(n && n.match('<')){
          type = name;
        }
        var s = type != 'unknown' ? that.include(fname,type) : that.include(fname);
        if(!n && s && s.name){
          name = s.name;
        }
        includes[name] = s;
      };
      if(ls[1] == 'as' && ls[2]){
        included(ls[0],ls[2]);
      } else {
        included(ls[0]);
      }
    },

    Use: function(line){
      var uses = this.uses;
      var l = line.replace('@uses ','').replace(';','');
      var ls = l.match(' ') ? l.split(' ') : [l];
      if(!uses.namespaces) uses.namespaces = {};
      if(!uses.interfaces) uses.interfaces = {};
      if(ls[0] == "namespace"){
        uses.namespaces[trimWordStype(ls[1])] = "namespace";
      } if(ls[0] == "interface"){
        uses.interfaces[trimWordStype(ls[1])] = "interface";
      } else {
        uses[trimWordStype(ls[0])] = ls[1] ? ls[1] : true;
      }
    }
  }

  var generateID = () => {
    return uuidV4();
  };

  class compiler {

    constructor(...args){
      this.execute(...args);
    }

  };

  compiler.prototype.execute = function compiler(string, file, mods, lidrw, global){
    var that = this;
    var compiled = that.compile(string, file.path, file.name, global);
    var ctx = Object.create(compiled);
    var caller = that.create_caller(ctx,main_object);
    return {global:caller,main:ctx,code: compiled.code};
  }

  compiler.prototype.compile = function(content, path, file){
    if(!path) path = "/";
    if(!file) file = "base.drw";
    var that = this, id = generateID();
    var ctx = new bitscript(file,path,that);
    var tempStrs = {}, strind = 0;

    var drw_code = content;

    function CPL_all(){ 
      BasicSyntaxReplacers.forEach(function(icf,index){ // icf = interface
        drw_code = drw_code.replace(that.mkRegEx(icf.regex),function(){
          var r = icf.callback.apply(ctx,arguments);
          return "";
        });
      });
      Replacers.forEach(function(replacer,index){ // icf = interface
        var reg;
        if(replacer.regex instanceof RegExp) reg = replacer.regex;
        else reg = that.mkRegEx(replacer.regex);
        drw_code = drw_code.replace(reg,
        that.compileReplacer(replacer.replacer,that['compilation_'+id]));
      });
    };

    var drw_code_lines = drw_code.match('\n') ? drw_code.split('\n') : [drw_code];
    
    drw_code_lines.forEach(function(){
      CPL_all();
    });

    drw_code = drw_code.replace(that.mkRegEx("@%wordcc"),function(a,b){
      return "global."+b;
    });

    return {code: drw_code, ctx: ctx};
  }

  compiler.prototype.builtInFn = function(fn){
    function checkForMoreToString(obj){
      if(!obj || !obj.__proto__) return obj || {};
      while(obj.__proto__){
        if(obj.toString) delete obj.toString;
        obj = obj.__proto__;
      }
      return obj;
    }
    var last = checkForMoreToString(fn);
    var name = fn.name || "";
    var str = "@f "+name+"(){ BitScript API }";
    if(fn.__stringify__) str = fn.__stringify__;
    if(fn.__stringify__) delete fn.__stringify__;
    fn.toString = function toString(){
      return str;
    };
    return fn;
  };

  compiler.prototype.defineBuiltInModules = function(main,global,define,require){
    var that = this;
  };

  compiler.prototype.mkRegEx = function(str,flags){
    var that = this;
    if(!flags) flags = 'mg';
    return new RegExp(str.replace(/\%([A-Za-z0-9_]+)/g,function(a,b){
      return RegexSet[b];
    }),flags);
  };

  compiler.prototype.compileReplacer = function(replacer_fn,drw){
    var that = this;
    return function(){
      var args = arguments;
      var _args = Array.from(args);
      _args.unshift(that);
      _args.unshift(drw);
      var replacer = replacer_fn.apply(this,_args);
      var str = replacer.replace(/\$\{([0-9]+)\}/g,function(a,b){
        return args[b];
      });
      if(replacer.match(/\$\((.*)\)\{([0-9]+)\}/g)){
        str = str.replace(/\$\((.*)\)\{([0-9]+)\}/g,function(a,b,c){
          var gotten = args[c];
          var replacen = b.match(',') ? b.split(',') : [b];
          replacen.forEach(function(item,index){
            gotten = gotten.replace(RegExp(item,'g'),'');
          });
          return gotten;
        });
      }
      return str;
    }
  };

  compiler.prototype.create_caller = function(main,global){
    var that = this;
    var caller = new (function Global(){});
    var ctx = main.ctx;
    for(var i in ctx.includes){
      caller[i] = ctx.includes[i];
    }
    for(var i in BuiltInFunctions){
      if(i in global) delete global[i];
      var fn = BuiltInFunctions[i](that,main,caller);
      that.builtInFn(fn);
      caller[i] = fn;
    }
    caller.uses = ctx.uses;
    caller.includes = ctx.includes;
    caller.global = caller;

    global.global = caller;
    return caller;
  };


  compiler.RegexSet = RegexSet;
  compiler.BasicSyntaxReplacers = BasicSyntaxReplacers;
  compiler.BuiltInFunctions = BuiltInFunctions;
  compiler.Replacers = Replacers;
  compiler.HelperFuncions = HelperFuncions;

  module.exports = compiler;

})(global);