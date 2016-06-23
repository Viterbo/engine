LightSaber.BitmapData = function (game, spec, parent) {    
    var layout = {x:22,y:33,width:200,height:200};
    this.bmd = game.make.bitmapData(layout.width, layout.height);
    this.bmd.x = this.bmd.y = 0;
    spec.texture = this.bmd;
    LightSaber.DisplayObject.call(this, game, spec, parent);
    this.x = layout.x;
    this.y = layout.y;       
    this.width = layout.width;
    this.height = layout.height;     
};

LightSaber.BitmapData.prototype = jwk.extend(Object.create(LightSaber.DisplayObject.prototype), {
    create: function () {
        console.log("SSSSSSSSSSSSSSS");
        var pos, color = LightSaber.utils.hexToRgb(this.spec.fillStyle);
        this.bmd.fill(color.r, color.g, color.b);        
        this.childrenDoCreate();
    },
    setDeployment: function (dep) {
        console.error("ERROR");
        this.bmd.width  = dep.width;
        this.bmd.height = dep.height;
        LightSaber.DisplayObject.prototype.setDeployment.call(this, dep);
    },
    setSize: function (size) {
        this.bmd.width  = size.width;
        this.bmd.height = size.height;
        LightSaber.DisplayObject.prototype.setSize.call(this, size);
    }    
});