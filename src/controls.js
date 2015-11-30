"use strict";

var ControlesLayer = cc.Layer.extend({
    spriteBotonSaltar: null,
    etiquetaMonedas: null,
    monedas: 0,

    ctor: function () {
        this._super();
        var size = cc.winSize;

        // Contador Monedas
        this.etiquetaMonedas = new cc.LabelTTF("Monedas: 0", "Helvetica", 20);
        this.etiquetaMonedas.setPosition(cc.p(size.width - 90, size.height - 20));
        this.etiquetaMonedas.fillStyle = new cc.Color(0, 0, 0, 0);
        this.addChild(this.etiquetaMonedas);


        // BotonSaltar
        this.spriteBotonSaltar = cc.Sprite.create(res.boton_saltar_png);
        this.spriteBotonSaltar.setPosition(
            cc.p(size.width * 0.8, size.height * 0.5));

        this.addChild(this.spriteBotonSaltar);

        // Registrar Mouse Down
        cc.eventManager.addListener({
            event: cc.EventListener.MOUSE,
            onMouseDown: this.procesarMouseDown
        }, this)

        this.scheduleUpdate();
        return true;
    },

    update: function (dt) {

    },

    procesarMouseDown: function (event) {
        var instancia = event.getCurrentTarget();
        var areaBoton = instancia.spriteBotonSaltar.getBoundingBox();

        // La pulsación cae dentro del botón
        if (cc.rectContainsPoint(areaBoton,
                cc.p(event.getLocationX(), event.getLocationY()))) {

            // Accedemos al padre (Scene), pedimos la capa con la idCapaJuego
            var gameLayer = instancia.getParent().getChildByTag(idCapaJuego);
            // tenemos el objeto GameLayer
            gameLayer.jugador.saltar();
        }
    },

    agregarMoneda: function () {
        this.monedas++;
        this.etiquetaMonedas.setString("Monedas: " + this.monedas);
    }
});

