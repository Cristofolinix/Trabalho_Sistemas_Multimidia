import { CHARACTERS } from '../config/characters.js';
import { FONT } from '../config/theme.js';
import { audio } from '../audio/AudioManager.js';

// Seleção de personagem. ← → navega, Espaço/Enter confirma, ESC volta.
export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  init(data) {
    // Para onde ir após escolher o personagem. O fluxo normal (Título →
    // Menu) não passa nada e cai na Fase 1; o seletor de fase do Modo Dev
    // (CreditsScene) passa a fase escolhida aqui, pra sempre abrir esta
    // tela de seleção antes de entrar na fase — sem isto, o Modo Dev
    // entrava direto como Hugo, sem deixar escolher o personagem.
    this.targetScene = data?.targetScene || 'Level1Scene';
  }

  create() {
    const W = this.scale.width, H = this.scale.height;

    this.add.tileSprite(0, 0, W, H, 'star_bg').setOrigin(0, 0).setTileScale(2);
    const glow = this.add.graphics();
    glow.fillStyle(0x0d1b2a, 0.5); glow.fillRect(0, 0, W, H);

    this.add.text(W / 2, 70, 'ESCOLHA SEU PERSONAGEM', {
      fontFamily: FONT, fontSize: '22px', color: '#f1c40f'
    }).setOrigin(0.5);
    this.add.text(W / 2, 110, 'SETAS PARA NAVEGAR   -   ESPACO PARA CONFIRMAR', {
      fontFamily: FONT, fontSize: '10px', color: '#9fb3c8'
    }).setOrigin(0.5);

    this.charKeys = Object.keys(CHARACTERS);
    this.selectedIndex = 0;

    const cardW = 230, cardH = 300, gap = 24;
    const totalW = this.charKeys.length * cardW + (this.charKeys.length - 1) * gap;
    const startX = (W - totalW) / 2 + cardW / 2;

    this.cards = this.charKeys.map((key, i) => {
      const c = CHARACTERS[key];
      const x = startX + i * (cardW + gap);
      const y = H / 2 + 30;

      const bg = this.add.rectangle(x, y, cardW, cardH, 0x16213e).setStrokeStyle(3, 0x7f8c8d);
      const sprite = this.add.sprite(x + (c.menuOffsetX ?? 0), y - 70, `${key}_idle`, 0).play(`${key}-idle`);
      sprite.setOrigin(c.originX, c.originY);
      // Cada personagem vem de um sprite pack com proporção de espaço vazio
      // diferente (ver characters.js) — normaliza pela altura REAL do desenho
      // (visibleH), não pelo frame, para ficarem do mesmo porte.
      const baseScale = 84 / c.visibleH;
      sprite.setScale(baseScale);
      const nome = this.add.text(x, y + 30, c.name.toUpperCase(), {
        fontFamily: FONT, fontSize: '18px', color: '#ffffff'
      }).setOrigin(0.5);
      const hab = this.add.text(x, y + 70, c.ability, {
        fontFamily: FONT, fontSize: '9px', color: '#9fb3c8',
        align: 'center', wordWrap: { width: cardW - 24 }
      }).setOrigin(0.5, 0);
      const tecla = this.add.text(x, y + 120, '[ F ]', {
        fontFamily: FONT, fontSize: '11px', color: '#2ecc71'
      }).setOrigin(0.5);

      return { bg, sprite, nome, hab, tecla, x, y, cardH, baseScale };
    });

    this.arrow = this.add.text(0, 0, 'v', {
      fontFamily: FONT, fontSize: '18px', color: '#f1c40f'
    }).setOrigin(0.5);

    this._updateSelection();

    this.input.keyboard.on('keydown-LEFT',  () => this._move(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this._move(1));
    this.input.keyboard.on('keydown-SPACE', () => this._confirm());
    this.input.keyboard.on('keydown-ENTER', () => this._confirm());
    this.input.keyboard.on('keydown-ESC',   () => this.scene.start('TitleScene'));

    // Botão voltar
    const back = this.add.text(40, H - 40, '< VOLTAR', {
      fontFamily: FONT, fontSize: '12px', color: '#bdc3c7'
    }).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('TitleScene'));
  }

  _move(dir) {
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + dir, 0, this.charKeys.length);
    audio.sfx('select');
    this._updateSelection();
  }

  _updateSelection() {
    this.cards.forEach((card, i) => {
      const sel = i === this.selectedIndex;
      card.bg.setFillStyle(sel ? 0x1f3a5f : 0x16213e);
      card.bg.setStrokeStyle(sel ? 4 : 3, sel ? 0xf1c40f : 0x7f8c8d);
      const a = sel ? 1 : 0.45;
      card.sprite.setAlpha(a); card.nome.setAlpha(a);
      card.hab.setAlpha(a); card.tecla.setAlpha(a);
      card.sprite.setScale(sel ? card.baseScale * 1.192 : card.baseScale);
    });
    const c = this.cards[this.selectedIndex];
    this.arrow.setPosition(c.x, c.y - c.cardH / 2 - 18);
    this.tweens.killTweensOf(this.arrow);
    this.tweens.add({ targets: this.arrow, y: this.arrow.y + 6, duration: 400, yoyo: true, repeat: -1 });
  }

  _confirm() {
    const chosen = this.charKeys[this.selectedIndex];
    audio.sfx('confirm');
    this.cameras.main.flash(220, 255, 255, 255);
    this.time.delayedCall(140, () => this.scene.start(this.targetScene, { char: chosen }));
  }
}
