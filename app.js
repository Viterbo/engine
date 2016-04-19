jwk.ajax({url:"games/prueba.json"}).done(function (json) {
    LightSaber.init({
        spec: json,
        full_document: true
    });
}).fail(function (e) {
    console.error(e);
})
