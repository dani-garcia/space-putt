"use strict";

var Planeta = cc.Class.extend({
    space: null,

    sprite: null,
    shape: null,
    layer: null,

    diameter: 0,
    position: null,


    ctor: function (space, object, layer) {
        this.space = space;
        this.layer = layer;

        this.diameter = object.width;
        this.position = cp.v(object.x + this.diameter / 2, object.y + this.diameter / 2);

        var body = cp.StaticBody();
        body.setPos(this.position);

        // Physics Sprite
        this.sprite = new cc.PhysicsSprite("#planet_" + this.diameter + "_2.png");
        this.sprite.setBody(body);
        layer.addChild(this.sprite, 5);


        // forma
        this.shape = new cp.CircleShape(body, this.diameter / 2, cp.vzero);
        this.shape.setCollisionType(tipoPlaneta);
        this.shape.setFriction(1);

        // agregar forma dinamica
        this.space.addShape(this.shape);
    }
});