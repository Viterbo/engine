LightSaber.Engine = function (spec) {
    this._spec = spec;
    this._boot_deferred = jwk.Deferred();
    this._boot_deferred_pending = true;
    var self = this;
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
        
    },
    _ls_start: function (){
        console.log("_ls_start");
        
        this._game = new Phaser.Game(
            this._spec.width, this._spec.height,
            Phaser.AUTO, this._spec.container_id);    
        this._game.state.add( 'LightSaber', this );
        this._game.state.start( 'LightSaber' );        
        return this._boot_deferred.promise();
    },
    preload: function () {
        console.log("preload()");        
        for (var name in this._spec.preload) {        
            this.game.load.image(name, this._spec.preload[name]);
        }        
    },    
    _create_scenes:function () {        
        console.log("_create_scenes()");        
        for (var name in this._data.scenes) {
            console.log(name, this._data.scenes[name]);
            var spec = this._data.scenes[name];
            spec.instance_name = name; 
            var state = new LightSaber.Scene(this.game, spec);
            
            
            
            
            /*
            game.state.add(name, state, spec.autostart);
            if (spec.autostart) {
                //game.state.clearCurrentState();
                //game.state.setCurrentState(name);
            }
            // this.scenes[name] = state;
            */
        }        
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
            this._create_scenes();            
        } else {
            console.warn("WARNING: this._data not set properly");
        };                
    },
    render: function () {
        // console.log("render()");        
    },
    update: function () {
        // console.log("update()");
        if (this._boot_deferred_pending) this._boot_deferred.resolve();
    },
    resize: function () {
        console.log("resize()");        
    }
};
LightSaber.Engine.prototype = LightSaber_Engine_prototype;