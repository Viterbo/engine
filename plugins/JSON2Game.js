// asdasdsd
Phaser.Plugin.JSON2Game = function(game, parent) {
    Phaser.Plugin.call(this, game, parent);
    //settings by default
    this._default = {};
    this._settings = this._default;
    this._parse_JSON2Game = function (JSON2Game) {
        this._data = JSON2Game;
        if (typeof this._data == "string") {
            try {
                this._data = JSON.parse(this._data);
            } catch(e) {
                console.error("ERROR: JSON2Game must be a plane map object or a valid json string. ", JSON2Game);
                return false;
            }
        }
        return true;
    }
    this._create_scenes = function() {
        for (var name in this._data.scenes) {
            console.log(name, this._data.scenes[name]);
            var spec = this._data.scenes[name];
            spec.instance_name = name; 
            var state = new Phaser.Plugin.JSON2Game.Scene(game, spec);
            game.state.add(name, state, spec.autostart);
            // this.scenes[name] = state;
        }
    }
    this._create = function (JSON2Game) {
        if (this._parse_JSON2Game(JSON2Game)) {
            console.assert(this._data, "ERROR: this._data not set");
            this._create_scenes();
            
        } else {
            console.warn("WARNING: this._data not set properly");
        };        
    };
    this._resize = function () {
        var current = this.game.state.getCurrentState();
        // console.log("onResize() current state: ", current);
        current.resize();
    };
    
    this.preUpdate  = null;
    this.update     = null;
    this.postUpdate = null;
    this.render     = null;
    this.postRender = null;
};
Phaser.Plugin.JSON2Game.utils = {
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
Phaser.Plugin.JSON2Game.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.JSON2Game.prototype.constructor = Phaser.Plugin.JSON2Game;

Phaser.Plugin.JSON2Game.prototype.setup = function (obj) {
    this._settings = Phaser.Utils.extend(false, {}, this._default, obj);
};
Phaser.Plugin.JSON2Game.prototype.create = function(gamejson) {
    var self = this;
    for (var name in gamejson.preload) {        
        this.game.load.image(name, gamejson.preload[name]);
    }
    this.game.load.onLoadComplete.add(function () {
        self._create.call(self, gamejson);
    }, this);
    this.game.load.start();
    
    return this;
};
Phaser.Plugin.JSON2Game.prototype.resize = function() {
    return this._resize.apply(this, arguments);
};
// --------------------------------------------------------------------------------------
Phaser.Plugin.JSON2Game.Base = function (game, spec) {
    this.game = game;
    this.spec = spec;
    this.instance_name = spec.instance_name;
    this.createChildren();
    this.sortChildren();
}
Phaser.Plugin.JSON2Game.Base.prototype = {
    constructor: Phaser.Plugin.JSON2Game.Base,
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
            console.assert(typeof child.spec.instance_name == "string", "ERROR: child.spec.instance_name is not a string", child);
            ready[child.spec.instance_name] = true;
            for (var i=0; i<deps.length; i++) {
                if (deps[i] == "parent") continue;
                index = deps[i].indexOf("parent.");
                if (index == 0) {
                    var dep = deps[i].substr(7);
                    if (!(dep in ready)) {
                        ready[child.spec.instance_name] = false;
                        list.push(child);
                    }
                }
            }
            if (ready[child.spec.instance_name]) new_order.push(child);
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
            var constructor = Phaser.Plugin.JSON2Game[child_spec.type];
            console.assert(constructor, "ERROR: type not found: ", child_spec.type, [child_spec]);
            child_spec.instance_name = name;
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
            if (this.children[i].instance_name == name) {
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
        return {x:x, y:y, ox:ox, oy:oy};
        
    },
    setDeployment: function (dep) {        
        this.phaserObj.width  = dep.width;
        this.phaserObj.height = dep.height;       
        this.phaserObj.x      = dep.x;
        this.phaserObj.y      = dep.y;
        return this;
    },
    updateDeployment: function () {
        this.computeDeployment(true);
        return this;
    },
    computeDeployment: function (apply) {
        var result = {width: 12, height: 34},
            berofe = {};
        
        if (this.spec.width) {
            if (typeof this.spec.width == "string" && this.spec.width.indexOf("%") != -1) {
                var w_percent = parseFloat(this.spec.width.substr(0, this.spec.width.indexOf("%")));
                result.width = w_percent * this.parent.phaserObj.width / 100;
            } else {
                result.width = parseInt(this.spec.width);
            }
        }
        
        if (this.spec.height) {
            if (typeof this.spec.height == "string" && this.spec.height.indexOf("%") != -1) {
                var h_percent = parseFloat(this.spec.height.substr(0, this.spec.height.indexOf("%")));
                result.height = h_percent * this.parent.phaserObj.height / 100;
            } else {
                result.height = parseInt(this.spec.height);
            }
        }
        
        if (apply) {
            this.setSize(result);
        } else {
            before = {
                x: this.phaserObj.x,
                y: this.phaserObj.y
            }
        }
        
        if (this.spec.position) {
            console.assert(typeof this.spec.position.of == "string", "ERROR: position MUST have a 'of' attribute referencing a valid object");
            console.assert(typeof this.spec.position.at == "string", "ERROR: position MUST have a 'at' attribute referencing a valid object");
            var refobj = this.parent;
            var index = this.spec.position.of.indexOf("parent.");
            if (index != -1) {
                refobj = this.parent.getChild(this.spec.position.of.substr("parent.".length));
            }            
            this.phaserObj.y = this.phaserObj.x = 0;            
            var my_coords = this.translateToCoords(this.spec.position.my);
            var at_coords = refobj.translateToCoords(this.spec.position.at);
            result.x = at_coords.x - my_coords.x;
            result.y = at_coords.y - my_coords.y;
        }

        if (this.spec.anchors) {
            console.assert(this.spec.anchors.length == 2, "ERROR: anchors MUST be an array-like object width 2 objects containing {my, at, of} map each");
            var refobj = [this.parent,this.parent],
                index = [],
                my_coords=[],
                at_coords=[];
            
            this.phaserObj.y = this.phaserObj.x = 0;        
            for (var i=0;i<2;i++) {
                index[i] = this.spec.anchors[i].of.indexOf("parent.");
                if (index[i] != -1) {
                    refobj[i] = this.parent.getChild(this.spec.anchors[i].of.substr("parent.".length));
                }            
                my_coords[i] = this.translateToCoords(this.spec.anchors[i].my);
                at_coords[i] = refobj[i].translateToCoords(this.spec.anchors[i].at);
            }
            
            /*
            // Despeje 
            result.x + result.width * my_coords[0].ox = at_coords[0].x;
            result.x + result.width * my_coords[1].ox = at_coords[1].x;
            
            result.x + result.width * my_coords[0].ox - (result.x + result.width * my_coords[1].ox)= at_coords[0].x - (at_coords[1].x);            
            result.x + result.width * my_coords[0].ox - result.x - result.width * my_coords[1].ox = at_coords[0].x - at_coords[1].x;
            result.width * my_coords[0].ox - result.width * my_coords[1].ox = at_coords[0].x - at_coords[1].x;
            result.width * (my_coords[0].ox - my_coords[1].ox) = at_coords[0].x - at_coords[1].x;
            result.width = (at_coords[0].x - at_coords[1].x) / (my_coords[0].ox - my_coords[1].ox);  <<--- (width)
            
            result.x = at_coords[0].x - result.width * my_coords[0].ox; <<--- (x)
            
            */
            
            result.width  = Math.abs((at_coords[0].x - at_coords[1].x));
            result.x      = at_coords[0].x - result.width * my_coords[0].ox;
            result.height = Math.abs((at_coords[0].y - at_coords[1].y));
            result.y      = at_coords[0].y - result.width * my_coords[0].ox;
            
            if (apply) {
                this.setSize(result);
            }
        }

        if (apply) {
            this.setPosition(result);
        } else {
            this.setPosition(before);
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
        // console.log("Phaser.Plugin.JSON2Game.base.prototype.resize");
        this.updateDeployment();
        for (var i in this.children) {
            this.children[i].resize();
        }
        // console.log(this);
        //alert("resize: " + this.instance_name);
    }
}
// --------------------------------------------------------------------------------------
Phaser.Plugin.JSON2Game.Scene = function (game, spec) {
    this.phaserObj = game.world;
    this.width = game.world.width;
    this.height = game.world.height;
    Phaser.Plugin.JSON2Game.Base.call(this, game, spec);    
}

Phaser.Plugin.JSON2Game.Scene.prototype = Object.create(Phaser.Plugin.JSON2Game.Base.prototype);
Phaser.Plugin.JSON2Game.Scene.prototype.constructor = Phaser.Plugin.JSON2Game.Scene;
Phaser.Plugin.JSON2Game.Scene.prototype.resize = function () {
    this.width = this.game.world.width;
    this.height = this.game.world.height;
    
    // console.log(this.game.world.width);
    
    for (var i in this.children) {
        this.children[i].resize();
    }
}

Phaser.Plugin.JSON2Game.Scene.prototype.create = function () {
    this.childrenDoCreate();
    this.resize();
}

Phaser.Plugin.JSON2Game.Scene.prototype.update = function () {
    // console.log("Phaser.Plugin.JSON2Game.Scene.prototype.update");
    // alert("update: Scene");
}

// --------------------------------------------------------------------------------------
CroppedSprite = function (game, x, y, texture) {
    Phaser.Sprite.call(this, game, x, y, texture);
};
CroppedSprite.prototype = Object.create(Phaser.Sprite.prototype);
CroppedSprite.prototype.constructor = CroppedSprite;
CroppedSprite.prototype.update = function() {
    console.log("this.updateCrop();");
    this.updateCrop();
};
MaskedSprite = function (game, x, y, texture) {
    Phaser.Sprite.call(this, game, x, y, texture);
};
MaskedSprite.prototype = Object.create(Phaser.Sprite.prototype);
MaskedSprite.prototype.constructor = MaskedSprite;
MaskedSprite.prototype.update = function() {
    
};
// ---------------------------------

Phaser.Plugin.JSON2Game.Sprite = function (game, spec) {
    Phaser.Plugin.JSON2Game.Base.call(this, game, spec);
}
Phaser.Plugin.JSON2Game.Sprite.prototype = Object.create(Phaser.Plugin.JSON2Game.Base.prototype);
Phaser.Plugin.JSON2Game.Sprite.prototype.constructor = Phaser.Plugin.JSON2Game.Sprite;
Phaser.Plugin.JSON2Game.Sprite.prototype.create = function () {
    // this.phaserObj = new CroppedSprite(game, 0, 0, this.spec.texture); // game.add.sprite(0, 0, this.spec.texture);
    this.phaserObj =  this.game.add.sprite(0, 0, this.spec.texture);
    this.game.add.existing(this.phaserObj);    
    
    this.cropRect  = new Phaser.Rectangle(0, 0, this.phaserObj.texture.width, this.phaserObj.texture.height);
    
    
    this.mask = this.game.add.graphics(0, 0);

    //	Shapes drawn to the Graphics object must be filled.
    this.mask.beginFill(0xff0000);
    this.mask.drawRect(0, 0, this.phaserObj.texture.width, this.phaserObj.texture.height);
    this.phaserObj.mask = this.mask;    
    
    
    this.texture = {h:this.phaserObj.texture.height, w: this.phaserObj.texture.width};
    this.aspectRatio = this.texture.w / this.texture.h;
    //this.phaserObj.crop(this.cropRect);
    this.childrenDoCreate();
}
Phaser.Plugin.JSON2Game.Sprite.prototype.setDeployment = function (dep) {
    Phaser.Plugin.JSON2Game.Base.prototype.setDeployment.call(this, dep);
    
    if (dep.crop) {
        if (dep.crop.x) this.cropRect.x = dep.crop.x;
        if (dep.crop.y) this.cropRect.y = dep.crop.y;
        if (dep.crop.width) this.cropRect.width = dep.crop.width;
        if (dep.crop.height) this.cropRect.height = dep.crop.height;
    }    
    if (dep.mask) {
        this.mask.clear();
        this.mask.beginFill(0xff0000);
        this.mask.drawRect(dep.mask.x, dep.mask.y, dep.mask.width, dep.mask.height);        
    }
    
}
Phaser.Plugin.JSON2Game.Sprite.prototype.computeDeployment = function (apply) {    
    var dep = Phaser.Plugin.JSON2Game.Base.prototype.computeDeployment.call(this, false);    
    var temp, percent;    
    this.phaserObj.scale.x = 1;
    this.phaserObj.scale.y = 1;
    var size = this.spec["texture-size"];
    switch (size) {
        case "cover":
            
            
            
            dep.mask = {x:dep.x,y:dep.y,width:dep.width,height:dep.height};
            
            
            if (this.aspectRatio <= dep.width / dep.height) {
                temp = dep.width / this.aspectRatio;
                percent = 0.5 * (temp-dep.height)/temp;
                // dep.crop = {height:Math.floor(this.texture.h*(1-percent*2))+1};
                // console.log(dep.crop.height, percent, temp, dep.height);
                // dep.crop = {height:dep.height};
                // dep.crop = {y:percent*this.texture.h, height:(1-percent*2) * this.texture.h};
                dep.y -= 0.5 * (temp-dep.height);
                dep.height = temp;
            } else {
                temp = dep.height * this.aspectRatio;
                //percent = 0.5 * (temp-dep.width)/temp;
                //dep.crop = { x:percent*this.texture.w, width:(1-percent*2) * this.texture.w};
                dep.x -= 0.5 * (temp-dep.width);
                dep.width = temp;
            }
            break;
        case "contain":
            if (this.aspectRatio <= dep.width / dep.height) {                
                temp = dep.height * this.aspectRatio;
                dep.x += 0.5 * (temp-dep.width);
                dep.width = temp;
            } else {
                temp = dep.width / this.aspectRatio;
                dep.y += 0.5 * (temp-dep.height);
                dep.height = temp;  
            }
            break;
        default:
    }    
    if (apply) {
        this.setDeployment(dep);   
    }
    return dep;
}

// --------------------------------------------------------------------------------------

Phaser.Plugin.JSON2Game.BitmapData = function (game, spec) {
    Phaser.Plugin.JSON2Game.Base.call(this, game, spec);
}
Phaser.Plugin.JSON2Game.BitmapData.prototype = Object.create(Phaser.Plugin.JSON2Game.Base.prototype);
Phaser.Plugin.JSON2Game.BitmapData.prototype.constructor = Phaser.Plugin.JSON2Game.BitmapData;
Phaser.Plugin.JSON2Game.BitmapData.prototype.create = function () {
    var pos, color = Phaser.Plugin.JSON2Game.utils.hexToRgb(this.spec.fillStyle);
    var layout = {x:22,y:33,width:200,height:200};
    this.bmd = this.game.make.bitmapData(layout.width,layout.height);
    this.bmd.fill(color.r, color.g, color.b);
    this.img = this.bmd.addToWorld(layout.x,layout.y);
    this.phaserObj = this.img;
    this.childrenDoCreate();
}

Phaser.Plugin.JSON2Game.BitmapData.prototype.setDeployment = function (dep) {
    this.bmd.width  = dep.width;
    this.bmd.height = dep.height;
    Phaser.Plugin.JSON2Game.Base.prototype.setDeployment.call(this, size);
}
Phaser.Plugin.JSON2Game.BitmapData.prototype.setSize = function (size) {
    this.bmd.width  = size.width;
    this.bmd.height = size.height;
    Phaser.Plugin.JSON2Game.Base.prototype.setSize.call(this, size);
}
// --------------------------------------------------------------------------------------

Phaser.Plugin.JSON2Game.DOM_Wrapper = function (game, spec) {
    Phaser.Plugin.JSON2Game.Base.call(this, game, spec);
}
Phaser.Plugin.JSON2Game.DOM_Wrapper.prototype = Object.create(Phaser.Plugin.JSON2Game.Base.prototype);
Phaser.Plugin.JSON2Game.DOM_Wrapper.prototype.constructor = Phaser.Plugin.JSON2Game.Sprite;
Phaser.Plugin.JSON2Game.DOM_Wrapper.prototype.create = function () {
    this.phaserObj = {width:11, height:22, x:0,y:0};
    this.childrenDoCreate();
}
