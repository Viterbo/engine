
    if ( typeof define === "function" && define.amd ) {
        define(function () {return LightSaber; } );
    } else {
        window.LightSaber = LightSaber;
    }

})();