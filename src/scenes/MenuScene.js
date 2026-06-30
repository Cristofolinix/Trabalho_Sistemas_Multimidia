import { CHARACTERS } from '../config/characters.js';

// Tela de seleção de personagem.
// Navegue com as setas esquerda/direita e confirme com Espaço ou Enter.
export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // ── Fundo ────────────────────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e);

    this.add.text(W / 2, 60, 'ESCOLHA SEU PERSONAGEM', {
      fontSize: '24px',
      fill: '#f1c40f',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(W / 2, 95, 'Use ← → para navegar  |  Espaço ou Enter para confirmar', {
      fontSize: '13px',
      fill: '#bdc3c7'
    }).setOrigin(0.5);

    // ── Cards dos personagens ─────────────────────────────────────────────
    this.charKeys = Object.keys(CHARACTERS);   // ['hugo','alex','berto','weverton']
    this.selectedIndex = 0;

    const cardW = 180;
    const cardH = 240;
    const gap   = 20;
    const totalW = this.charKeys.length * cardW + (this.charKeys.length - 1) * gap;
    const startX = (W - totalW) / 2 + cardW / 2;

    this.cards = this.charKeys.map((key, i) => {
      const char = CHARACTERS[key];
      const x = startX + i * (cardW + gap);
      const y = H / 2 + 20;

      // Fundo do card
      const bg = this.add.rectangle(x, y, cardW, cardH, 0x2c3e50)
        .setStrokeStyle(2, 0x7f8c8d);

      // Retângulo colorido (placeholder do sprite)
      const avatar = this.add.rectangle(x, y - 60, 48, 64, char.color);

      // Nome
      const nome = this.add.text(x, y + 20, char.name, {
        fontSize: '18px',
        fill: '#ecf0f1',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // Habilidade — quebra em múltiplas linhas
      const hab = this.add.text(x, y + 55, char.ability, {
        fontSize: '11px',
        fill: '#95a5a6',
        wordWrap: { width: cardW - 16 },
        align: 'center'
      }).setOrigin(0.5, 0);

      return { bg, avatar, nome, hab, x, y, cardW, cardH };
    });

    // ── Seta indicadora ───────────────────────────────────────────────────
    this.arrow = this.add.text(0, 0, '▼', {
      fontSize: '20px', fill: '#f1c40f'
    }).setOrigin(0.5);

    this._updateSelection();

    // ── Teclado ───────────────────────────────────────────────────────────
    this.input.keyboard.on('keydown-LEFT',  () => this._move(-1));
    this.input.keyboard.on('keydown-RIGHT', () => this._move(1));
    this.input.keyboard.on('keydown-SPACE', () => this._confirm());
    this.input.keyboard.on('keydown-ENTER', () => this._confirm());
  }

  _move(dir) {
    this.selectedIndex = Phaser.Math.Wrap(
      this.selectedIndex + dir, 0, this.charKeys.length
    );
    this._updateSelection();
  }

  _updateSelection() {
    // Destaca o card selecionado e esmaece os outros
    this.cards.forEach((card, i) => {
      const selected = i === this.selectedIndex;
      card.bg.setFillStyle(selected ? 0x34495e : 0x2c3e50);
      card.bg.setStrokeStyle(selected ? 3 : 2, selected ? 0xf1c40f : 0x7f8c8d);
      card.avatar.setAlpha(selected ? 1 : 0.4);
      card.nome.setAlpha(selected ? 1 : 0.5);
      card.hab.setAlpha(selected ? 1 : 0.4);
    });

    // Posiciona a seta acima do card selecionado
    const c = this.cards[this.selectedIndex];
    this.arrow.setPosition(c.x, c.y - c.cardH / 2 - 20);

    // Animação de pulso na seta
    this.tweens.killTweensOf(this.arrow);
    this.tweens.add({
      targets: this.arrow,
      y: this.arrow.y + 6,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  _confirm() {
    const chosenKey = this.charKeys[this.selectedIndex];

    // Flash no card antes de trocar de cena
    this.cameras.main.flash(300, 255, 255, 255, false, () => {
      this.scene.start('Level1Scene', { char: chosenKey });
    });
  }
}
