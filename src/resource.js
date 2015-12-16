"use strict";

var res = {
    animacion_bola_plist: "res/animacion_bola.plist",
    animacion_bola_png: "res/animacion_bola.png",

    mapa1_tmx: "res/mapa1.tmx",
    mapa2_tmx: "res/mapa2.tmx",
    mapa3_tmx: "res/mapa3.tmx",
    tileset_space_png: "res/tileset_space.png",

    planets_plist: "res/planets.plist",
    planets_png: "res/planets.png",

    meta_plist: "res/meta.plist",
    meta_png: "res/meta.png",

    fondo_titulo_png: "res/fondo_titulo.png",
    jugar_png: "res/jugar.png",
    jugar_glow_png: "res/jugar_glow.png"
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}
