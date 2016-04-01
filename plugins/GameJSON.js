
Phaser.Plugin.GameJSON = function(game, parent) {
    Phaser.Plugin.call(this, game, parent);
    //settings by default
    this._default = {};
    this._settings = this._default;
    this._parse_gamejson = function (gamejson) {
        this._data = gamejson;
        if (typeof this._data == "string") {
            try {
                this._data = JSON.parse(this._data);
            } catch(e) {
                console.error("ERROR: gamejson must be a plane map object or a valid json string. ", gamejson);
                return false;
            }
        }
        return true;
    }
    this._create_scenes = function() {
        for (var name in this._data.scenes) {
            console.log(name, this._data.scenes[name]);
            var spec = this._data.scenes[name];
            spec.child_name = name; 
            var state = new Phaser.Plugin.GameJSON.Scene(game, spec);
            game.state.add(name, state, spec.autostart);
            // this.scenes[name] = state;
        }
    }
    this._create = function (gamejson) {
        if (this._parse_gamejson(gamejson)) {
            console.assert(this._data, "ERROR: this._data not set");
            this._create_scenes();
            
        } else {
            console.warn("WARNING: this._data not set properly");
        };        
    };
    this._resize = function () {
        var current = this.game.state.getCurrentState();
        console.log("onResize() current state: ", current);
        current.resize();
    };
    
    this.preUpdate  = null;
    this.update     = null;
    this.postUpdate = null;
    this.render     = null;
    this.postRender = null;
};
Phaser.Plugin.GameJSON.utils = {
    hexToRgb: function (hex) {
        // http://stackoverflow.com/a/5624139
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }        
}
Phaser.Plugin.GameJSON.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.GameJSON.prototype.constructor = Phaser.Plugin.GameJSON;

