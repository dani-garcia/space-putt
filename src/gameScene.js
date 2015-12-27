"use strict";

var tipo = {
    PELOTA: 1,
    PLANETA: 2,
    BORDE: 3,
    META: 4,
    SOL: 5,
    AGUJERO: 6
};

var nivelJuego = 1;

var NUM_NIVELES = 3;
var PELOTAS_JUGADOR_INICIAL = 3;
var DEBUG = false;

var GameLayer = cc.Layer.extend({
    space: null,

    mapa: null,
    planetas: null,
    agujeros: null,
    spritePelota: null,

    meta: null,
    pelotas: null,

    drawNode: null,
    trazaPelota: null,
    finalizarTraza: null,
    puntosInvalidados: null,

    // Configuracion de la traza
    numPuntos: 35,
    stepsEntrePuntos: 7,

    disparada: null,
    tiempoParada: null,

    posicionUltimoDisparo: null,
    ultimoAgujero: null,

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
        this.space.addCollisionHandler(tipo.PELOTA, tipo.META, null, this.collisionPelotaConMeta.bind(this), null, null);

        // Colisiones con el sol
        this.space.addCollisionHandler(tipo.PELOTA, tipo.SOL, null, this.collisionPelotaConSol.bind(this), null, null);

        // Colisiones con agujeros negros
        this.space.addCollisionHandler(tipo.PELOTA, tipo.AGUJERO, null, this.collisionPelotaConAgujero.bind(this), null, this.separacionPelotaConAgujero.bind(this));

        this.scheduleUpdate();

        return true;
    },

    collisionPelotaConAgujero: function (arbiter, space) {
        // Si estamos trazando el camino, acaba aqui
        if (!this.disparada) {
            this.finalizarTraza = true;
            return;
        }

        var shapeAgujero = arbiter.getShapes()[1];
        var agujero;

        // Buscamos el agujero actual
        for (var key in this.agujeros) {
            agujero = this.agujeros[key];
            // Si lo hemos encontrado, salimos
            if (agujero.shape === shapeAgujero)
                break;
        }

        // Si acabamos de salir por aqui, no podemos volver a entrar
        if (this.ultimoAgujero.id === agujero.id) {
            return;
        }

        // Buscamos el agujero destino (mismo id y simbolo opuesto)
        var agujeroDestino = this.agujeros[agujero.id + (agujero.side === "+" ? "-" : "+")];

        // anotamos de donde salimos
        this.ultimoAgujero = agujeroDestino;

        // Nos movemos a su posicion
        var action = cc.moveTo(0, agujeroDestino.position);
        this.spritePelota.runAction(action);

        // Reproducimos sonido
        cc.audioEngine.playEffect(res.warp_wav, false);
    },

    separacionPelotaConAgujero: function (arbiter, space) {
        // Si estamos trazando el camino, acaba aqui
        if (!this.disparada) {
            this.finalizarTraza = true;
            return;
        }

        var shapeAgujero = arbiter.getShapes()[1];
        var agujero;

        // Buscamos el agujero actual
        for (var key in this.agujeros) {
            agujero = this.agujeros[key];
            // Si lo hemos encontrado, salimos
            if (agujero.shape === shapeAgujero)
                break;
        }

        // Si nos estamos separando del agujero de salida, ya seria posible volver a usar los agujeros
        if (this.ultimoAgujero === agujero) {
            this.ultimoAgujero = {};
        }
    },

    collisionPelotaConSol: function (arbiter, space) {
        // Si estamos trazando el camino, acaba aqui
        if (!this.disparada) {
            this.finalizarTraza = true;
            return;
        }

        cc.audioEngine.playEffect(res.burned_wav, false);

        // Reseteamos la pelota y la traza
        this.debeEliminarPelota = true;
        this.trazaPelota = [];

        // Ponemos el contador en blanco
        var capaControles = this.getParent().getChildByTag(idCapaControles);
        capaControles.setPelotas(this.pelotas);
    },

    collisionPelotaConMeta: function (arbiter, space) {
        // Si no se ha disparado, no podemos ganar, obviamente
        if (!this.disparada) {
            return;
        }

        cc.audioEngine.playEffect(res.win_wav, false);

        // Cambiamos de nivel.
        nivelJuego++;

        this.cambioNivel();
    },

    moverPelota: function (click) {
        // Si se ha disparado o no quedan pelotas, no se puede hacer de nuevo
        if (this.disparada || this.pelotas <= 0)
            return;

        // Quitamos una pelota y ponemos el contador a rojo para ver que no se puede disparar
        var capaControles = this.getParent().getChildByTag(idCapaControles);
        capaControles.setPelotasDesactivadas(--this.pelotas);

        // Disparamos
        this.disparada = true;
        this.spritePelota.body.applyImpulse(this.clickToVector(click), cp.vzero);

        // Sonido disparo
        cc.audioEngine.playEffect(res.golfhit_wav, false);

        // Guardamos la posicion para restaurarla en caso de que se lance contra el sol
        this.posicionUltimoDisparo = cc.p(this.spritePelota.body.p);
    },

    trazarPelota: function (click) {
        // Si se ha disparado, no se puede hacer de nuevo
        if (this.disparada)
            return;

        // Guardamos la pos inicial y preparamos la traza
        var posInicial = cc.p(this.spritePelota.body.p);
        this.trazaPelota = [];
        this.finalizarTraza = false;

        // Movemos la pelota
        this.spritePelota.body.applyImpulse(this.clickToVector(click), cp.vzero);

        // Anotamos el camino
        for (var i = 0; i < this.numPuntos; i++) {
            // Iteramos las fisicas unas cuantas veces
            for (var j = 0; j < this.stepsEntrePuntos; j++) {
                this.space.step(1 / 60); // Para 60 fps
                this.aplicarGravedadPlanetaria();
            }

            // Anotamos la posicion
            this.trazaPelota.push(cc.p(this.spritePelota.body.p));

            // Si nos toca finalizar la traza, acabamos antes de tiempo
            if (this.finalizarTraza)
                break;
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
            return;
        }

        // Iteramos las fisicas
        this.space.step(dt);

        // Actualizamos el tiempo de disparo
        this.actualizarTiempoDisparo(dt);

        // Calcular fuerza sobre la pelota
        this.aplicarGravedadPlanetaria();

        // Centramos la camara con respecto a la pelota
        this.actualizarCamara();

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
                this.drawNode.drawDot(this.trazaPelota[i], initialSize - dSize * i, cc.color(255, 0, 0, 255 - dColor * i));
            }
        }
    },

    actualizarTiempoDisparo: function (dt) {
        if (this.disparada) {
            var velocidad = new cc.math.Vec2(this.spritePelota.body.getVel()).length();

            // Contamos el tiempo que lleve parada (se entiende parada por velocidad < 20)
            if (velocidad > 20) {
                this.tiempoParada = 0
            } else {
                this.tiempoParada += dt;

                // Si llevamos parados dos segundos...
                if (this.tiempoParada > 2) {
                    // Quitamos una pelota del marcador y lo ponemos en blanco
                    var capaControles = this.getParent().getChildByTag(idCapaControles);
                    capaControles.setPelotas(this.pelotas);

                    // Ya es posible disparar de nuevo
                    this.disparada = false;

                    // Borramos la traza
                    this.trazaPelota = [];
                    this.puntosInvalidados = true;
                }
            }

        } else if (this.pelotas <= 0) { // Si toca disparar, pero no hay pelotas, perdiste
            cc.audioEngine.playEffect(res.over_wav, false);

            nivelJuego = 1;
            this.cambioNivel();
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

    cambioNivel: function () {
        // Cambiamos el contador de nivel
        var capaControles = this.getParent().getChildByTag(idCapaControles);
        capaControles.actualizarNivel();

        // Reseteamos las pelotas
        this.pelotas = PELOTAS_JUGADOR_INICIAL;
        capaControles.setPelotas(this.pelotas);

        cc.director.runScene(new GameScene());
    },

    clickToVector: function (click) {
        // A partir de las coordenadas de click, calculamos el vector de movimiento
        // (posClick - (posPelota + scrollPantalla))
        var vector = new cc.math.Vec2(click).subtract(this.spritePelota.body.p).subtract(this.getPosition());

        // Lo multiplicamos por 2
        vector.scale(2);

        // Evitamos que pase de un valor maximo
        var maxVector = 500;

        if (vector.length() > maxVector)
            vector.normalize().scale(maxVector);

        return vector;
    },

    actualizarCamara: function () {
        // Hacemos que la camara siga a la pelota, pero sin salirse de los bordes del mapa
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
        // Crear el mapa y añadirlo al layer (como hay un numero limitado de niveles, los repetimos en bucle
        var nivel = (nivelJuego - 1) % NUM_NIVELES + 1;
        this.mapa = new cc.TMXTiledMap(res["mapa" + nivel + "_tmx"]);
        this.addChild(this.mapa);

        // ----------------
        // Pelota
        var pelota = this.mapa.getObjectGroup("Pelota").getObjects();
        cc.assert(pelota.length === 1, "Sólo debe haber una pelota");
        this.inicializarPelota(pelota[0].x, pelota[0].y);

        // -----------------------------------
        // Planetas
        var planetas = this.mapa.getObjectGroup("Planetas").getObjects();
        this.planetas = []; // Vaciamos la lista de planetas, en caso de que haya algo

        for (var i = 0; i < planetas.length; i++) {
            this.planetas.push(new Planeta(this.space, planetas[i], this));
        }

        // -----------------------------------
        // Soles
        var soles = this.mapa.getObjectGroup("Soles").getObjects();

        for (var i = 0; i < soles.length; i++) {
            this.planetas.push(new Sol(this.space, soles[i], this));
        }

        // -----------------------------------
        // Agujeros de gusano
        var agujeros = this.mapa.getObjectGroup("Agujeros").getObjects();
        this.ultimoAgujero = {};
        this.agujeros = {};

        for (var i = 0; i < agujeros.length; i++) {
            var agu = new AgujeroGusano(this.space, agujeros[i], this);
            this.agujeros[agu.id + agu.side] = agu;
        }

        // -----------------------------------
        // Meta
        var meta = this.mapa.getObjectGroup("Meta").getObjects();
        cc.assert(meta.length === 1, "Sólo debe haber una meta");
        this.inicializarMeta(meta[0]);

        // -----------------------------------
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

                shapeBorde.setCollisionType(tipo.BORDE);

                this.space.addStaticShape(shapeBorde);
            }
        }
    },

    inicializarMeta: function (object) {
        // Body
        var body = cp.StaticBody();
        body.setPos(cp.v(object.x + object.width / 2, object.y + object.height / 2));
        body.setAngle(2 * Math.PI - object.rotation * Math.PI / 180);

        // Sprite
        this.sprite = new cc.PhysicsSprite("#meta.png");
        this.sprite.setBody(body);
        this.addChild(this.sprite, 10);

        // forma
        this.shape = new cp.BoxShape(body, object.width, object.height);
        this.shape.setCollisionType(tipo.META);

        // Nunca genera colisiones reales
        this.shape.setSensor(true);

        // agregar forma
        this.space.addStaticShape(this.shape);
    },

    inicializarPelota: function (x, y) {
        // Sprite
        this.spritePelota = new cc.PhysicsSprite("#bola.png");
        this.addChild(this.spritePelota, 20);

        // Body
        var body = new cp.Body(1, cp.momentForCircle(1, this.spritePelota.width / 2, this.spritePelota.width / 2, cp.vzero));
        body.p = cc.p(x, y);
        this.spritePelota.setBody(body);
        this.space.addBody(body);

        // Forma
        var shape = new cp.CircleShape(body, this.spritePelota.width / 2, cp.vzero);
        shape.setFriction(100);
        shape.setCollisionType(tipo.PELOTA);
        this.space.addShape(shape);

        // Metodo para poder eliminar la pelota luego
        this.eliminarPelota = function () {
            this.space.removeShape(shape);
            this.space.removeBody(shape.body);
            this.spritePelota.removeFromParent();
        };

        // Nada mas crear la pelota, redibujamos la traza y la marcamos como no disparada
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
