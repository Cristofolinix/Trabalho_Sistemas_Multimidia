import { makeTexture, PAL } from '../utils/pixelArt.js';
import { CHARACTERS } from '../config/characters.js';

// Jogador (16×22). 'C'/'c' = cor da camisa (varia por personagem).
const PLAYER_ROWS = [
  '................',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '....HSSSSSSH....',
  '....SSSSSSSS....',
  '....S0SSSS0S....',
  '....SSSSSSSS....',
  '....SssssssS....',
  '.....SSSSSS.....',
  '......SccS......',
  '....CCCCCCCC....',
  '...CCCCCCCCCC...',
  '..SCCCCCCCCCCS..',
  '..SCcCCCCCCcCS..',
  '...CCCCCCCCCC...',
  '...CCCCCCCCCC...',
  '....CCCCCCCC....',
  '....PPPPPPPP....',
  '....PPP..PPP....',
  '....PPP..PPP....',
  '....KKK..KKK....',
  '...KKKK..KKKK...',
];

// Ressaca: estudante de ressaca, encurvado, segurando uma caneca (AA). 14×18
const RESSACA_ROWS = [
  '..HHHHHHHHHH..',
  '.HHHHHHHHHHHH.',
  '.HHZZZZZZZZHH.',
  '..ZmZZZZZZmZ..',
  '..Z0ZZZZ00ZZ..',
  '..ZZZZZZZZZZ..',
  '..ZZsssssZZZ..',
  '..MMMMMMMM....',
  '.MMMMMMMMMMAA.',
  '.MMMMMMMMMMAA.',
  '.MmMMMMMMmMAA.',
  '..MMMMMMMM....',
  '..MMMMMMMM....',
  '..MMM..MMM....',
  '..MM....MM....',
  '..mm....mm....',
  '.KKK....KKK...',
  '..............',
];

