// Classe do jogador. Usa um retângulo colorido como placeholder.
// Quando os sprites ficarem prontos, substitua apenas o visual aqui.
export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config) {
    super(scene, x, y, 'player_placeholder');

    this.config = config;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.body.setSize(28, 40);
    this.setTint(config.color);

    // Atributos de jogo
    this.hp = 3;
    this.maxHp = 3;
    this.isAlive = true;
    this.invincible = false;

    // Cooldown da habilidade especial (em ms)
    this.abilityCooldown = 0;
    this.abilityMaxCooldown = config.abilityCooldown ?? 2000;

    // Referências de controle (preenchidas em Level1Scene)
    this.cursors  = null;
    this.wasd     = null;
    this.jumpKey  = null;
    this.jumpKey2 = null;  // seta para cima
    this.abilityKey = null;

    // Estado interno de habilidades
    this._dashActive = false;
  }

  update(delta) {
    if (!this.isAlive) return;

    const onGround = this.body.blocked.down;
    const speed    = this.config.speed;

    // Cooldown da habilidade
    if (this.abilityCooldown > 0) {
      this.abilityCooldown -= delta;
    }

    // ── Movimento horizontal ──────────────────────────────────────────────
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      this.setVelocityX(-speed);
      this.setFlipX(true);
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      this.setVelocityX(speed);
      this.setFlipX(false);
    } else {
      this.setVelocityX(this.body.velocity.x * 0.8);
    }

    // ── Pulo — Espaço, ↑ ou W ────────────────────────────────────────────
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.jumpKey)
                     || Phaser.Input.Keyboard.JustDown(this.jumpKey2)
                     || Phaser.Input.Keyboard.JustDown(this.wasd.up);

    if (jumpPressed && onGround) {
      this.setVelocityY(this.config.jumpVelocity);
    }

    // ── Habilidade especial — F ───────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.abilityKey) && this.abilityCooldown <= 0) {
      this._useAbility();
    }
  }

  // Dispara a habilidade do personagem (cada um tem a sua lógica)
  _useAbility() {
    this.abilityCooldown = this.abilityMaxCooldown;
    this.scene.events.emit('abilityUsed', this.config.key);

    switch (this.config.key) {
      case 'hugo':    this._abilityHugo();     break;
      case 'alex':    this._abilityAlex();     break;
      case 'berto':   this._abilityBerto();    break;
      case 'weverton':this._abilityWeverton(); break;
    }
  }

  // Hugo — soco: cria uma hitbox à frente por 0,3s
  _abilityHugo() {
    const dir = this.flipX ? -1 : 1;
    const hitbox = this.scene.add.rectangle(
      this.x + dir * 40, this.y, 36, 32, 0xe74c3c, 0.7
    );

    // Verifica colisão manual com inimigos
    this.scene.time.addEvent({
      delay: 50,
      repeat: 5,
      callback: () => {
        this.scene.enemies?.getChildren().forEach(e => {
          if (Phaser.Geom.Intersects.RectangleToRectangle(
            hitbox.getBounds(), e.getBounds()
          )) {
            e.destroy();
          }
        });
      }
    });

    this.scene.time.delayedCall(300, () => hitbox.destroy());
    this._showAbilityText('Soco!');
  }

  // Alex — projétil: lança um retângulo que percorre o cenário
  _abilityAlex() {
    const dir = this.flipX ? -1 : 1;
    const proj = this.scene.physics.add.image(
      this.x + dir * 20, this.y, 'key_placeholder'
    );
    proj.setTint(0x3498db);
    proj.body.setAllowGravity(false);
    proj.setVelocityX(dir * 500);

    // Destrói inimigo ao tocar
    this.scene.physics.add.overlap(proj, this.scene.enemies, (p, e) => {
      e.destroy();
      p.destroy();
    });

    // Destrói o projétil após 2s
    this.scene.time.delayedCall(2000, () => proj.destroy());
    this._showAbilityText('Projétil!');
  }

  // Berto — onda de área: pulsa e elimina inimigos num raio
  _abilityBerto() {
    const circle = this.scene.add.circle(this.x, this.y, 10, 0x2ecc71, 0.5);

    this.scene.tweens.add({
      targets: circle,
      scaleX: 8, scaleY: 8,
      alpha: 0,
      duration: 500,
      onUpdate: () => {
        this.scene.enemies?.getChildren().forEach(e => {
          const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
          if (dist < circle.radius * circle.scaleX) {
            e.destroy();
          }
        });
      },
      onComplete: () => circle.destroy()
    });

    this._showAbilityText('Onda!');
  }

  // Weverton — dash: impulso horizontal rápido
  _abilityWeverton() {
    if (this._dashActive) return;
    this._dashActive = true;

    const dir = this.flipX ? -1 : 1;
    this.setVelocityX(dir * 700);
    this.setAlpha(0.6);

    this.scene.time.delayedCall(200, () => {
      this._dashActive = false;
      this.setAlpha(1);
    });

    this._showAbilityText('Dash!');
  }

  // Exibe texto da habilidade acima do jogador por 0,8s
  _showAbilityText(msg) {
    const txt = this.scene.add.text(this.x, this.y - 50, msg, {
      fontSize: '14px', fill: '#ffffff',
      backgroundColor: '#00000088', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(20);

    this.scene.tweens.add({
      targets: txt, y: txt.y - 20, alpha: 0, duration: 800,
      onComplete: () => txt.destroy()
    });
  }

  takeDamage() {
    if (this.invincible || !this.isAlive) return;

    this.hp -= 1;

    if (this.hp <= 0) {
      this.die();
      return;
    }

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

  respawn(x, y) {
    this.hp = this.maxHp;
    this.isAlive = true;
    this.invincible = false;
    this.alpha = 1;
    this.setPosition(x, y);
    this.setVelocity(0, 0);
  }
}
