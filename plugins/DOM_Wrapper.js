DOM_Wrapper = function (game, x, y) {

    //  We call the Phaser.Sprite passing in the game reference
    //  We're giving it a random X/Y position here, just for the sake of this demo - you could also pass the x/y in the constructor
    Phaser.Sprite.call(this, game, x, y, "AAAAAAAAAAAAAAAAAAA");

    this.anchor.setTo(0, 0);

    console.log("game.add.existing(this);");
    game.add.existing(this);

};

DOM_Wrapper.prototype = Object.create(Phaser.Sprite.prototype);
DOM_Wrapper.prototype.constructor = DOM_Wrapper;

DOM_Wrapper.prototype.update = function() {
  var t = this;
  console.log(t.deltaX, t.offsetX, t.x);
};
