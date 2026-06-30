import { makeTexture, PAL } from '../utils/pixelArt.js';
import { CHARACTERS } from '../config/characters.js';

// Template do corpo do jogador (14×20). 'C'/'c' = cor da camisa (varia por personagem).
const PLAYER_ROWS = [
  '.....HHHH.....',
  '....HHHHHH....',
  '...HHSSSSHH...',
  '...HSSSSSSH...',
  '...S0SSSS0S...',
  '...SSSSSSSS...',
  '...sSSSSSSs...',
  '....SSSSSS....',
  '...CCCCCCCC...',
  '..CCCCCCCCCC..',
  '..CcCCCCCCcC..',
  '..CCCCCCCCCC..',
  '...CCCCCCCC...',
  '...CcCCCCcC...',
  '...CCCCCCCC...',
  '...PPPPPPPP...',
  '...PPP..PPP...',
  '...PP....PP...',
  '...pp....pp...',
  '..KKK..KKK....',
];

// Inimigo Ressaca (zumbi cansado, encurvado) 14×18
const RESSACA_ROWS = [
  '.....ZZZZ.....',
  '....ZZZZZZ....',
  '...Z0ZZZZ0Z...',   // olheiras escuras
  '...ZZZZZZZZ...',
  '...zZZZZZZz...',
  '....ZZZZZZ....',
  '...MMMMMMMM...',
  '..MMMMMMMMMM..',
  '..MmMMMMMMmM..',
  '..MMMMMMMMMM..',
  '...MMMMMMMM...',
  '...MMMMMMMM...',
  '...MMM..MMM...',
  '...MM....MM...',
  '...mm....mm...',
  '..000..000....',
  '..............',
  '..............',
];

// Inimigo Trote (calouro com boné) 14×18
const TROTE_ROWS = [
  '...TTTTTTTT...',   // boné
  '..TtTTTTTTtT..',
  '...SSSSSSSS...',
  '...S0SSSS0S...',
  '...SSSSSSSS...',
  '....SSSSSS....',
  '...TTTTTTTT...',   // camisa laranja
  '..TTTTTTTTTT..',
  '..TtTTTTTTtT..',
  '..TTTTTTTTTT..',
  '...TTTTTTTT...',
  '...TTTTTTTT...',
  '...PPP..PPP...',
  '...PP....PP...',
  '...PP....PP...',
  '...pp....pp...',
  '..KKK..KKK....',
  '..............',
];

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    this._makeAllTextures();
  }

  create() {
    // Garante que a fonte pixelada esteja carregada antes de desenhar textos
    const go = () => this.scene.start('TitleScene');
    if (document.fonts && document.fonts.load) {
      Promise.race([
        document.fonts.load('16px "Press Start 2P"').then(() => document.fonts.ready),
        new Promise(res => this.time.delayedCall(2500, res))   // timeout de segurança
      ]).then(go).catch(go);
    } else {
      go();
    }
  }

  _makeAllTextures() {
    const PX = 3;   // tamanho de cada pixel — sprites nítidos e maiores

    // ── Jogadores: uma textura por personagem (camisa colorida embutida) ──
    Object.values(CHARACTERS).forEach(c => {
      const pal = { ...PAL, C: c.color, c: c.colorDark };
      makeTexture(this, `player_${c.key}`, PX, PLAYER_ROWS, pal);
    });

    // ── Inimigos ──────────────────────────────────────────────────────────
    makeTexture(this, 'enemy_ressaca', PX, RESSACA_ROWS);
    makeTexture(this, 'enemy_trote',   PX, TROTE_ROWS);

    // ── Chave ───────────────────────────────────────────────────────────── 8×11
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

    // ── Porta ───────────────────────────────────────────────────────────── 12×18
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

    // ── Tiles de chão e plataforma (32×32 via grid 16×16, px=2) ───────────
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

    // ── Spikes (armadilha) 8×8 ────────────────────────────────────────────
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

    // ── Projétil (Alex) ───────────────────────────────────────────────────
    makeTexture(this, 'projectile', 3, [
      '.BBB.',
      'BBBBB',
      'BBwBB',
      'BBBBB',
      '.BBB.',
    ], { ...PAL, w: 0xaed6f1 });

    // ── Estrela verde (logo UNEMAT) ───────────────────────────────────────
    const starPal = { X: 0x2e8b3d, x: 0x256d30 };
    makeTexture(this, 'star_green', 5, [
      '.......XX.......',
      '......XXXX......',
      '......XXXX......',
      '......XXXX......',
      'XXXXXXXXXXXXXXXX',
      '.XXXXXXXXXXXXXX.',
      '..XXXXXXXXXXXX..',
      '...XXXXXXXXXX...',
      '...XXXXXXXXXX...',
      '..XXXXXXXXXXXX..',
      '..XXXXX.xXXXXX..',
      '.XXXX....xXXXX..',
      '.XXx......xXXX..',
      '.Xx........xXX..',
      '.x..........x..',
    ], starPal);

    // ── Estrela amarela pequena (HUD / vitória) ───────────────────────────
    makeTexture(this, 'star_gold', 3, [
      '...YY...',
      '...YY...',
      'YYYYYYYY',
      '.YYYYYY.',
      '..YYYY..',
      '.YYYYYY.',
      '.YY..YY.',
    ]);

    // ── Coração cheio e vazio (HUD de vida) 8×7 ──────────────────────────
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

    // ── Fundo de estrelas ─────────────────────────────────────────────────
    this._makeStarBg();
  }

  _makeStarBg() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x0d1b2a, 1);
    g.fillRect(0, 0, 128, 128);
    const stars = [
      [5,3],[12,7],[20,2],[30,9],[45,4],[58,1],[3,15],[18,20],
      [35,12],[50,18],[7,28],[22,32],[40,25],[55,30],[10,40],
      [28,45],[48,38],[60,42],[15,55],[38,58],[52,50],[2,52],
      [70,8],[85,3],[100,12],[115,6],[75,25],[92,30],[110,22],
      [80,45],[98,52],[120,40],[68,60],[105,58],[88,15],[122,55],
    ];
    stars.forEach(([x, y]) => {
      const bright = (x + y) % 3 === 0;
      g.fillStyle(bright ? 0xffffff : 0x6688aa, 1);
      g.fillRect(x, y, bright ? 2 : 1, bright ? 2 : 1);
    });
    g.generateTexture('star_bg', 128, 128);
    g.destroy();
  }
}
