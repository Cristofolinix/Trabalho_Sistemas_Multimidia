import { FONT } from '../config/theme.js';
import { audio } from '../audio/AudioManager.js';

// Menu de pausa como cena própria (sobreposta à fase, que fica pausada).
// Cena separada garante que os botões recebam cliques corretamente.
export class PauseScene extends Phaser.Scene {
  constructor() { super({ key: 'PauseScene' }); }

  init(data) {
    this.fromScene = data?.from ?? 'Level1Scene';
  }

  create() {
    const W = this.scale.width, H = this.scale.height;

    this.add.rectangle(0, 0, W, H, 0x000000, 0.72).setOrigin(0, 0);
    this.add.text(W / 2, H / 2 - 100, 'PAUSADO', {
      fontFamily: FONT, fontSize: '30px', color: '#f1c40f'
    }).setOrigin(0.5);

    this._btn(W / 2, H / 2 - 10, 'CONTINUAR',   0x27ae60, () => this._resume());
    this._btn(W / 2, H / 2 + 55, 'MENU INICIAL', 0x2980b9, () => {
      audio.sfx('confirm');
      this.scene.stop(this.fromScene);
      this.scene.stop();
      this.scene.start('TitleScene');
    });

    this.add.text(W / 2, H - 40, 'ESC PARA CONTINUAR', {
      fontFamily: FONT, fontSize: '10px', color: '#9fb3c8'
    }).setOrigin(0.5);

    this.input.keyboard.on('keydown-ESC', () => this._resume());
  }

  _resume() {
    audio.sfx('select');
    this.scene.stop();
    this.scene.resume(this.fromScene);
  }

  _btn(x, y, label, color, cb) {
    const btn = this.add.rectangle(x, y, 300, 48, color, 0.95)
      .setStrokeStyle(3, 0xffffff, 0.4)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontFamily: FONT, fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5);
    btn.on('pointerover', () => { btn.setScale(1.05); txt.setScale(1.05); audio.sfx('select'); });
    btn.on('pointerout',  () => { btn.setScale(1);    txt.setScale(1); });
    btn.on('pointerdown', cb);
  }
}
