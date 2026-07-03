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
      const sprite = this.add.sprite(x + (c.menuOffsetX ?? 0), 205, `${k}_idle`, 0).play(`${k}-idle`);
      sprite.setOrigin(c.originX, c.originY);
      sprite.setScale(84 / c.visibleH);   // normaliza porte entre packs (altura real do desenho)
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

    this.add.text(W / 2, 490, 'PERSONAGENS: GRAFXKID SPRITE PACKS (CC0, ITCH.IO)', {
      fontFamily: FONT, fontSize: '9px', color: '#5d6d7e'
    }).setOrigin(0.5);
    this.add.text(W / 2, 510, 'INIMIGOS: 2D ZOMBIES SPRITESHEET (CC0, OPENGAMEART)', {
      fontFamily: FONT, fontSize: '9px', color: '#5d6d7e'
    }).setOrigin(0.5);

    // ── SELETOR DE FASE (para testes) ──────────────────────────────────────
    this.add.text(W / 2, 556, '[ MODO DEV ] TESTAR FASE:', {
      fontFamily: FONT, fontSize: '9px', color: '#e67e22'
    }).setOrigin(0.5);

    const phases = [
      { label: 'FASE 1', scene: 'Level1Scene' },
      { label: 'FASE 2', scene: 'Level2Scene' },
      { label: 'FASE 3', scene: 'Level3Scene' },
    ];
    phases.forEach((ph, i) => {
      const bx = W / 2 + (i - (phases.length - 1) / 2) * 160;
      const btn = this.add.rectangle(bx, 588, 140, 34, 0x1a3a5c, 1)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0xe67e22);
      this.add.text(bx, 588, ph.label, {
        fontFamily: FONT, fontSize: '12px', color: '#e67e22'
      }).setOrigin(0.5);
      btn.on('pointerover',  () => btn.setFillStyle(0x2a5a8c, 1));
      btn.on('pointerout',   () => btn.setFillStyle(0x1a3a5c, 1));
      btn.on('pointerdown',  () => this.scene.start('MenuScene', { targetScene: ph.scene }));
    });

    const back = this.add.rectangle(W / 2, H - 30, 220, 36, 0x7f8c8d, 0.9)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H - 30, '< VOLTAR', {
      fontFamily: FONT, fontSize: '14px', color: '#fff'
    }).setOrigin(0.5);
    back.on('pointerover', () => back.setFillStyle(0x95a5a6, 1));
    back.on('pointerout',  () => back.setFillStyle(0x7f8c8d, 0.9));
    back.on('pointerdown', () => this.scene.start('TitleScene'));
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('TitleScene'));
  }
}
