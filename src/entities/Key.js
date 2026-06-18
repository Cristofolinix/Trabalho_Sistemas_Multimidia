// Chave coletável. Quando o jogador toca, emite 'keyCollected'.
export class Key extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'key_placeholder');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Chave não cai e não se move pela física — o tween controla a posição
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.moves = false;  // impede a física de sobrescrever o tween (corrige flickering)
    this.setTint(0xf1c40f);  // amarelo dourado

    // Animação de "flutuar" com tween
    scene.tweens.add({
      targets: this,
      y: y - 8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  collect() {
    this.scene.events.emit('keyCollected');
    this.destroy();
  }
}
