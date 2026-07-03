import { FONT } from '../config/theme.js';

export class AboutScene extends Phaser.Scene {
  constructor() { super({ key: 'AboutScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1b2a);

    this.add.text(W / 2, 34, 'SOBRE O JOGO', {
      fontFamily: FONT, fontSize: '22px', color: '#f1c40f'
    }).setOrigin(0.5).setDepth(10);

    const viewTop = 64, viewBottom = H - 66;
    const viewH = viewBottom - viewTop;

    this.scrollY = 0;
    this.content = this.add.container(0, viewTop);

    const maskG = this.make.graphics();
    maskG.fillStyle(0xffffff);
    maskG.fillRect(0, viewTop, W, viewH);
    this.content.setMask(maskG.createGeometryMask());

    let cy = 10;
    const lx = 60;
    const iconX = lx + 30;
    const textX = lx + 80;

    const add = obj => { this.content.add(obj); return obj; };

    const sectionTitle = (t, color) => {
      cy += 10;
      add(this.add.text(lx, cy, t, { fontFamily: FONT, fontSize: '15px', color }));
      cy += 26;
    };
    const line = (t, color = '#ecf0f1', indent = lx + 16, size = '10px') => {
      add(this.add.text(indent, cy, t, { fontFamily: FONT, fontSize: size, color }));
      cy += 18;
    };
    const divider = () => {
      cy += 6;
      add(this.add.rectangle(W / 2, cy, W - 100, 1, 0x2c3e50));
      cy += 16;
    };

    // Normaliza todos os ícones pela altura do frame para saírem com tamanho visual parecido.
    const ICON_H = 46;
    const enemy = (sheet, anim, frameH, name, nameColor, descLines) => {
      const iconScale = ICON_H / frameH;
      const rowTop = cy;
      add(this.add.sprite(iconX, rowTop + ICON_H / 2, sheet, 0).setScale(iconScale).play(anim));
      add(this.add.text(textX, rowTop, name, { fontFamily: FONT, fontSize: '11px', color: nameColor }));
      let dy = rowTop + 18;
      descLines.forEach(l => {
        add(this.add.text(textX, dy, l, { fontFamily: FONT, fontSize: '9px', color: '#bdc3c7' }));
        dy += 15;
      });
      cy = rowTop + Math.max(ICON_H + 6, 18 + descLines.length * 15 + 6);
    };

    sectionTitle('CONTROLES', '#3498db');
    line('SETAS / A D ......... mover');
    line('CIMA / W / ESPACO ... pular');
    line('F ................... habilidade especial');
    line('ESC .................. pausar');

    sectionTitle('OBJETIVO', '#2ecc71');
    line('Colete as 3 chaves de cada fase e leve');
    line('o personagem ate a porta de saida.');

    sectionTitle('PERIGOS GERAIS', '#e74c3c');
    line('Inimigos, espinhos e buracos tiram 1');
    line('coracao. Ao cair ou ser atingido, voce');
    line('volta ao ultimo ponto seguro em que pisou.');

    divider();

    sectionTitle('FASE 1 — CALOURADA', '#f39c12');
    line('A melhor fase do curso. Sobreviva', '#ecf0f1', lx);
    line('a ressaca e as galinhas que aplicam o trote pra chegar', '#ecf0f1', lx);
    line('inteiro na sua primeira aula.', '#ecf0f1', lx);
    cy += 6;

    enemy('ressaca_walk', 'ressaca-walk', 138, 'RESSACA', '#bb88dd', [
      'Zumbi lento e cambaleante.',
      'Anda devagar e cospe vomito a distancia.',
    ]);
    enemy('trote_run', 'trote-run', 34, 'TROTE', '#e8a87c', [
      'Galinha rapida e agressiva.',
      'Persegue, agarra e joga voce nos espinhos.',
    ]);

    divider();

    sectionTitle('FASE 2 — O MEIO DO CURSO', '#f39c12');
    line('O sono acumulado bate, os trabalhos em grupo', '#ecf0f1', lx);
    line('nao andam e as provas parecem nao ter fim.', '#ecf0f1', lx);
    line('Bem-vindo ao meio do curso.', '#ecf0f1', lx);
    cy += 6;

    enemy('enemy_sono', 'sono-float', 272, 'SONO', '#8899ee', [
      'Fantasma flutuante de voo erratico.',
      'Aplica lentidao profunda ao encostar.',
    ]);
    enemy('enemy_trabalho', 'trabalho-run', 379, 'TRABALHO EM GRUPO', '#e8a87c', [
      'Corre em dupla pelo chao.',
      'Persegue em alta velocidade quando alerta.',
    ]);
    enemy('enemy_calculo', 'calculo-float', 298, 'CALCULO', '#7fd8d8', [
      'Segue padroes fixos: horizontal, vertical',
      'ou circular. Nao persegue o jogador.',
    ]);
    enemy('enemy_prova', 'prova-float', 430, 'PROVA', '#e74c3c', [
      'Mini-chefe: flutua e persegue em qualquer',
      'direcao. Leva varios golpes pra cair.',
    ]);

    divider();

    sectionTitle('FASE 3 — APRESENTACAO TCC', '#f39c12');
    line('Uma tempestade escura anuncia o dia final.', '#ecf0f1', lx);
    line('Enfrente a Banca Avaliadora e o proprio TCC', '#ecf0f1', lx);
    line('pra finalmente se formar.', '#ecf0f1', lx);
    cy += 6;

    enemy('enemy_sono_acumulado', 'sono-acumulado-float', 282, 'SONO ACUMULADO', '#8899ee', [
      'Versao mais rapida e agressiva do sono.',
      'Persegue de mais longe e aplica lentidao.',
    ]);
    enemy('enemy_tcc_mob', 'tcc-mob-run', 308, 'TCC COMUM', '#f1c40f', [
      'Corre pelo chao com furia.',
      'Um dos inimigos mais velozes do jogo.',
    ]);
    enemy('boss_tcc', 'boss-tcc-float', 472, 'CHEFE: O TCC', '#e74c3c', [
      'Livro voador que cospe paginas cortantes.',
      'Mergulha por instantes — aproveite a brecha',
      'pra acertar socos e tiros.',
    ]);
    enemy('boss_banca', 'boss-banca-float', 454, 'CHEFE: BANCA AVALIADORA', '#e74c3c', [
      'Mesa de professores presa ao chao.',
      'Arremessa folhas de papel a distancia.',
    ]);

    cy += 10;
    const contentHeight = cy;
    this.maxScroll = Math.max(0, contentHeight - viewH);

    const scrollBy = delta => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + delta, 0, this.maxScroll);
      this.content.y = viewTop - this.scrollY;
      this._updateScrollbar();
    };
    this.input.on('wheel', (_p, _o, _dx, dy) => scrollBy(dy * 0.5));
    this.input.keyboard.on('keydown-DOWN', () => scrollBy(40));
    this.input.keyboard.on('keydown-UP', () => scrollBy(-40));

    if (this.maxScroll > 0) {
      const barX = W - 22;
      this.add.rectangle(barX, viewTop + viewH / 2, 6, viewH, 0x1a2634).setDepth(9);
      this.scrollThumb = this.add.rectangle(barX, viewTop, 6, 40, 0x5d8fd6).setDepth(10);
      this._updateScrollbar();

      this.add.text(W / 2, viewBottom + 20, '▼ role com a roda do mouse ou as setas ▼', {
        fontFamily: FONT, fontSize: '9px', color: '#5d6d7e'
      }).setOrigin(0.5);
    }

    const back = this.add.rectangle(W / 2, H - 26, 220, 36, 0x7f8c8d, 0.9)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(W / 2, H - 26, '< VOLTAR', { fontFamily: FONT, fontSize: '13px', color: '#fff' })
      .setOrigin(0.5).setDepth(10);
    back.on('pointerover', () => back.setFillStyle(0x95a5a6, 1));
    back.on('pointerout', () => back.setFillStyle(0x7f8c8d, 0.9));
    back.on('pointerdown', () => this.scene.start('TitleScene'));
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('TitleScene'));
  }

  _updateScrollbar() {
    if (!this.scrollThumb) return;
    const viewTop = 64, viewBottom = this.scale.height - 66;
    const viewH = viewBottom - viewTop;
    const trackH = viewH;
    const thumbH = Math.max(30, trackH * (viewH / (viewH + this.maxScroll)));
    const t = this.maxScroll > 0 ? this.scrollY / this.maxScroll : 0;
    this.scrollThumb.height = thumbH;
    this.scrollThumb.y = viewTop + thumbH / 2 + t * (trackH - thumbH);
  }
}
