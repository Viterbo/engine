jwk.ajax({url:"games/card-suarez.json"}).done(function (json) {
    LightSaber.init({
        spec: json,
        full_document: true,
        create: function (game) {            
            for (var i in game.world.children) {
                if (game.world.children[i].instance_name == "card") {
                    console.log("create---------->", game.world.children[i]);                    
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
