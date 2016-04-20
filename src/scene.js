LightSaber.Scene = function (game, spec, parent) {    
    LightSaber.DisplayObject.call(this, game, spec, parent);
    this.width = game.world.width;
    this.height = game.world.height;
    this.x = 0;
    this.y = 0;
    this.game.world.addChild(this);
    this.childrenDoCreate();
};

LightSaber.Scene.prototype = jwk.extend(Object.create(LightSaber.DisplayObject.prototype), {
    resize: function () {
        this.width = this.game.world.width;
        this.height = this.game.world.height;
        for (var i in this._ls_children) {
            this._ls_children[i].resize();
        }        
    }
});