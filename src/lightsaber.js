var LightSaber = {
    init:function (settings) {
        this._settings = jwk.extend({
            height:600,
            width:800,
            container_id:'',
            full_document: true,
            auto_resize: true
        }, settings);

        if (this._settings.spec) this.create(this._settings.spec);
        
    },
    create: function (spec) {
        this.clear();
        this._engine = new LightSaber.Engine(spec);
        this._engine._ls_start().done(function (){
            if (LightSaber._settings.auto_resize) {
                window.onresize = LightSaber.resize;
                LightSaber.resize();
            }            
        });
    },
    clear: function () {
    },
    resize :function () {
        console.log("resize()");
        var height = window.innerHeight;
        var width = window.innerWidth;
        if (LightSaber._engine) LightSaber._engine._ls_resize(width, height);
    }
    
};