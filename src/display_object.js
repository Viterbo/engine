LightSaber.DisplayObject = function (game,spec,parent) {
    Phaser.Sprite.call(this, game, 0, 0, spec.texture);
    this.game = game;
    this.spec = spec;
    this._ls_parent = parent;
    if (parent) {
        parent.addChild(this);
    }
    this.createChildren();
    this.sortChildren();
};

LightSaber.DisplayObject.prototype = jwk.extend(Object.create(Phaser.Sprite.prototype), {

    constructor: LightSaber.DisplayObject,
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
        console.assert(this._ls_children, "ERROR: this._ls_children does't exist");
        var index = 0;
        var list = this._ls_children.map(function (n) { return n; }); // copia limpia
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
        console.assert(this._ls_children.length == new_order.length, "ERROR: some child lost in the sorting proccess");
        this._ls_children = new_order;
    },
    createChildren: function () {
        console.assert(this.spec, "ERROR: this.spec does't exist");
        this._ls_children = [];
        for (var name in this.spec.children) {
            var child_spec = this.spec.children[name];
            var child = null;
            var constructor = LightSaber[child_spec.type];
            console.assert(constructor, "ERROR: type not found: ", child_spec.type, [child_spec]);
            child_spec.instance_name = name;            
            child = new constructor(this.game, child_spec, this);
            child._ls_parent = this;            
            this._ls_children.push(child);
        }
    },
    childrenDoCreate: function() {
        console.assert(this._ls_children, "ERROR: this._ls_children does't exist");
        for (var i=0; i<this._ls_children.length; i++) {
            this._ls_children[i].create();
            // this._ls_children[i].childrenDoCreate();
        }        
    },
    getChild: function(name) {        
        for (var i=0; i<this._ls_children.length; i++) {
            if (this._ls_children[i].instance_name == name) {
                return this._ls_children[i];
            }
        }
        console.error("ERROR: no child with name '"+name+"' was found", this._ls_children);
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
        
        x = this.x + this.width * ox;
        y = this.y + this.height * oy;        
        return {x:x, y:y, ox:ox, oy:oy};
        
    },
    setDeployment: function (dep) {
        console.error("ERROR");
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
                result.width = w_percent * this._ls_parent.width / 100;
            } else {
                result.width = parseInt(this.spec.width);
            }
        }
        
        if (this.spec.height) {
            if (typeof this.spec.height == "string" && this.spec.height.indexOf("%") != -1) {
                var h_percent = parseFloat(this.spec.height.substr(0, this.spec.height.indexOf("%")));
                result.height = h_percent * this._ls_parent.height / 100;
            } else {
                result.height = parseInt(this.spec.height);
            }
        }
        
        if (apply) {
            this.setSize(result);
        } else {
            before = {
                x: this.x,
                y: this.y
            }
        }
        
        if (this.spec.position) {
            console.assert(typeof this.spec.position.of == "string", "ERROR: position MUST have a 'of' attribute referencing a valid object");
            console.assert(typeof this.spec.position.at == "string", "ERROR: position MUST have a 'at' attribute referencing a valid object");
            var refobj = this._ls_parent;
            var index = this.spec.position.of.indexOf("parent.");
            if (index != -1) {
                refobj = this._ls_parent.getChild(this.spec.position.of.substr("parent.".length));
            }            
            this.y = this.x = 0;            
            var my_coords = this.translateToCoords(this.spec.position.my);
            var at_coords = refobj.translateToCoords(this.spec.position.at);
            result.x = at_coords.x - my_coords.x;
            result.y = at_coords.y - my_coords.y;
        }

        if (this.spec.anchors) {
            console.assert(this.spec.anchors.length == 2, "ERROR: anchors MUST be an array-like object width 2 objects containing {my, at, of} map each");
            var refobj = [this._ls_parent,this._ls_parent],
                index = [],
                my_coords=[],
                at_coords=[];
            
            this.y = this.x = 0;        
            for (var i=0;i<2;i++) {
                index[i] = this.spec.anchors[i].of.indexOf("parent.");
                if (index[i] != -1) {
                    refobj[i] = this._ls_parent.getChild(this.spec.anchors[i].of.substr("parent.".length));
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
        this.width  = size.width;
        this.height = size.height;       
    },
    setPosition: function (pos) {
        this.x      = pos.x;
        this.y      = pos.y;            
    },
    resize: function () {
        // console.log("Phaser.Plugin.JSON2Game.base.prototype.resize");
        this.updateDeployment();
        for (var i in this._ls_children) {
            this._ls_children[i].resize();
        }
        // console.log(this);
        //alert("resize: " + this.instance_name);
    }
});