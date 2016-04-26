function LightSaber(settings) {
    this.init(settings);
};

LightSaber.prototype = {
    constructor: LightSaber,
    init:function (settings) {
        this._settings = jwk.extend({
            height:600,
            width:800,
            container_id:'',
            full_document: true,
            auto_resize: true,
            section: "/btn4"
        }, settings);
                
        if (this._settings.spec) this.create(this._settings.spec);
        
    },
    create: function (spec) {
        var saber = this;        
        this.clear();
        this.engine = new LightSaber.Engine(jwk.extend(spec, {callbacks:this._settings}), saber);
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
        console.log("resize()");
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
    
    extend_spec: function (spec) {
        var self = this;
        var obj = jwk.extend({}, spec);
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
                obj = jwk.extend(obj, _class_final);
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
                    obj = jwk.extend(obj, _section_spec);
                }
            });
            
        }
        return obj;
    }
};