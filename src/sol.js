"use strict";

var _animacionSol;

var Sol = cc.Class.extend({
    sprite: null,
    shape: null,

    diameter: null,
    position: null,

    ctor: function (space, object, layer) {
        this.diameter = object.width;
        this.position = cp.v(object.x + this.diameter / 2, object.y + this.diameter / 2);

        var body = cp.StaticBody();
        body.setPos(this.position);

        // Sprite
        var spriteName = "#sun/sun_1.png";
        this.sprite = new cc.Sprite(spriteName);
        this.sprite.setPosition(this.position);
        layer.addChild(this.sprite, 5);

        // Cargamos la animacion solo una vez
        if (!_animacionSol) {
            // Animacion
            var frames = [];
            for (var i = 1; i <= 27; i++) {
                var str = "sun/sun_" + i + ".png";
                var frame = cc.spriteFrameCache.getSpriteFrame(str);
                frames.push(frame);
            }

            _animacionSol = new cc.Animation(frames, 0.2);
        }

        this.sprite.runAction(cc.animate(_animacionSol).repeatForever());

        // forma
        this.shape = new cp.CircleShape(body, this.diameter / 2, cp.vzero);
        this.shape.setCollisionType(tipo.SOL);

        // agregar forma
        space.addStaticShape(this.shape);
    }
});
