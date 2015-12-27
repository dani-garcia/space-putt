"use strict";

var AgujeroGusano = cc.Class.extend({
    sprite: null,
    shape: null,

    diameter: null,
    position: null,

    // Cada agujero en el mapa tendra un tipo de forma '1+' o '1-' donde el numero indica el id de la pareja de agujeros
    // y el simbolo el lado, que podra ser + o -. De este modo cada agujero lleva hasta el agujero con mismo id y simbolo opuesto
    id: null,
    side: null,

    ctor: function (space, object, layer) {
        this.diameter = object.width;
        this.position = cp.v(object.x + this.diameter / 2, object.y + this.diameter / 2);

        this.id = object.type.slice(0, -1); // Quitamos ultimo caracter
        this.side = object.type.slice(-1); // Cojemos ultimo caracter

        var body = cp.StaticBody();
        body.setPos(this.position);

        // Sprite
        this.sprite = new cc.Sprite("#worm-hole.png");
        this.sprite.setPosition(this.position);
        layer.addChild(this.sprite, 5);

        // Animacion
        this.sprite.runAction(cc.rotateBy(1, 20).repeatForever());

        // forma
        this.shape = new cp.CircleShape(body, this.diameter / 2, cp.vzero);
        this.shape.setCollisionType(tipo.AGUJERO);

        // No colisionar con ella
        this.shape.setSensor(true);

        // agregar forma
        space.addStaticShape(this.shape);
    }
});
