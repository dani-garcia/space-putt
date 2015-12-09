"use strict";

var ControlesLayer = cc.Layer.extend({
    spriteBotonSaltar: null,
    etiquetaPelotas: null,
    etiquetaNivel: null,

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
            onMouseDown: this.procesarMouseDown.bind(this)
        }, this);

        this.scheduleUpdate();
        return true;
    },

    update: function (dt) {

    },

    procesarMouseDown: function (event) {
        // Accedemos al padre (Scene), pedimos la capa con la idCapaJuego
        var gameLayer = this.getParent().getChildByTag(idCapaJuego);

        // tenemos el objeto GameLayer
        var body = gameLayer.spritePelota.body;
        var dx = (event.getLocationX() - body.p.x) - gameLayer.getPositionX();
        var dy = (event.getLocationY() - body.p.y) - gameLayer.getPositionY();

        var movimiento = new cc.math.Vec2(dx, dy);

        if (movimiento.length() > 500)
            movimiento.normalize().scale(500);

        console.log(movimiento);

        gameLayer.moverPelota(movimiento);
    },

    actualizarNivel: function () {
        this.etiquetaNivel.setString("Nivel: " + nivelJuego);
    },

    setPelotas: function (pelotas) {
        this.etiquetaVidas.setString("Pelotas: " + pelotas);
    }
});

