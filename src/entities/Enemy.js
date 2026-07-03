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
  sono_acumulado: {
    // tira 4×1: frame = 225×564
    sheet: 'enemy_sono_acumulado', anim: 'sono-acumulado-float', speed: 65, damage: 1, hp: 1,
    scale: 0.10, body: [120, 300], offset: [52, 132], isFloating: true,
    appliesSlow: true, isSonoAcumulado: true
  },
  tcc_mob: {
    // tira 4×1: frame = 236×308
    sheet: 'enemy_tcc_mob', anim: 'tcc-mob-run', speed: 85, damage: 1, hp: 2,
    scale: 0.22, body: [160, 240], offset: [38, 34]
  },
  boss_tcc: {
    // grade 2×2: frame = 495×472
    sheet: 'boss_tcc', anim: 'boss-tcc-float', speed: 80, damage: 1, hp: 10,
    scale: 0.28, body: [350, 380], offset: [72, 46], isFloating: true,
    isBoss: true
  },
  boss_banca: {
    // grade 2×2: frame = 504×454
    sheet: 'boss_banca', anim: 'boss-banca-float', speed: 0, damage: 1, hp: 10,
    scale: 0.28, body: [400, 380], offset: [52, 37], isFloating: true,
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

    // Período de graça: nos primeiros instantes após o inimigo aparecer
    // (= início da fase, pra quem já nasce em cena) ele não pode detectar/
    // perseguir o jogador. Sem isto, um inimigo que nasce perto do ponto de
    // spawn do jogador (ex.: os dois "trabalho em grupo" logo na entrada da
    // Fase 2) já começa perseguindo no frame 1, sem o jogador ter tido
    // qualquer chance de reagir ou se afastar.
    //
    // Contagem em FRAMES (não em `scene.time.now`): a Clock de uma cena
    // (`this.scene.time`) é o MESMO objeto reaproveitado toda vez que a
    // cena reinicia (morrer e "Tentar Novamente", ou trocar de fase no
    // Modo Dev) — ela não zera sozinha. Um inimigo recém-criado no
    // reinício leria `scene.time.now` como o valor "congelado" de quando a
    // cena rodou por último, e a comparação com o tempo atual (bem maior)
    // já apareceria acima de 1200ms imediatamente, sem graça nenhuma. Contar
    // frames em vez de tempo absoluto não depende de nenhum relógio
    // acumulado — sempre começa do zero a cada `new Enemy(...)`.
    this.spawnGraceFrames = 70; // ~1.2s a 60fps
  }

  // Só pode perseguir/alertar depois do período de graça pós-spawn.
  _canAggro() {
    return this.spawnGraceFrames <= 0;
  }

  update() {
    if (!this.active) return;

    if (this.spawnGraceFrames > 0) this.spawnGraceFrames--;

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
    else if (this.type === 'sono_acumulado') this._updateSonoAcumulado();
    else if (this.type === 'tcc_mob') this._updateTccMob();
    else if (this.type === 'boss_tcc') this._updateBossTcc();
    else if (this.type === 'boss_banca') this._updateBossBanca();
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
        if (p && p.isAlive && now > this.grabReadyAt && this._canAggro()) {
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
    const p = this.scene.player;
    const dist = (p && p.isAlive)
      ? Math.hypot(p.x - this.x, p.y - this.y) : Infinity;
    const chasing = this._canAggro() && dist < 350;

    if (chasing) {
      // Persegue: ângulo livre (2D), "puxado" aos poucos em direção ao
      // jogador mas nunca perfeitamente — mais devagar que o trabalho em
      // grupo (this.speed já é menor, 50 vs 75). O alcance vertical aqui é
      // maior (220) porque precisa poder ir atrás do jogador entre
      // plataformas vizinhas.
      const t = this.scene.time.now / 1200;
      this._sonoWanderAngle += 0.018 * Math.sin(t); // deriva o ângulo vagarosamente
      const targetAngle = Math.atan2(p.y - this.y, p.x - this.x);
      const diff = targetAngle - this._sonoWanderAngle;
      this._sonoWanderAngle += Math.sign(Math.sin(diff)) * 0.06;

      const vx = Math.cos(this._sonoWanderAngle) * this.speed;
      const vy = Math.sin(this._sonoWanderAngle) * this.speed * 0.6;
      this.setVelocity(vx, vy);
      this.setFlipX(vx < 0);

      if (this.x < this.leftX || this.x > this.rightX) {
        this._sonoWanderAngle = Math.PI - this._sonoWanderAngle;
      }
      if (this.y < this.homeY - 220) this._sonoWanderAngle = Math.abs(this._sonoWanderAngle) % (Math.PI * 2);
      if (this.y > this.homeY + 220) this._sonoWanderAngle = -Math.abs(this._sonoWanderAngle);
      return;
    }

    // Parado (não perseguindo): deriva horizontal + balanço vertical
    // DESACOPLADOS, em vez de um ângulo livre girando 360°.
    // Motivo: com o ângulo livre, de vez em quando ele apontava quase
    // reto pra cima/baixo — e como o alcance vertical parado é bem
    // pequeno (20px, ver nota abaixo sobre o porquê), o fantasma batia
    // nos dois limites verticais em frações de segundo, obrigando a
    // correção a inverter o sinal o tempo todo. Isso não mexe na
    // velocidade horizontal em si (cos(ângulo) é igual pra ângulo e
    // -ângulo), mas quando o ângulo fica perto de ±90°, vx fica bem perto
    // de zero e seu SINAL some/inverte por causa de arredondamento —
    // e `setFlipX(vx < 0)` virava o sprite de lado a cada frame,
    // parecendo "piscar" de um lado pro outro sem se mover de verdade.
    // Desacoplado assim, vx nunca chega perto de zero (fica sempre em
    // ±50% da velocidade) e o balanço vertical é uma senoide pura, sem
    // limite artificial pra "bater" e reverter de repente.
    if (this._sonoIdleDir === undefined) this._sonoIdleDir = this.flipX ? -1 : 1;
    const vx = this._sonoIdleDir * this.speed * 0.5;
    const vy = Math.sin(this.scene.time.now / 900) * this.speed * 0.35;
    this.setVelocity(vx, vy);
    this.setFlipX(vx < 0);
    this._sonoWanderAngle = Math.atan2(vy, vx); // mantém coerente pra quando começar a perseguir

    if (this.x <= this.leftX) { this._sonoIdleDir = 1;  this.setFlipX(false); }
    else if (this.x >= this.rightX) { this._sonoIdleDir = -1; this.setFlipX(true); }

    // Alcance vertical parado bem pequeno (só a senoide, ±35% da velocidade
    // já garante isso) — a folga mínima entre o posto do fantasma e a
    // plataforma que ele guarda é só 60px (Seção 3 do abismo aéreo), e o
    // SPRITE do sono é bem maior que a hitbox física dele: metade da altura
    // do frame sozinha já são ~38px (frame 272px × escala 0.28 ÷ 2). Testado
    // com `sprite.getBounds()` (desenho inteiro, não só a hitbox): sem
    // sobreposição em nenhum dos 6 fantasmas do nível.
  }

  _updateTrabalho() {
    const p = this.scene.player;
    if (p && p.isAlive && this._canAggro() && Math.abs(p.x - this.x) < 380 && Math.abs(p.y - this.y) < 120) {
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
    // Sono Acumulado: Fantasma mais rápido e agressivo
    const t = this.scene.time.now / 1000;
    this._sonoWanderAngle += 0.024 * Math.sin(t);

    const p = this.scene.player;
    const dist = (p && p.isAlive) ? Math.hypot(p.x - this.x, p.y - this.y) : Infinity;
    const chasing = this._canAggro() && dist < 420; // Maior detecção (420 vs 350)

    if (chasing) {
      const targetAngle = Math.atan2(p.y - this.y, p.x - this.x);
      const diff = targetAngle - this._sonoWanderAngle;
      this._sonoWanderAngle += Math.sign(Math.sin(diff)) * 0.08; // Curva mais rápido
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
    // TCC Comum: terrestre rápido
    const p = this.scene.player;
    if (p && p.isAlive && this._canAggro() && Math.abs(p.x - this.x) < 400 && Math.abs(p.y - this.y) < 130) {
      const dx = p.x - this.x;
      const dir = Math.sign(dx) || 1;
      const groundAhead = this._isGroundAhead(dir);
      if (groundAhead || !this.body.blocked.down) {
        this.setVelocityX(dir * 190); // Corre muito rápido (190 vs 175)
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
    // Chefão TCC: Flutua na arena em zigue-zague
    const t = this.scene.time.now;
    
    // Movimento flutuante em zigue-zague
    const targetY = this.homeY + Math.sin(t / 800) * 80;
    this.setVelocityY((targetY - this.y) * 4);

    // Patrulha horizontal de arena
    this._patrol();

    // Atira no jogador
    const p = this.scene.player;
    if (p && p.isAlive && t > (this.nextShot ?? 0)) {
      const dist = Math.hypot(p.x - this.x, p.y - this.y);
      if (dist < 600) {
        if (this.scene.spawnBossProjectile) {
          this.scene.spawnBossProjectile(this, 'tcc');
        }
        this.nextShot = t + 1400; // Recarrega
      }
    }
  }

  _updateBossBanca() {
    // Chefão Banca Avaliadora: Flutua levemente na cadeira/mesa (estacionário no X)
    const t = this.scene.time.now;
    
    const targetY = this.homeY + Math.sin(t / 1200) * 20;
    this.setVelocityY((targetY - this.y) * 2);
    this.setVelocityX(0);

    // Vira para o jogador
    const p = this.scene.player;
    if (p && p.isAlive) {
      this.setFlipX(p.x < this.x);

      // Atira no jogador
      if (t > (this.nextShot ?? 0)) {
        const dist = Math.hypot(p.x - this.x, p.y - this.y);
        if (dist < 700) {
          if (this.scene.spawnBossProjectile) {
            this.scene.spawnBossProjectile(this, 'banca');
          }
          this.nextShot = t + 1800; // Recarrega
        }
      }
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
