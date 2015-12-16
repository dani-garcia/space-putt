"use strict";

var tipoPelota = 1;
var tipoPlaneta = 2;
var tipoBorde = 3;
var tipoMeta = 4;

var nivelJuego = 1;
var PELOTAS_JUGADOR_INICIAL = 3;

var GameLayer = cc.Layer.extend({
    space: null,

    mapa: null,
    mapaAncho: null,
    planetas: null,
    spritePelota: null,

    meta: null,
    pelotas: null,

    drawNode: null,
    trazaPelota: null,

    disparada: null,
    tiempoParada: null,

    ctor: function () {
        this._super();

        cc.spriteFrameCache.addSpriteFrames(res.animacion_bola_plist);
        cc.spriteFrameCache.addSpriteFrames(res.meta_plist);
        cc.spriteFrameCache.addSpriteFrames(res.planets_plist);

        // Inicializar Space
        this.space = new cp.Space();
        this.space.gravity = cp.v(0, 0);

        // Depuración
        this.depuracion = new cc.PhysicsDebugNode(this.space);
        this.addChild(this.depuracion, 10);

        // Ajustamos el numero de pelotas
        this.pelotas = PELOTAS_JUGADOR_INICIAL;

        this.cargarMapa();

        // Nodo de dibujo de traza
        this.drawNode = new cc.DrawNode();
        this.addChild(this.drawNode, 20);
        this.trazaPelota = [];

        this.scheduleUpdate();

        this.space.addCollisionHandler(tipoPelota, tipoMeta, null, this.collisionPelotaConMeta.bind(this), null, null);

        return true;
    },

    collisionPelotaConMeta: function (arbiter, space) {
        // Si no se ha disparado, es que estamos trazando el camino
        if (!this.disparada)
            return;

        console.log("Ganaste");

        // Cambiamos de nivel. Como solo hay tres, los repetimos
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
        var maxVector = 700;
        var vector = new cc.math.Vec2(clickVector).subtract(this.spritePelota.body.p).subtract(this.getPosition());

        if (vector.length() > maxVector)
            vector.normalize().scale(maxVector);

        return vector;
    },

    moverPelota: function (clickVector) {
        // Si se ha disparado o no quedan pelotas, no se puede hacer de nuevo
        if (this.disparada || this.pelotas <= 0)
            return;

        var vector = this.clickToVector(clickVector);

        var capaControles = this.getParent().getChildByTag(idCapaControles);
        capaControles.setPelotas(--this.pelotas);

        this.disparada = true;
        this.spritePelota.body.applyImpulse(vector, cp.vzero);
    },

    trazarPelota: function (clickVector) {
        // Si se ha disparado, no se puede hacer de nuevo
        if (this.disparada)
            return;

        var posInicial = cc.p(this.spritePelota.body.p);
        this.trazaPelota = [];

        var dt = 1 / 60; // Para 60 fps

        {
            // Movemos la pelota
            var vector = this.clickToVector(clickVector);
            this.spritePelota.body.applyImpulse(vector, cp.vzero);

            // Dibujamos 10 puntos
            for (var i = 0; i < 10; i++) {
                this.trazaPelota.push(cc.p(this.spritePelota.body.p));

                // Dejamos 20 pasos entre cada punto
                for (var j = 0; j < 20; j++) {
                    this.space.step(dt);
                    this.aplicarGravedadPlanetaria();
                }
            }

            // Reseteamos la pelota
            this.eliminarPelota();
            this.inicializarPelota(posInicial.x, posInicial.y);
        }
    },

    update: function (dt) {
        this.space.step(dt);

        this.actualizarCamara();

        // Actualizar tiempo de disparo
        if (this.disparada) {
            var velocidad = new cc.math.Vec2(this.spritePelota.body.getVel()).length();

            if (velocidad > 20) {
                this.tiempoParada = 0
            } else {
                this.tiempoParada += dt;

                // Si llevamos parados dos segundos, podemos volver a tirar si quedan pelotas, o perdemos si no quedan
                // Tambien borramos la traza
                if (this.tiempoParada > 2) {
                    this.disparada = false;
                    this.trazaPelota = [];

                    if (this.pelotas <= 0) {
                        console.log("Perdiste");

                        nivelJuego = 1;
                        this.cambioNivel();
                    }
                }
            }
        }

        // Calcular fuerza sobre la pelota
        this.aplicarGravedadPlanetaria();

        // Dibujar traza (si la hay)
        this.drawNode.clear();
        for (var i in this.trazaPelota) {
            var punto = this.trazaPelota[i];
            this.drawNode.drawDot(punto, 3, cc.color.RED);
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
        this.mapa = new cc.TMXTiledMap(res["mapa" + nivelJuego + "_tmx"]);

        // Añadirlo a la Layer
        this.addChild(this.mapa);

        // Ancho del mapa
        this.mapaAncho = this.mapa.getContentSize().width;

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

        // agregar forma dinamica
        this.space.addShape(this.shape);
    },

    inicializarPelota: function (x, y) {
        this.spritePelota = new cc.PhysicsSprite("#animacion_bola1.png");
        var body = new cp.Body(1, cp.momentForCircle(1, 0, this.spritePelota.width / 2, cp.vzero));
        body.p = cc.p(x, y);
        this.spritePelota.setBody(body);
        this.space.addBody(body);

        var shape = new cp.CircleShape(body, this.spritePelota.width / 2, cp.vzero);
        shape.setFriction(100);
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
