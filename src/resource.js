"use strict";

var res = {
    sprites_plist: "res/sprites.plist",
    sprites_png: "res/sprites.png",

    mapa1_tmx: "res/mapa1.tmx",
    mapa2_tmx: "res/mapa2.tmx",
    mapa3_tmx: "res/mapa3.tmx",
    tileset_space_png: "res/tileset_space.png",

    fondo_titulo_png: "res/fondo_titulo.png",
    jugar_png: "res/jugar.png",
    jugar_glow_png: "res/jugar_glow.png",

    golfhit_wav: "res/golfhit.wav",
    burned_wav: "res/burned.wav",
    warp_wav: "res/warp.wav",
    win_wav: "res/win.wav",
    over_wav: "res/over.wav"
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}
