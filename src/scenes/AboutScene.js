import { FONT } from '../config/theme.js';

// Tela "Sobre" — unifica COMO JOGAR e os INIMIGOS.
export class AboutScene extends Phaser.Scene {
  constructor() { super({ key: 'AboutScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1b2a);

    this.add.text(W / 2, 40, 'SOBRE O JOGO', {
      fontFamily: FONT, fontSize: '24px', color: '#f1c40f'
    }).setOrigin(0.5);

    // Linha divisória vertical
    const g = this.add.graphics();
    g.lineStyle(2, 0x2c3e50, 1);
    g.lineBetween(W / 2, 80, W / 2, H - 80);

    // ───────── COLUNA ESQUERDA: COMO JOGAR ─────────
    const lx = 70;
    let y = 95;
    const head = (t, c, col = lx) => {
      this.add.text(col, y, t, { fontFamily: FONT, fontSize: '14px', color: c }); y += 28;
    };
    const line = (t, col = lx + 16) => {
      this.add.text(col, y, t, { fontFamily: FONT, fontSize: '10px', color: '#ecf0f1' }); y += 21;
    };

    head('CONTROLES', '#3498db');
    line('SETAS / A D ......... mover');
    line('CIMA / W / ESPACO ... pular');
    line('F ................... habilidade');
    line('ESC ................. pausar');
    y += 8;

    head('OBJETIVO', '#2ecc71');
    line('Colete as 3 CHAVES da fase.');
    line('Suba pelas plataformas para');
    line('alcanca-las e leve ate a PORTA.');
    y += 8;

    head('PERIGOS', '#e74c3c');
    line('Inimigos, espinhos e buracos');
    line('tiram 1 coracao. Ao cair, volta');
    line('ao ultimo ponto seguro.');

    // ───────── COLUNA DIREITA: INIMIGOS + TEMA ─────────
    const rx = W / 2 + 60;
    y = 95;
    this.add.text(rx, y, 'INIMIGOS', { fontFamily: FONT, fontSize: '14px', color: '#9b59b6' });
    y += 40;

    // Ressaca
    this.add.sprite(rx + 20, y + 14, 'ressaca_walk', 0).setScale(2).play('ressaca-walk');
    this.add.text(rx + 60, y - 4, 'RESSACA', { fontFamily: FONT, fontSize: '12px', color: '#bb88dd' });
    this.add.text(rx + 60, y + 18, 'Lento e cambaleante.', { fontFamily: FONT, fontSize: '9px', color: '#bdc3c7' });
    this.add.text(rx + 60, y + 36, 'Anda devagar pelo chao.', { fontFamily: FONT, fontSize: '9px', color: '#bdc3c7' });
    y += 90;

    // Trote
    this.add.sprite(rx + 20, y + 10, 'trote_run', 0).setScale(1.8).play('trote-run');
    this.add.text(rx + 60, y - 4, 'TROTE', { fontFamily: FONT, fontSize: '12px', color: '#e8a87c' });
    this.add.text(rx + 60, y + 18, 'Rapido e agitado.', { fontFamily: FONT, fontSize: '9px', color: '#bdc3c7' });
    this.add.text(rx + 60, y + 36, 'Persegue em alta velocidade.', { fontFamily: FONT, fontSize: '9px', color: '#bdc3c7' });
    y += 100;

    this.add.text(rx, y, 'A AVENTURA', { fontFamily: FONT, fontSize: '14px', color: '#f39c12' });
    y += 28;
    this.add.text(rx, y, 'Sua jornada na universidade', { fontFamily: FONT, fontSize: '9px', color: '#ecf0f1' }); y += 20;
    this.add.text(rx, y, 'comeca na maior festa do ano.', { fontFamily: FONT, fontSize: '9px', color: '#ecf0f1' }); y += 20;
    this.add.text(rx, y, 'Encare os perrengues do campus', { fontFamily: FONT, fontSize: '9px', color: '#ecf0f1' }); y += 20;
    this.add.text(rx, y, 'e siga em frente, calouro!', { fontFamily: FONT, fontSize: '9px', color: '#ecf0f1' });

    // Botão voltar
    const back = this.add.rectangle(W / 2, H - 42, 220, 44, 0x7f8c8d, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H - 42, '< VOLTAR', { fontFamily: FONT, fontSize: '14px', color: '#fff' }).setOrigin(0.5);
    back.on('pointerover', () => back.setFillStyle(0x95a5a6, 1));
    back.on('pointerout',  () => back.setFillStyle(0x7f8c8d, 0.9));
    back.on('pointerdown', () => this.scene.start('TitleScene'));
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('TitleScene'));
  }
}
