export class CreditsScene extends Phaser.Scene {
  constructor() { super({ key: 'CreditsScene' }); }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1b2a);

    // Linha decorativa
    const g = this.add.graphics();
    g.lineStyle(2, 0xf1c40f, 0.6);
    g.lineBetween(40, 60, W - 40, 60);
    g.lineBetween(40, H - 60, W - 40, H - 60);

    this.add.text(W / 2, 32, 'CRÉDITOS', {
      fontSize: '26px', fill: '#f1c40f', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Personagens / equipe
    const chars = [
      { name: 'Hugo',     color: '#e74c3c', role: 'Personagem — corpo a corpo' },
      { name: 'Alex',     color: '#3498db', role: 'Personagem — projétil' },
      { name: 'Berto',    color: '#2ecc71', role: 'Personagem — área' },
      { name: 'Weverton', color: '#f39c12', role: 'Personagem — mobilidade' },
    ];

    this.add.text(W / 2, 80, 'EQUIPE', {
      fontSize: '14px', fill: '#3498db', fontStyle: 'bold'
    }).setOrigin(0.5);

    chars.forEach((c, i) => {
      const y = 110 + i * 42;
      // Card
      this.add.rectangle(W / 2, y, 340, 36, 0x1a252f);
      // Bloco de cor (avatar placeholder)
      this.add.rectangle(W / 2 - 145, y, 20, 28, parseInt(c.color.replace('#', '0x')));
      this.add.text(W / 2 - 128, y, c.name, {
        fontSize: '15px', fill: c.color, fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      this.add.text(W / 2 + 20, y, c.role, {
        fontSize: '11px', fill: '#bdc3c7'
      }).setOrigin(0, 0.5);
    });

    // Inimigos
    this.add.text(W / 2, 295, 'INIMIGOS', {
      fontSize: '14px', fill: '#9b59b6', fontStyle: 'bold'
    }).setOrigin(0.5);

    const enemies = [
      { name: 'Ressaca',    desc: 'Fase 1 — zumbi lento, cambaleante' },
      { name: 'Trote',      desc: 'Fase 1 — calouro em bando' },
    ];
    enemies.forEach((e, i) => {
      const y = 320 + i * 30;
      this.add.text(W / 2, y, `${e.name}  —  ${e.desc}`, {
        fontSize: '12px', fill: '#ecf0f1'
      }).setOrigin(0.5);
    });

    // Tecnologias
    this.add.text(W / 2, 400, 'TECNOLOGIA', {
      fontSize: '13px', fill: '#2ecc71', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(W / 2, 422, 'Phaser 3.90  •  Vite  •  JavaScript', {
      fontSize: '12px', fill: '#95a5a6'
    }).setOrigin(0.5);

    this.add.text(W / 2, 452, 'Disciplina: Sistemas Multimídia', {
      fontSize: '11px', fill: '#5d6d7e'
    }).setOrigin(0.5);

    // Botão voltar
    const btn = this.add.rectangle(W / 2, H - 32, 160, 36, 0x7f8c8d, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H - 32, '◀  VOLTAR', {
      fontSize: '14px', fill: '#fff', fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(0x95a5a6, 1));
    btn.on('pointerout',  () => btn.setFillStyle(0x7f8c8d, 0.9));
    btn.on('pointerdown', () => this.scene.start('TitleScene'));
  }
}
