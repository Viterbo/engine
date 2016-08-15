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
});