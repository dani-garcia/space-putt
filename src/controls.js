"use strict";

var ControlesLayer = cc.Layer.extend({
    spriteBotonSaltar: null,
    etiquetaPelotas: null,
    etiquetaNivel: null,

    click: null,

    ctor: function () {
        this._super();
        var size = cc.winSize;

        // Contador Vidas
        this.etiquetaVidas = new cc.LabelTTF("Pelotas: " + PELOTAS_JUGADOR_INICIAL, "Helvetica", 20);
        this.etiquetaVidas.setPosition(size.width - 90, size.height - 60);
        this.etiquetaVidas.fillStyle = cc.color.WHITE;
        this.addChild(this.etiquetaVidas);

        // Contador nivel
        this.etiquetaNivel = new cc.LabelTTF("Nivel: " + nivelJuego, "Helvetica", 20);
        this.etiquetaNivel.setPosition(size.width - 90, size.height - 35);
        this.etiquetaNivel.fillStyle = cc.color.WHITE;
        this.addChild(this.etiquetaNivel);

        // Registrar Mouse Down
        cc.eventManager.addListener({
            event: cc.EventListener.MOUSE,
            onMouseDown: this.mouseDown.bind(this),
            onMouseUp: this.mouseUp.bind(this),
            onMouseMove: this.mouseMove.bind(this),
            onMouseScroll: null
        }, this);

        this.scheduleUpdate();
        return true;
    },

    update: function (dt) {

    },

    mouseDown: function () {
        this.click = true;
    },

    mouseMove: function (event) {
        if (this.click) {
            var gameLayer = this.getParent().getChildByTag(idCapaJuego);
            gameLayer.trazarPelota(event.getLocation());
        }
    },

    mouseUp: function (event) {
        this.click = false;

        var gameLayer = this.getParent().getChildByTag(idCapaJuego);
        gameLayer.moverPelota(event.getLocation());
    },

    actualizarNivel: function () {
        this.etiquetaNivel.setString("Nivel: " + nivelJuego);
    },

    setPelotas: function (pelotas) {
        this.etiquetaVidas.setString("Pelotas: " + pelotas);
    }
});

