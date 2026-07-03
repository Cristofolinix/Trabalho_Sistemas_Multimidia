import { FONT } from '../config/theme.js';
import { audio } from '../audio/AudioManager.js';
import { CHARACTERS, DEFAULT_CHARACTER } from '../config/characters.js';

export class WinScene extends Phaser.Scene {
  constructor() { super({ key: 'WinScene' }); }

  init(data) {
    this.selectedChar = data?.char ?? DEFAULT_CHARACTER;
    this.graduated = data?.graduated ?? false;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    
    // Fundo festivo: azul marinho se formou, roxo escuro se passou da fase 2
    const bgCol = this.graduated ? 0x0c2461 : 0x1a1a2e;
    this.add.rectangle(W / 2, H / 2, W, H, bgCol);
    audio.sfx('win');

    if (this.graduated) {
      // ── MODO PARABÉNS GRADUAÇÃO ──────────────────────────────────────────
      // Estrela verde comemorativa de fundo
      const star = this.add.image(W / 2, 160, 'star_green').setScale(2.5).setAlpha(0.65);
      this.tweens.add({ targets: star, angle: 360, duration: 8000, repeat: -1 });

      // Player comemorando
      const cfg = CHARACTERS[this.selectedChar];
      const playerSprite = this.add.sprite(W / 2, 210, `${this.selectedChar}_idle`, 0)
        .setOrigin(cfg.originX, cfg.originY)
        .setScale(120 / cfg.visibleH); // tamanho destacado na tela
      playerSprite.play(`${this.selectedChar}-idle`);

      // Capelo na cabeça (ou pairando logo acima)
      const capelo = this.add.image(W / 2, 85, 'capelo').setScale(0.12);
      this.tweens.add({
        targets: capelo, y: 75, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });

      // Canudo flutuando ao lado
      const canudo = this.add.image(W / 2 + 100, 160, 'canudo').setScale(0.08);
      this.tweens.add({
        targets: canudo, y: 150, angle: 10, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });

      this.add.text(W / 2, 300, 'VOCE SE FORMOU!', {
        fontFamily: FONT, fontSize: '32px', color: '#f1c40f'
      }).setOrigin(0.5).setStroke('#7a4f00', 5);

      this.add.text(W / 2, 360, 'TCC Apresentado e Banca Aprovada com Sucesso!', {
        fontFamily: FONT, fontSize: '12px', color: '#ecf0f1', align: 'center'
      }).setOrigin(0.5);

      this._btn(W / 2, 450, 'JOGAR NOVAMENTE', 0x27ae60, () => this.scene.start('MenuScene'));
      this._btn(W / 2, 516, 'MENU INICIAL',    0x2980b9, () => this.scene.start('TitleScene'));
    } else {
      // ── MODO FASE 2 CONCLUÍDA ─────────────────────────────────────────────
      const star = this.add.image(W / 2, 130, 'star_green').setScale(2.2);
      this.tweens.add({ targets: star, angle: 360, duration: 6000, repeat: -1 });

      this.add.text(W / 2, 240, 'FASE 2 CONCLUIDA!', {
        fontFamily: FONT, fontSize: '26px', color: '#f1c40f'
      }).setOrigin(0.5).setStroke('#7a4f00', 5);

      this.add.text(W / 2, 295, 'Voce coletou todas as chaves e escapou do Meiao!', {
        fontFamily: FONT, fontSize: '11px', color: '#ecf0f1', align: 'center'
      }).setOrigin(0.5);

      this.add.text(W / 2, 345, 'PREPARE-SE PARA A APRESENTACAO DO TCC', {
        fontFamily: FONT, fontSize: '10px', color: '#e74c3c'
      }).setOrigin(0.5);

      this._btn(W / 2, 420, 'INICIAR FASE 3', 0xd35400, () => {
        this.scene.start('Level3Scene', { char: this.selectedChar });
      });
      this._btn(W / 2, 486, 'MENU INICIAL',  0x2980b9, () => this.scene.start('TitleScene'));
    }

    this._spawnStars(W, H);
  }

  _btn(x, y, label, color, cb) {
    const btn = this.add.rectangle(x, y, 340, 48, color, 0.9)
      .setStrokeStyle(3, 0xffffff, 0.35).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: FONT, fontSize: '14px', color: '#fff' }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(color, 1));
    btn.on('pointerout',  () => btn.setFillStyle(color, 0.9));
    btn.on('pointerdown', cb);
  }

  _spawnStars(W, H) {
    for (let i = 0; i < 22; i++) {
      const x = Phaser.Math.Between(0, W);
      const s = this.add.image(x, -20, 'star_gold').setScale(Phaser.Math.FloatBetween(0.6, 1.4)).setDepth(-1);
      this.tweens.add({
        targets: s, y: H + 30, x: x + Phaser.Math.Between(-60, 60), angle: 360,
        duration: Phaser.Math.Between(2200, 4200), delay: Phaser.Math.Between(0, 2000), repeat: -1
      });
    }
  }
}
