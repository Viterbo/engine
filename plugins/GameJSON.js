
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
}
Phaser.Plugin.GameJSON.Base.prototype = {
    constructor: Phaser.Plugin.GameJSON.Base,
    getDependencies: function () {
        console.error("ERROR: getDependencies() not implemented yet"); 
        /*
        tengo que fijarme en los atributos "position" y "anchors" y sacar el dato "of" que referencia a otro objeto
        devuelvo una lista de dependencias.
        Si referencia solo al padre devuelvo ["parent"],
        Si no devuelvo ["parent.Hermano1", "parent.Hermano2"]        
        */
    },
    orderChildren: function () {
        /*
        tengo que ordenar los children de manera que los primeros
        solo dependan del tamaño y pos de su padre y que...
        
        */
        var acepted = 0;
        var index = null;
        for (var childname in this.children) { 
            var child = this.children[childname];
            var deps = child.spec.getDependencies();
            for (var i=0; i<deps.length; i++) {
                if (deps[i] == "parent") continue;
                index = deps[i].indexOf("parent.");
                if (index == 0) {
                    var dep = deps[i].substr(7);
                }
            }
        }
    },
    createChildren: function () {
        this.children = [];
        for (var name in this.spec.children) {
            var child_spec = this.spec.children[name];
            var child = null;
            var constructor = Phaser.Plugin.GameJSON[obj_spec.type];
            console.assert(constructor, "ERROR: type not found: ", obj_spec.type, [obj_spec]);
            child = new constructor(this.game, obj_spec);
            this.children.push(child);
        }
        
    }
}
// --------------------------------------------------------------------------------------
Phaser.Plugin.GameJSON.Scene = function (game, spec) {
    Phaser.Plugin.GameJSON.Base.call(this, game, spec);    
}

Phaser.Plugin.GameJSON.Scene.prototype = Object.create(Phaser.Plugin.GameJSON.Base.prototype);
Phaser.Plugin.GameJSON.Scene.prototype.constructor = Phaser.Plugin.GameJSON.Scene;
Phaser.Plugin.GameJSON.Scene.prototype._func: function () {
}
Phaser.Plugin.GameJSON.Scene.prototype.create: function () {
    console.log("Phaser.Plugin.GameJSON.Scene.create()", [this.spec]);
}
Phaser.Plugin.GameJSON.Scene.prototype.resize: function () {
    
}

// --------------------------------------------------------------------------------------
Phaser.Plugin.GameJSON.Sprite = function (game, spec) {
    Phaser.Plugin.GameJSON.Base.call(this, game, spec);
}
Phaser.Plugin.GameJSON.Sprite.prototype = Object.create(Phaser.Plugin.GameJSON.Base.prototype);
Phaser.Plugin.GameJSON.Sprite.prototype.constructor = Phaser.Plugin.GameJSON.Sprite;

// --------------------------------------------------------------------------------------

Phaser.Plugin.GameJSON.BitmapData = function (game, spec) {
    Phaser.Plugin.GameJSON.Base.call(this, game, spec);
}
Phaser.Plugin.GameJSON.BitmapData.prototype = Object.create(Phaser.Plugin.GameJSON.Base.prototype);
Phaser.Plugin.GameJSON.BitmapData.prototype.constructor = Phaser.Plugin.GameJSON.BitmapData;


// --------------------------------------------------------------------------------------

Phaser.Plugin.GameJSON.DOM_Wrapper = function (game, spec) {
    Phaser.Plugin.GameJSON.Base.call(this, game, spec);
}
Phaser.Plugin.GameJSON.DOM_Wrapper.prototype = Object.create(Phaser.Plugin.GameJSON.Base.prototype);
Phaser.Plugin.GameJSON.DOM_Wrapper.prototype.constructor = Phaser.Plugin.GameJSON.Sprite;
