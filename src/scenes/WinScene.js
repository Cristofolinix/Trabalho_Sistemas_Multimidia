export class WinScene extends Phaser.Scene {
  constructor() { super({ key: 'WinScene' }); }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e);

    // Tocha comemorativa
    this.add.image(W / 2, 100, 'unemat_torch').setScale(0.8);

    this.add.text(W / 2, 175, 'FASE 1 CONCLUÍDA!', {
      fontSize: '30px', fill: '#f1c40f', fontStyle: 'bold',
      stroke: '#8b4513', strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(W / 2, 220, 'Você coletou todas as chaves e abriu a porta!', {
      fontSize: '15px', fill: '#ecf0f1', align: 'center'
    }).setOrigin(0.5);

    this.add.text(W / 2, 275, 'Fase 2 — em desenvolvimento', {
      fontSize: '13px', fill: '#7f8c8d'
    }).setOrigin(0.5);

    // Botões
    this._btn(W / 2, 335, 'JOGAR NOVAMENTE', 0x27ae60, () => this.scene.start('MenuScene'));
    this._btn(W / 2, 385, 'MENU INICIAL',    0x2980b9, () => this.scene.start('TitleScene'));

    // Estrelas caindo
    this._spawnStars(W, H);
  }

  _btn(x, y, label, color, cb) {
    const btn = this.add.rectangle(x, y, 220, 38, color, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontSize: '14px', fill: '#fff', fontStyle: 'bold'
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(color, 1));
    btn.on('pointerout',  () => btn.setFillStyle(color, 0.9));
    btn.on('pointerdown', () => cb());
  }

  _spawnStars(W, H) {
    const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(0, W);
      const star = this.add.text(x, -20, '★', {
        fontSize: `${Phaser.Math.Between(10, 22)}px`,
        fill: colors[i % colors.length]
      }).setAlpha(0.85).setDepth(-1);

      this.tweens.add({
        targets: star,
        y: H + 30,
        x: x + Phaser.Math.Between(-50, 50),
        duration: Phaser.Math.Between(2000, 4000),
        delay: Phaser.Math.Between(0, 1800),
        repeat: -1
      });
    }
  }
}
