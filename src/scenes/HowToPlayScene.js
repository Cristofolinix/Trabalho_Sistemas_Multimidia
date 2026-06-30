export class HowToPlayScene extends Phaser.Scene {
  constructor() { super({ key: 'HowToPlayScene' }); }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Fundo
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1b2a);
    const line = this.add.graphics();
    line.lineStyle(2, 0xf1c40f, 0.6);
    line.lineBetween(40, 60, W - 40, 60);

    // Título
    this.add.text(W / 2, 32, 'COMO JOGAR', {
      fontSize: '26px', fill: '#f1c40f', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Seções
    const sections = [
      {
        title: '🕹  CONTROLES',
        items: [
          '← → ou A D         Mover',
          '↑ ou W ou Espaço   Pular',
          'F                   Usar habilidade especial',
        ]
      },
      {
        title: '🎯  OBJETIVO',
        items: [
          'Colete as 3 CHAVES espalhadas pela fase.',
          'Evite ou destrua os inimigos.',
          'Leve as chaves até a PORTA para avançar.',
        ]
      },
      {
        title: '⚔  PERSONAGENS',
        items: [
          'Hugo      — Soco corpo a corpo (F)',
          'Alex      — Projétil à distância (F)',
          'Berto     — Onda de área (F)',
          'Weverton  — Dash de velocidade (F)',
        ]
      },
      {
        title: '❤  VIDA',
        items: [
          'Você começa com 3 corações.',
          'Encostar em inimigos tira 1 coração.',
          'Cair nos buracos também tira 1 coração.',
          'Ao perder tudo, a fase reinicia.',
        ]
      },
    ];

    let yOff = 85;
    sections.forEach(sec => {
      this.add.text(60, yOff, sec.title, {
        fontSize: '14px', fill: '#3498db', fontStyle: 'bold'
      });
      yOff += 22;
      sec.items.forEach(item => {
        this.add.text(80, yOff, item, { fontSize: '12px', fill: '#ecf0f1' });
        yOff += 18;
      });
      yOff += 8;
    });

    // Botão voltar
    this._makeBackButton(W / 2, H - 40);
  }

  _makeBackButton(x, y) {
    const btn = this.add.rectangle(x, y, 160, 36, 0x7f8c8d, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, '◀  VOLTAR', {
      fontSize: '14px', fill: '#fff', fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.on('pointerover',  () => btn.setFillStyle(0x95a5a6, 1));
    btn.on('pointerout',   () => btn.setFillStyle(0x7f8c8d, 0.9));
    btn.on('pointerdown',  () => this.scene.start('TitleScene'));
  }
}
