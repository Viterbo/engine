window.onload = function() {

    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'phaser-example', { preload: preload, create: create, update: update, render: render });

    function preload() {

        game.load.image('backdrop', 'assets/pics/remember-me.jpg');
        game.load.image('card', 'assets/sprites/mana_card.png');

    }

    var card, cursors, dom, delta;
    function create() {

        game.world.setBounds(0, 0, 1920, 1200);

        game.add.sprite(0, 0, 'backdrop');

        card = game.add.sprite(200, 200, 'card');

        game.physics.enable(card, Phaser.Physics.ARCADE);
        card.body.collideWorldBounds = true;

        game.camera.follow(card);

        cursors = game.input.keyboard.createCursorKeys();

        var part_1 ="<iframe frameborder='0' allowfullscreen='true' style='height:100%; width:100%'src='https://www.youtube.com/embed/",
            part_2 = "?feature=oembed&amp;autoplay=0&amp;wmode=opaque&amp;rel=0&amp;showinfo=0&amp;modestbranding=0&amp;fs=1'></iframe>";
        
        // html = "<div style='width:100%; height: 100%; border: 1px solid black; display: inline-block'></div>";
        html = part_1 + "I53HDr0-Qew" + part_2;
        dom = new DOM_Wrapper(game, html, 500, 700);
        dom.width = 300;
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
        if (delta>0) {
            delta = 0.001;
        } else {
            delta = -0.001;
        }
        
        
        dom.angle += 1;
        // dom.angle = 6;
        //dom.anchor.x = 0.2;
        dom.anchor.x += delta;
        if (dom.anchor.x>1) delta = -1;
        if (dom.anchor.x<0) delta = 1;
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

        game.renderer.resize(width, height);
        if (game.renderType === 1) {
            Phaser.Canvas.setSmoothingEnabled(game.context, false);
        }

        game.camera.setSize(width, height);

    };


    window.onresize = resizeGame;


};
