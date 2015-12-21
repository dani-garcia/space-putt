"use strict";

var Sol = Planeta.extend({

    ctor: function (space, object, layer) {
        // Asi llamariamos al constructor de planeta
        //this._super(space, object, layer);

        this.space = space;
        this.layer = layer;

        this.diameter = object.width;
        this.position = cp.v(object.x + this.diameter / 2, object.y + this.diameter / 2);

        var body = cp.StaticBody();
        body.setPos(this.position);

        // Physics Sprite
        var spriteName = "#sun/sun_1.png";
        this.sprite = new cc.PhysicsSprite(spriteName);
        this.sprite.setBody(body);
        layer.addChild(this.sprite, 5);

        // Animacion
        var frames = [];
        for (var i = 1; i <= 16; i++) {
            var str = "sun/sun_" + i + ".png";
            var frame = cc.spriteFrameCache.getSpriteFrame(str);
            frames.push(frame);
        }
        this.sprite.runAction(cc.animate(new cc.Animation(frames, 0.15)).repeatForever());

        // forma
        this.shape = new cp.CircleShape(body, this.diameter / 2, cp.vzero);
        this.shape.setCollisionType(tipoSol);

        // agregar forma
        this.space.addStaticShape(this.shape);
    }
});
