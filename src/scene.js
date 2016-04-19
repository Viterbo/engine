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
  
});