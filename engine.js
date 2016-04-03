// window.onload = function() {


    var game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.CANVAS, '', { preload: preload, create: create });

    function preload() {
        game.load.json('gamejson', 'games/card-suarez.json');    
    }

    function create() {

        gamejson = game.cache.getJSON('gamejson');
        game.plugins.json2game = new Phaser.Plugin.JSON2Game(game);
        game.plugins.json2game.create(gamejson);     

    }

    function resize() {

            var height = window.innerHeight;
            var width = window.innerWidth;
            var bounds = new Phaser.Rectangle(0, 0, width, height);

            game.renderer.view.style.position = "absolute";
            game.renderer.view.style.top = "0px";
            game.renderer.view.style.left = "0px";
            game.renderer.resize(width, height);
            if (game.renderType === 1) {
                Phaser.Canvas.setSmoothingEnabled(game.context, false);
            }
            game.camera.setSize(width, height);
            game.camera.bounds = bounds;
            game.world.bounds = bounds;
            game.width = width;
            game.height = height;
            game.stage.width = width;
            game.stage.height = height;
            if (game.plugins.json2game) game.plugins.json2game.resize();
    }


    window.onresize = resize;   


// };
