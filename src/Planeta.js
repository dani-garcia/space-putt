"use strict";

var Planeta = cc.Class.extend({
    space: null,

    sprite: null,
    shape: null,
    layer: null,

    diameter: null,
    position: null,

    ctor: function (space, object, layer) {
        this.space = space;
        this.layer = layer;

        this.diameter = object.width;
        this.position = cp.v(object.x + this.diameter / 2, object.y + this.diameter / 2);

        var body = cp.StaticBody();
        body.setPos(this.position);

        // Physics Sprite
        var randomNumber = Math.floor(Math.random() * 2) + 1;
        var spriteName = "#planet_" + this.diameter + "_" + randomNumber + ".png";
        this.sprite = new cc.PhysicsSprite(spriteName);
        this.sprite.setBody(body);
        layer.addChild(this.sprite, 5);


        // forma
        this.shape = new cp.CircleShape(body, this.diameter / 2, cp.vzero);
        this.shape.setCollisionType(tipoPlaneta);
        this.shape.setFriction(1);

        // agregar forma dinamica
        this.space.addShape(this.shape);
    },

    eliminar: function () {
        // quita la forma
        this.space.removeShape(this.shape);

        // quita el sprite
        this.layer.removeChild(this.sprite);
    }
});
