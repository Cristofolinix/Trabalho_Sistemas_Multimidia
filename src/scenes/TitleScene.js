// Tela inicial do jogo Unemat Stories.
// Botões: Iniciar → MenuScene | Como Jogar → HowToPlayScene | Créditos → CreditsScene
export class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'TitleScene' }); }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // ── Fundo com estrelas em paralaxe ────────────────────────────────
    this.bg = this.add.tileSprite(0, 0, W, H, 'star_bg')
      .setOrigin(0, 0)
      .setTileScale(2);

    // Névoa colorida (atmosfera de calourada)
    const glow = this.add.graphics();
    glow.fillGradientStyle(0x1a0533, 0x1a0533, 0x0d1b2a, 0x0d1b2a, 1);
    glow.fillRect(0, 0, W, H);
    glow.setAlpha(0.6);

    // ── Logo UNEMAT (tocha pixel art) ─────────────────────────────────
    const torchY = 105;
    this.torch = this.add.image(W / 2, torchY, 'unemat_torch')
      .setOrigin(0.5, 0.5);

    // Halo de brilho atrás da tocha
    const halo = this.add.graphics();
    halo.fillStyle(0xff9900, 0.15);
    halo.fillCircle(W / 2, torchY, 70);

    // Animação de pulso na tocha (simula chama)
    this.tweens.add({
      targets: this.torch,
      scaleX: 1.04, scaleY: 0.97,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ── Título "UNEMAT STORIES" ────────────────────────────────────────
    this.add.text(W / 2, 205, 'UNEMAT', {
      fontSize: '42px',
      fill: '#f1c40f',
      fontStyle: 'bold',
      stroke: '#8b4513',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 0, fill: true }
    }).setOrigin(0.5);

    this.add.text(W / 2, 248, 'STORIES', {
      fontSize: '28px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#2c3e50',
      strokeThickness: 4,
      letterSpacing: 8
    }).setOrigin(0.5);

    // Linha decorativa
    const line = this.add.graphics();
    line.lineStyle(2, 0xf1c40f, 0.8);
    line.lineBetween(W / 2 - 140, 278, W / 2 + 140, 278);

    // ── Botões ─────────────────────────────────────────────────────────
    this._makeButton(W / 2, 320, '▶  INICIAR',     0x27ae60, () => this._startGame());
    this._makeButton(W / 2, 375, '?  COMO JOGAR',  0x2980b9, () => this.scene.start('HowToPlayScene'));
    this._makeButton(W / 2, 430, '★  CRÉDITOS',    0x8e44ad, () => this.scene.start('CreditsScene'));

    // ── Versão / rodapé ───────────────────────────────────────────────
    this.add.text(W / 2, H - 16, 'Trabalho de Sistemas Multimídia  •  v0.1', {
      fontSize: '10px', fill: '#5d6d7e'
    }).setOrigin(0.5, 1);

    // ── Scroll de fundo ───────────────────────────────────────────────
    this.time.addEvent({
      delay: 16,
      callback: () => { this.bg.tilePositionX += 0.3; },
      loop: true
    });
  }

  _makeButton(x, y, label, color, callback) {
    const btn = this.add.rectangle(x, y, 220, 40, color, 0.85)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0xffffff, 0.3);

    const txt = this.add.text(x, y, label, {
      fontSize: '16px', fill: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Hover
    btn.on('pointerover', () => {
      btn.setFillStyle(color, 1);
      this.tweens.add({ targets: [btn, txt], scaleX: 1.06, scaleY: 1.06, duration: 80 });
    });
    btn.on('pointerout', () => {
      btn.setFillStyle(color, 0.85);
      this.tweens.add({ targets: [btn, txt], scaleX: 1, scaleY: 1, duration: 80 });
    });
    btn.on('pointerdown', () => {
      this.cameras.main.flash(200, 255, 255, 255, false, () => callback());
    });

    return btn;
  }

  _startGame() {
    this.scene.start('MenuScene');
  }
}
