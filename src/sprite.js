LightSaber.Sprite = function (game, spec, parent) {    
    LightSaber.DisplayObject.call(this, game, spec, parent);
};

LightSaber.Sprite.prototype = jwk.extend(Object.create(LightSaber.DisplayObject.prototype), {
    create: function () {        
        //this.game.add.existing(this.phaserObj);    

        // this.cropRect  = new Phaser.Rectangle(0, 0, this.phaserObj.texture.width, this.phaserObj.texture.height);
        this.mask = this.game.add.graphics(0, 0);

        //	Shapes drawn to the Graphics object must be filled.
        this.mask.beginFill(0xff0000);
        this.mask.drawRect(0, 0, this.texture.width, this.texture.height);
        this.mask = this.mask;    


        this.texture_size = {h:this.texture.height, w: this.texture.width};
        this.aspectRatio = this.texture_size.w / this.texture_size.h;
        //this.phaserObj.crop(this.cropRect);
        this.childrenDoCreate();

        // this.phaserObj.worldTransform = new PIXI.Matrix();
        // console.log("this.phaserObj.worldTransform = new PIXI.Matrix();", [this.phaserObj.getBounds()]);        
        
        this.childrenDoCreate();
    },
    computeDeployment: function (apply) {    
        var dep = LightSaber.DisplayObject.prototype.computeDeployment.call(this, false);    
        var temp, percent;    
        this.scale.x = 1;
        this.scale.y = 1;
        var size = this.spec["texture-size"];
        switch (size) {
            case "cover":
                dep.mask = {x:dep.x,y:dep.y,width:dep.width,height:dep.height};
                if (this.aspectRatio <= dep.width / dep.height) {
                    temp = dep.width / this.aspectRatio;
                    percent = 0.5 * (temp-dep.height)/temp;
                    // dep.crop = {height:Math.floor(this.texture.h*(1-percent*2))+1};
                    // console.log(dep.crop.height, percent, temp, dep.height);
                    // dep.crop = {height:dep.height};
                    // dep.crop = {y:percent*this.texture.h, height:(1-percent*2) * this.texture.h};
                    dep.y -= 0.5 * (temp-dep.height);
                    dep.height = temp;
                } else {
                    temp = dep.height * this.aspectRatio;
                    //percent = 0.5 * (temp-dep.width)/temp;
                    //dep.crop = { x:percent*this.texture.w, width:(1-percent*2) * this.texture.w};
                    dep.x -= 0.5 * (temp-dep.width);
                    dep.width = temp;
                }
                break;
            case "contain":
                if (this.aspectRatio <= dep.width / dep.height) {                
                    temp = dep.height * this.aspectRatio;
                    dep.x += 0.5 * (temp-dep.width);
                    dep.width = temp;
                } else {
                    temp = dep.width / this.aspectRatio;
                    dep.y += 0.5 * (temp-dep.height);
                    dep.height = temp;  
                }
                break;
            default:
        }    
        if (apply) {
            this.setDeployment(dep);   
        }
        return dep;
    },
    setDeployment: function (dep) {
        
        LightSaber.DisplayObject.prototype.setDeployment.call(this, dep);

        if (dep.crop) {
            if (dep.crop.x) this.cropRect.x = dep.crop.x;
            if (dep.crop.y) this.cropRect.y = dep.crop.y;
            if (dep.crop.width) this.cropRect.width = dep.crop.width;
            if (dep.crop.height) this.cropRect.height = dep.crop.height;
        }    

        if (dep.mask) {
            this.mask.clear();
            this.mask.beginFill(0xff0000);
            this.mask.drawRect(dep.mask.x, dep.mask.y, dep.mask.width, dep.mask.height);
            this._bounds = new Phaser.Rectangle(dep.mask.x, dep.mask.y, dep.mask.width, dep.mask.height);
        }

    }
});