Phaser.Plugin.GameJSON.prototype.setup = function (obj) {
    this._settings = Phaser.Utils.extend(false, {}, this._default, obj);
};
Phaser.Plugin.GameJSON.prototype.create = function() {
    return this._create.apply(this, arguments);
};
Phaser.Plugin.GameJSON.prototype.resize = function() {
    return this._resize.apply(this, arguments);
};
// --------------------------------------------------------------------------------------
Phaser.Plugin.GameJSON.Base = function (game, spec) {
    this.game = game;
    this.spec = spec;
    this.createChildren();
    this.sortChildren();
}
Phaser.Plugin.GameJSON.Base.prototype = {
    constructor: Phaser.Plugin.GameJSON.Base,
    getDependencies: function () {
        var result = [];
        if (this.spec.position) {
            result.push(this.spec.position.of);
        }
        if (this.spec.anchors) {
            for (var i in this.spec.anchors) {
                result.push(this.spec.anchors[i].of);
            }            
        }        
        return result;
    },
    sortChildren: function () {
        console.assert(this.children, "ERROR: this.children does't exist");
        var index = 0;
        var list = this.children.map(function (n) { return n; }); // copia limpia
        var ready = {};
        var new_order = [];
        var counter = 100;
        while (list.length > 0) {
            if (counter--<0) {
                console.error("ERROR: infinite dependency loop");
                break;
            } 
            var child = list.shift();
            var deps = child.getDependencies();
            console.assert(typeof child.spec.child_name == "string", "ERROR: child.spec.child_name is not a string", child);
            ready[child.spec.child_name] = true;
            for (var i=0; i<deps.length; i++) {
                if (deps[i] == "parent") continue;
                index = deps[i].indexOf("parent.");
                if (index == 0) {
                    var dep = deps[i].substr(7);
                    if (!(dep in ready)) {
                        ready[child.spec.child_name] = false;
                        list.push(child);
                    }
                }
            }
            if (ready[child.spec.child_name]) new_order.push(child);
        }
        console.assert(this.children.length == new_order.length, "ERROR: some child lost in the sorting proccess");
        this.children = new_order;
    },
    createChildren: function () {
        console.assert(this.spec, "ERROR: this.spec does't exist");
        this.children = [];
        for (var name in this.spec.children) {
            var child_spec = this.spec.children[name];
            var child = null;
            var constructor = Phaser.Plugin.GameJSON[child_spec.type];
            console.assert(constructor, "ERROR: type not found: ", child_spec.type, [child_spec]);
            child_spec.child_name = name;
            child = new constructor(this.game, child_spec);
            child.parent = this;            
            this.children.push(child);
        }
    },
    childrenDoCreate: function() {
        console.assert(this.children, "ERROR: this.children does't exist");
        for (var i=0; i<this.children.length; i++) {
            this.children[i].create();
            // this.children[i].childrenDoCreate();
        }        
    },
    getChild: function(name) {        
        for (var i=0; i<this.children.length; i++) {
            if (this.children[i].child_name == name) {
                return this.children[i];
            }
        }
        console.error("ERROR: no child with name '"+name+"' was found", this.children);
    },
    translateToCoords: function (str) {
        var x, y, ox, oy;
        console.assert(typeof str == "string", "ERROR: str must be a string. got: ", typeof str);
        var parts = str.split(" ");
        console.assert(parts.length == 2, "ERROR: str MUST have two expresions separated by one space. got: ", str);
        
        switch (parts[0]) {
            case "top":    oy = 0;   break;
            case "middle": oy = 0.5; break;
            case "bottom": oy = 1;   break;
            default:
                if (parts[0].indexOf("%") != -1) {
                    oy = parseInt(parts[0].substr(0, parts[0].indexOf("%"))) * 0.01;
                } else {
                    oy = parts[0] / this.height;
                }
        }
        
        switch (parts[1]) {
            case "left":   ox = 0;   break;
            case "center": ox = 0.5; break;
            case "right":  ox = 1;   break;
            default:
                if (parts[1].indexOf("%") != -1) {
                    ox = parseInt(parts[1].substr(0, parts[1].indexOf("%"))) * 0.01;
                } else {
                    ox = parts[1] / this.width;
                }
        }
        
        x = this.phaserObj.x + this.phaserObj.width * ox;
        y = this.phaserObj.y + this.phaserObj.height * oy;        
        return {x:x, y:y};
        
    },
    computeSize: function () {
        // console.log("computePosition>---->",this, this.parent, this.parent.width);
        var result = {width: 200, height: 100};
        
        if (this.spec.width) {
            if (typeof this.spec.width == "string" && this.spec.width.indexOf("%") != -1) {
                var w_percent = parseFloat(this.spec.width.substr(0, this.spec.width.indexOf("%")));
                result.width = w_percent * this.parent.width / 100;
            } else {
                result.width = parseInt(this.parent.width);
            }
        }
        
        if (this.spec.height) {
            if (typeof this.spec.height == "string" && this.spec.height.indexOf("%") != -1) {
                var h_percent = parseFloat(this.spec.height.substr(0, this.spec.height.indexOf("%")));
                result.height = h_percent * this.parent.height / 100;
            } else {
                result.height = parseInt(this.parent.height);
            }
        }
        return result;
    },
    computePosition: function () {
        // console.log("computePosition>---->",this, this.parent, this.parent.width);
        var result = {x:0,y:0};
        
        if (this.spec.position) {
            console.assert(typeof this.spec.position.of == "string", "ERROR: position MUST have a 'of' attribute referencing a valid object");
            console.assert(typeof this.spec.position.at == "string", "ERROR: position MUST have a 'at' attribute referencing a valid object");
            var refobj = this.parent;
            var index = this.spec.position.of.indexOf("parent.");
            if (index != -1) {
                refobj = this.parent.getChild(this.spec.position.of.substr(index));
            }
            this.phaserObj.y = this.phaserObj.x = 0;
            var my_coords = this.translateToCoords(this.spec.position.my);
            var at_coords = refobj.translateToCoords(this.spec.position.at);
            result.x = at_coords.x - my_coords.x;
            result.y = at_coords.y - my_coords.y;
        }
        return result;
    },
    setSize: function (size) {
        this.phaserObj.width  = size.width;
        this.phaserObj.height = size.height;       
    },
    setPosition: function (pos) {
        this.phaserObj.x      = pos.x;
        this.phaserObj.y      = pos.y;            
    },
    resize: function () {
        console.log("Phaser.Plugin.GameJSON.base.prototype.resize");
        this.setSize(this.computeSize());
        this.setPosition(this.computePosition());
        for (var i in this.children) {
            this.children[i].resize();
        }
    }
}
// --------------------------------------------------------------------------------------
Phaser.Plugin.GameJSON.Scene = function (game, spec) {
    this.phaserObj = game.world;
    this.width = game.world.width;
    this.height = game.world.height;
    Phaser.Plugin.GameJSON.Base.call(this, game, spec);    
}

