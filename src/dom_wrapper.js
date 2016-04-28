LightSaber.DOM_Wrapper = function (game, spec, parent) {    
    LightSaber.DisplayObject.call(this, game, spec, parent);
};

LightSaber.DOM_Wrapper.prototype = jwk.extend(Object.create(LightSaber.DisplayObject.prototype), {
    create: function () {
        var $ = window.$ || window.jQuery || jwk.query || TreeQuery;
        this._$element = $("<div style='position: absolute; display: inline-block;'></div>").append(this.spec.html).appendTo("body");
        this._$canvas_view = $(this.game.renderer.view);    
        this.childrenDoCreate();
    },
    update: function() {
        LightSaber.DisplayObject.prototype.update.call(this);
        var offset = null;
        if (this._last_parent_x != this.parent.x ||
            this._last_parent_y != this.parent.y ||
            this._last_self_x != this.x ||
            this._last_self_y != this.y
           ) {            
            this._last_parent_x = this.parent.x;
            this._last_parent_y = this.parent.y;
            this._last_self_x = this.x;
            this._last_self_y = this.y;
            offset = this._$canvas_view.offset();
            offset.top += this.y + this.parent.y;
            offset.left += this.x + this.parent.x;
            // console.log("offset:",offset);
            this._$element[0].style.top = offset.top+"px";
            this._$element[0].style.left = offset.left+"px";
            //console.log("offset: ", offset);
        }

        var offset = null;    
        if (this._last_width != this.width ||
            this._last_height != this.height        
           ) {
            this._last_width = this.width;
            this._last_height = this.height;
            // console.log("width:",this.width,"height:", this.height);
            this._$element.width(this.width);
            this._$element.height(this.height);
            //console.log("w,h: ", this.width, this.height);
        }

        if (this._last_angle != this.angle) {
            this._last_angle = this.angle;
            var x = 100 * (this.anchor.x-0.5),
                y = 100 * (this.anchor.y-0.5),
                _x = this.anchor.x * 100,
                _y = this.anchor.y * 100;        
            var t = "translate("+(x)+"%,"+(y)+"%) translate(-"+_x+"%,-"+_y+"%) " +
                "rotate(" + this.angle + "deg) translate("+(-x)+"%,"+(-y)+"%)";                             
            this._$element[0].style.transform = t;        
        }
    },
    resize: function (){
        LightSaber.DisplayObject.prototype.resize.call(this);
    }
});


/*

LightSaber.DOM_Wrapper = function (html, game, x, y, w, h, ax, ay) {
    console.assert(typeof html == "string" || html instanceof HTMLElement, "WARNING: html param not supperted. html passed: ", typeof html, html );

    //  We call the Phaser.Sprite passing in the game reference
    //  We're giving it a random X/Y position here, just for the sake of this demo - you could also pass the x/y in the constructor
    Phaser.Sprite.call(this, game, x, y, null);

    this.anchor.setTo(ax, ay);
    this.width = w;
    this.height = h;    
    game.add.existing(this);
    
    
    // border: 1px solid red
    this._$element = $("<div style='position: absolute; display: inline-block;'></div>").append(html).appendTo("body");
    this._$canvas_view = $(this.game.renderer.view);    
    this.update();
};

LightSaber.DOM_Wrapper.prototype = Object.create(Phaser.Sprite.prototype);
LightSaber.DOM_Wrapper.prototype.constructor = LightSaber.DOM_Wrapper;

LightSaber.DOM_Wrapper.prototype.update = function() {
    
    var offset = null;
    if (this._last_parent_x != this.parent.x ||
        this._last_parent_y != this.parent.y ||
        this._last_self_x != this.x ||
        this._last_self_y != this.y
       ) {
        this._last_parent_x = this.parent.x;
        this._last_parent_y = this.parent.y;
        this._last_self_x = this.x;
        this._last_self_y = this.y;
        offset = this._$canvas_view.offset();
        offset.top += this.y + this.parent.y;
        offset.left += this.x + this.parent.x;
        this._$element[0].style.top = offset.top+"px";
        this._$element[0].style.left = offset.left+"px";
        //console.log("offset: ", offset);
    }
    
    var offset = null;    
    if (this._last_width != this.width ||
        this._last_height != this.height        
       ) {
        this._last_width = this.width;
        this._last_height = this.height;
        this._$element.width(this.width);
        this._$element.height(this.height);
        //console.log("w,h: ", this.width, this.height);
    }
    
    if (this._last_angle != this.angle) {
        this._last_angle = this.angle;
        var x = 100 * (this.anchor.x-0.5),
            y = 100 * (this.anchor.y-0.5),
            _x = this.anchor.x * 100,
            _y = this.anchor.y * 100;        
        var t = "translate("+(x)+"%,"+(y)+"%) translate(-"+_x+"%,-"+_y+"%) " +
            "rotate(" + this.angle + "deg) translate("+(-x)+"%,"+(-y)+"%)";                             
        this._$element[0].style.transform = t;        
    }    
};

*/
// ----------------------------------------------------------------------------------

LightSaber.DOM_Wrapper.install = function (game) {
    game.make.domWrapper = function (html, x, y, w, h, ax, ay) {
        return new LightSaber.DOM_Wrapper(game, html, x, y, w, h, ax, ay);
    }
    
    game.add.domWrapper = function (html, x, y, w, h, ax, ay, group) {
        if (group === undefined) { group = game.world; }
        var obj = game.make.domWrapper(html, x, y, w, h, ax, ay);
        group.add(obj);
        return obj;
    }
    
}
