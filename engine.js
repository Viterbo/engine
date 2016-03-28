window.onload = function() {

    var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });

    function preload() {

        game.load.image('backdrop', 'assets/pics/remember-me.jpg');
        game.load.image('card', 'assets/sprites/mana_card.png');

    }

    var card;
    var cursors;
    var dom;
    function create() {

        game.world.setBounds(0, 0, 1920, 1200);

        game.add.sprite(0, 0, 'backdrop');

        card = game.add.sprite(200, 200, 'card');

        game.physics.enable(card, Phaser.Physics.ARCADE);
        card.body.collideWorldBounds = true;

        game.camera.follow(card);

        cursors = game.input.keyboard.createCursorKeys();


        dom = new DOM_Wrapper(game, 777, 77);
        dom.width = 100;
        dom.height = 200;

    }

    function update() {

        card.body.velocity.x = 0;
        card.body.velocity.y = 0;

        if (cursors.left.isDown)
        {
            // card.x -= 4;
            card.body.velocity.x = -240;
        }
        else if (cursors.right.isDown)
        {
            // card.x += 4;
            card.body.velocity.x = 240;
        }

        if (cursors.up.isDown)
        {
            // card.y -= 4;
            card.body.velocity.y = -240;
        }
        else if (cursors.down.isDown)
        {
            // card.y += 4;
            card.body.velocity.y = 240;

        }

    }

    function render() {

        game.debug.cameraInfo(game.camera, 500, 32);
        game.debug.spriteCoords(card, 32, 32);
        // game.debug.physicsBody(card.body);

    }


    var resizeGame = function () {

        var height = window.innerHeight;
        var width = window.innerWidth;

        game.width = width;
        game.height = height;
        // game.stage.bounds.width = width;
        // game.stage.bounds.height = height;

        if (game.renderType === 1) {
            console.log("ENTRO ACA");
            game.renderer.resize(width, height);
            Phaser.Canvas.setSmoothingEnabled(game.context, false);
        }

        game.camera.setSize(width, height);

    };


    window.onresize = resizeGame;


};
