(function (undef) {
;
//------------------------------------------------------


function LightSaber(settings) {
    this.init(settings);
};

LightSaber.utils = {};
LightSaber.utils.$ = window.$ 
    || window.jQuery 
    || (typeof angular != "undefined" ? angular.element : null)
    || (typeof jwk != "undefined" ? jwk.query : null)
    || window.TreeQuery;
LightSaber.utils.Deferred = LightSaber.utils.$.Deferred 
    || (typeof jwk != "undefined" ? jwk.Deferred : null);    
LightSaber.utils.extend = LightSaber.utils.$.extend 
    || (typeof angular != "undefined" ? angular.extend : null)
    || (typeof jwk != "undefined" ? jwk.extend : null);    


LightSaber.prototype = {
    constructor: LightSaber,
    tweenable_properties: {
        alpha: true
    },
    init:function (settings) {
        this._settings = LightSaber.utils.extend({
            height:600,
            width:800,
            container_id:'',
            full_document: true,
            auto_resize: true,
            section: "/"
        }, settings);
                
        if (this._settings.spec) this.create(this._settings.spec);
        
    },
    create: function (spec) {
        var saber = this;        
        this.clear();
        this.engine = new LightSaber.Engine(LightSaber.utils.extend(spec, {callbacks:this._settings}), saber);
        this.engine._ls_start().done(function (){            
            if (saber._settings.auto_resize) {
                saber.engine._game.renderer.autoResize = true;
                window.onresize = saber.resize.bind(saber);                            
                saber.enter_section(saber._settings.section);
            }            
        });
    },
    clear: function () {
    },
    resize :function () {
        var height = window.innerHeight;
        var width = window.innerWidth;
        if (this.engine) this.engine._ls_resize(width, height);
    },
    enter_section: function (section) {
        this._section = section;
        this.update_spec();
        this.resize();
    },
    update_spec: function (spec) {
        if (this.engine) this.engine._ls_update_spec();
    },
    // -------------------------------------------------------
    
    create_handler: function (event_name) {
        var saber = this;
        return function (target, pointer) {
            switch(target.spec[event_name].handler) {
                case "scene-enter-section":
                    saber.enter_section(target.spec[event_name].params);
                    break;
            }
        }
    },
    extend_spec: function (spec) {
        var self = this;
        var obj = LightSaber.utils.extend({}, spec);
        var class_list = [];
        
        if (spec.class) {
            if (typeof spec.class == "string") {
                spec.class = spec.class.split(" ");
            }
            console.assert(Array.isArray(spec.class), spec.class);
            console.assert(this._settings.spec.class, this._settings.spec.class);
            for (var i in spec.class) {
                var _class_name = spec.class[i];
                var _class_spec = this._settings.spec.class[_class_name];
                var _class_final = this.extend_spec(_class_spec);
                obj = LightSaber.utils.extend(obj, _class_final);
                class_list.push(_class_name);
            }
            obj.class = class_list;
        }
        
        if (spec.instance_name && this._section && this._settings.spec.scene.sections) {
            
            function section_iterate(_section, callback) {
                if (_section == "/") {
                    callback(_section);
                } else {
                    var list = _section.split("/");
                    list.pop();
                    var newsection = list.join("/");
                    if (newsection == "") newsection = "/";
                    section_iterate(newsection, callback);
                    callback(_section);
                }
            }

            section_iterate(this._section, function (path) {
                // console.log("section_iterate() ---> ", path);
                var sec = self._settings.spec.scene.sections[path];
                if (sec && sec[spec.instance_name]) {
                    var _section_spec = sec[spec.instance_name];
                    _section_spec = self.extend_spec(_section_spec);
                    obj = LightSaber.utils.extend(obj, _section_spec);
                }
            });
            
        }
        return obj;
    }
};;
//------------------------------------------------------


LightSaber.DisplayObject = function (game,spec,parent) {
    console.log("spec.texture", spec.texture)
    Phaser.Sprite.call(this, game, 0, 0, spec.texture);
    this.game = game;
    this.spec = spec;
    this.data = spec;
    this.state = {x:0, y:0, width: 123, height: 456};
    this.instance_name = spec.instance_name;
    this._ls_parent = parent;    
    if (parent) {
        // parent.addChild(this);
        this.game.world.addChild(this);
    }
    
    this.subscribeToEvents();
    this.createChildren();
    this.sortChildren();
};

LightSaber.DisplayObject.prototype = LightSaber.utils.extend(Object.create(Phaser.Sprite.prototype), {

    constructor: LightSaber.DisplayObject,
    getDependencies: function () {
        var result = [];
        if (this.data.position) {
            result.push(this.data.position.of);
        }
        if (this.data.anchors) {
            for (var i in this.data.anchors) {
                result.push(this.data.anchors[i].of);
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
        console.assert(this.data, "ERROR: this.data does't exist");
        this._ls_children = [];
        for (var name in this.data.children) {            
            var child_spec = this.data.children[name];
            child_spec.instance_name = name;  
            child_spec = this.game.saber.extend_spec(child_spec);
            var child = null;
            var constructor = LightSaber[child_spec.type];
            console.assert(constructor, "ERROR: type not found: ", child_spec.type, [child_spec]);
            child = new constructor(this.game, child_spec, this);
            child._ls_parent = this;            
            this._ls_children.push(child);
        }
    },
    subscribeToEvents: function () {
        for (var name in this.spec) {
            var event_spec = this.spec[name];
            switch(name) {
                case "onInputOver":
                case "onInputDown":
                    var handler = this.game.saber.create_handler(name, event_spec);
                    this.inputEnabled = true;                
                    this.events[name].add(handler, this);                    
                    break;
                default:
                    if (name.indexOf("on") == 0) {
                        console.warn("WARNING: if not an event handler, dont use 'on' as a prefix. property found: ", name);
                    }
            }
        }
    },
    update_spec: function() {
        console.assert(this._ls_children, "ERROR: this._ls_children does't exist");
        this.data = this.game.saber.extend_spec(this.spec);
        for (var prop in this.data) {
            if (prop in this.game.saber.tweenable_properties) {
                if (this.data[prop] != this.state[prop]) {
                    // console.log("Estoy agregando la prop:", prop);
                    this.state[prop] = this.data[prop];
                }
                // console.log(">", this.spec.instance_name, this.state);
            }
        }
        for (var i=0; i<this._ls_children.length; i++) {
            this._ls_children[i].update_spec();
            // this._ls_children[i].childrenDoCreate();
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
            case "center": oy = 0.5;
                console.error("ERROR: use 'middle' instead of 'center' for vertical aligment");
                break;
            default:
                if (parts[0].indexOf("%") != -1) {
                    oy = parseInt(parts[0].substr(0, parts[0].indexOf("%"))) * 0.01;
                } else {
                    oy = parts[0] / this.state.height;
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
                    ox = parts[1] / this.state.width;
                }
        }
        
        x = this.state.x + this.state.width * ox;
        y = this.state.y + this.state.height * oy;        
        return {x:x, y:y, ox:ox, oy:oy};
        
    },
    setDeployment: function (dep) {
        this.setSize(dep);
        this.setPosition(dep);
    },
    updateDeployment: function () {
        this.computeDeployment(true);
        return this;
    },
    computeDeployment: function (apply) {
        console.debug("DisplayObject.computeDeployment("+  apply + ")");
        
        var result = {width: 12, height: 34},
            before = {};
        
        if (this.data.width) {
            if (typeof this.data.width == "string" && this.data.width.indexOf("%") != -1) {
                var w_percent = parseFloat(this.data.width.substr(0, this.data.width.indexOf("%")));
                result.width = w_percent * this._ls_parent.state.width / 100;
            } else {
                result.width = parseInt(this.data.width);
            }
        }
        
        if (this.data.maxWidth) {
            if (typeof this.data.maxWidth == "string" && this.data.maxWidth.indexOf("%") != -1) {
                var w_percent = parseFloat(this.data.maxWidth.substr(0, this.data.maxWidth.indexOf("%")));
                result.maxWidth = w_percent * this._ls_parent.state.width / 100;
            } else {
                result.maxWidth = parseInt(this.data.maxWidth);
            }
            result.width = Math.min(result.maxWidth, result.width);
        }
        
        if (this.data.minWidth) {
            if (typeof this.data.minWidth == "string" && this.data.minWidth.indexOf("%") != -1) {
                var w_percent = parseFloat(this.data.minWidth.substr(0, this.data.minWidth.indexOf("%")));
                result.minWidth = w_percent * this._ls_parent.state.width / 100;
            } else {
                result.minWidth = parseInt(this.data.minWidth);
            }
            result.width = Math.max(result.minWidth, result.width);
        }
                
        if (this.data.height) {
            if (typeof this.data.height == "string" && this.data.height.indexOf("%") != -1) {
                var h_percent = parseFloat(this.data.height.substr(0, this.data.height.indexOf("%")));

                result.height = h_percent * this._ls_parent.state.height / 100;
            } else {
                result.height = parseInt(this.data.height);
            }
        }
        
        if (this.data.maxHeight) {
            if (typeof this.data.maxHeight == "string" && this.data.maxHeight.indexOf("%") != -1) {
                var h_percent = parseFloat(this.data.maxHeight.substr(0, this.data.maxHeight.indexOf("%")));
                result.maxHeight = h_percent * this._ls_parent.state.height / 100;
            } else {
                result.maxHeight = parseInt(this.data.maxHeight);
            }
            result.height = Math.min(result.maxHeight, result.height);
        }
        
        if (this.data.minHeight) {
            if (typeof this.data.minHeight == "string" && this.data.minHeight.indexOf("%") != -1) {
                var h_percent = parseFloat(this.data.minHeight.substr(0, this.data.minHeight.indexOf("%")));
                result.minHeight = h_percent * this._ls_parent.state.height / 100;
            } else {
                result.minHeight = parseInt(this.data.minHeight);
            }
            result.height = Math.max(result.minHeight, result.height);
        }
        
        if (apply) {
            this.setSize(result);
        } else {
            before = {
                width: this.state.width,
                height: this.state.height,
                x: this.state.x,
                y: this.state.y
            }
            // el objeto ya tiene que tener seteado su tamaño antes de ejecutar this.translateToCoords(this.data.position.my);
            this.state.width = result.width;
            this.state.height = result.height;
        }
        
        if (this.data.position) {
            console.assert(typeof this.data.position.of == "string", "ERROR: position MUST have a 'of' attribute referencing a valid object");
            console.assert(typeof this.data.position.at == "string", "ERROR: position MUST have a 'at' attribute referencing a valid object");
            var refobj = this._ls_parent;
            var index = this.data.position.of.indexOf("parent.");
            if (index != -1) {
                refobj = this._ls_parent.getChild(this.data.position.of.substr("parent.".length));
            }            
            this.state.y = this.state.x = 0;            
            var my_coords = this.translateToCoords(this.data.position.my);
            var at_coords = refobj.translateToCoords(this.data.position.at);
            result.x = at_coords.x - my_coords.x;
            result.y = at_coords.y - my_coords.y;
        }

        if (this.data.anchors) {
            console.assert(this.data.anchors.length == 2, "ERROR: anchors MUST be an array-like object width 2 objects containing {my, at, of} map each");
            var refobj = [this._ls_parent,this._ls_parent],
                index = [],
                my_coords=[],
                at_coords=[];
            
            this.y = this.x = 0;        
            for (var i=0;i<2;i++) {
                index[i] = this.data.anchors[i].of.indexOf("parent.");
                if (index[i] != -1) {
                    refobj[i] = this._ls_parent.getChild(this.data.anchors[i].of.substr("parent.".length));
                }            
                my_coords[i] = this.translateToCoords(this.data.anchors[i].my);
                at_coords[i] = refobj[i].translateToCoords(this.data.anchors[i].at);
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
        this.state.width  = size.width;
        this.state.height = size.height;
        /*
        if (this._already_set_size) {
            var tween = this.game.add.tween(this).to( { width:size.width, height:size.height }, 250, Phaser.Easing.Cubic.Out, true);
        } else {
            this.width  = size.width;
            this.height = size.height;
        }
        this._already_set_size = !isNaN(size.width) && !isNaN(size.height);
        */
        this._update_state_use_tween = this._update_not_first_time && !isNaN(size.width) && !isNaN(size.height) && this.spec.tween;
        this._update_state = true;    
    },
    setPosition: function (pos) {
        this.state.y = pos.y;
        this.state.x = pos.x;
        /*
        if (this._already_set_position) {
            var tween = this.game.add.tween(this).to( { x:pos.x, y:pos.y }, 250, Phaser.Easing.Cubic.Out, true);
        } else {
            this.x = pos.x;
            this.y = pos.y;            
        }
        this._already_set_position = !isNaN(pos.x) && !isNaN(pos.y);
        */
        this._update_state_use_tween = this._update_not_first_time && !isNaN(pos.x) && !isNaN(pos.y) && this.spec.tween;
        this._update_state = true;
    },
    resize: function () {
        // console.log("Phaser.Plugin.JSON2Game.base.prototype.resize");
        this.updateDeployment();
        for (var i in this._ls_children) {
            this._ls_children[i].resize();
        }
        // console.log(this);
        //alert("resize: " + this.instance_name);
    },
    update: function () {
        if (this._update_state) {
            this._update_state = false;
            this._update_not_first_time = true;
            if (this._update_state_use_tween) {
                var tween = this.game.add.tween(this).to( this.state, this.spec.tween.time, this.spec.tween.ease, true, this.spec.tween.delay);
            } else {
                console.log("this.state: ", this.state, [this]);
                LightSaber.utils.extend(this, this.state);
            }
        }
    }
});;
//------------------------------------------------------


LightSaber.DOM_Wrapper = function (game, spec, parent) {    
    LightSaber.DisplayObject.call(this, game, spec, parent);
};

LightSaber.DOM_Wrapper.prototype = LightSaber.utils.extend(Object.create(LightSaber.DisplayObject.prototype), {
    create: function () {
        var $ = LightSaber.utils.$;
        this._$element = $("<div style='position: absolute; display: inline-block;'></div>").append(this.spec.html).appendTo("body");
        this._$canvas_view = $(this.game.renderer.view);    
        this.childrenDoCreate();
    },
    update: function() {
        LightSaber.DisplayObject.prototype.update.call(this);
        var offset = null;
        if (this._last_parent_x != this.parent.x ||
            this._last_parent_y != this.parent.y ||
            this._last_self_x != this.x ||
            this._last_self_y != this.y
           ) {
            this._last_parent_x = this.parent.x;
            this._last_parent_y = this.parent.y;
            this._last_self_x = this.x;
            this._last_self_y = this.y;
            offset = this._$canvas_view.offset();
            offset.top += this.y + this.parent.y;
            offset.left += this.x + this.parent.x;
            // console.log("offset:",offset);
            this._$element[0].style.top = offset.top+"px";
            this._$element[0].style.left = offset.left+"px";
            //console.log("offset: ", offset);
        }

        var offset = null;    
        if (this._last_width != this.width ||
            this._last_height != this.height        
           ) {
            this._last_width = this.width;
            this._last_height = this.height;
            // console.log("width:",this.width,"height:", this.height);
            this._$element.width(this.width);
            this._$element.height(this.height);
            //console.log("w,h: ", this.width, this.height);
        }

        if (this._last_angle != this.angle) {
            this._last_angle = this.angle;
            var x = 100 * (this.anchor.x-0.5),
                y = 100 * (this.anchor.y-0.5),
                _x = this.anchor.x * 100,
                _y = this.anchor.y * 100;        
            var t = "translate("+(x)+"%,"+(y)+"%) translate(-"+_x+"%,-"+_y+"%) " +
                "rotate(" + this.angle + "deg) translate("+(-x)+"%,"+(-y)+"%)";                             
            this._$element[0].style.transform = t;        
        }
        
        if (this._last_alpha != this.alpha ||
            this._last_alpha != this.alpha        
           ) {
            this._last_alpha = this.alpha;
            this._$element.css("opacity", this.alpha);            
        }

        
    },
    resize: function (){
        LightSaber.DisplayObject.prototype.resize.call(this);
    }
});


/*

LightSaber.DOM_Wrapper = function (html, game, x, y, w, h, ax, ay) {
    console.assert(typeof html == "string" || html instanceof HTMLElement, "WARNING: html param not supperted. html passed: ", typeof html, html );

    //  We call the Phaser.Sprite passing in the game reference
    //  We're giving it a random X/Y position here, just for the sake of this demo - you could also pass the x/y in the constructor
    Phaser.Sprite.call(this, game, x, y, null);

    this.anchor.setTo(ax, ay);
    this.width = w;
    this.height = h;    
    game.add.existing(this);
    
    
    // border: 1px solid red
    this._$element = $("<div style='position: absolute; display: inline-block;'></div>").append(html).appendTo("body");
    this._$canvas_view = $(this.game.renderer.view);    
    this.update();
};

LightSaber.DOM_Wrapper.prototype = Object.create(Phaser.Sprite.prototype);
LightSaber.DOM_Wrapper.prototype.constructor = LightSaber.DOM_Wrapper;

LightSaber.DOM_Wrapper.prototype.update = function() {
    
    var offset = null;
    if (this._last_parent_x != this.parent.x ||
        this._last_parent_y != this.parent.y ||
        this._last_self_x != this.x ||
        this._last_self_y != this.y
       ) {
        this._last_parent_x = this.parent.x;
        this._last_parent_y = this.parent.y;
        this._last_self_x = this.x;
        this._last_self_y = this.y;
        offset = this._$canvas_view.offset();
        offset.top += this.y + this.parent.y;
        offset.left += this.x + this.parent.x;
        this._$element[0].style.top = offset.top+"px";
        this._$element[0].style.left = offset.left+"px";
        //console.log("offset: ", offset);
    }
    
    var offset = null;    
    if (this._last_width != this.width ||
        this._last_height != this.height        
       ) {
        this._last_width = this.width;
        this._last_height = this.height;
        this._$element.width(this.width);
        this._$element.height(this.height);
        //console.log("w,h: ", this.width, this.height);
    }
    
    if (this._last_angle != this.angle) {
        this._last_angle = this.angle;
        var x = 100 * (this.anchor.x-0.5),
            y = 100 * (this.anchor.y-0.5),
            _x = this.anchor.x * 100,
            _y = this.anchor.y * 100;        
        var t = "translate("+(x)+"%,"+(y)+"%) translate(-"+_x+"%,-"+_y+"%) " +
            "rotate(" + this.angle + "deg) translate("+(-x)+"%,"+(-y)+"%)";                             
        this._$element[0].style.transform = t;        
    }    
};

*/
// ----------------------------------------------------------------------------------

LightSaber.DOM_Wrapper.install = function (game) {
    game.make.domWrapper = function (html, x, y, w, h, ax, ay) {
        return new LightSaber.DOM_Wrapper(game, html, x, y, w, h, ax, ay);
    }
    
    game.add.domWrapper = function (html, x, y, w, h, ax, ay, group) {
        if (group === undefined) { group = game.world; }
        var obj = game.make.domWrapper(html, x, y, w, h, ax, ay);
        group.add(obj);
        return obj;
    }
    
}
;
//------------------------------------------------------


LightSaber.utils.hexToRgb = function (hex) {
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
;
//------------------------------------------------------


LightSaber.Engine = function (spec, saber) {
    this._spec = spec;
    this._callbacks = spec.callbacks;
    this._boot_deferred = LightSaber.utils.Deferred();
    this._boot_deferred_pending = true;
    var self = this;
    this.saber = saber;
    this._boot_deferred.promise().done(function(){
        self._boot_deferred_pending = false;
    });
};
LightSaber_Engine_prototype = {
    constructor: LightSaber.Engine,
    _ls_resize:function (width, height){
        var bounds = new Phaser.Rectangle(0, 0, width, height);

        this._game.renderer.view.style.position = "absolute";
        this._game.renderer.view.style.top = "0px";
        this._game.renderer.view.style.left = "0px";
        this._game.renderer.resize(width, height);
        if (this._game.renderType === 1) {
            Phaser.Canvas.setSmoothingEnabled(this._game.context, false);
        }
        this._game.camera.setSize(width, height);
        this._game.camera.bounds = bounds;
        this._game.world.bounds = bounds;
        this._game.width = width;
        this._game.height = height;
        this._game.stage.width = width;
        this._game.stage.height = height;
        
        this.scene.resize();
        
    },
    _ls_start: function (){
        console.log("_ls_start");
        
        this._game = new Phaser.Game(this._spec.width, this._spec.height, Phaser.AUTO, this._spec.container_id);        
        this._game.saber = this.saber;
        this._game.state.add( 'LightSaber', this );
        this._game.state.start( 'LightSaber' );
        // LightSaber.DOM_Wrapper.install(this._game);
        return this._boot_deferred.promise();
    },
    preload: function () {
        console.log("preload()");        
        for (var name in this._spec.preload) {        
            this.game.load.image(name, this._spec.preload[name]);
        }        
    },    
    _ls_update_spec:function () {
        this.scene.update_spec();
        /*for (var i in this._scenes) {
            var scene = this._scenes[i];
            scene.update_spec();
        } */        
    },    
    _create_scene:function () {        
        console.log("_create_scene()");    
        this.scene = new LightSaber.Scene(this.game, this._data.scene);
    },
    _parse_gamejson:function (gamejson) {
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
    },  
    create: function () {
        console.log("create()", this._spec);        
        if (this._parse_gamejson(this._spec)) {
            console.assert(this._data, "ERROR: this._data not set");
            this._create_scene();            
        } else {
            console.warn("WARNING: this._data not set properly");
        };        
        if (typeof this._callbacks.create == "function") {
            this._callbacks.create(this._game);            
        }
    },
    render: function () {
        //console.log("render()");        
        if (typeof this._callbacks.render == "function") {
            this._callbacks.render(this._game);            
        }        
    },
    update: function () {
        //console.log("update()");
        if (this._boot_deferred_pending) this._boot_deferred.resolve();
        if (typeof this._callbacks.update == "function") {
            this._callbacks.update(this._game);            
        }        
    },
    resize: function () {
        console.log("resize()");        
    }
};
LightSaber.Engine.prototype = LightSaber_Engine_prototype;;
//------------------------------------------------------


LightSaber.YoutubeVideo = function (game, spec, parent) {
    console.log("LightSaber.YoutubeVideo");
    var x=0,y=0,w=200,h=150; // provisorio
    var autoplay = "autoplay=" + (spec.autoplay ? "1" : "0"); 
    var fullscreen = "allowfullscreen='" + (spec.allowfullscreen ? "true" : "false") + "'";    
    var part_1 ="<iframe frameborder='0' "+fullscreen+" style='height:100%; width:100%'src='https://www.youtube.com/embed/",
        part_2 = "?feature=oembed&amp;"+autoplay+"&amp;wmode=opaque&amp;rel=0&amp;showinfo=0&amp;modestbranding=0&amp;fs=1'></iframe>";    
    var html = part_1 + spec.videoid + part_2;            
    spec.html = html;
    LightSaber.DOM_Wrapper.call(this, game, spec, parent);
};

LightSaber.YoutubeVideo.prototype = LightSaber.utils.extend(Object.create(LightSaber.DOM_Wrapper.prototype), {
    
});;
//------------------------------------------------------


LightSaber.Sprite = function (game, spec, parent) {
    // LightSaber.DisplayObject.call(this, game, spec, parent);
    
    
    console.log("spec.texture", spec.texture)
    Phaser.Sprite.call(this, game, 0, 0, spec.texture);
    this.game = game;
    this.spec = spec;
    this.data = spec;
    this.state = {x:0, y:0, width: 123, height: 456};
    this.instance_name = spec.instance_name;
    this._ls_parent = parent;    
    if (parent) {
        // parent.addChild(this);
        this.game.world.addChild(this);
    }
    
    this.subscribeToEvents();
    this.createChildren();
    this.sortChildren();    
};

LightSaber.Sprite.prototype = LightSaber.utils.extend(Object.create(LightSaber.DisplayObject.prototype), {
    create: function () {        
        //this.game.add.existing(this.phaserObj);    

        // this.cropRect  = new Phaser.Rectangle(0, 0, this.phaserObj.texture.width, this.phaserObj.texture.height);
        this.mask = this.game.add.graphics(0, 0);

        //	Shapes drawn to the Graphics object must be filled.
        this.mask.beginFill(0xff0000);
        this.mask.drawRect(0, 0, this.texture.width, this.texture.height);
        // this.mask = this.mask;    
        //this.phaserObj.crop(this.cropRect);

        this.texture_size = {h:this.texture.height, w: this.texture.width};
        this.aspectRatio = this.texture_size.w / this.texture_size.h;
        this.childrenDoCreate();

        // this.phaserObj.worldTransform = new PIXI.Matrix();
        // console.log("this.phaserObj.worldTransform = new PIXI.Matrix();", [this.phaserObj.getBounds()]);                
    },
    computeDeployment: function (apply) {    
        var dep = LightSaber.DisplayObject.prototype.computeDeployment.call(this, false);
        console.debug("Sprite.computeDeployment("+  apply + ")");
        var temp, percent;    
        this.scale.x = 1;
        this.scale.y = 1;
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
    },
    setDeployment: function (dep) {
        console.debug("setDeployment:", dep);
        LightSaber.DisplayObject.prototype.setDeployment.call(this, dep);

        if (dep.crop) {
            console.log("AAAAAAAAAAAAAAAAAA");
            if (dep.crop.x) this.cropRect.x = dep.crop.x;
            if (dep.crop.y) this.cropRect.y = dep.crop.y;
            if (dep.crop.width) this.cropRect.width = dep.crop.width;
            if (dep.crop.height) this.cropRect.height = dep.crop.height;
        }    

        if (dep.mask && this.mask) {
            console.log("BBBBBBBBBBBBBBBBB");
            this.mask.clear();
            this.mask.beginFill(0xff0000);
            this.mask.drawRect(dep.mask.x, dep.mask.y, dep.mask.width, dep.mask.height);
            this._bounds = new Phaser.Rectangle(dep.mask.x, dep.mask.y, dep.mask.width, dep.mask.height);
        }

    }
});;
//------------------------------------------------------


LightSaber.Scene = function (game, spec, parent) {
    this.data = game.saber.extend_spec(spec);
    LightSaber.DisplayObject.call(this, game, spec, parent);
    this.width = game.world.width;
    this.height = game.world.height;
    this.x = 0;
    this.y = 0;
    this.game.world.addChild(this);
    this.childrenDoCreate();
};

LightSaber.Scene.prototype = LightSaber.utils.extend(Object.create(LightSaber.DisplayObject.prototype), {
    resize: function () {
        this.state = {
            width: this.game.world.width,
            height: this.game.world.height,
            x: 0,
            y: 0
        }
        this._update_state = true;
        for (var i in this._ls_children) {
            this._ls_children[i].resize();
        }        
    }
});;
//------------------------------------------------------


LightSaber.BitmapData = function (game, spec, parent) {    
    var layout = {x:22,y:33,width:200,height:200};
    this.bmd = game.make.bitmapData(layout.width, layout.height);
    this.bmd.x = this.bmd.y = 0;
    spec.texture = this.bmd;
    LightSaber.DisplayObject.call(this, game, spec, parent);
    this.x = layout.x;
    this.y = layout.y;       
    this.width = layout.width;
    this.height = layout.height;     
};

LightSaber.BitmapData.prototype = LightSaber.utils.extend(Object.create(LightSaber.DisplayObject.prototype), {
    create: function () {
        console.log("SSSSSSSSSSSSSSS");
        var pos, color = LightSaber.utils.hexToRgb(this.spec.fillStyle);
        this.bmd.fill(color.r, color.g, color.b);        
        this.childrenDoCreate();
    },
    setDeployment: function (dep) {
        console.error("ERROR");
        this.bmd.width  = dep.width;
        this.bmd.height = dep.height;
        LightSaber.DisplayObject.prototype.setDeployment.call(this, dep);
    },
    setSize: function (size) {
        this.bmd.width  = size.width;
        this.bmd.height = size.height;
        LightSaber.DisplayObject.prototype.setSize.call(this, size);
    }    
});;
//------------------------------------------------------



    if ( typeof define === "function" && define.amd ) {
        define(function () {return LightSaber; } );
    } else {
        window.LightSaber = LightSaber;
    }

})();