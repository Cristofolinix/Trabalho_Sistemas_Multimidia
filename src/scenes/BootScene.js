import { makeTexture, PAL } from '../utils/pixelArt.js';
import { CHARACTERS } from '../config/characters.js';

const STATES = ['idle', 'run', 'jump', 'fall'];

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    Object.entries(CHARACTERS).forEach(([c, cfg]) => {
      STATES.forEach(st =>
        this.load.spritesheet(`${c}_${st}`, `assets/player_${c}_${st}.png`,
          { frameWidth: cfg.frameW, frameHeight: cfg.frameH }));
    });
    this.load.spritesheet('ressaca_walk', 'assets/enemy_ressaca_walk.png',
      { frameWidth: 71, frameHeight: 138 });
    this.load.spritesheet('trote_run', 'assets/enemy_trote_run.png',
      { frameWidth: 32, frameHeight: 34 });

    this.load.spritesheet('enemy_sono',     'assets/enemy_sono.png',     { frameWidth: 246, frameHeight: 272 });
    this.load.spritesheet('enemy_trabalho', 'assets/enemy_trabalho.png', { frameWidth: 438, frameHeight: 379 });
    this.load.spritesheet('enemy_calculo',  'assets/enemy_calculo.png',  { frameWidth: 233, frameHeight: 298 });
    this.load.spritesheet('enemy_prova',    'assets/enemy_prova.png',    { frameWidth: 412, frameHeight: 430 });
    this.load.image('stone_tile', 'assets/stone_tile.png');
    this.load.image('stone_platform', 'assets/stone_platform.png');

    // grade 2×2 (450x282 por frame) — não é tira 4×1
    this.load.spritesheet('enemy_sono_acumulado', 'assets/enemy_sono_acumulado.png', { frameWidth: 450, frameHeight: 282 });
    this.load.spritesheet('enemy_tcc_mob',        'assets/enemy_tcc_mob.png',        { frameWidth: 236, frameHeight: 308 });
    this.load.spritesheet('boss_tcc',             'assets/boss_tcc.png',             { frameWidth: 495, frameHeight: 472 });
    this.load.spritesheet('boss_banca',           'assets/boss_banca.png',           { frameWidth: 504, frameHeight: 454 });
    this.load.image('canudo', 'assets/canudo.png');
    this.load.image('capelo', 'assets/capelo.png');

    this._makeArtTextures();
  }

  create() {
    this._makeAnimations();

    const go = () => this.scene.start('TitleScene');
    if (document.fonts && document.fonts.load) {
      Promise.race([
        document.fonts.load('16px "Press Start 2P"').then(() => document.fonts.ready),
        new Promise(res => this.time.delayedCall(2500, res))
      ]).then(go).catch(go);
    } else { go(); }
  }

  _makeAnimations() {
    const mk = (key, sheet, rate, loop) => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key, frames: this.anims.generateFrameNumbers(sheet),
        frameRate: rate, repeat: loop ? -1 : 0
      });
    };
    Object.keys(CHARACTERS).forEach(c => {
      mk(`${c}-idle`, `${c}_idle`, 6, true);
      mk(`${c}-run`,  `${c}_run`,  18, true);
      mk(`${c}-jump`, `${c}_jump`,  1, false);
      mk(`${c}-fall`, `${c}_fall`,  1, false);
    });
    mk('ressaca-walk', 'ressaca_walk', 5,  true);
    mk('trote-run',    'trote_run',    18, true);

    mk('sono-float', 'enemy_sono', 6, true);
    mk('trabalho-run', 'enemy_trabalho', 8, true);
    mk('calculo-float', 'enemy_calculo', 6, true);
    mk('prova-float', 'enemy_prova', 6, true);

    mk('sono-acumulado-float', 'enemy_sono_acumulado', 6, true);
    mk('tcc-mob-run',          'enemy_tcc_mob',        8, true);
    mk('boss-tcc-float',       'boss_tcc',             6, true);
    mk('boss-banca-float',     'boss_banca',           6, true);
  }

  _makeArtTextures() {
    const PX = 3;

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

    makeTexture(this, 'projectile', 3, [
      '.BBB.', 'BBBBB', 'BBwBB', 'BBBBB', '.BBB.',
    ], { ...PAL, w: 0xaed6f1 });

    makeTexture(this, 'vomit', 3, [
      '.ZZ.',
      'ZZZZ',
      'ZzzZ',
      'ZZZZ',
      '.ZZ.',
      '..Z.',
    ], { ...PAL, Z: 0x8bc34a, z: 0x558b2f });

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

    makeTexture(this, 'star_gold', 3, [
      '...Y...', '..YYY..', 'YYYYYYY', '.YYYYY.', '.YY.YY.',
    ]);

    makeTexture(this, 'heart_full', 3, [
      '.RR..RR.', 'RRRRRRRR', 'RRRRRRRR', 'RRRRRRRR', '.RRRRRR.', '..RRRR..', '...RR...',
    ]);
    makeTexture(this, 'heart_empty', 3, [
      '.LL..LL.', 'L..LL..L', 'L......L', 'L......L', '.L....L.', '..L..L..', '...LL...',
    ]);

    const cf = this.make.graphics({ x: 0, y: 0, add: false });
    cf.fillStyle(0xffffff, 1); cf.fillRect(0, 0, 6, 6);
    cf.generateTexture('confetti', 6, 6); cf.destroy();

    const sp = this.make.graphics({ x: 0, y: 0, add: false });
    sp.fillStyle(0xffffff, 1);
    sp.fillRect(3, 0, 2, 8); sp.fillRect(0, 3, 8, 2);  // formato de brilho (+)
    sp.generateTexture('spark', 8, 8); sp.destroy();

    this._makeStarBg();
    this._makeCityscape();
  }

  _makeStarBg() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
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

  _makeCityscape() {
    const W = 320, H = 180;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const blds = [
      [0, 90, 46], [50, 60, 40], [95, 110, 38], [140, 50, 44],
      [190, 80, 50], [245, 40, 38], [288, 100, 32],
    ];
    blds.forEach(([x, top, w]) => {
      g.fillStyle(0x3a2150, 1);
      g.fillRect(x, top, w, H - top);
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

}
