import { CHARACTERS } from '../config/characters.js';
import { FONT } from '../config/theme.js';

export class CreditsScene extends Phaser.Scene {
  constructor() { super({ key: 'CreditsScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1b2a);

    this.add.text(W / 2, 44, 'CREDITOS', {
      fontFamily: FONT, fontSize: '26px', color: '#f1c40f'
    }).setOrigin(0.5);

    // Personagens com sprite real
    this.add.text(W / 2, 120, 'PERSONAGENS', {
      fontFamily: FONT, fontSize: '16px', color: '#3498db'
    }).setOrigin(0.5);

    const keys = Object.keys(CHARACTERS);
    const startX = W / 2 - (keys.length - 1) * 150 / 2;
    keys.forEach((k, i) => {
      const c = CHARACTERS[k];
      const x = startX + i * 150;
      this.add.sprite(x, 205, `${k}_idle`, 0).setScale(2.6).play(`${k}-idle`);
      this.add.text(x, 275, c.name.toUpperCase(), {
        fontFamily: FONT, fontSize: '12px',
        color: '#' + c.color.toString(16).padStart(6, '0')
      }).setOrigin(0.5);
    });

    // Tecnologia
    this.add.text(W / 2, 370, 'FEITO COM', { fontFamily: FONT, fontSize: '14px', color: '#2ecc71' }).setOrigin(0.5);
    this.add.text(W / 2, 405, 'PHASER 3.90  -  VITE  -  JAVASCRIPT', {
      fontFamily: FONT, fontSize: '12px', color: '#9fb3c8'
    }).setOrigin(0.5);
    this.add.text(W / 2, 450, 'DISCIPLINA: SISTEMAS MULTIMIDIA', {
      fontFamily: FONT, fontSize: '11px', color: '#5d6d7e'
    }).setOrigin(0.5);

    this.add.text(W / 2, 490, 'ARTE: PIXEL ADVENTURE - PIXEL FROG (CC0)', {
      fontFamily: FONT, fontSize: '9px', color: '#5d6d7e'
    }).setOrigin(0.5);

    const back = this.add.rectangle(W / 2, H - 44, 220, 44, 0x7f8c8d, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H - 44, '< VOLTAR', {
      fontFamily: FONT, fontSize: '14px', color: '#fff'
    }).setOrigin(0.5);
    back.on('pointerover', () => back.setFillStyle(0x95a5a6, 1));
    back.on('pointerout',  () => back.setFillStyle(0x7f8c8d, 0.9));
    back.on('pointerdown', () => this.scene.start('TitleScene'));
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('TitleScene'));
  }
}
