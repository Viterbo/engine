Phaser.Plugin.MyPlugin = function(game, parent) {
    Phaser.Plugin.call(this, game, parent);

    //settings by default
    this._default = {};
    this._settings = this._default;
    /**
    * some function.
    */
    this._func = function () {


    };
};

Phaser.Plugin.MyPlugin.prototype = Object.create(Phaser.Plugin.prototype);
Phaser.Plugin.MyPlugin.prototype.constructor = Phaser.Plugin.MyPlugin;



Phaser.Plugin.MyPlugin.prototype.setup = function (obj) {
  this._settings = Phaser.Utils.extend(false, {}, this._default, obj);
};
Phaser.Plugin.MyPlugin.prototype.func = function(){
  this._func();
};
