"use strict";

var Planeta = cc.Class.extend({
    sprite: null,
    shape: null,

    diameter: null,
    position: null,

    ctor: function (space, object, layer) {
        this.diameter = object.width;
        this.position = cp.v(object.x + this.diameter / 2, object.y + this.diameter / 2);

        var body = cp.StaticBody();
        body.setPos(this.position);

        // Sprite (cogemos aleatoriamente uno de los dos del tamaño adecuado)
        var randomNumber = Math.floor(Math.random() * 2) + 1;
        var spriteName = "#planet/planet_" + this.diameter + "_" + randomNumber + ".png";
        this.sprite = new cc.Sprite(spriteName);
        this.sprite.setPosition(this.position);
        layer.addChild(this.sprite, 5);

        // forma
        this.shape = new cp.CircleShape(body, this.diameter / 2, cp.vzero);
        this.shape.setCollisionType(tipo.PLANETA);
        this.shape.setFriction(100);

        // agregar forma
        space.addStaticShape(this.shape);
    }
});
