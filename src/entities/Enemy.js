// Inimigo com tipo. Patrulha entre dois X e causa dano ao encostar.
//  - 'ressaca': lento e cambaleante
//  - 'trote':   rápido e errático
const TYPES = {
  ressaca: { texture: 'enemy_ressaca', speed: 55,  damage: 1, wobble: true  },
  trote:   { texture: 'enemy_trote',   speed: 120, damage: 1, wobble: false },
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, leftX, rightX, type = 'ressaca') {
    const def = TYPES[type] ?? TYPES.ressaca;
    super(scene, x, y, def.texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = type;
    this.def = def;
    this.damage = def.damage;

    this.body.setSize(28, 46);
    this.body.setOffset(7, 6);
    this.setCollideWorldBounds(false);

    this.leftX = leftX;
    this.rightX = rightX;
    this.speed = def.speed;
    this._t = 0;

    this.setVelocityX(this.speed);
  }

  update(time, delta) {
    if (!this.active) return;

    // Inverte ao atingir os limites de patrulha ou bater numa parede
    if (this.x <= this.leftX || this.body.blocked.left) {
      this.setVelocityX(this.speed);
      this.setFlipX(false);
    } else if (this.x >= this.rightX || this.body.blocked.right) {
      this.setVelocityX(-this.speed);
      this.setFlipX(true);
    }

    // Cambaleio visual da Ressaca
    if (this.def.wobble) {
      this._t += (delta ?? 16);
      this.setAngle(Math.sin(this._t / 200) * 8);
    }
  }

  // Morte com pequeno efeito de "puff"
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
