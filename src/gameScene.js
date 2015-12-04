"use strict";

var tipoPelota = 1;
var tipoPlaneta = 2;

var GameLayer = cc.Layer.extend({
    space: null,

    mapa: null,
    mapaAncho: null,
    planetas: [],
    spritePelota: null,


    ctor: function () {
        this._super();

        cc.spriteFrameCache.addSpriteFrames(res.animacion_bola_plist);
        cc.spriteFrameCache.addSpriteFrames(res.planets_plist);

        // Inicializar Space
        this.space = new cp.Space();
        this.space.gravity = cp.v(0, 0);

        // Depuración
        this.depuracion = new cc.PhysicsDebugNode(this.space);
        this.addChild(this.depuracion, 10);

        // Evento MOUSE
        cc.eventManager.addListener({
            event: cc.EventListener.MOUSE,
            onMouseDown: this.procesarMouseDown.bind(this)
        }, this);

        this.cargarMapa();
        this.scheduleUpdate();


        return true;
    },

    update: function (dt) {
        this.space.step(dt);

        // actualizar camara (posición de la capa).
        var xPelota = this.spritePelota.getBody().p.x;
        var yPelota = this.spritePelota.getBody().p.y;

        this.setPositionX(-xPelota + cc.winSize.width / 2);
        this.setPositionY(-yPelota + cc.winSize.height / 2);

        this.spritePelota.body.applyForce(this.calcularFuerza(), cp.vzero);
    },

    calcularFuerza: function () {
        var fuerza = cp.v(0, 0);
        var posPelota = this.spritePelota.getPosition();

        //      G M m
        // F = --------
        //       d^2

        for (var i = 0; i < this.planetas.length; i++) {
            var planeta = this.planetas[i];
            var planetWeight = planeta.diameter / 100;

            var distXSq = Math.pow(planeta.position.x - posPelota.x, 2);
            var distYSq = Math.pow(planeta.position.y - posPelota.y, 2);

            fuerza.add(cp.v(planetWeight / distXSq, planetWeight / distYSq));
        }

        return fuerza;
    },

    procesarMouseDown: function (event) {
        var body = this.spritePelota.body;
        var dx = (event.getLocationX() - body.p.x) - this.getPositionX();
        var dy = (event.getLocationY() - body.p.y) - this.getPositionY();

        body.applyImpulse(cp.v(dx, dy), cp.vzero);
    },

    cargarMapa: function () {
        this.mapa = new cc.TMXTiledMap(res.mapa1_tmx);

        // Añadirlo a la Layer
        this.addChild(this.mapa);

        // Ancho del mapa
        this.mapaAncho = this.mapa.getContentSize().width;

        var pelota = this.mapa.getObjectGroup("Pelota").getObjects();
        cc.assert(pelota.length === 1, "Sólo debe haber una pelota");

        this.inicializarPelota(pelota[0].x, pelota[0].y);


        var planetas = this.mapa.getObjectGroup("Planetas").getObjects();

        for (var i = 0; i < planetas.length; i++) {
            this.planetas.push(new Planeta(this.space, planetas[i], this));
        }
    },

    inicializarPelota: function (x, y) {
        var size = cc.winSize;
        this.spritePelota = new cc.PhysicsSprite("#animacion_bola1.png");
        var body = new cp.Body(1, cp.momentForCircle(1, 0, this.spritePelota.width / 2, cp.vzero));
        body.p = cc.p(x, y);
        this.spritePelota.setBody(body);
        this.space.addBody(body);

        var shape = new cp.CircleShape(body, this.spritePelota.width / 2, cp.vzero);
        shape.setFriction(1);
        shape.setCollisionType(tipoPelota);
        this.space.addShape(shape);
        this.addChild(this.spritePelota, 20);

        this.eliminarPelota = function () {
            this.space.removeShape(shape);
            this.space.removeBody(shape.body);
            this.spritePelota.removeFromParent();
        }
    }
});

var idCapaJuego = 1;
var idCapaControles = 2;

var GameScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new GameLayer();
        this.addChild(layer, 0, idCapaJuego);

        var controlesLayer = new ControlesLayer();
        this.addChild(controlesLayer, 100, idCapaControles);
    }
});
