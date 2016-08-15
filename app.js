jwk.ajax({url:"games/prueba.json"}).done(function (json) {
    var saber = new LightSaber({
        spec: json,
        full_document: false,
        container_id: 'container',
        create: function (game) {            
            for (var i in game.world.children) {
                if (game.world.children[i].instance_name == "card") {
                    console.log("create---------->", [game.world.children[i]]);
                    console.log("create---------->", [game.saber]);                    
                } 
            }
        },
        update: function (game) {
            // console.log("update", game);
        },
        render: function (game) {
            // console.log("render", game);
        }
    });    
}).fail(function (e) {
    console.error(e);
})
