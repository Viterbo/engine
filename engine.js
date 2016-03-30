window.onload = function() {


    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

    function preload() {
        console.log("preload()");
        game.load.json('gamejson', 'games/card-suarez.json');
    }

    var u=0, r=0, gamejson; 
    function create() {
        console.log("create()");
        game.stage.backgroundColor = '#0072bc';
        gamejson = game.cache.getJSON('gamejson');
        console.log(gamejson);      
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
