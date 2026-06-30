import { FONT, COLORS } from '../config/theme.js';

// Tela inicial — logo UNEMAT pixelada + título do jogo + menu.
export class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'TitleScene' }); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Fundo de estrelas com leve movimento ─────────────────────────────
    this.bg = this.add.tileSprite(0, 0, W, H, 'star_bg').setOrigin(0, 0).setTileScale(2);
    const glow = this.add.graphics();
    glow.fillGradientStyle(0x1a0533, 0x1a0533, 0x0d1b2a, 0x0d1b2a, 0.7);
    glow.fillRect(0, 0, W, H);

    // ── LOGO UNEMAT ──────────────────────────────────────────────────────
    // "UNEMAT" em azul institucional, com a estrela verde sobre as letras.
    const logoY = 150;
    const logo = this.add.text(W / 2, logoY, 'UNEMAT', {
      fontFamily: FONT, fontSize: '64px', color: COLORS.unematBlue
    }).setOrigin(0.5);
    // contorno claro para destacar do fundo escuro
    logo.setStroke('#e8eef7', 6);
    logo.setShadow(4, 4, '#000000', 0, true, true);

    // Estrela verde sobre o "M/A" (como na marca da UNEMAT)
    this.star = this.add.image(W / 2 + 78, logoY - 36, 'star_green').setScale(1.1);
    this.tweens.add({
      targets: this.star, angle: 360, duration: 9000, repeat: -1
    });

    // Subtítulo institucional
    this.add.text(W / 2, logoY + 52, 'UNIVERSIDADE DO ESTADO DE MATO GROSSO', {
      fontFamily: FONT, fontSize: '10px', color: '#9fb3c8'
    }).setOrigin(0.5);

    // Título do jogo
    this.add.text(W / 2, logoY + 110, 'S T O R I E S', {
      fontFamily: FONT, fontSize: '34px', color: COLORS.gold
    }).setOrigin(0.5).setStroke('#7a4f00', 5);

    // ── Botões ───────────────────────────────────────────────────────────
    this._button(W / 2, 400, 'INICIAR',     0x27ae60, () => this.scene.start('MenuScene'));
    this._button(W / 2, 466, 'COMO JOGAR',  0x2980b9, () => this.scene.start('HowToPlayScene'));
    this._button(W / 2, 532, 'CREDITOS',    0x8e44ad, () => this.scene.start('CreditsScene'));

    // Rodapé
    this.add.text(W / 2, H - 22, 'TRABALHO DE SISTEMAS MULTIMIDIA  -  v0.2', {
      fontFamily: FONT, fontSize: '9px', color: '#5d6d7e'
    }).setOrigin(0.5);
  }

  update() {
    this.bg.tilePositionX += 0.25;
  }

  _button(x, y, label, color, cb) {
    const btn = this.add.rectangle(x, y, 320, 50, color, 0.9)
      .setStrokeStyle(3, 0xffffff, 0.35)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontFamily: FONT, fontSize: '16px', color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.setFillStyle(color, 1);
      this.tweens.add({ targets: [btn, txt], scaleX: 1.06, scaleY: 1.06, duration: 80 });
    });
    btn.on('pointerout', () => {
      btn.setFillStyle(color, 0.9);
      this.tweens.add({ targets: [btn, txt], scaleX: 1, scaleY: 1, duration: 80 });
    });
    btn.on('pointerdown', () => {
      this.cameras.main.flash(180, 255, 255, 255);
      this.time.delayedCall(120, cb);
    });
  }
}
