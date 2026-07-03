import { audio } from '../audio/AudioManager.js';

const TYPES = {
  ressaca: {
    sheet: 'ressaca_walk', anim: 'ressaca-walk', speed: 36, damage: 1,
    scale: 0.5, body: [44, 120], offset: [14, 12],
    shootRange: 340,
    shootInterval: 2200,
  },
  trote: {
    sheet: 'trote_run', anim: 'trote-run', speed: 120, damage: 1,
    scale: 1.8, body: [16, 24], offset: [8, 8],
    detectRange: 240,
    chaseSpeed: 150,
    carrySpeed: 120,
  },
  sono: {
    sheet: 'enemy_sono', anim: 'sono-float', speed: 50, damage: 1, hp: 1,
    scale: 0.28, body: [80, 120], offset: [83, 76], isFloating: true,
    appliesSlow: true
  },
  trabalho: {
    sheet: 'enemy_trabalho', anim: 'trabalho-run', speed: 75, damage: 1, hp: 2,
    scale: 0.16, body: [340, 300], offset: [48, 50]
  },
  calculo: {
    sheet: 'enemy_calculo', anim: 'calculo-float', speed: 90, damage: 1, hp: 1,
    scale: 0.22, body: [180, 230], offset: [26, 34], isFloating: true
  },
  prova: {
    sheet: 'enemy_prova', anim: 'prova-float', speed: 75, damage: 2, hp: 4,
    scale: 0.18, body: [300, 330], offset: [56, 50], isFloating: true
  },
  sono_acumulado: {
    // grade 2×2: frame = 450×282 (não é tira 4×1)
    sheet: 'enemy_sono_acumulado', anim: 'sono-acumulado-float', speed: 65, damage: 1, hp: 1,
    scale: 0.20, body: [130, 120], offset: [175, 50], isFloating: true,
    appliesSlow: true, isSonoAcumulado: true
  },
  tcc_mob: {
    sheet: 'enemy_tcc_mob', anim: 'tcc-mob-run', speed: 85, damage: 1, hp: 2,
    scale: 0.22, body: [160, 240], offset: [38, 34]
  },
  boss_tcc: {
    sheet: 'boss_tcc', anim: 'boss-tcc-float', speed: 80, damage: 1, hp: 10,
    scale: 0.28, body: [350, 380], offset: [72, 46], isFloating: true,
    isBoss: true
  },
  boss_banca: {
    // sem isFloating: mesa com pessoas, fica no chão com gravidade normal
    sheet: 'boss_banca', anim: 'boss-banca-float', speed: 0, damage: 1, hp: 10,
    scale: 0.28, body: [400, 380], offset: [52, 37],
    isBoss: true
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
    this.homeX = x;
    this.homeY = y;
    this.speed = def.speed;
    this.hp = def.hp ?? 1;

    if (def.isFloating) {
      this.body.setAllowGravity(false);
    }

    // Estado da máquina de estados do trote: 'patrol' → 'chase' → 'carry' → 'return'
    this.state = 'patrol';
    this.carrying = null;
    this.grabReadyAt = 0;
    this.targetTrapX = x;
    this.pitDir = 1;
    this.carryDeadline = 0;

    // Escalona o primeiro cuspe para não saírem todos juntos
    this.nextShot = (scene.time?.now ?? 0) + 800 + (x % 700);

    this.startY = y;
    this.calcPattern = (Math.floor(x / 200)) % 3;
    this._sonoWanderAngle = Math.random() * Math.PI * 2;

    if (def.anim) this.play(def.anim);
    this.setVelocityX(this.speed);

    // Período de graça em frames (não em scene.time.now, que não zera no restart):
    // garante que o inimigo não detecte o jogador nos primeiros ~1.2s após spawnar.
    this.spawnGraceFrames = 70;
  }

  _canAggro() {
    return this.spawnGraceFrames <= 0;
  }

  update() {
    if (!this.active) return;

    if (this.spawnGraceFrames > 0) this.spawnGraceFrames--;

    // group.add() reativa a gravidade do body silenciosamente; reafirma todo frame para flutuantes.
    if (this.def.isFloating && this.body.allowGravity) {
      this.body.setAllowGravity(false);
    }

    const worldH = this.scene.physics.world.bounds.height;
    if (this.y > worldH + 80) { this._resetHome(); return; }

    if (this.type === 'trote') this._updateTrote();
    else if (this.type === 'sono') this._updateSono();
    else if (this.type === 'trabalho') this._updateTrabalho();
    else if (this.type === 'calculo') this._updateCalculo();
    else if (this.type === 'prova') this._updateProva();
    else if (this.type === 'sono_acumulado') this._updateSonoAcumulado();
    else if (this.type === 'tcc_mob') this._updateTccMob();
    else if (this.type === 'boss_tcc') this._updateBossTcc();
    else if (this.type === 'boss_banca') this._updateBossBanca();
    else this._updateRessaca();
  }

  // Verifica se há chão à frente na direção `dir`. Usa body.bottom para funcionar
  // corretamente em inimigos de qualquer tamanho (um deslocamento fixo falharia).
  _isGroundAhead(dir) {
    if (this.def.isFloating) return true;
    const checkX = this.x + dir * (this.width * this.scaleX * 0.6);
    const checkY = this.body.bottom + 6;
    const plats = this.scene.platforms?.getChildren() ?? [];
    for (const t of plats) {
      if (!t.active) continue;
      const b = t.getBounds();
      if (checkX >= b.left && checkX <= b.right && checkY >= b.top && checkY <= b.bottom + 32) {
        return true;
      }
    }
    return false;
  }

  _patrol() {
    if (this._dir === undefined) this._dir = 1;

    if (this.body.blocked.down && !this._isGroundAhead(this._dir)) {
      this._dir *= -1;
      this.setFlipX(this._dir < 0);
    }

    if (this.x <= this.leftX || this.body.blocked.left) {
      this._dir = 1;
      this.setFlipX(true);
    } else if (this.x >= this.rightX || this.body.blocked.right) {
      this._dir = -1;
      this.setFlipX(false);
    }
    this.setVelocityX(this._dir * this.speed);
  }

  _updateTrote() {
    const p = this.scene.player;
    const now = this.scene.time.now;

    switch (this.state) {
      case 'patrol': {
        this._patrol();
        if (p && p.isAlive && now > this.grabReadyAt && this._canAggro()) {
          const dx = p.x - this.x, dy = p.y - this.y;
          if (Math.abs(dx) < this.def.detectRange && Math.abs(dy) < 90) {
            this.state = 'chase';
          }
        }
        break;
      }

      case 'chase': {
        if (!p || !p.isAlive) { this.state = 'return'; break; }
        const dx = p.x - this.x, dy = p.y - this.y;
        if (Math.abs(dx) > this.def.detectRange * 1.6 || Math.abs(dy) > 150) {
          this.state = 'return'; break;
        }
        const dir = dx < 0 ? -1 : 1;
        this.setFlipX(dir > 0);
        const canAdvance = this.body.blocked.down && this._isGroundAhead(dir);
        this.setVelocityX(canAdvance ? dir * this.def.chaseSpeed : 0);
        break;
      }

      case 'carry': {
        if (!this.carrying) { this.state = 'return'; break; }
        const dir = this.targetTrapX < this.x ? -1 : 1;
        this.setVelocityX(dir * this.def.carrySpeed);
        this.setFlipX(dir > 0);
        this.carrying.setPosition(this.x, this.y - 20);
        this.carrying.setVelocity(0, 0);
        if (Math.abs(this.x - this.targetTrapX) < 12 || now > this.carryDeadline) {
          this._throw();
        }
        break;
      }

      case 'return': {
        const dir = this.homeX < this.x ? -1 : 1;
        const canAdvance = this.body.blocked.down && this._isGroundAhead(dir);
        this.setVelocityX(canAdvance ? dir * this.speed : 0);
        this.setFlipX(dir > 0);
        if (Math.abs(this.x - this.homeX) < 20) {
          this.state = 'patrol';
          this.setVelocityX(this.speed);
        }
        break;
      }
    }
  }

  canGrab() {
    return this.type === 'trote'
      && (this.state === 'patrol' || this.state === 'chase')
      && !this.carrying
      && this.scene.time.now > this.grabReadyAt;
  }

  grab(player) {
    if (!this.canGrab()) return;
    this.state = 'carry';
    this.carrying = player;
    player.grabbed = true;
    player.setVelocity(0, 0);
    player.body.setAllowGravity(false);
    this.targetTrapX = this._nearestTrapEdge();
    this.carryDeadline = this.scene.time.now + 4000;
    audio.sfx('grab');
  }

  _nearestTrapEdge() {
    const traps = this.scene.traps || [];
    const margin = 26;
    let best = null, bestDist = Infinity;
    traps.forEach(t => {
      const cx = (t.x1 + t.x2) / 2;
      const d = Math.abs(cx - this.x);
      if (d < bestDist) { bestDist = d; best = t; }
    });
    if (!best) {
      this.pitDir = this.flipX ? 1 : -1;
      this.throwTargetX = this.x + this.pitDir * 60;
      return this.x;
    }
    const cx = (best.x1 + best.x2) / 2;
    const pitWidth = best.x2 - best.x1;
    if (this.x <= cx) {
      this.pitDir = 1;
      this.throwTargetX = best.x1 + pitWidth * 0.28;
      return best.x1 - margin;
    }
    this.pitDir = -1;
    this.throwTargetX = best.x2 - pitWidth * 0.28;
    return best.x2 + margin;
  }

  // Usa tween para controlar diretamente a posição do jogador até o ponto do espinho,
  // evitando que o atrito do Player.update() cancele o impulso no meio do caminho.
  _throw() {
    const p = this.carrying;
    this.carrying = null;
    this.state = 'return';
    this.grabReadyAt = this.scene.time.now + 3000;
    audio.sfx('throw');
    if (!p) return;

    // p.grabbed continua true durante o tween: Player.update() fica pausado.
    this.scene.tweens.add({
      targets: p,
      x: this.throwTargetX,
      y: 705,
      duration: 380,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        p.grabbed = false;
        p.body.setAllowGravity(true);
        p.setVelocity(0, 0);
        if (p.isAlive) this.scene._hurtAndRespawn();
      }
    });
  }

  _updateRessaca() {
    this._patrol();
    const p = this.scene.player;
    const now = this.scene.time.now;
    if (p && p.isAlive && now > this.nextShot) {
      const dx = p.x - this.x, dy = p.y - this.y;
      if (Math.abs(dx) < this.def.shootRange && Math.abs(dy) < 130) {
        this.setFlipX(dx > 0);
        this.scene.spawnVomit(this, p);
        this.nextShot = now + this.def.shootInterval;
      }
    }
  }

  _resetHome() {
    if (this.carrying) this._throw();
    this.setPosition(this.homeX, this.homeY);
    this.setVelocity(0, 0);
    this.state = 'patrol';
  }

  _updateSono() {
    const p = this.scene.player;
    const dist = (p && p.isAlive)
      ? Math.hypot(p.x - this.x, p.y - this.y) : Infinity;
    const chasing = this._canAggro() && dist < 350;

    if (chasing) {
      const t = this.scene.time.now / 1200;
      this._sonoWanderAngle += 0.018 * Math.sin(t);
      const targetAngle = Math.atan2(p.y - this.y, p.x - this.x);
      const diff = targetAngle - this._sonoWanderAngle;
      this._sonoWanderAngle += Math.sign(Math.sin(diff)) * 0.06;

      const vx = Math.cos(this._sonoWanderAngle) * this.speed;
      const vy = Math.sin(this._sonoWanderAngle) * this.speed * 0.6;
      this.setVelocity(vx, vy);

      // Usa dx para o flip em vez de vx: quando o jogador está quase acima/abaixo,
      // vx oscila de sinal por arredondamento causando piscar visual no sprite.
      const dxToPlayer = p.x - this.x;
      if (Math.abs(dxToPlayer) > 6) this.setFlipX(dxToPlayer < 0);

      if (this.x < this.leftX || this.x > this.rightX) {
        this._sonoWanderAngle = Math.PI - this._sonoWanderAngle;
      }
      if (this.y < this.homeY - 220) this._sonoWanderAngle = Math.abs(this._sonoWanderAngle) % (Math.PI * 2);
      if (this.y > this.homeY + 220) this._sonoWanderAngle = -Math.abs(this._sonoWanderAngle);
      return;
    }

    // Parado: velocidade X e Y desacopladas para evitar que vx fique próximo de zero
    // e o sprite pisque de lado quando o ângulo fica perto de ±90°.
    if (this._sonoIdleDir === undefined) this._sonoIdleDir = this.flipX ? -1 : 1;
    const vx = this._sonoIdleDir * this.speed * 0.5;
    const vy = Math.sin(this.scene.time.now / 900) * this.speed * 0.35;
    this.setVelocity(vx, vy);
    this.setFlipX(vx < 0);
    this._sonoWanderAngle = Math.atan2(vy, vx);

    if (this.x <= this.leftX) { this._sonoIdleDir = 1; this.setFlipX(false); }
    else if (this.x >= this.rightX) { this._sonoIdleDir = -1; this.setFlipX(true); }
  }

  _updateTrabalho() {
    const p = this.scene.player;
    if (p && p.isAlive && this._canAggro() && Math.abs(p.x - this.x) < 380 && Math.abs(p.y - this.y) < 120) {
      const dx = p.x - this.x;
      const dir = Math.sign(dx) || 1;
      const groundAhead = this._isGroundAhead(dir);
      if (groundAhead || !this.body.blocked.down) {
        this.setVelocityX(dir * 175);
        this.setFlipX(dx < 0);
        if (this.body.blocked.down && p.y < this.y - 30 && Math.random() < 0.025) {
          this.setVelocityY(-380);
        }
      } else {
        this.setVelocityX(0);
      }
    } else {
      this._patrol();
    }
  }

  _updateCalculo() {
    const t = this.scene.time.now;
    switch (this.calcPattern) {
      case 0:
        this._patrol();
        this.setVelocityY(0);
        break;

      case 1: {
        this._patrol();
        const targetY = this.startY + Math.sin(t / 700) * 100;
        this.setVelocityY((targetY - this.y) * 5);
        break;
      }

      case 2: {
        const radius = 80;
        const speed = t / 1100;
        const targetX = this.homeX + Math.cos(speed) * radius;
        const targetY = this.startY + Math.sin(speed) * radius * 0.6;
        this.setVelocityX((targetX - this.x) * 6);
        this.setVelocityY((targetY - this.y) * 6);
        this.setFlipX(this.body.velocity.x < 0);
        break;
      }
    }
  }

  _updateProva() {
    const p = this.scene.player;
    if (p && p.isAlive) {
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (this._canAggro() && dist < 550) {
        this.setVelocityX(Math.sign(dx) * this.speed);
        this.setVelocityY(Math.sign(dy) * this.speed * 0.5);
        this.setFlipX(dx < 0);
      } else {
        this._patrol();
        this.setVelocityY(0);
      }
    } else {
      this._patrol();
      this.setVelocityY(0);
    }
  }

  _updateSonoAcumulado() {
    const t = this.scene.time.now / 1000;
    this._sonoWanderAngle += 0.024 * Math.sin(t);

    const p = this.scene.player;
    const dist = (p && p.isAlive) ? Math.hypot(p.x - this.x, p.y - this.y) : Infinity;
    const chasing = this._canAggro() && dist < 420;

    if (chasing) {
      const targetAngle = Math.atan2(p.y - this.y, p.x - this.x);
      const diff = targetAngle - this._sonoWanderAngle;
      this._sonoWanderAngle += Math.sign(Math.sin(diff)) * 0.08;
    }

    const vx = Math.cos(this._sonoWanderAngle) * this.speed;
    const vy = Math.sin(this._sonoWanderAngle) * this.speed * 0.7;
    this.setVelocity(vx, vy);
    this.setFlipX(vx < 0);

    if (this.x < this.leftX || this.x > this.rightX) {
      this._sonoWanderAngle = Math.PI - this._sonoWanderAngle;
    }
    const vRange = chasing ? 260 : 25;
    if (this.y < this.homeY - vRange) this._sonoWanderAngle = Math.abs(this._sonoWanderAngle) % (Math.PI * 2);
    if (this.y > this.homeY + vRange) this._sonoWanderAngle = -Math.abs(this._sonoWanderAngle);
  }

  _updateTccMob() {
    const p = this.scene.player;
    if (p && p.isAlive && this._canAggro() && Math.abs(p.x - this.x) < 400 && Math.abs(p.y - this.y) < 130) {
      const dx = p.x - this.x;
      const dir = Math.sign(dx) || 1;
      const groundAhead = this._isGroundAhead(dir);
      if (groundAhead || !this.body.blocked.down) {
        // 150px/s deixa folga real para escapar (velocidade dos personagens: 195-225)
        this.setVelocityX(dir * 150);
        this.setFlipX(dx < 0);
        if (this.body.blocked.down && p.y < this.y - 30 && Math.random() < 0.03) {
          this.setVelocityY(-380);
        }
      } else {
        this.setVelocityX(0);
      }
    } else {
      this._patrol();
    }
  }

  _updateBossTcc() {
    // Flutua alto na maior parte do tempo; a cada ~5s mergulha por ~1.5s
    // para dentro do alcance do jogador — essa é a janela de ataque.
    const t = this.scene.time.now;
    const p = this.scene.player;

    if (this._tccNextDive === undefined) this._tccNextDive = t + 3000;
    if (this._tccDiveUntil === undefined) this._tccDiveUntil = 0;
    if (this._tccDiving && t > this._tccDiveUntil) this._tccDiving = false;
    if (!this._tccDiving && t > this._tccNextDive) {
      this._tccDiving = true;
      this._tccDiveUntil = t + 1500;
      this._tccNextDive = t + 5000;
    }

    let targetY;
    if (this._tccDiving && p && p.isAlive) {
      targetY = Math.min(p.y - 30, this.homeY + 200);
    } else {
      targetY = this.homeY + Math.sin(t / 800) * 80;
    }
    this.setVelocityY((targetY - this.y) * 4);

    this._patrol();

    if (p && p.isAlive && t > (this.nextShot ?? 0)) {
      const dist = Math.hypot(p.x - this.x, p.y - this.y);
      if (dist < 600) {
        if (this.scene.spawnBossProjectile) {
          this.scene.spawnBossProjectile(this, 'tcc');
        }
        this.nextShot = t + 1400;
      }
    }
  }

  _updateBossBanca() {
    const t = this.scene.time.now;
    this.setVelocityX(0);

    const p = this.scene.player;
    if (p && p.isAlive) {
      this.setFlipX(p.x < this.x);

      if (t > (this.nextShot ?? 0)) {
        const dist = Math.hypot(p.x - this.x, p.y - this.y);
        if (dist < 700) {
          if (this.scene.spawnBossProjectile) {
            this.scene.spawnBossProjectile(this, 'banca');
          }
          this.nextShot = t + 1800;
        }
      }
    }
  }

  kill() {
    if (!this.active) return;
    // Debounce de 500ms: evita que uma única ativação de habilidade gaste todos
    // os hits de um inimigo com hp > 1 de uma vez (o soco verifica 7× em 210ms).
    const now = this.scene.time.now;
    if (this._lastHitAt !== undefined && now - this._lastHitAt < 500) return;
    this._lastHitAt = now;

    if (this.hp > 1) {
      this.hp--;
      this.scene.tweens.add({ targets: this, alpha: 0.3, duration: 90, yoyo: true, repeat: 1, onComplete: () => this.alpha = 1 });
      return;
    }

    if (this.carrying) {
      this.carrying.grabbed = false;
      this.carrying.body.setAllowGravity(true);
      this.carrying = null;
    }
    const puff = this.scene.add.circle(this.x, this.y, 6, 0xffffff, 0.7);
    this.scene.tweens.add({
      targets: puff, scaleX: 3, scaleY: 3, alpha: 0, duration: 250,
      onComplete: () => puff.destroy()
    });
    this.destroy();
  }
}
