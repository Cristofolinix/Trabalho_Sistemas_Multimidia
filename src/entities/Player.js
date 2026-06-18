// Classe do jogador. Usa um retângulo colorido como placeholder.
// Quando os sprites ficarem prontos, substitua apenas o visual aqui.
export class Player extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} config - dados do personagem (de characters.js)
   */
  constructor(scene, x, y, config) {
    // Usa a textura gerada por BootScene
    super(scene, x, y, 'player_placeholder');

    this.config = config;

    // Adiciona o sprite à cena e à física Arcade
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Ajusta o corpo físico
    this.setCollideWorldBounds(false); // permite cair por buracos
    this.body.setSize(28, 40);        // hitbox um pouco menor que o visual
    this.setTint(config.color);

    // Atributos de jogo
    this.hp = 3;
    this.maxHp = 3;
    this.isAlive = true;
    this.invincible = false;          // frames de invencibilidade após dano

    // Referências de controle (preenchidas em Level1Scene)
    this.cursors = null;
    this.wasd = null;
    this.jumpKey = null;
  }

  // Chamado a cada frame pela cena
  update() {
    if (!this.isAlive) return;

    const onGround = this.body.blocked.down;
    const speed = this.config.speed;

    // Movimento horizontal
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      this.setVelocityX(-speed);
      this.setFlipX(true);
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      this.setVelocityX(speed);
      this.setFlipX(false);
    } else {
      // Desacelera suavemente
      this.setVelocityX(this.body.velocity.x * 0.8);
    }

    // Pulo — só quando no chão
    if (Phaser.Input.Keyboard.JustDown(this.jumpKey) && onGround) {
      this.setVelocityY(this.config.jumpVelocity);
    }
  }

  // Recebe dano de um inimigo
  takeDamage() {
    if (this.invincible || !this.isAlive) return;

    this.hp -= 1;

    if (this.hp <= 0) {
      this.die();
      return;
    }

    // Pisca por 1 segundo (invencibilidade temporária)
    this.invincible = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.alpha = 1;
        this.invincible = false;
      }
    });
  }

  die() {
    this.isAlive = false;
    this.setVelocity(0, 0);
    this.scene.events.emit('playerDied');
  }

  // Reinicia o jogador num ponto de spawn
  respawn(x, y) {
    this.hp = this.maxHp;
    this.isAlive = true;
    this.invincible = false;
    this.alpha = 1;
    this.setPosition(x, y);
    this.setVelocity(0, 0);
  }
}
