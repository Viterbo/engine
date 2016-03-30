window.onload = function() {


    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

    function preload() {
        console.log("preload()");
        game.load.image('a', 'assets/sprites/a.png');
        game.load.image('b', 'assets/sprites/b.png');
    }

    var u=0, r=0;
    function create() {
    }

    function update() {
    }

    function render() {
    }

    var resizeGame = function () {

        var height = window.innerHeight;
        var width = window.innerWidth;

        game.width = width;
        game.height = height;
        // game.stage.bounds.width = width;
        // game.stage.bounds.height = height;
        game.renderer.resize(width, height);
        if (game.renderType === 1) {
            Phaser.Canvas.setSmoothingEnabled(game.context, false);
        }

        game.camera.setSize(width, height);

    };


    window.onresize = resizeGame;


};
