import { FONT } from '../config/theme.js';

export class HowToPlayScene extends Phaser.Scene {
  constructor() { super({ key: 'HowToPlayScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1b2a);

    this.add.text(W / 2, 44, 'COMO JOGAR', {
      fontFamily: FONT, fontSize: '26px', color: '#f1c40f'
    }).setOrigin(0.5);

    const sections = [
      { title: 'CONTROLES', color: '#3498db', items: [
        'SETAS ou A/D ......... mover',
        'SETA CIMA / W / ESPACO  pular',
        'F .................... habilidade especial',
        'ESC .................. pausar / sair',
      ]},
      { title: 'OBJETIVO', color: '#2ecc71', items: [
        'Colete as 3 CHAVES escondidas pela fase.',
        'Suba pelas plataformas - elas escondem as chaves.',
        'Leve as 3 chaves ate a PORTA para vencer.',
      ]},
      { title: 'PERIGOS', color: '#e74c3c', items: [
        'Inimigos: encostar tira 1 coracao.',
        'Espinhos e buracos: tiram 1 coracao.',
        'Voce volta ao ultimo ponto seguro ao cair.',
        'Sem coracoes, a fase reinicia.',
      ]},
      { title: 'PERSONAGENS', color: '#f39c12', items: [
        'Hugo: soco | Alex: tiro',
        'Berto: onda | Weverton: dash',
      ]},
    ];

    let y = 100;
    sections.forEach(sec => {
      this.add.text(120, y, sec.title, { fontFamily: FONT, fontSize: '14px', color: sec.color });
      y += 30;
      sec.items.forEach(it => {
        this.add.text(150, y, it, { fontFamily: FONT, fontSize: '11px', color: '#ecf0f1' });
        y += 24;
      });
      y += 14;
    });

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
