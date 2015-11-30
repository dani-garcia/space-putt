"use strict";

var GameLayer = cc.Layer.extend({
    space: null,

    mapa: null,
    mapaAncho: null,


    ctor: function () {
        this._super();

        //cc.spriteFrameCache.addSpriteFrames(...);

        // Inicializar Space
        this.space = new cp.Space();
        this.space.gravity = cp.v(0, 0);
        // Depuración
        this.depuracion = new cc.PhysicsDebugNode(this.space);
        this.addChild(this.depuracion, 10);

        this.cargarMapa();
        this.scheduleUpdate();

        return true;
    },

    update: function (dt) {
        this.space.step(dt);
    },

    cargarMapa: function () {
        this.mapa = new cc.TMXTiledMap(res.mapa_tmx);

        // Añadirlo a la Layer
        this.addChild(this.mapa);

        // Ancho del mapa
        this.mapaAncho = this.mapa.getContentSize().width;
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
