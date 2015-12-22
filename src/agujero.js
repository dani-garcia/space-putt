"use strict";

var AgujeroGusano = Planeta.extend({

    // Cada agujero en el mapa tendra un tipo de forma '1+' o '1-' donde el numero indica el id de la pareja de agujeros
    // y el simbolo el lado, que podra ser A o B. De este modo cada agujero lleva hasta el agujero con mismo id y simbolo opuesto
    id: null,
    side: null,

    ctor: function (space, object, layer) {
        // Asi llamariamos al constructor de planeta
        //this._super(space, object, layer);

        this.space = space;
        this.layer = layer;

        this.diameter = object.width;
        this.position = cp.v(object.x + this.diameter / 2, object.y + this.diameter / 2);

        var type = object.type;
        this.id = type.slice(0, -1); // Quitamos ultimo caracter
        this.side = type.slice(-1); // Cojemos ultimo caracter

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
        this.shape.setCollisionType(tipoAgujero);

        // No colisionar con ella
        this.shape.setSensor(true);

        // agregar forma
        this.space.addStaticShape(this.shape);
    }
});
