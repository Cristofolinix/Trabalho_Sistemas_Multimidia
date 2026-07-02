import { FONT } from '../config/theme.js';
import { audio } from '../audio/AudioManager.js';

export class WinScene extends Phaser.Scene {
  constructor() { super({ key: 'WinScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e);
    audio.sfx('win');

    // Estrela verde comemorativa
    const star = this.add.image(W / 2, 130, 'star_green').setScale(2.2);
    this.tweens.add({ targets: star, angle: 360, duration: 6000, repeat: -1 });

    this.add.text(W / 2, 240, 'FASE 2 CONCLUIDA!', {
      fontFamily: FONT, fontSize: '28px', color: '#f1c40f'
    }).setOrigin(0.5).setStroke('#7a4f00', 5);

    this.add.text(W / 2, 295, 'Voce coletou todas as chaves\ne abriu a porta!', {
      fontFamily: FONT, fontSize: '12px', color: '#ecf0f1', align: 'center', lineSpacing: 8
    }).setOrigin(0.5);

    this.add.text(W / 2, 360, 'FASE 3 EM DESENVOLVIMENTO', {
      fontFamily: FONT, fontSize: '10px', color: '#7f8c8d'
    }).setOrigin(0.5);

    this._btn(W / 2, 430, 'JOGAR NOVAMENTE', 0x27ae60, () => this.scene.start('MenuScene'));
    this._btn(W / 2, 496, 'MENU INICIAL',    0x2980b9, () => this.scene.start('TitleScene'));

    this._spawnStars(W, H);
  }

  _btn(x, y, label, color, cb) {
    const btn = this.add.rectangle(x, y, 320, 48, color, 0.9)
      .setStrokeStyle(3, 0xffffff, 0.35).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: FONT, fontSize: '14px', color: '#fff' }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(color, 1));
    btn.on('pointerout',  () => btn.setFillStyle(color, 0.9));
    btn.on('pointerdown', cb);
  }

  _spawnStars(W, H) {
    for (let i = 0; i < 22; i++) {
      const x = Phaser.Math.Between(0, W);
      const s = this.add.image(x, -20, 'star_gold').setScale(Phaser.Math.FloatBetween(0.6, 1.4)).setDepth(-1);
      this.tweens.add({
        targets: s, y: H + 30, x: x + Phaser.Math.Between(-60, 60), angle: 360,
        duration: Phaser.Math.Between(2200, 4200), delay: Phaser.Math.Between(0, 2000), repeat: -1
      });
    }
  }
}
