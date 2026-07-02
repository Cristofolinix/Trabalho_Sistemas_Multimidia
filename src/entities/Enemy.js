import { audio } from '../audio/AudioManager.js';

// Inimigo com tipo. Cada tipo tem um comportamento próprio:
//  - 'ressaca' (zumbi): patrulha e CUSPE VÔMITO no jogador. Se acertar, deixa
//                       o jogador enjoado (controles invertidos + tela balançando).
//  - 'trote'   (galinha): PERSEGUE o jogador; ao encostar, AGARRA, carrega até a
//                         armadilha (buraco com espinhos) mais próxima e joga dentro.
const TYPES = {
  ressaca: {
    sheet: 'ressaca_walk', anim: 'ressaca-walk', speed: 36, damage: 1,   // cambaleio lento
    scale: 0.5, body: [44, 120], offset: [14, 12],   // zumbi CC0 (frame 71x138)
    // Vômito
    shootRange: 340,      // distância máxima para cuspir
    shootInterval: 2200,  // intervalo entre cuspes (ms)
  },
  trote: {
    sheet: 'trote_run', anim: 'trote-run', speed: 120, damage: 1,
    scale: 1.8, body: [16, 24], offset: [8, 8],
    // Perseguição / arraste
    detectRange: 240,     // distância para começar a perseguir
    chaseSpeed: 150,      // velocidade ao perseguir
    carrySpeed: 120,      // velocidade ao carregar o jogador
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

    // Limites de patrulha e "casa" (para onde volta após perseguir)
    this.leftX = leftX;
    this.rightX = rightX;
    this.homeX = x;
    this.homeY = y;
    this.speed = def.speed;

    // ── Estado do trote (máquina de estados) ─────────────────────────────
    // 'patrol' → 'chase' → 'carry' → 'return' → 'patrol'
    this.state = 'patrol';
    this.carrying = null;      // referência ao jogador enquanto carrega
    this.grabReadyAt = 0;      // timestamp em que pode agarrar de novo
    this.targetTrapX = x;      // X da beira da armadilha alvo
    this.pitDir = 1;           // direção do arremesso (para dentro do buraco)
    this.carryDeadline = 0;    // desiste de carregar se demorar demais

    // ── Estado da ressaca ────────────────────────────────────────────────
    // Escalona o primeiro cuspe para não saírem todos juntos
    this.nextShot = (scene.time?.now ?? 0) + 800 + (x % 700);

    this.play(def.anim);
    this.setVelocityX(this.speed);
  }

  update() {
    if (!this.active) return;

    // Segurança: se caiu num buraco enquanto perseguia, volta para casa
    const worldH = this.scene.physics.world.bounds.height;
    if (this.y > worldH + 80) { this._resetHome(); return; }

    if (this.type === 'trote') this._updateTrote();
    else                       this._updateRessaca();
  }

  // ── Patrulha simples entre leftX e rightX ──────────────────────────────
  // O sprite "olha" para a esquerda por padrão; flipX = true vira para a direita.
  // A velocidade é REAFIRMADA todo frame (não só ao virar) — sem isso, uma
  // colisão contra a emenda entre dois blocos de chão pode zerar a velocidade
  // e deixar o inimigo "grudado" no lugar até a próxima vez que ele alcançasse
  // um limite (o que podia nunca acontecer).
  _patrol() {
    if (this._dir === undefined) this._dir = 1;   // direção inicial: direita

    if (this.x <= this.leftX || this.body.blocked.left) {
      this._dir = 1;
      this.setFlipX(true);
    } else if (this.x >= this.rightX || this.body.blocked.right) {
      this._dir = -1;
      this.setFlipX(false);
    }
    this.setVelocityX(this._dir * this.speed);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  TROTE (galinha) — perseguir / agarrar / carregar / arremessar
  // ════════════════════════════════════════════════════════════════════════
  _updateTrote() {
    const p = this.scene.player;
    const now = this.scene.time.now;

    switch (this.state) {
      // Patrulhando: se o jogador chega perto (e no mesmo nível), começa a caça
      case 'patrol': {
        this._patrol();
        if (p && p.isAlive && now > this.grabReadyAt) {
          const dx = p.x - this.x, dy = p.y - this.y;
          if (Math.abs(dx) < this.def.detectRange && Math.abs(dy) < 90) {
            this.state = 'chase';
          }
        }
        break;
      }

      // Perseguindo: corre na direção do jogador (só no chão, para não cair)
      case 'chase': {
        if (!p || !p.isAlive) { this.state = 'return'; break; }
        const dx = p.x - this.x, dy = p.y - this.y;
        // Desiste se o jogador escapar para longe ou para outro nível
        if (Math.abs(dx) > this.def.detectRange * 1.6 || Math.abs(dy) > 150) {
          this.state = 'return'; break;
        }
        const dir = dx < 0 ? -1 : 1;
        this.setFlipX(dir > 0);
        this.setVelocityX(this.body.blocked.down ? dir * this.def.chaseSpeed : 0);
        break;
      }

      // Carregando: leva o jogador até a beira da armadilha e joga dentro
      case 'carry': {
        if (!this.carrying) { this.state = 'return'; break; }
        const dir = this.targetTrapX < this.x ? -1 : 1;
        this.setVelocityX(dir * this.def.carrySpeed);
        this.setFlipX(dir > 0);
        // mantém o jogador preso logo acima da galinha
        this.carrying.setPosition(this.x, this.y - 20);
        this.carrying.setVelocity(0, 0);
        if (Math.abs(this.x - this.targetTrapX) < 12 || now > this.carryDeadline) {
          this._throw();
        }
        break;
      }

      // Voltando para o ponto de origem, depois retoma a patrulha
      case 'return': {
        const dir = this.homeX < this.x ? -1 : 1;
        this.setVelocityX(this.body.blocked.down ? dir * this.speed : 0);
        this.setFlipX(dir > 0);
        if (Math.abs(this.x - this.homeX) < 20) {
          this.state = 'patrol';
          this.setVelocityX(this.speed);
        }
        break;
      }
    }
  }

  // A cena (overlap jogador×inimigo) pergunta se esta galinha pode agarrar agora
  canGrab() {
    return this.type === 'trote'
        && (this.state === 'patrol' || this.state === 'chase')
        && !this.carrying
        && this.scene.time.now > this.grabReadyAt;
  }

  // Inicia o agarrão: desativa o controle do jogador e escolhe a armadilha alvo
  grab(player) {
    if (!this.canGrab()) return;
    this.state = 'carry';
    this.carrying = player;
    player.grabbed = true;
    player.setVelocity(0, 0);
    player.body.setAllowGravity(false);
    this.targetTrapX = this._nearestTrapEdge();  // também define this.pitDir
    this.carryDeadline = this.scene.time.now + 4000;
    audio.sfx('grab');
  }

  // Descobre a beira da armadilha (buraco com espinhos) mais próxima.
  // Retorna o X onde a galinha deve parar; define pitDir (para onde arremessar).
  _nearestTrapEdge() {
    const traps = this.scene.traps || [];
    const margin = 26;
    let best = null, bestDist = Infinity;
    traps.forEach(t => {
      const cx = (t.x1 + t.x2) / 2;
      const d = Math.abs(cx - this.x);
      if (d < bestDist) { bestDist = d; best = t; }
    });
    if (!best) { this.pitDir = this.flipX ? 1 : -1; return this.x; }
    const cx = (best.x1 + best.x2) / 2;
    if (this.x <= cx) { this.pitDir = 1;  return best.x1 - margin; } // aborda pela esquerda
    this.pitDir = -1; return best.x2 + margin;                       // aborda pela direita
  }

  // Arremessa o jogador para dentro do buraco e volta para casa.
  // O dano e o reposicionamento seguro NÃO dependem de a física acertar o
  // espinho — a trajetória do arremesso podia deixar o jogador na beirada do
  // buraco em vez de dentro, e aí ele nunca tomava dano nem era resgatado.
  // Por isso o impulso é só o efeito visual do "arremesso"; o dano garantido
  // vem logo em seguida, do mesmo jeito que pisar num espinho normalmente.
  _throw() {
    const p = this.carrying;
    this.carrying = null;
    this.state = 'return';
    this.grabReadyAt = this.scene.time.now + 3000;  // "recarga" antes de agarrar de novo
    if (p) {
      p.grabbed = false;
      p.body.setAllowGravity(true);
      p.setVelocity(this.pitDir * 240, -260);   // impulso visual para dentro do buraco
      this.scene.time.delayedCall(280, () => {
        if (p.isAlive) this.scene._hurtAndRespawn();
      });
    }
    audio.sfx('throw');
  }

  // ════════════════════════════════════════════════════════════════════════
  //  RESSACA (zumbi) — cuspir vômito
  // ════════════════════════════════════════════════════════════════════════
  _updateRessaca() {
    this._patrol();
    const p = this.scene.player;
    const now = this.scene.time.now;
    if (p && p.isAlive && now > this.nextShot) {
      const dx = p.x - this.x, dy = p.y - this.y;
      if (Math.abs(dx) < this.def.shootRange && Math.abs(dy) < 130) {
        this.setFlipX(dx > 0);          // vira para o jogador antes de cuspir
        this.scene.spawnVomit(this, p);
        this.nextShot = now + this.def.shootInterval;
      }
    }
  }

  // Volta ao ponto de origem (usado quando cai num buraco enquanto persegue)
  _resetHome() {
    if (this.carrying) this._throw();
    this.setPosition(this.homeX, this.homeY);
    this.setVelocity(0, 0);
    this.state = 'patrol';
  }

  kill() {
    if (!this.active) return;
    // Se estava carregando o jogador, solta antes de morrer
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
