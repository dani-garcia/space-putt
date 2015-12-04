"use strict";

var res = {
    animacion_bola_plist: "res/animacion_bola.plist",
    animacion_bola_png: "res/animacion_bola.png",
    mapa1_tmx: "res/mapa1.tmx",
    planets_plist: "res/planets.plist",
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}