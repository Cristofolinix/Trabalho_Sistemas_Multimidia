import { FONT } from '../config/theme.js';
import { audio } from '../audio/AudioManager.js';

// Tela de Game Over — aparece quando o jogador perde todas as vidas.
// Mostra antes de qualquer reinício automático, com uma música triste.
export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data) {
    this.char = data?.char;
    // Fase em que o jogador perdeu as vidas — cada Level*Scene informa a
    // própria chave ao chamar esta tela (ver _onPlayerDied). Sem isto,
    // "Tentar Novamente" sempre mandava de volta pra Fase 1, mesmo quem
    // morreu na Fase 2.
    this.phase = data?.phase || 'Level1Scene';
  }

  create() {
    const W = this.scale.width, H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x120a1a);

    this.add.text(W / 2, H / 2 - 90, 'GAME OVER', {
      fontFamily: FONT, fontSize: '36px', color: '#e74c3c'
    }).setOrigin(0.5).setStroke('#3a0a0a', 6);

    this.add.text(W / 2, H / 2 - 40, 'Voce ficou sem coracoes...', {
      fontFamily: FONT, fontSize: '12px', color: '#bdc3c7'
    }).setOrigin(0.5);

    this._btn(W / 2, H / 2 + 40, 'TENTAR NOVAMENTE', 0x27ae60, () => {
      this.scene.start(this.phase, { char: this.char });
    });
    this._btn(W / 2, H / 2 + 100, 'MENU INICIAL', 0x2980b9, () => {
      this.scene.start('TitleScene');
    });

    // Jingle triste — tocado uma vez ao entrar nesta tela
    audio.gameOverJingle();
  }

  _btn(x, y, label, color, cb) {
    const btn = this.add.rectangle(x, y, 300, 46, color, 0.95)
      .setStrokeStyle(3, 0xffffff, 0.3)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontFamily: FONT, fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5);
    btn.on('pointerover', () => { btn.setScale(1.05); txt.setScale(1.05); audio.sfx('select'); });
    btn.on('pointerout',  () => { btn.setScale(1);    txt.setScale(1); });
    btn.on('pointerdown', () => { audio.sfx('confirm'); cb(); });
  }
}
