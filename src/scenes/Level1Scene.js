import { Player } from '../entities/Player.js';
import { Enemy }  from '../entities/Enemy.js';
import { Key }    from '../entities/Key.js';
import { Door }   from '../entities/Door.js';
import { CHARACTERS, DEFAULT_CHARACTER } from '../config/characters.js';
import { FONT } from '../config/theme.js';
import { audio } from '../audio/AudioManager.js';

// ── Dimensões do mundo ──────────────────────────────────────────────────
const WORLD_W   = 6400;
const WORLD_H   = 720;
const GROUND    = 640;   // Y do topo do chão
const TILE      = 32;
const GRAVITY   = 1000;

export class Level1Scene extends Phaser.Scene {
  constructor() { super({ key: 'Level1Scene' }); }

  init(data) {
    this.selectedChar = data?.char ?? DEFAULT_CHARACTER;
    this.keysCollected = 0;
    this.totalKeys = 3;
  }

  create() {
    // O emissor de eventos da cena (this.events) SOBREVIVE a scene.restart().
    // Sem isto, cada reinício empilharia mais um listener de 'keyCollected' e
    // 'playerDied' (o antigo continuaria ativo), fazendo o contador de chaves
    // e a lógica de morte disparar várias vezes por evento após cada restart.
    this.events.off('keyCollected');
    this.events.off('playerDied');

    // ── Fundo da fase (clima de calourada) ───────────────────────────────
    this._buildBackground();

    // ── Física e limites ─────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.physics.world.gravity.y = GRAVITY;

    // ── Grupos ───────────────────────────────────────────────────────────
    this.platforms = this.physics.add.staticGroup();
    this.spikes    = this.physics.add.staticGroup();
    this.enemies   = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    this.keyGroup  = this.physics.add.group({ classType: Key, runChildUpdate: false });
    this.vomits    = this.physics.add.group();   // projéteis de vômito da Ressaca

    this._buildLevel();

    // ── Jogador ───────────────────────────────────────────────────────────
    const cfg = CHARACTERS[this.selectedChar];
    this.spawnPoint = { x: 90, y: 560 };
    this.player = new Player(this, this.spawnPoint.x, this.spawnPoint.y, cfg);
    this.checkpoint = { ...this.spawnPoint };

    this.player.cursors = this.input.keyboard.createCursorKeys();
    this.player.wasd    = this.input.keyboard.addKeys({
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up:    Phaser.Input.Keyboard.KeyCodes.W
    });
    this.player.jumpKey    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.player.jumpKey2   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.player.abilityKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    // ── Colisões ──────────────────────────────────────────────────────────
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);

    this.physics.add.overlap(this.player, this.enemies, (pl, en) => {
      if (pl.grabbed) return;                         // já está sendo carregado
      // Galinha (trote) em modo de caça: agarra em vez de só dar dano
      if (en.type === 'trote' && !pl.invincible && en.canGrab()) {
        en.grab(pl);
        return;
      }
      pl.takeDamage(en.damage);
      // empurrão ao tomar dano
      pl.setVelocity((pl.x < en.x ? -1 : 1) * 220, -260);
    });

    // Espinhos: não machucam enquanto o jogador está sendo carregado
    // (o dano vem quando a galinha o joga dentro do buraco)
    this.physics.add.overlap(this.player, this.spikes, () => {
      if (this.player.grabbed) return;
      this._hurtAndRespawn();
    });

    // Vômito acerta o jogador → fica enjoado (10s)
    this.physics.add.overlap(this.player, this.vomits, (pl, v) => {
      if (!v.active) return;
      this._splat(v.x, v.y);
      v.destroy();
      pl.applyNausea(10000);
    });
    // Vômito bate no chão/plataforma → espirra e some
    this.physics.add.collider(this.vomits, this.platforms, (v) => {
      this._splat(v.x, v.y);
      v.destroy();
    });

    this.physics.add.overlap(this.player, this.keyGroup, (_p, k) => k.collect());
    this.events.on('keyCollected', () => {
      this.keysCollected++;
      audio.sfx('key');
      this._updateKeysHUD();
      if (this.keysCollected >= this.totalKeys) this.door.open();
    });

    // ── Porta ─────────────────────────────────────────────────────────────
    this.door = new Door(this, WORLD_W - 130, GROUND - 26, this.totalKeys);
    this.physics.add.overlap(this.player, this.door, () => {
      if (this.door.tryEnter(this.keysCollected)) {
        audio.sfx('door');
        this.scene.start('Level2Scene', { char: this.selectedChar });
      }
    });

