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
  sono: {
    sheet: 'enemy_sono', anim: 'sono-float', speed: 50, damage: 1, hp: 1,
    // Escala menor: ~35px de altura visual (fantasma discreto)
    scale: 0.28, body: [80, 120], offset: [83, 76], isFloating: true,
    appliesSlow: true
  },
  trabalho: {
    // grade 2×2: frame = 438×379 → visual ~70px de altura
    sheet: 'enemy_trabalho', anim: 'trabalho-run', speed: 75, damage: 1, hp: 2,
    scale: 0.16, body: [340, 300], offset: [48, 50]
  },
  calculo: {
    // tira 4×1: frame = 233×298 → visual ~60px de altura
    sheet: 'enemy_calculo', anim: 'calculo-float', speed: 90, damage: 1, hp: 1,
    scale: 0.22, body: [180, 230], offset: [26, 34], isFloating: true
  },
  prova: {
    // grade 2×2: frame = 412×430 → visual ~55px de altura
    sheet: 'enemy_prova', anim: 'prova-float', speed: 75, damage: 2, hp: 4,
    scale: 0.18, body: [300, 330], offset: [56, 50], isFloating: true
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
    this.hp = def.hp ?? 1;

    if (def.isFloating) {
      this.body.setAllowGravity(false);
    }

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

    // ── Estado do Cálculo: padrão de movimento (atribuído no construtor) ─────
    // 0 = horizontal (só patrulha), 1 = vertical (sobe/desce), 2 = círculo
    this.startY = y;
    this.calcPattern = (Math.floor(x / 200)) % 3; // varia por posição no mundo
    this._sonoWanderAngle = Math.random() * Math.PI * 2; // ângulo inicial do errante

    if (def.anim) this.play(def.anim);
    this.setVelocityX(this.speed);
  }

  update() {
    if (!this.active) return;

    // Inimigos flutuantes (sono/cálculo/prova) tem a gravidade desligada no
    // construtor, mas `group.add()` (chamado logo depois, em _addEnemy) a
    // REATIVA silenciosamente ao registrar o body no grupo de física — sem
    // isto aqui, eles caem lentamente pela tela inteira até sumirem no vazio
    // ou afundarem no chão. Reafirma todo frame por segurança (é barato:
    // só troca a flag se já não estiver no valor certo).
    if (this.def.isFloating && this.body.allowGravity) {
      this.body.setAllowGravity(false);
    }

    // Segurança: se caiu num buraco enquanto perseguia, volta para casa
    const worldH = this.scene.physics.world.bounds.height;
    if (this.y > worldH + 80) { this._resetHome(); return; }

    if (this.type === 'trote') this._updateTrote();
    else if (this.type === 'sono') this._updateSono();
    else if (this.type === 'trabalho') this._updateTrabalho();
    else if (this.type === 'calculo') this._updateCalculo();
    else if (this.type === 'prova') this._updateProva();
    else                       this._updateRessaca();
  }

  // Detecção de borda genérica: existe chão logo à frente na direção `dir`
  // (+1/-1)? Usada por qualquer inimigo terrestre em qualquer estado (patrulha
  // OU perseguição) pra não correr pra dentro de um buraco. Sempre true para
  // inimigos flutuantes (não têm chão pra checar).
  _isGroundAhead(dir) {
    if (this.def.isFloating) return true;
    const checkX = this.x + dir * (this.width * this.scaleX * 0.6);
    // Usa a base REAL do hitbox (body.bottom) + uma margem pequena, em vez de
    // um deslocamento fixo a partir de this.y — um valor fixo (ex: "+20")
    // funciona só pra inimigos do tamanho do trote/ressaca; num inimigo bem
    // maior (trabalho) o ponto de checagem ficava flutuando alguns pixels
    // ACIMA do topo da plataforma, nunca batendo em nenhum tile — a checagem
    // sempre dava "sem chão" nos dois sentidos e o inimigo travava no lugar.
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

  // Patrulha com detecção de borda (não cai em buracos)
  _patrol() {
    if (this._dir === undefined) this._dir = 1;

    // Detecção de borda: verifica se há chão à frente antes de avançar
    // (só importa quando o inimigo está apoiado no chão)
    if (this.body.blocked.down && !this._isGroundAhead(this._dir)) {
      this._dir *= -1; // vira antes de cair
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

      // Perseguindo: corre na direção do jogador, mas para na beirada de um
      // buraco em vez de cair perseguindo (mesma checagem da patrulha).
      case 'chase': {
        if (!p || !p.isAlive) { this.state = 'return'; break; }
        const dx = p.x - this.x, dy = p.y - this.y;
        // Desiste se o jogador escapar para longe ou para outro nível
        if (Math.abs(dx) > this.def.detectRange * 1.6 || Math.abs(dy) > 150) {
          this.state = 'return'; break;
        }
        const dir = dx < 0 ? -1 : 1;
        this.setFlipX(dir > 0);
        const canAdvance = this.body.blocked.down && this._isGroundAhead(dir);
        this.setVelocityX(canAdvance ? dir * this.def.chaseSpeed : 0);
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
    this.targetTrapX = this._nearestTrapEdge();  // também define pitDir/throwTarget*
    this.carryDeadline = this.scene.time.now + 4000;
    audio.sfx('grab');
  }

  // Descobre a beira da armadilha (buraco com espinhos) mais próxima.
  // Retorna o X onde a galinha deve parar (perto da beira, ainda em piso
  // sólido) e define pitDir + o ponto exato (dentro do buraco, em cima do
  // espinho) para onde o jogador será jogado — ver _throw().
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
    // Mira a ~28% da largura do buraco a partir da beira de entrada — bem
    // dentro da área de espinhos, mas antes da pedra de passagem no meio.
    if (this.x <= cx) {
      this.pitDir = 1;
      this.throwTargetX = best.x1 + pitWidth * 0.28;
      return best.x1 - margin;                    // aborda pela esquerda
    }
    this.pitDir = -1;
    this.throwTargetX = best.x2 - pitWidth * 0.28;
    return best.x2 + margin;                       // aborda pela direita
  }

  // Arremessa o jogador para DENTRO do buraco, em cima dos espinhos de verdade
  // (não um impulso de física que podia deixar ele na beirada — o próprio
  // atrito do Player.update() matava a velocidade do arremesso no meio do
  // caminho). Um tween controla a posição diretamente até o ponto calculado
  // em _nearestTrapEdge(); só ao chegar lá o dano acontece e o jogador é
  // levado para a última área segura pisada (mesmo efeito de pisar num
  // espinho normalmente).
  _throw() {
    const p = this.carrying;
    this.carrying = null;
    this.state = 'return';
    this.grabReadyAt = this.scene.time.now + 3000;  // "recarga" antes de agarrar de novo
    audio.sfx('throw');
    if (!p) return;

    // p.grabbed continua true durante o arremesso: Player.update() fica
    // pausado (sem gravidade/atrito brigando com o tween) até o pouso.
    this.scene.tweens.add({
      targets: p,
      x: this.throwTargetX,
      y: 705,                 // dentro da hitbox do espinho (topo do buraco = 688)
      duration: 380,
      ease: 'Cubic.easeIn',   // acelera "caindo" nos espinhos
      onComplete: () => {
        p.grabbed = false;
        p.body.setAllowGravity(true);
        p.setVelocity(0, 0);
        if (p.isAlive) this.scene._hurtAndRespawn();
      }
    });
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

  // ════════════════════════════════════════════════════════════════════════
  //  INIMIGOS FASE 2
  // ════════════════════════════════════════════════════════════════════════
  _updateSono() {
    // Fantasma: movimento errante 2D (não em linha reta), voando (sem gravidade
    // — ver update()). Usa um ângulo que vai mudando lentamente de forma
    // senoidal, e é "puxado" aos poucos em direção ao jogador quando perto.
    const t = this.scene.time.now / 1200;
    this._sonoWanderAngle += 0.018 * Math.sin(t); // deriva o ângulo vagarosamente

    const p = this.scene.player;
    const dist = (p && p.isAlive)
      ? Math.hypot(p.x - this.x, p.y - this.y) : Infinity;
    const chasing = dist < 350;

    if (chasing) {
      // Persegue: inclina o ângulo em direção ao jogador, mas nunca perfeitamente
      // — mais devagar que o trabalho em grupo (this.speed já é menor, 50 vs 75).
      const targetAngle = Math.atan2(p.y - this.y, p.x - this.x);
      const diff = targetAngle - this._sonoWanderAngle;
      this._sonoWanderAngle += Math.sign(Math.sin(diff)) * 0.06;
    }

    // Aplica velocidade no ângulo atual
    const vx = Math.cos(this._sonoWanderAngle) * this.speed;
    const vy = Math.sin(this._sonoWanderAngle) * this.speed * 0.6;
    this.setVelocity(vx, vy);
    this.setFlipX(vx < 0);

    // Limites de patrulha: inverte ângulo horizontal se sair da área
    if (this.x < this.leftX || this.x > this.rightX) {
      this._sonoWanderAngle = Math.PI - this._sonoWanderAngle;
    }
    // Limites verticais RELATIVOS ao posto do fantasma (homeY) — sem isto ele
    // "deriva" livre pela tela toda (a versão antiga usava os limites do MUNDO
    // inteiro) e podia acabar lá embaixo, dentro da área de espinhos do abismo,
    // parecendo ter "caído" mesmo estando voando/sem gravidade. Enquanto
    // perseguindo, o alcance é maior (precisa poder ir atrás do jogador entre
    // plataformas vizinhas); parado, fica bem perto do posto.
    //
    // O alcance parado (20) é menor que a folga mínima usada no level design
    // entre o posto do fantasma e a plataforma que ele guarda (60px na Seção
    // 3 do abismo aéreo, 80px nos que ficam sobre o chão — ver Level2Scene.js).
    // Precisa ser bem pequeno porque o SPRITE do sono é bem maior que a
    // hitbox física dele: metade da altura do frame já são ~38px (frame
    // 272px alto × escala 0.28 ÷ 2) — ou seja, mesmo com a hitbox nunca
    // saindo do lugar, o desenho do fantasma (a "cauda" fica pendurada bem
    // abaixo do corpo) já consome quase toda a folga de 60px sozinho.
    // Medido ao vivo: com alcance 35 a cauda ainda entrava ~14px na
    // plataforma; com 20, fica sempre por cima (testado com
    // `sprite.getBounds()`, que reflete o desenho inteiro, não só a hitbox).
    const vRange = chasing ? 220 : 20;
    if (this.y < this.homeY - vRange) this._sonoWanderAngle = Math.abs(this._sonoWanderAngle) % (Math.PI * 2);
    if (this.y > this.homeY + vRange) this._sonoWanderAngle = -Math.abs(this._sonoWanderAngle);
  }

  _updateTrabalho() {
    const p = this.scene.player;
    if (p && p.isAlive && Math.abs(p.x - this.x) < 380 && Math.abs(p.y - this.y) < 120) {
      // Modo ALERTA: persegue com a mesma detecção de borda da patrulha
      // (_isGroundAhead — usa body.bottom, funciona pra qualquer tamanho)
      const dx = p.x - this.x;
      const dir = Math.sign(dx) || 1;
      const groundAhead = this._isGroundAhead(dir);
      if (groundAhead || !this.body.blocked.down) {
        this.setVelocityX(dir * 175);
        this.setFlipX(dx < 0);
        // Pula para alcançar plataformas acima
        if (this.body.blocked.down && p.y < this.y - 30 && Math.random() < 0.025) {
          this.setVelocityY(-380);
        }
      } else {
        // Borda detectada: para na beirada
        this.setVelocityX(0);
      }
    } else {
      this._patrol(); // patrulha com detecção de borda já inclusa
    }
  }

  _updateCalculo() {
    // Padrão de movimento predefinido (atribuído no construtor por posição)
    const t = this.scene.time.now;
    switch (this.calcPattern) {
      case 0: // HORIZONTAL: apenas patrulha esquerda-direita
        this._patrol();
        this.setVelocityY(0); // sem deriva vertical
        break;

      case 1: { // VERTICAL: sobe e desce em volta do startY
        this._patrol();
        const targetY = this.startY + Math.sin(t / 700) * 100;
        this.setVelocityY((targetY - this.y) * 5);
        break;
      }

      case 2: { // CÍRCULO: órbita em torno de (startX, startY)
        const radius = 80;
        const speed  = t / 1100; // rotação lenta
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
    // Mini-chefe: persegue tanto no X quanto no Y (flutua até o jogador)
    const p = this.scene.player;
    if (p && p.isAlive) {
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 550) {
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

  kill() {
    if (!this.active) return;
    // Debounce: algumas habilidades verificam a hitbox várias vezes numa
    // única ativação (o soco do Hugo confere 7 vezes em 210ms; a onda do
    // Berto confere a cada frame por 420ms) — sem isto, um inimigo com mais
    // de 1hp (trabalho, prova) morria de UMA ativação só, gastando todos os
    // hits de uma vez em vez de precisar de ativações separadas. 500ms cobre
    // a duração de qualquer habilidade atual com folga, sem atrapalhar hits
    // de verdade (o cooldown das habilidades é sempre bem maior que isso).
    const now = this.scene.time.now;
    if (this._lastHitAt !== undefined && now - this._lastHitAt < 500) return;
    this._lastHitAt = now;

    if (this.hp > 1) {
      this.hp--;
      this.scene.tweens.add({ targets: this, alpha: 0.3, duration: 90, yoyo: true, repeat: 1, onComplete: () => this.alpha = 1 });
      return;
    }

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