Phaser.Plugin.GameJSON.Scene.prototype = Object.create(Phaser.Plugin.GameJSON.Base.prototype);
Phaser.Plugin.GameJSON.Scene.prototype.constructor = Phaser.Plugin.GameJSON.Scene;
Phaser.Plugin.GameJSON.Scene.prototype.resize = function () {
    this.width = this.game.world.width;
    this.height = this.game.world.height;
    
    console.log(this.game.stage.width);
    
    for (var i in this.children) {
        this.children[i].resize();
    }
}

Phaser.Plugin.GameJSON.Scene.prototype.create = function () {
    this.childrenDoCreate();
    this.resize();
}

// --------------------------------------------------------------------------------------
Phaser.Plugin.GameJSON.Sprite = function (game, spec) {
    Phaser.Plugin.GameJSON.Base.call(this, game, spec);
}
Phaser.Plugin.GameJSON.Sprite.prototype = Object.create(Phaser.Plugin.GameJSON.Base.prototype);
Phaser.Plugin.GameJSON.Sprite.prototype.constructor = Phaser.Plugin.GameJSON.Sprite;
Phaser.Plugin.GameJSON.Sprite.prototype.create = function () {
    
    this.phaserObj = {width:11, height:22, x:0,y:0};
    this.childrenDoCreate();
}

// --------------------------------------------------------------------------------------

Phaser.Plugin.GameJSON.BitmapData = function (game, spec) {
    Phaser.Plugin.GameJSON.Base.call(this, game, spec);
}
Phaser.Plugin.GameJSON.BitmapData.prototype = Object.create(Phaser.Plugin.GameJSON.Base.prototype);
Phaser.Plugin.GameJSON.BitmapData.prototype.constructor = Phaser.Plugin.GameJSON.BitmapData;
Phaser.Plugin.GameJSON.BitmapData.prototype.create = function () {
    var pos, color = Phaser.Plugin.GameJSON.utils.hexToRgb(this.spec.fillStyle);
    var layout = {x:22,y:33,width:200,height:200};
    this.bmd = this.game.make.bitmapData(layout.width,layout.height);
    this.bmd.fill(color.r, color.g, color.b);
    this.img = this.bmd.addToWorld(layout.x,layout.y);
    this.phaserObj = this.img;
    this.childrenDoCreate();
}

Phaser.Plugin.GameJSON.BitmapData.prototype.setSize = function (size) {
    this.bmd.width  = size.width;
    this.bmd.height = size.height;
    Phaser.Plugin.GameJSON.Base.prototype.setSize.call(this, size);
}
// --------------------------------------------------------------------------------------

Phaser.Plugin.GameJSON.DOM_Wrapper = function (game, spec) {
    Phaser.Plugin.GameJSON.Base.call(this, game, spec);
}
Phaser.Plugin.GameJSON.DOM_Wrapper.prototype = Object.create(Phaser.Plugin.GameJSON.Base.prototype);
Phaser.Plugin.GameJSON.DOM_Wrapper.prototype.constructor = Phaser.Plugin.GameJSON.Sprite;
Phaser.Plugin.GameJSON.DOM_Wrapper.prototype.create = function () {
    this.phaserObj = {width:11, height:22, x:0,y:0};
    this.childrenDoCreate();
}
