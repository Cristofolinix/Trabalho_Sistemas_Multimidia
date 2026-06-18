// Inimigo base: patrulha entre dois pontos X e causa dano ao encostar.
// Extensível para os inimigos específicos de cada fase.
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x       posição inicial
   * @param {number} y
   * @param {number} leftX   limite esquerdo da patrulha
   * @param {number} rightX  limite direito da patrulha
   */
  constructor(scene, x, y, leftX, rightX) {
    super(scene, x, y, 'enemy_placeholder');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(30, 36);
    this.setTint(0x9b59b6);  // roxo — fácil de distinguir do jogador

    // Limites de patrulha
    this.leftX = leftX;
    this.rightX = rightX;
    this.speed = 80;

    // Começa indo para a direita
    this.setVelocityX(this.speed);

    // Impede que o inimigo caia por gravidade fora das plataformas
    this.body.setAllowGravity(true);
    this.setCollideWorldBounds(false);
  }

  update() {
    // Inverte direção ao atingir os limites
    if (this.x <= this.leftX) {
      this.setVelocityX(this.speed);
      this.setFlipX(false);
    } else if (this.x >= this.rightX) {
      this.setVelocityX(-this.speed);
      this.setFlipX(true);
    }
  }
}
