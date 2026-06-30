import { FONT } from '../config/theme.js';

// Porta no fim da fase. Só deixa passar com todas as chaves.
export class Door extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, totalKeys) {
    super(scene, x, y, 'door_sprite');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    this.totalKeys = totalKeys;
    this._warnActive = false;

    // Rótulo acima da porta
    this.label = scene.add.text(x, y - 56, 'SAIDA', {
      fontFamily: FONT, fontSize: '10px', color: '#f1c40f'
    }).setOrigin(0.5);
  }

  tryEnter(keysCollected) {
    if (keysCollected >= this.totalKeys) return true;

    if (!this._warnActive) {
      this._warnActive = true;
      const falta = this.totalKeys - keysCollected;
      const msg = this.scene.add.text(
        this.scene.cameras.main.midPoint.x, 120,
        `FALTAM ${falta} CHAVE(S)!`,
        { fontFamily: FONT, fontSize: '14px', color: '#e74c3c' }
      ).setOrigin(0.5).setScrollFactor(0).setDepth(50);
      this.scene.time.delayedCall(1800, () => { msg.destroy(); this._warnActive = false; });
    }
    return false;
  }

  open() {
    this.setTint(0x88ff88);
  }
}
