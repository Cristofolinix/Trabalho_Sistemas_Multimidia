// Jogador. Cada personagem tem sua própria textura (player_<key>),
// com a cor da camisa já embutida — sem tint, para preservar os detalhes.
export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config) {
    super(scene, x, y, `player_${config.key}`);

    this.config = config;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Sprite tem 42×60 px (14×20 grid × px3). Hitbox menor e centrada.
    this.setCollideWorldBounds(false);
    this.body.setSize(26, 52);
    this.body.setOffset(8, 8);

    // Atributos
    this.hp = 4;
    this.maxHp = 4;
    this.isAlive = true;
    this.invincible = false;

    this.abilityCooldown = 0;
    this.abilityMaxCooldown = config.abilityCooldown ?? 1500;

    // Pulo com coyote-time e jump-buffer (sensação mais responsiva)
    this.coyote = 0;        // ms desde que saiu do chão
    this.jumpBuffer = 0;    // ms desde que apertou pulo

    // Controles (preenchidos pela cena)
    this.cursors = null;
    this.wasd = null;
    this.jumpKey = null;
    this.jumpKey2 = null;
    this.abilityKey = null;

    this._dashActive = false;
  }

  update(delta) {
    if (!this.isAlive) return;

    const onGround = this.body.blocked.down || this.body.touching.down;
    const speed = this.config.speed;

    if (this.abilityCooldown > 0) this.abilityCooldown -= delta;

    // ── Movimento horizontal ──────────────────────────────────────────────
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;

    if (left && !this._dashActive) {
      this.setVelocityX(-speed);
      this.setFlipX(true);
    } else if (right && !this._dashActive) {
      this.setVelocityX(speed);
      this.setFlipX(false);
    } else if (!this._dashActive) {
      this.setVelocityX(this.body.velocity.x * 0.8);
    }

    // ── Coyote time + jump buffer ─────────────────────────────────────────
    if (onGround) this.coyote = 120; else this.coyote -= delta;
    this.jumpBuffer -= delta;

    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.jumpKey)
                     || Phaser.Input.Keyboard.JustDown(this.jumpKey2)
                     || Phaser.Input.Keyboard.JustDown(this.wasd.up);
    if (jumpPressed) this.jumpBuffer = 120;

    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.setVelocityY(this.config.jumpVelocity);
      this.jumpBuffer = 0;
      this.coyote = 0;
    }

    // ── Habilidade — F ────────────────────────────────────────────────────
    if (Phaser.Input.Keyboard.JustDown(this.abilityKey) && this.abilityCooldown <= 0) {
      this._useAbility();
    }
  }

  _useAbility() {
    this.abilityCooldown = this.abilityMaxCooldown;
    switch (this.config.key) {
      case 'hugo':     this._abilityHugo();     break;
      case 'alex':     this._abilityAlex();     break;
      case 'berto':    this._abilityBerto();    break;
      case 'weverton': this._abilityWeverton(); break;
    }
  }

  _abilityHugo() {
    const dir = this.flipX ? -1 : 1;
    const hitbox = this.scene.add.rectangle(this.x + dir * 44, this.y, 44, 40, 0xe74c3c, 0.6);
    this.scene.time.addEvent({
      delay: 40, repeat: 6,
      callback: () => {
        this.scene.enemies?.getChildren().forEach(e => {
          if (e.active && Phaser.Geom.Intersects.RectangleToRectangle(hitbox.getBounds(), e.getBounds())) {
            e.kill();
          }
        });
      }
    });
    this.scene.time.delayedCall(280, () => hitbox.destroy());
    this._showAbilityText('SOCO!');
  }

  _abilityAlex() {
    const dir = this.flipX ? -1 : 1;
    const proj = this.scene.physics.add.image(this.x + dir * 24, this.y, 'projectile');
    proj.body.setAllowGravity(false);
    proj.setVelocityX(dir * 560);
    this.scene.physics.add.overlap(proj, this.scene.enemies, (p, e) => { e.kill(); p.destroy(); });
    this.scene.time.delayedCall(1600, () => proj.destroy());
    this._showAbilityText('TIRO!');
  }

  _abilityBerto() {
    const circle = this.scene.add.circle(this.x, this.y, 10, 0x2ecc71, 0.4);
    this.scene.tweens.add({
      targets: circle, scaleX: 12, scaleY: 12, alpha: 0, duration: 450,
      onUpdate: () => {
        this.scene.enemies?.getChildren().forEach(e => {
          if (e.active && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) < circle.radius * circle.scaleX) {
            e.kill();
          }
        });
      },
      onComplete: () => circle.destroy()
    });
    this._showAbilityText('ONDA!');
  }

  _abilityWeverton() {
    if (this._dashActive) return;
    this._dashActive = true;
    const dir = this.flipX ? -1 : 1;
    this.setVelocityX(dir * 760);
    this.invincible = true;       // breve invencibilidade no dash
    this.setAlpha(0.6);
    this.scene.time.delayedCall(220, () => {
      this._dashActive = false;
      this.invincible = false;
      this.setAlpha(1);
    });
    this._showAbilityText('DASH!');
  }

  _showAbilityText(msg) {
    const txt = this.scene.add.text(this.x, this.y - 46, msg, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px', color: '#ffffff'
    }).setOrigin(0.5).setDepth(20);
    this.scene.tweens.add({
      targets: txt, y: txt.y - 24, alpha: 0, duration: 700,
      onComplete: () => txt.destroy()
    });
  }

  takeDamage(amount = 1) {
    if (this.invincible || !this.isAlive) return;
    this.hp -= amount;
    if (this.hp <= 0) { this.die(); return; }

    this.invincible = true;
    this.scene.tweens.add({
      targets: this, alpha: 0.3, duration: 90, yoyo: true, repeat: 5,
      onComplete: () => { this.alpha = 1; this.invincible = false; }
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
