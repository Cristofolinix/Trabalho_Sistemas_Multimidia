// Inimigo com tipo. Patrulha entre dois X e causa dano ao encostar.
// Sprites: Pixel Adventure (Pixel Frog, CC0).
//  - 'ressaca': Snail — lento
//  - 'trote':   Chicken — rápido
const TYPES = {
  ressaca: {
    sheet: 'ressaca_walk', anim: 'ressaca-walk', speed: 50,  damage: 1,
    scale: 1.9, body: [30, 14], offset: [4, 8],
  },
  trote: {
    sheet: 'trote_run', anim: 'trote-run', speed: 120, damage: 1,
    scale: 1.8, body: [16, 24], offset: [8, 8],
  },
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, leftX, rightX, type = 'ressaca') {
    const def = TYPES[type] ?? TYPES.ressaca;
    super(scene, x, y, def.sheet, 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = type;
    this.def = def;
    this.damage = def.damage;

    this.setScale(def.scale);
    this.body.setSize(def.body[0], def.body[1]);
    this.body.setOffset(def.offset[0], def.offset[1]);
    this.setCollideWorldBounds(false);

    this.leftX = leftX;
    this.rightX = rightX;
    this.speed = def.speed;

    this.play(def.anim);
    this.setVelocityX(this.speed);
  }

  update() {
    if (!this.active) return;

    // Inverte ao atingir os limites de patrulha ou bater numa parede.
    // O sprite "olha" para a esquerda por padrão; flipX vira para a direita.
    if (this.x <= this.leftX || this.body.blocked.left) {
      this.setVelocityX(this.speed);
      this.setFlipX(true);
    } else if (this.x >= this.rightX || this.body.blocked.right) {
      this.setVelocityX(-this.speed);
      this.setFlipX(false);
    }
  }

  kill() {
    if (!this.active) return;
    const puff = this.scene.add.circle(this.x, this.y, 6, 0xffffff, 0.7);
    this.scene.tweens.add({
      targets: puff, scaleX: 3, scaleY: 3, alpha: 0, duration: 250,
      onComplete: () => puff.destroy()
    });
    this.destroy();
  }
}