// Trote: calouro com boné e rosto pintado (faixa R). 14×18
const TROTE_ROWS = [
  '...TTTTTTTT...',
  '..TTTTTTTTTT..',
  '..TtTTTTTTtT..',
  '...SSSSSSSS...',
  '...S0SSSS0S...',
  '...RRRRRRRR...',
  '....SSSSSS....',
  '...OOOOOOOO...',
  '..OOOOOOOOOO..',
  '..OoOOOOOOoO..',
  '..OOOOOOOOOO..',
  '...OOOOOOOO...',
  '...OOOOOOOO...',
  '...OOO..OOO...',
  '...OO....OO...',
  '...pp....pp...',
  '..KKK..KKK....',
  '..............',
];

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() { this._makeAllTextures(); }

  create() {
    const go = () => this.scene.start('TitleScene');
    if (document.fonts && document.fonts.load) {
      Promise.race([
        document.fonts.load('16px "Press Start 2P"').then(() => document.fonts.ready),
        new Promise(res => this.time.delayedCall(2500, res))
      ]).then(go).catch(go);
    } else { go(); }
  }

  _makeAllTextures() {
    const PX = 3;

    // ── Jogadores (uma textura por personagem) ──
    Object.values(CHARACTERS).forEach(c => {
      const pal = { ...PAL, C: c.color, c: c.colorDark };
      makeTexture(this, `player_${c.key}`, PX, PLAYER_ROWS, pal);
    });

    // ── Inimigos ──
    makeTexture(this, 'enemy_ressaca', PX, RESSACA_ROWS);
    makeTexture(this, 'enemy_trote',   PX, TROTE_ROWS);

    // ── Chave ──
    makeTexture(this, 'key_sprite', PX, [
      '..YYYY..',
      '.YyyyyY.',
      '.Yy..yY.',
      '.Yy..yY.',
      '.YyyyyY.',
      '..YYYY..',
      '...YY...',
      '...YY...',
      '...YYY..',
      '...YY...',
      '...YYY..',
    ]);

    // ── Porta ──
    makeTexture(this, 'door_sprite', PX, [
      '.NNNNNNNNNN.',
      'NNNNNNNNNNNN',
      'NDDDDDDDDDDN',
      'NDddddddddDN',
      'NDd.AAAA.dDN',
      'NDd.AffA.dDN',
      'NDd.AffA.dDN',
      'NDd.AAAA.dDN',
      'NDddddddddDN',
      'NDd......dDN',
      'NDd......dDN',
      'NDd.AA...dDN',
      'NDd......dDN',
      'NDddddddddDN',
      'NDDDDDDDDDDN',
      'NDDDDDDDDDDN',
      'NNNNNNNNNNNN',
      '.NNNNNNNNNN.',
    ]);

    // ── Tiles ──
    makeTexture(this, 'floor_tile', 2, [
      'kkkkkkkkkkkkkkkk',
      'llllllllllllllll',
      'lLLlLLLlLLlLLLll',
      'lLLlLLLlLLlLLLll',
      'llllllllllllllll',
      'lnLLnLLLnLLnLLnl',
      'lnnLLLnnnLLnnnnl',
      'lnnnnnnnnnnnnnnl',
      'lnnnnnnnnnnnnnnl',
      'lnLnnLLnnLnnLLnl',
      'lnnnnnLnnnnnnnnl',
      'lnnnnnnnnnLnnnnl',
      'lnnnnnnnnnnnnnnl',
      'lnnLnnnnnnnLnnnl',
      'lnnnnnnnLnnnnnnl',
      'llllllllllllllll',
    ], { ...PAL, n: 0x4a3520 });

    makeTexture(this, 'platform_tile', 2, [
      'kkkkkkkkkkkkkkkk',
      'kLLLLLLLLLLLLLLk',
      'kLlLlLlLlLlLlLLk',
      'kLLLLLLLLLLLLLLk',
      'kLlLlLlLlLlLlLLk',
      'kLLLLLLLLLLLLLLk',
      'llllllllllllllll',
      'llllllllllllllll',
    ]);

    // ── Spikes ──
    makeTexture(this, 'spike_tile', 4, [
      '...kk...',
      '...kk...',
      '..kLLk..',
      '..kLLk..',
      '.kLLLLk.',
      '.LLLLLL.',
      'LLLLLLLL',
      'LLLLLLLL',
    ]);

    // ── Projétil ──
    makeTexture(this, 'projectile', 3, [
      '.BBB.',
      'BBBBB',
      'BBwBB',
      'BBBBB',
      '.BBB.',
    ], { ...PAL, w: 0xaed6f1 });

    // ── Estrela verde SIMÉTRICA (logo UNEMAT) — grade 15 col, centro col 7 ──
    const starPal = { X: 0x2e8b3d, x: 0x256d30 };
    makeTexture(this, 'star_green', 5, [
      '.......X.......',
      '.......X.......',
      '......XXX......',
      '......XXX......',
      'XXXXXXXXXXXXXXX',
      '.XXXXXXXXXXXXX.',
      '..XXXXXXXXXXX..',
      '...XXXXXXXXX...',
      '...XXXXXXXXX...',
      '..XXXXXXXXXXX..',
      '..XXXXX.XXXXX..',
      '.XXXX.....XXXX.',
      '.XXX.......XXX.',
      'XX.........XX..',
      'X...........X..',
    ], starPal);

    // ── Estrela dourada (HUD / vitória) ──
    makeTexture(this, 'star_gold', 3, [
      '...Y...',
      '..YYY..',
      'YYYYYYY',
      '.YYYYY.',
      '.YY.YY.',
    ]);

    // ── Corações ──
    makeTexture(this, 'heart_full', 3, [
      '.RR..RR.',
      'RRRRRRRR',
      'RRRRRRRR',
      'RRRRRRRR',
      '.RRRRRR.',
      '..RRRR..',
      '...RR...',
    ]);
    makeTexture(this, 'heart_empty', 3, [
      '.LL..LL.',
      'L..LL..L',
      'L......L',
      'L......L',
      '.L....L.',
      '..L..L..',
      '...LL...',
    ]);

    // ── Confete (partícula festiva) ──
    const cf = this.make.graphics({ x: 0, y: 0, add: false });
    cf.fillStyle(0xffffff, 1); cf.fillRect(0, 0, 6, 6);
    cf.generateTexture('confetti', 6, 6); cf.destroy();

    // ── Fundos procedurais ──
    this._makeStarBg();
    this._makeCityscape();
    this._makeLights();
  }

  _makeStarBg() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // Céu quente de início de noite (calourada)
    g.fillStyle(0x2a1840, 1); g.fillRect(0, 0, 128, 128);
    const stars = [
      [5,3],[12,7],[20,2],[30,9],[45,4],[58,1],[3,15],[18,20],
      [35,12],[50,18],[7,28],[22,32],[40,25],[55,30],[10,40],
      [28,45],[48,38],[60,42],[15,55],[38,58],[52,50],[2,52],
      [70,8],[85,3],[100,12],[115,6],[75,25],[92,30],[110,22],
      [80,45],[98,52],[120,40],[68,60],[105,58],[88,15],[122,55],
    ];
    stars.forEach(([x, y]) => {
      const bright = (x + y) % 3 === 0;
      g.fillStyle(bright ? 0xffe8b0 : 0xc9a0e0, 1);
      g.fillRect(x, y, bright ? 2 : 1, bright ? 2 : 1);
    });
    g.generateTexture('star_bg', 128, 128);
    g.destroy();
  }

  // Silhueta de prédios do campus (tileável na horizontal)
  _makeCityscape() {
    const W = 320, H = 180;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // prédios escuros
    const blds = [
      [0, 90, 46], [50, 60, 40], [95, 110, 38], [140, 50, 44],
      [190, 80, 50], [245, 40, 38], [288, 100, 32],
    ];
    blds.forEach(([x, top, w]) => {
      g.fillStyle(0x3a2150, 1);
      g.fillRect(x, top, w, H - top);
      // janelas acesas (luz quente)
      for (let wy = top + 8; wy < H - 8; wy += 16) {
        for (let wx = x + 6; wx < x + w - 6; wx += 14) {
          if ((wx + wy) % 3 !== 0) {
            g.fillStyle(0xffd27a, 1);
            g.fillRect(wx, wy, 5, 7);
          }
        }
      }
    });
    g.generateTexture('bg_city', W, H);
    g.destroy();
  }

  // Varal de luzinhas de festa (tileável na horizontal)
  _makeLights() {
    const W = 200, H = 48;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // fio em arco
    g.lineStyle(2, 0x4a3a2a, 1);
    g.beginPath();
    g.moveTo(0, 6);
    for (let x = 0; x <= W; x += 4) {
      const y = 6 + Math.sin((x / W) * Math.PI) * 16;
      g.lineTo(x, y);
    }
    g.strokePath();
    // lâmpadas coloridas penduradas
    const colors = [0xff5a5a, 0xffd24a, 0x5ad1ff, 0x6aff8a, 0xff8ad1];
    for (let i = 0, x = 16; x < W; x += 28, i++) {
      const y = 6 + Math.sin((x / W) * Math.PI) * 16;
      g.fillStyle(colors[i % colors.length], 1);
      g.fillCircle(x, y + 10, 4);
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(x - 1, y + 9, 1.5);
    }
    g.generateTexture('bg_lights', W, H);
    g.destroy();
  }
}