    // ── Câmera ──────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // ── HUD + pausa ─────────────────────────────────────────────────────────
    this._buildHUD();
    // ESC abre o menu de pausa (cena dedicada) e congela a fase
    this.input.keyboard.on('keydown-ESC', () => {
      audio.sfx('select');
      this.scene.launch('PauseScene', { from: 'Level1Scene' });
      this.scene.pause();
    });
    // M alterna o som
    this.input.keyboard.on('keydown-M', () => audio.toggleMute());

    // Música de fundo (garante que esteja tocando)
    audio.unlock();
    audio.startMusic();

    this.events.on('playerDied', () => this._onPlayerDied());
  }

  update(time, delta) {
    // Paralaxe (cada camada move numa velocidade diferente)
    const sx = this.cameras.main.scrollX;
    this.bg.tilePositionX    = sx * 0.10;
    this.cityBg.tilePositionX = sx * 0.30;
    this.player.update(delta);

    // ── Efeito de náusea: câmera balançando (jogador tonto) ───────────────
    // Rotação suave em onda + leve zoom (>1 esconde os cantos ao girar).
    const cam = this.cameras.main;
    if (this.player.nauseaTimer > 0) {
      cam.setRotation(Math.sin(time / 90) * 0.02);
      cam.setZoom(1.05 + Math.sin(time / 220) * 0.015);
    } else if (cam.rotation !== 0 || cam.zoom !== 1) {
      cam.setRotation(0);
      cam.setZoom(1);
    }

    // Atualiza checkpoint sempre que estiver pisando em piso sólido.
    // (blocked.down só é true sobre uma plataforma/chão, nunca sobre um buraco,
    //  então o último ponto pisado é sempre seguro para renascer.)
    if (this.player.isAlive && this.player.body.blocked.down) {
      this.checkpoint = { x: this.player.x, y: this.player.y - 6 };
    }

    // Queda no vazio
    if (this.player.isAlive && this.player.y > WORLD_H + 40) this._hurtAndRespawn();
  }

  // ════════════════════════════════════════════════════════════════════════
  //  FUNDO / CENÁRIO (tema Calourada)
  // ════════════════════════════════════════════════════════════════════════
  _buildBackground() {
    const W = this.scale.width, H = this.scale.height;

    // Céu quente em gradiente (início de noite)
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-40);
    sky.fillGradientStyle(0x3a1a5a, 0x3a1a5a, 0x1a1030, 0x1a1030, 1);
    sky.fillRect(0, 0, W, H);

    // Estrelas (paralaxe muito lenta)
    this.bg = this.add.tileSprite(0, 0, W, H, 'star_bg')
      .setOrigin(0, 0).setScrollFactor(0).setTileScale(2).setDepth(-38);

    // Silhueta do campus (prédios com janelas acesas)
    this.cityBg = this.add.tileSprite(0, H - 320, W, 180, 'bg_city')
      .setOrigin(0, 0).setScrollFactor(0).setTileScale(1.4).setDepth(-30);

    // Canhões de luz varrendo o céu (clima de balada/festa)
    this._spotlights(W, H);

    // Confete caindo (festivo, fixo na tela)
    this.add.particles(0, -10, 'confetti', {
      x: { min: 0, max: W }, y: -10,
      lifespan: 7000,
      speedY: { min: 25, max: 60 }, speedX: { min: -15, max: 15 },
      scale: { min: 0.4, max: 0.9 }, rotate: { min: 0, max: 360 },
      tint: [0xff5a5a, 0xffd24a, 0x5ad1ff, 0x6aff8a, 0xff8ad1],
      frequency: 350, quantity: 1
    }).setScrollFactor(0).setDepth(-24);

    // ── Props no mundo (rolam junto com a fase) ──────────────────────────
    // Faixas de boas-vindas
    [[760, 'BEM-VINDOS, CALOUROS!'], [3500, 'CALOURADA 2026'],
     [5600, 'FESTA NO CAMPUS!']].forEach(([x, txt]) => this._banner(x, 150, txt));

    // Caixas de som (palco da festa) ao longo do chão
    [240, 2050, 4050, 6000].forEach(x => this._speaker(x));

    // Balões presos em plataformas
    [[470, 480], [2000, 400], [3278, 245],
     [4738, 315], [5900, 560]].forEach(([x, y]) => this._balloon(x, y));
  }

  // Canhões de luz coloridos varrendo o céu (fixos na tela)
  _spotlights(W, H) {
    const beams = [
      { x: W * 0.15, color: 0xff3a7a, from: -28, to: 18 },
      { x: W * 0.40, color: 0x3a9bff, from: 22,  to: -20 },
      { x: W * 0.62, color: 0x6aff8a, from: -18, to: 26 },
      { x: W * 0.85, color: 0xffd24a, from: 20,  to: -24 },
    ];
    beams.forEach((b, i) => {
      const g = this.add.graphics({ x: b.x, y: H + 10 })
        .setScrollFactor(0).setDepth(-28).setBlendMode(Phaser.BlendModes.ADD);
      // cone apontando para cima (apex na base da tela)
      g.fillStyle(b.color, 0.10);
      g.fillTriangle(0, 0, -70, -(H + 20), 70, -(H + 20));
      g.fillStyle(b.color, 0.06);
      g.fillTriangle(0, 0, -130, -(H + 20), 130, -(H + 20));
      g.setAngle(b.from);
      this.tweens.add({
        targets: g, angle: b.to,
        duration: 2600 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    });
  }

  _banner(x, y, text) {
    const bg = this.add.rectangle(x, y, text.length * 13 + 24, 30, 0x8e2b2b)
      .setStrokeStyle(2, 0xf1c40f).setDepth(-12);
    this.add.text(x, y, text, {
      fontFamily: FONT, fontSize: '11px', color: '#ffe8b0'
    }).setOrigin(0.5).setDepth(-11);
    // Cordas longas subindo para fora da tela (parecem presas a postes acima)
    const g = this.add.graphics().setDepth(-13);
    g.lineStyle(2, 0xb0aa90, 0.5);
    const topY = y - 320;   // bem acima do topo do viewport
    g.lineBetween(x - bg.width / 2, y - 15, x - bg.width / 2 - 70, topY);
    g.lineBetween(x + bg.width / 2, y - 15, x + bg.width / 2 + 70, topY);
    // pequenas bandeirinhas penduradas nas cordas (festa)
    const colors = [0xff5a5a, 0xffd24a, 0x5ad1ff, 0x6aff8a];
    for (let i = 1; i <= 5; i++) {
      const t = i / 6;
      const fx = (x - bg.width / 2) + (-70) * t;
      const fy = (y - 15) + (topY - (y - 15)) * t;
      this.add.triangle(fx, fy, 0, 0, 10, 0, 5, 12, colors[i % colors.length], 0.9).setDepth(-13);
      const fx2 = (x + bg.width / 2) + (70) * t;
      this.add.triangle(fx2, fy, 0, 0, 10, 0, 5, 12, colors[(i + 1) % colors.length], 0.9).setDepth(-13);
    }
  }

  // Caixa de som de palco (corpo + cones dos alto-falantes)
  _speaker(x) {
    const g = this.add.graphics().setDepth(-8);
    const top = GROUND - 92, w = 44, h = 92;
    // corpo
    g.fillStyle(0x1a1a22, 1);
    g.fillRect(x - w / 2, top, w, h);
    g.fillStyle(0x2c2c3a, 1);
    g.fillRect(x - w / 2 + 3, top + 3, w - 6, h - 6);
    // alto-falante grande (woofer)
    g.fillStyle(0x111118, 1); g.fillCircle(x, top + 56, 15);
    g.fillStyle(0x3a3a48, 1);  g.fillCircle(x, top + 56, 9);
    g.fillStyle(0x111118, 1);  g.fillCircle(x, top + 56, 3);
    // tweeter pequeno
    g.fillStyle(0x111118, 1); g.fillCircle(x, top + 22, 7);
    g.fillStyle(0x3a3a48, 1);  g.fillCircle(x, top + 22, 4);
    // luzinha de status
    g.fillStyle(0x6aff8a, 1); g.fillCircle(x + w / 2 - 6, top + 8, 2);
  }

  _balloon(x, y) {
    const colors = [0xff5a5a, 0x5ad1ff, 0x6aff8a, 0xffd24a, 0xff8ad1];
    const c = colors[(x + y) % colors.length];
    const balloon = this.add.container(x, y).setDepth(-6);
    const body = this.add.ellipse(0, 0, 18, 24, c);
    const shine = this.add.ellipse(-4, -6, 5, 7, 0xffffff, 0.5);
    const g = this.add.graphics();
    g.lineStyle(1, 0xcccccc, 0.7); g.lineBetween(0, 12, 0, 34);
    balloon.add([g, body, shine]);
    this.tweens.add({
      targets: balloon, y: y - 12, duration: 1800 + (x % 600),
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  CONSTRUÇÃO DO NÍVEL
  // ════════════════════════════════════════════════════════════════════════
  _buildLevel() {
    // -- chão em segmentos (entre eles há buracos) --
    const floor = [
      [0, 1300], [1560, 2500], [2760, 3700], [3960, 5000], [5260, WORLD_W]
    ];
    floor.forEach(([a, b]) => this._addFloor(a, b));

    // -- pilares no meio dos buracos (pedras de passagem) --
    [[1398, 2], [2598, 2], [3798, 2], [5098, 2]].forEach(([x, t]) =>
      this._addPlatform(x, GROUND, t));

    // -- spikes no fundo de cada buraco --
    const pits = [[1300, 1560], [2500, 2760], [3700, 3960], [5000, 5260]];
    pits.forEach(([a, b]) => this._addSpikes(a, b, 688));

    // Armadilhas: as galinhas (trote) carregam o jogador até a beira destes
    // buracos e o jogam dentro. Guardamos os intervalos X para o Enemy escolher
    // a armadilha mais próxima.
    this.traps = pits.map(([x1, x2]) => ({ x1, x2 }));

    // -- spikes de superfície (obstáculos a pular) --
    this._addSpikes(4380, 4460, 608);
    this._addSpikes(5600, 5690, 608);

    // ── SEÇÃO A — rota alta para a Chave 1 ──────────────────────────────
    this._addPlatform(420, 520, 3);
    this._addPlatform(640, 430, 3);
    this._addPlatform(860, 370, 3);
    this._addKey(908, 320);

    // ── SEÇÃO B — rota alta alternativa (atalho sobre inimigos) ─────────
    this._addPlatform(1700, 510, 3);
    this._addPlatform(1920, 470, 3);
    this._addPlatform(2140, 470, 3);

    // ── SEÇÃO C — rota alta para a Chave 2 (guardada) ───────────────────
    this._addPlatform(2860, 520, 3);
    this._addPlatform(3060, 420, 3);
    this._addPlatform(3260, 330, 3);
    this._addKey(3308, 285);

    // ── SEÇÃO D — escalada difícil até a Chave 3 ────────────────────────
    this._addPlatform(4060, 540, 3);
    this._addPlatform(4280, 470, 3);
    this._addPlatform(4500, 470, 3);
    this._addPlatform(4720, 400, 3);
    this._addKey(4768, 355);

    // ── Inimigos ─────────────────────────────────────────────────────────
    this._addEnemy(350,  GROUND - 30, 160,  640,  'ressaca');
    this._addEnemy(1050, GROUND - 30, 900,  1250, 'trote');
    this._addEnemy(1965, 440,         1935, 2000, 'ressaca');   // sobre plataforma HB2
    this._addEnemy(1800, GROUND - 30, 1620, 2100, 'trote');
    this._addEnemy(3105, 390,         3075, 3140, 'ressaca');   // guarda da Chave 2 (HC2)
    this._addEnemy(3000, GROUND - 30, 2820, 3200, 'trote');
    this._addEnemy(3500, GROUND - 30, 3300, 3650, 'ressaca');
    this._addEnemy(4545, 440,         4515, 4580, 'trote');     // sobre plataforma HD3
    this._addEnemy(4200, GROUND - 30, 3990, 4360, 'ressaca');
    this._addEnemy(4800, GROUND - 30, 4620, 4960, 'trote');
    this._addEnemy(5450, GROUND - 30, 5300, 5560, 'ressaca');
    this._addEnemy(6000, GROUND - 30, 5720, 6150, 'trote');
  }

  _addFloor(xStart, xEnd) {
    for (let x = xStart; x < xEnd; x += TILE) {
      this.platforms.create(x + TILE / 2, GROUND + TILE / 2, 'floor_tile').refreshBody();
    }
  }

  _addPlatform(xLeft, topY, tiles) {
    for (let i = 0; i < tiles; i++) {
      this.platforms.create(xLeft + i * TILE + TILE / 2, topY + TILE / 2, 'platform_tile').refreshBody();
    }
  }

  _addSpikes(xStart, xEnd, topY) {
    for (let x = xStart; x < xEnd; x += TILE) {
      const s = this.spikes.create(x + TILE / 2, topY + TILE / 2, 'spike_tile');
      s.body.setSize(24, 16).setOffset(4, 14);
      s.refreshBody();
    }
  }

  _addEnemy(x, y, leftX, rightX, type) {
    this.enemies.add(new Enemy(this, x, y, leftX, rightX, type), true);
  }

  // Cria um projétil de vômito saindo da "boca" do zumbi em direção ao jogador.
  // Tem gravidade (faz um arco) e some ao bater no chão ou após um tempo.
  spawnVomit(enemy, player) {
    const dir = player.x >= enemy.x ? 1 : -1;
    const v = this.vomits.create(enemy.x + dir * 14, enemy.y - 6, 'vomit');
    v.setDepth(12);
    v.body.setAllowGravity(true);
    v.body.setSize(10, 12);
    v.setVelocity(dir * 260, -180);   // arremesso em arco
    audio.sfx('vomit');
    this.time.delayedCall(2600, () => { if (v.active) v.destroy(); });
  }

  // Espirro do vômito ao acertar algo
  _splat(x, y) {
    const s = this.add.particles(x, y, 'vomit', {
      lifespan: 350, speed: { min: 40, max: 120 },
      scale: { start: 0.6, end: 0 }, quantity: 6, gravityY: 300
    }).setDepth(12);
    s.explode(6, x, y);
    this.time.delayedCall(400, () => s.destroy());
  }

  _addKey(x, y) {
    this.keyGroup.add(new Key(this, x, y), true);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  HUD
  // ════════════════════════════════════════════════════════════════════════
  _buildHUD() {
    // Painel de fundo do HUD
    this.add.rectangle(0, 0, this.scale.width, 52, 0x000000, 0.4)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(40);

    // Chave (ícone + contador)
    this.add.image(24, 26, 'key_sprite').setScrollFactor(0).setDepth(41).setScale(0.9);
    this.hudKeys = this.add.text(40, 18, `${this.keysCollected}/${this.totalKeys}`, {
      fontFamily: FONT, fontSize: '16px', color: '#f1c40f'
    }).setScrollFactor(0).setDepth(41);

    // Corações
    this.hearts = [];
    for (let i = 0; i < this.player.maxHp; i++) {
      const h = this.add.image(130 + i * 30, 26, 'heart_full')
        .setScrollFactor(0).setDepth(41);
      this.hearts.push(h);
    }

    // Fase (centro)
    this.add.text(this.scale.width / 2, 16, 'FASE 1 - CALOURADA', {
      fontFamily: FONT, fontSize: '12px', color: '#ffffff'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(41);

    // Habilidade (direita)
    this.hudAbility = this.add.text(this.scale.width - 16, 18,
      `[F] ${CHARACTERS[this.selectedChar].ability}`, {
        fontFamily: FONT, fontSize: '10px', color: '#2ecc71', align: 'right'
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(41);

    // Dica de pausa
    this.add.text(this.scale.width - 16, this.scale.height - 14, '[ESC] PAUSA', {
      fontFamily: FONT, fontSize: '9px', color: '#5d6d7e'
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(41);

    // Polling do HUD
    this.time.addEvent({
      delay: 100, loop: true, callback: () => {
        this._updateHeartsHUD();
        this._updateAbilityHUD();
      }
    });
  }

  _updateKeysHUD() {
    this.hudKeys.setText(`${this.keysCollected}/${this.totalKeys}`);
  }

  _updateHeartsHUD() {
    this.hearts.forEach((h, i) => {
      h.setTexture(i < this.player.hp ? 'heart_full' : 'heart_empty');
    });
  }

  _updateAbilityHUD() {
    const cd = this.player.abilityCooldown;
    const ab = CHARACTERS[this.selectedChar].ability;
    if (cd > 0) {
      this.hudAbility.setText(`[F] ${(cd / 1000).toFixed(1)}s`).setColor('#e74c3c');
    } else {
      this.hudAbility.setText(`[F] ${ab}`).setColor('#2ecc71');
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  DANO / RESPAWN
  // ════════════════════════════════════════════════════════════════════════
  _hurtAndRespawn() {
    if (!this.player.isAlive || this.player.invincible) return;
    this.player.takeDamage(1);   // tira 1 coração (não cura)
    this.cameras.main.shake(200, 0.012);
    if (this.player.isAlive) {
      // Limpa estados especiais para não renascer enjoado/agarrado
      this.player.nauseaTimer = 0;
      this.player.grabbed = false;
      this.player.body.setAllowGravity(true);
      this.player.clearTint();
      this.cameras.main.setRotation(0);
      this.cameras.main.setZoom(1);
      this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
      this.player.setVelocity(0, 0);
    }
  }

  _onPlayerDied() {
    audio.sfx('die');
    audio.stopMusic();
    this.cameras.main.shake(400, 0.02);
    this.cameras.main.fade(700, 0, 0, 0);
    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', { char: this.selectedChar });
    });
  }
}
