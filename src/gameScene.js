"use strict";

var tipoPelota = 1;
var tipoPlaneta = 2;
var tipoBorde = 3;
var tipoMeta = 4;
var tipoSol = 5;

var nivelJuego = 1;
var PELOTAS_JUGADOR_INICIAL = 3;

var DEBUG = false;

var GameLayer = cc.Layer.extend({
    space: null,

    mapa: null,
    planetas: null,
    spritePelota: null,

    meta: null,
    pelotas: null,

    drawNode: null,
    trazaPelota: null,
    finalizarTraza: null,
    puntosInvalidados: null,

    // Configuracion de la traza
    numPuntos: 25,
    stepsEntrePuntos: 10,

    disparada: null,
    tiempoParada: null,

    posicionUltimoDisparo: null,

    debeEliminarPelota: null,

    ctor: function () {
        this._super();

        // Carga de las animaciones
        cc.spriteFrameCache.addSpriteFrames(res.sprites_plist);

        // Inicializar Space
        this.space = new cp.Space();

        // Depuración
        if (DEBUG) {
            var depuracion = new cc.PhysicsDebugNode(this.space);
            this.addChild(depuracion, 10);
        }

        // Nodo de dibujo de traza
        this.drawNode = new cc.DrawNode();
        this.addChild(this.drawNode, 20);
        this.trazaPelota = [];

        // Ajustamos el numero de pelotas
        this.pelotas = PELOTAS_JUGADOR_INICIAL;

        // Cargamos el mapa
        this.cargarMapa();

        // Colisiones con la meta
        this.space.addCollisionHandler(tipoPelota, tipoMeta, null, null, this.collisionPelotaConMeta.bind(this), null);

        // Colisiones con el sol
        this.space.addCollisionHandler(tipoPelota, tipoSol, null, null, this.collisionPelotaConSol.bind(this), null);

        this.scheduleUpdate();

        return true;
    },

    collisionPelotaConSol: function (arbiter, space) {
        // Si no se ha disparado, es que estamos trazando el camino
        if (!this.disparada) {

            // Si estamos trazando el camino, detenemos la traza
            this.finalizarTraza = true;
            return;
        }

        console.log("Colision contra el sol");

        // Reseteamos la pelota
        this.debeEliminarPelota = true;
    },

    collisionPelotaConMeta: function (arbiter, space) {
        // Si no se ha disparado, es que estamos trazando el camino
        if (!this.disparada)
            return;

        console.log("Ganaste");

        // Cambiamos de nivel. Como solo hay tres, los repetimos en bucle
        nivelJuego %= 3;
        nivelJuego++;

        this.cambioNivel();
    },

    cambioNivel: function () {
        // Cambiamos el contador de nivel
        var capaControles = this.getParent().getChildByTag(idCapaControles);
        capaControles.actualizarNivel();

        // Reseteamos las pelotas
        this.pelotas = PELOTAS_JUGADOR_INICIAL;
        capaControles.setPelotas(this.pelotas);

        cc.director.runScene(new GameScene());
    },

    clickToVector: function (clickVector) {
        // Calculamos el vector de movimiento (posClick - (posPelota + scrollPantalla))
        var vector = new cc.math.Vec2(clickVector).subtract(this.spritePelota.body.p).subtract(this.getPosition());

        // Lo multiplicamos por 1.5
        vector.scale(1.5);

        // Evitamos que pase de un valor maximo
        var maxVector = 500;

        if (vector.length() > maxVector)
            vector.normalize().scale(maxVector);

        return vector;
    },

    moverPelota: function (clickVector) {
        // Si se ha disparado o no quedan pelotas, no se puede hacer de nuevo
        if (this.disparada || this.pelotas <= 0)
            return;

        // Obtenemos el vector del disparo
        var vector = this.clickToVector(clickVector);

        // Quitamos una pelota
        var capaControles = this.getParent().getChildByTag(idCapaControles);
        capaControles.setPelotas(--this.pelotas);

        // Disparamos
        this.disparada = true;
        this.spritePelota.body.applyImpulse(vector, cp.vzero);

        // Guardamos la posicion para restaurarla en caso de que se lance contra el sol
        this.posicionUltimoDisparo = cc.p(this.spritePelota.body.p);
    },

    trazarPelota: function (clickVector) {
        // Si se ha disparado, no se puede hacer de nuevo
        if (this.disparada)
            return;

        // Guardamos la pos inicial y preparamos la traza
        var posInicial = cc.p(this.spritePelota.body.p);
        this.trazaPelota = [];
        this.finalizarTraza = false;

        // Movemos la pelota
        var vector = this.clickToVector(clickVector);
        this.spritePelota.body.applyImpulse(vector, cp.vzero);

        // Anotamos el camino
        for (var i = 0; i < this.numPuntos; i++) {
            // Iteramos las fisicas unas cuantas veces
            for (var j = 0; j < this.stepsEntrePuntos; j++) {
                this.space.step(1 / 60); // Para 60 fps
                this.aplicarGravedadPlanetaria();
            }

            // Si nos toca finalizar la traza, acabamos antes de tiempo
            if (this.finalizarTraza)
                break;

            // Anotamos la posicion
            this.trazaPelota.push(cc.p(this.spritePelota.body.p));
        }

        // Tras acabar la traza, reseteamos la pelota
        this.eliminarPelota();
        this.inicializarPelota(posInicial.x, posInicial.y);
    },

    update: function (dt) {
        // Si tenemos que eliminar la pelota (por que choque contra el sol), lo hacemos
        if (this.debeEliminarPelota) {
            this.debeEliminarPelota = false;
            this.eliminarPelota();
            this.inicializarPelota(this.posicionUltimoDisparo.x, this.posicionUltimoDisparo.y);
            this.trazaPelota = [];
            return;
        }

        // Iteramos las fisicas
        this.space.step(dt);

        // Centramos la camara con respecto a la pelota
        this.actualizarCamara();

        // Actualizamos el tiempo de disparo
        if (this.disparada) {
            var velocidad = new cc.math.Vec2(this.spritePelota.body.getVel()).length();

            if (velocidad > 20) {
                this.tiempoParada = 0
            } else {
                this.tiempoParada += dt;

                // Si llevamos parados dos segundos, podemos volver a tirar si quedan pelotas
                // Tambien borramos la traza
                if (this.tiempoParada > 2) {
                    this.disparada = false;

                    this.trazaPelota = [];
                    this.puntosInvalidados = true;

                }
            }
        } else if (this.pelotas <= 0) { // Si toca disparar, pero no hay pelotas, perdiste
            console.log("Perdiste");

            nivelJuego = 1;
            this.cambioNivel();
        }

        // Calcular fuerza sobre la pelota
        this.aplicarGravedadPlanetaria();

        // Dibujar traza (solo si es necesario)
        if (this.puntosInvalidados) {
            this.puntosInvalidados = false;

            // Borramos los puntos anteriores
            this.drawNode.clear();

            var initialSize = 3;
            // Vamos a ir reduciendo el tamaño y opacidad de la traza a medida que nos alejamos del inicio
            var dSize = initialSize / this.numPuntos;
            var dColor = 200 / this.numPuntos;

            for (var i = 0; i < this.trazaPelota.length; i++) {
                var punto = this.trazaPelota[i];
                this.drawNode.drawDot(punto, initialSize - dSize * i, cc.color(255, 0, 0, 255 - dColor * i));
            }
        }
    },

    aplicarGravedadPlanetaria: function () {
        // Posicion pelota
        var posPelota = new cc.math.Vec2(this.spritePelota.getPosition());
        var diametroPelota = this.spritePelota.width;

        // Inspirado por:
        // http://www.emanueleferonato.com/2012/03/28/simulate-radial-gravity-also-know-as-planet-gravity-with-box2d-as-seen-on-angry-birds-space/

        var sumaImpulso = new cc.math.Vec2(0, 0);

        for (var i = 0; i < this.planetas.length; i++) {
            // Planeta y su diametro
            var planeta = this.planetas[i];
            var diametroPlaneta = planeta.diameter;

            // Distancia al centro del planeta
            var distancia = new cc.math.Vec2(planeta.position).subtract(posPelota);
            var distanciaLength = distancia.length();

            // Calculo de impulso
            var impulso = new cc.math.Vec2(distancia).normalize();
            impulso.scale(700 / distanciaLength);
            impulso.scale((diametroPlaneta + diametroPelota) / distanciaLength);

            // Si está en la superficie de un planeta, fingimos que los demas planetas no le afectan
            // Si no hacemos esto la pelota rodara en la direccion del planeta mas cercano
            if (distanciaLength < diametroPlaneta / 2 + diametroPelota) {
                sumaImpulso = impulso;
                break;
            }

            sumaImpulso.add(impulso);
        }

        // Aplicamos el impulso
        this.spritePelota.body.applyImpulse(sumaImpulso, cp.vzero);

        // Friccion rotacional (Reducimos velocidad angular)
        // Si no la esfera estaria rodando sin parar
        // https://chipmunk-physics.net/forum/viewtopic.php?t=536
        this.spritePelota.body.w *= 0.95;
    },

    actualizarCamara: function () {
        var xPelota = this.spritePelota.getBody().p.x;
        var yPelota = this.spritePelota.getBody().p.y;

        // Actualizar eje X
        if (cc.winSize.width / 2 > xPelota) {
            this.setPositionX(0);

        } else if (this.mapa.width - cc.winSize.width / 2 < xPelota) {
            this.setPositionX(cc.winSize.width - this.mapa.width);

        } else {
            this.setPositionX(cc.winSize.width / 2 - xPelota);
        }

        // Actualizar eje Y
        if (cc.winSize.height / 2 > yPelota) {
            this.setPositionY(0);

        } else if (this.mapa.height - cc.winSize.height / 2 < yPelota) {
            this.setPositionY(cc.winSize.height - this.mapa.height);

        } else {
            this.setPositionY(cc.winSize.height / 2 - yPelota);
        }
    },

    cargarMapa: function () {
        // Crear el mapa y añadirlo al layer
        this.mapa = new cc.TMXTiledMap(res["mapa" + nivelJuego + "_tmx"]);
        this.addChild(this.mapa);

        // Pelota
        var pelota = this.mapa.getObjectGroup("Pelota").getObjects();
        cc.assert(pelota.length === 1, "Sólo debe haber una pelota");
        this.inicializarPelota(pelota[0].x, pelota[0].y);

        // Planetas
        var planetas = this.mapa.getObjectGroup("Planetas").getObjects();
        this.planetas = []; // Vaciamos la lista de planetas, en caso de que haya algo

        for (var i = 0; i < planetas.length; i++) {
            this.planetas.push(new Planeta(this.space, planetas[i], this));
        }

        // Soles
        var soles = this.mapa.getObjectGroup("Soles").getObjects();

        for (var i = 0; i < soles.length; i++) {
            this.planetas.push(new Sol(this.space, soles[i], this));
        }

        // Meta
        var meta = this.mapa.getObjectGroup("Meta").getObjects();
        cc.assert(meta.length === 1, "Sólo debe haber una meta");
        this.inicializarMeta(meta[0]);

        // Bordes
        var bordes = this.mapa.getObjectGroup("Bordes").getObjects();
        // Los objetos de la capa bordes se transforman a
        // formas estáticas de Chipmunk ( SegmentShape ).
        for (var i = 0; i < bordes.length; i++) {
            var borde = bordes[i];
            var puntos = borde.polylinePoints;
            for (var j = 0; j < puntos.length - 1; j++) {
                var shapeBorde = new cp.SegmentShape(new cp.StaticBody(),
                    cp.v(parseInt(borde.x) + parseInt(puntos[j].x),
                        parseInt(borde.y) - parseInt(puntos[j].y)),
                    cp.v(parseInt(borde.x) + parseInt(puntos[j + 1].x),
                        parseInt(borde.y) - parseInt(puntos[j + 1].y)),
                    10);

                shapeBorde.setCollisionType(tipoBorde);

                this.space.addStaticShape(shapeBorde);
            }
        }
    },

    inicializarMeta: function (object) {
        var body = cp.StaticBody();
        body.setPos(cp.v(object.x + object.width / 2, object.y + object.height / 2));
        body.setAngle(2 * Math.PI - object.rotation * Math.PI / 180);

        // Physics Sprite
        this.sprite = new cc.PhysicsSprite("#meta.png");
        this.sprite.setBody(body);
        this.addChild(this.sprite, 10);

        // forma
        this.shape = new cp.BoxShape(body, object.width, object.height);
        this.shape.setCollisionType(tipoMeta);

        // Nunca genera colisiones reales
        this.shape.setSensor(true);

        // agregar forma
        this.space.addShape(this.shape);
    },

    inicializarPelota: function (x, y) {
        this.spritePelota = new cc.PhysicsSprite("#bola.png");
        var body = new cp.Body(1, cp.momentForCircle(1, 0, this.spritePelota.width / 2, cp.vzero));
        body.p = cc.p(x, y);
        this.spritePelota.setBody(body);
        this.space.addBody(body);

        // Forma
        var shape = new cp.CircleShape(body, this.spritePelota.width / 2, cp.vzero);
        shape.setFriction(100);
        shape.setCollisionType(tipoPelota);
        this.space.addShape(shape);
        this.addChild(this.spritePelota, 20);

        // Metodo para poder eliminar la pelota luego
        this.eliminarPelota = function () {
            this.space.removeShape(shape);
            this.space.removeBody(shape.body);
            this.spritePelota.removeFromParent();
        };

        this.disparada = false;
        this.puntosInvalidados = true;
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
