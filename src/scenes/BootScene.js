import { makeTexture, PAL } from '../utils/pixelArt.js';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    this._makeAllTextures();
  }

  create() {
    this.scene.start('TitleScene');
  }

  _makeAllTextures() {
    // ── Jogador (base — tintado por personagem) ─────────────────────── 8×14, px=4
    makeTexture(this, 'player_base', 4, [
      '..SSSS..',
      '.S0SS0S.',
      '.SSSSSS.',
      '..hhhh..',
      '.pppppp.',
      'pppppppp',
      '.pppppp.',
      '..pp.pp.',
      '.PP..PP.',
      '.PP..PP.',
      '..P..P..',
    ]);

    // ── Inimigo Ressaca (zumbi cansado) ─────────────────────────────── 8×12, px=4
    makeTexture(this, 'enemy_ressaca', 4, [
      '..ZZZZ..',
      '.Z0ZZ0Z.',  // olheiras roxas
      '.MZZZZM.',
      '..ZZZZ..',
      '.MMMMMM.',
      'MMMMMMMM',
      '.MMMMMM.',
      '..MM.MM.',
      '.mm..mm.',
      '.mm..mm.',
      '..m..m..',
    ]);

    // ── Inimigo Trote (calouro bagunceiro) ──────────────────────────── 8×12, px=4
    makeTexture(this, 'enemy_trote', 4, [
      '..SSSS..',
      '.S0SS0S.',
      '.SSSSSS.',
      '..hhhh..',
      '.TTTTTT.',
      'TTTTTTTT',
      '.TTTTTT.',
      '..TT.TT.',
      '.tt..tt.',
      '.tt..tt.',
      '..t..t..',
    ]);

    // ── Chave (pixel art de chave) ───────────────────────────────────── 8×12, px=3
    makeTexture(this, 'key_sprite', 3, [
      '..YYY...',
      '.YYYYY..',
      '.Y...Y..',
      '.YYYYY..',
      '..YYY...',
      '...Y....',
      '...Y....',
      '...YY...',
      '...Y....',
    ]);

    // ── Porta ───────────────────────────────────────────────────────── 10×16, px=4
    makeTexture(this, 'door_sprite', 4, [
      '.DDDDDDDD.',
      'DdddddddD.',
      'Dd..AA.dD.',
      'Dd.AAAA.D.',
      'Dd.A..A.D.',
      'Dd.AAAA.D.',
      'Dd..AA.dD.',
      'DdddddddD.',
      'Dd......D.',
      'Dd......D.',
      'Dd..00..D.',
      'Dd......D.',
      'Dd......D.',
      'DdddddddD.',
      'DDDDDDDDDD',
      'DDDDDDDDDD',
    ]);

    // ── Tile de chão ─────────────────────────────────────────────────── 16×8, px=2
    makeTexture(this, 'floor_tile', 2, [
      'llllllllllllllll',
      'lLLLLLLLLLLLLLLl',
      'lL..L....L.....l',
      'lL..L....L.....l',
      'lL..............l',
      'lL..............l',
      'lLLLLLLLLLLLLLLl',
      'llllllllllllllll',
    ]);

    // ── Tile de plataforma ────────────────────────────────────────────── 16×8, px=2
    makeTexture(this, 'platform_tile', 2, [
      'kkkkkkkkkkkkkkkk',
      'kLLLLLLLLLLLLLLk',
      'kL.L....L......k',
      'kL..............k',
      'kLLLLLLLLLLLLLLk',
      'kkkkkkkkkkkkkkkk',
    ]);

    // ── Projétil (Alex) ──────────────────────────────────────────────── 6×4, px=3
    makeTexture(this, 'projectile', 3, [
      '..BBB.',
      '.BBBBB',
      '.BBBBB',
      '..BBB.',
    ]);

    // ── Tocha UNEMAT (logo) ─────────────────────────────────────────── 14×22, px=5
    makeTexture(this, 'unemat_torch', 5, [
      '....WWWWW.....',
      '...WWWWWWW....',
      '..WwWWWWWwW...',
      '..WwWWWWWwW...',
      '.WwwWWWWWwwW..',
      '.WfffFFFFffW..',
      '..WffFFFFfW...',
      '..WfFFFFfW....',
      '...WfFFFW.....',
      '....WFFW......',
      '....NNNN......',
      '...NNNNNN.....',
      '....NNNN......',
      '....NNNN......',
      '....NNNN......',
      '...NNNNNN.....',
      '....NNNN......',
      '....NNNN......',
      '...nnnnnn.....',
      '..nnnnnnnn....',
      '..nnnnnnnn....',
      '..nnnnnnnn....',
    ]);

    // ── Fundo de estrelas (tile 64×64) ───────────────────────────────── px=1
    this._makeStarBg();

    // Compat: mantém chaves antigas para não quebrar código existente
    makeTexture(this, 'player_placeholder', 4, [
      '..SSSS..',
      '.S0SS0S.',
      '.SSSSSS.',
      '..hhhh..',
      '.pppppp.',
      'pppppppp',
      '.pppppp.',
      '..pp.pp.',
      '.PP..PP.',
      '.PP..PP.',
      '..P..P..',
    ]);
    makeTexture(this, 'enemy_placeholder', 4, [
      '..ZZZZ..',
      '.Z0ZZ0Z.',
      '.MZZZZM.',
      '..ZZZZ..',
      '.MMMMMM.',
      'MMMMMMMM',
      '.MMMMMM.',
      '..MM.MM.',
      '.mm..mm.',
      '.mm..mm.',
      '..m..m..',
    ]);
    makeTexture(this, 'key_placeholder', 3, [
      '..YYY...',
      '.YYYYY..',
      '.Y...Y..',
      '.YYYYY..',
      '..YYY...',
      '...Y....',
      '...Y....',
      '...YY...',
      '...Y....',
    ]);
    makeTexture(this, 'door_placeholder', 4, [
      '.DDDDDDDD.',
      'DdddddddD.',
      'Dd..AA.dD.',
      'Dd.AAAA.D.',
      'Dd.A..A.D.',
      'Dd.AAAA.D.',
      'Dd..AA.dD.',
      'DdddddddD.',
      'Dd......D.',
      'Dd......D.',
      'Dd..00..D.',
      'Dd......D.',
      'Dd......D.',
      'DdddddddD.',
      'DDDDDDDDDD',
      'DDDDDDDDDD',
    ]);
  }

  _makeStarBg() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x0d1b2a, 1);
    g.fillRect(0, 0, 64, 64);
    // Estrelas aleatórias mas determinísticas
    const stars = [
      [5,3],[12,7],[20,2],[30,9],[45,4],[58,1],[3,15],[18,20],
      [35,12],[50,18],[7,28],[22,32],[40,25],[55,30],[10,40],
      [28,45],[48,38],[60,42],[15,55],[38,58],[52,50],[2,52],
    ];
    stars.forEach(([x, y]) => {
      const bright = (x + y) % 3 === 0;
      g.fillStyle(bright ? 0xffffff : 0xaabbcc, 1);
      g.fillRect(x, y, bright ? 2 : 1, bright ? 2 : 1);
    });
    g.generateTexture('star_bg', 64, 64);
    g.destroy();
  }
}
