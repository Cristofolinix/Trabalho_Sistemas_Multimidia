import { audio } from '../audio/AudioManager.js';

// Jogador. Sprite animado (Pixel Adventure) + habilidade especial por personagem.
export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, config) {
    super(scene, x, y, `${config.key}_idle`, 0);

    this.config = config;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Spritesheet 32×32 (Pixel Adventure). Escala 1.8 e hitbox no corpo.
    this.setScale(1.8);
    this.setCollideWorldBounds(false);
    this.body.setSize(16, 26);
    this.body.setOffset(8, 6);

    this.play(`${config.key}-idle`);
    this._anim = 'idle';

    // Atributos
    this.hp = 4;
    this.maxHp = 4;
    this.isAlive = true;
    this.invincible = false;

    this.abilityCooldown = 0;
    this.abilityMaxCooldown = config.abilityCooldown ?? 1500;

    // ── Estados especiais causados por inimigos ──────────────────────────
    // Náusea (vômito do zumbi): enquanto > 0, os controles esquerda/direita
    // ficam invertidos e a câmera balança (efeito tratado na cena).
    this.nauseaTimer = 0;
    // Agarrado (galinha do trote): input desativado; a galinha posiciona o
    // jogador enquanto o carrega até a armadilha.
    this.grabbed = false;

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

    // Enquanto agarrado pela galinha, o jogador não se controla: a própria
    // galinha define a posição dele (ver Enemy.js, estado 'carry').
    if (this.grabbed) return;

    const onGround = this.body.blocked.down || this.body.touching.down;
    const speed = this.config.speed;

    if (this.abilityCooldown > 0) this.abilityCooldown -= delta;

    // Conta regressiva da náusea (vômito do zumbi)
    if (this.nauseaTimer > 0) {
      this.nauseaTimer -= delta;
      if (this.nauseaTimer <= 0) {
        this.nauseaTimer = 0;
        this.clearTint();   // volta à cor normal quando passa o enjoo
      }
    }

    // ── Movimento horizontal ──────────────────────────────────────────────
    let left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    let right = this.cursors.right.isDown || this.wasd.right.isDown;

    // Náusea: inverte esquerda ↔ direita (frente vira trás e vice-versa)
    if (this.nauseaTimer > 0) { const tmp = left; left = right; right = tmp; }

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
      audio.sfx('jump');
    }

    // ── Animação por estado ───────────────────────────────────────────────
    let state;
    if (!onGround) state = this.body.velocity.y < 0 ? 'jump' : 'fall';
    else if (Math.abs(this.body.velocity.x) > 15) state = 'run';
    else state = 'idle';
    if (state !== this._anim) {
      this._anim = state;
      this.play(`${this.config.key}-${state}`, true);
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

  // Hugo — soco: arco de impacto + faíscas, derruba inimigo à frente
  _abilityHugo() {
    audio.sfx('punch');
    const dir = this.flipX ? -1 : 1;
    const cx = this.x + dir * 40, cy = this.y;

    // Arco do golpe (graphics) que cresce e some
    const arc = this.scene.add.graphics().setDepth(15);
    let r = 14;
    const drawArc = () => {
      arc.clear();
      arc.lineStyle(5, 0xffe08a, 0.9);
      const a0 = dir > 0 ? -0.9 : Math.PI + 0.9;
      const a1 = dir > 0 ? 0.9  : Math.PI - 0.9;
      arc.beginPath(); arc.arc(cx, cy, r, a0, a1, dir < 0); arc.strokePath();
    };
    this.scene.tweens.addCounter({
      from: 14, to: 46, duration: 200,
      onUpdate: t => { r = t.getValue(); drawArc(); },
      onComplete: () => arc.destroy()
    });

    // Faíscas no impacto
    this._sparks(cx + dir * 10, cy, dir);

    // Hitbox de dano por alguns frames
    const hitbox = new Phaser.Geom.Rectangle(cx - 26, cy - 24, 52, 48);
    this.scene.time.addEvent({
      delay: 30, repeat: 6,
      callback: () => this.scene.enemies?.getChildren().forEach(e => {
        if (e.active && Phaser.Geom.Intersects.RectangleToRectangle(hitbox, e.getBounds())) {
          this.scene.cameras.main.shake(120, 0.006);
          e.kill();
        }
      })
    });
    this._showAbilityText('SOCO!');
  }

  // Alex — projétil com rastro de partículas e clarão de saída
  _abilityAlex() {
    audio.sfx('shoot');
    const dir = this.flipX ? -1 : 1;
    const proj = this.scene.physics.add.image(this.x + dir * 26, this.y, 'projectile').setDepth(12);
    proj.body.setAllowGravity(false);
    proj.setVelocityX(dir * 620);

    // clarão de saída
    const flash = this.scene.add.circle(this.x + dir * 26, this.y, 12, 0xaed6f1, 0.8).setDepth(12);
    this.scene.tweens.add({ targets: flash, scale: 2, alpha: 0, duration: 180, onComplete: () => flash.destroy() });

    // rastro de partículas seguindo o projétil
    const trail = this.scene.add.particles(0, 0, 'spark', {
      follow: proj, lifespan: 240, scale: { start: 0.7, end: 0 },
      speed: 20, frequency: 18, tint: 0x5ad1ff, blendMode: 'ADD'
    }).setDepth(11);

    const stop = () => { trail.destroy(); proj.destroy(); };
    this.scene.physics.add.overlap(proj, this.scene.enemies, (p, e) => { e.kill(); this._sparks(p.x, p.y, dir); stop(); });
    this.scene.time.delayedCall(1500, stop);
    this._showAbilityText('TIRO!');
  }

  // Berto — onda de área: anéis concêntricos + faíscas + tremor
  _abilityBerto() {
    audio.sfx('wave');
    this.scene.cameras.main.shake(180, 0.008);
    for (let k = 0; k < 3; k++) {
      const ring = this.scene.add.circle(this.x, this.y, 10, 0x2ecc71, 0).setStrokeStyle(4, 0x6aff8a, 0.9).setDepth(13);
      this.scene.tweens.add({
        targets: ring, scale: 9, alpha: 0, duration: 480, delay: k * 90,
        onComplete: () => ring.destroy()
      });
    }
    // dano em raio crescente
    const dmg = this.scene.add.circle(this.x, this.y, 10, 0, 0);
    this.scene.tweens.add({
      targets: dmg, radius: 150, duration: 420,
      onUpdate: () => this.scene.enemies?.getChildren().forEach(e => {
        if (e.active && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) < dmg.radius) e.kill();
      }),
      onComplete: () => dmg.destroy()
    });
    this._sparks(this.x, this.y, 0);
    this._showAbilityText('ONDA!');
  }

  // Weverton — dash com fantasmas (afterimage) e invencibilidade breve
  _abilityWeverton() {
    if (this._dashActive) return;
    audio.sfx('dash');
    this._dashActive = true;
    const dir = this.flipX ? -1 : 1;
    this.setVelocityX(dir * 820);
    this.invincible = true;
    this.setAlpha(0.7);

    // fantasmas que somem (afterimage)
    const ghost = this.scene.time.addEvent({
      delay: 35, repeat: 5,
      callback: () => {
        const g = this.scene.add.image(this.x, this.y, this.texture.key, this.frame.name)
          .setScale(1.8).setFlipX(this.flipX).setAlpha(0.5).setTint(0xf39c12).setDepth(this.depth - 1);
        this.scene.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
      }
    });

    this.scene.time.delayedCall(240, () => {
      this._dashActive = false;
      this.invincible = false;
      this.setAlpha(1);
      ghost.remove();
    });
    this._showAbilityText('DASH!');
  }

  // Pequena explosão de faíscas
  _sparks(x, y, dir) {
    const e = this.scene.add.particles(x, y, 'spark', {
      lifespan: 350, speed: { min: 80, max: 220 },
      angle: dir === 0 ? { min: 0, max: 360 } : (dir > 0 ? { min: -60, max: 60 } : { min: 120, max: 240 }),
      scale: { start: 1, end: 0 }, quantity: 10, tint: 0xffe08a, blendMode: 'ADD'
    }).setDepth(16);
    e.explode(10, x, y);
    this.scene.time.delayedCall(400, () => e.destroy());
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

  // Aplica o estado de náusea (chamado quando o vômito do zumbi acerta).
  // Enquanto ativo: controles invertidos + câmera balançando (efeito na cena).
  applyNausea(ms = 10000) {
    if (!this.isAlive) return;
    const wasHealthy = this.nauseaTimer <= 0;
    this.nauseaTimer = ms;                 // renova sempre para 10s
    this.setTint(0x9be36b);                // tom esverdeado de enjoo
    if (wasHealthy) {
      audio.sfx('nausea');
      this._showAbilityText('ENJOADO!');   // aviso flutuante
    }
  }

  takeDamage(amount = 1) {
    if (this.invincible || !this.isAlive) return;
    this.hp -= amount;
    audio.sfx('hurt');
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
    // Limpa estados especiais para não renascer enjoado/agarrado
    this.nauseaTimer = 0;
    this.grabbed = false;
    this.body.setAllowGravity(true);
    this.clearTint();
    this.setPosition(x, y);
    this.setVelocity(0, 0);
  }
}
