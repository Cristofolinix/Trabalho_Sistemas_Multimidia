// Chave coletável. Quando o jogador toca, emite 'keyCollected'.
export class Key extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'key_sprite');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Chave não cai e não se move pela física — o tween controla a posição
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.moves = false;   // impede a física de brigar com o tween (sem flickering)

    // Brilho atrás da chave
    this.glow = scene.add.circle(x, y, 16, 0xf1c40f, 0.18).setDepth(-1);
    scene.tweens.add({
      targets: this.glow, scaleX: 1.3, scaleY: 1.3, alpha: 0.35,
      duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Flutuação suave
    scene.tweens.add({
      targets: this, y: y - 10,
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  collect() {
    this.scene.events.emit('keyCollected');
    // Efeito de coleta
    const fx = this.scene.add.image(this.x, this.y, 'key_sprite');
    this.scene.tweens.add({
      targets: fx, y: fx.y - 40, scaleX: 1.6, scaleY: 1.6, alpha: 0,
      duration: 400, onComplete: () => fx.destroy()
    });
    this.glow?.destroy();
    this.destroy();
  }
}
