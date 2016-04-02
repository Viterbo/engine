window.onload = function() {


    window.game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });

    function preload() {
        console.log("preload()");
        game.load.json('gamejson', 'games/card-suarez.json');
    }

    var u=0, r=0, gamejson; 
    function create() {
        console.log("create()");        
        game.stage.backgroundColor = '#FFFFFF';
        gamejson = game.cache.getJSON('gamejson');
        console.log(gamejson);
        
        resize();
        
        game.plugins.gamejson = new Phaser.Plugin.GameJSON(game);
        console.log("game.plugins.gamejson", game.plugins.gamejson);
        game.plugins.gamejson.setup({});
        game.plugins.gamejson.create(gamejson);
    }

    function update() {
        
    }

    function render() {
        
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
        if (game.plugins.gamejson) game.plugins.gamejson.resize();
    };


    window.onresize = resize;


};
