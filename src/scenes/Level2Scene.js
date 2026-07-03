import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Key } from '../entities/Key.js';
import { Door } from '../entities/Door.js';
import { CHARACTERS, DEFAULT_CHARACTER } from '../config/characters.js';
import { FONT } from '../config/theme.js';
import { audio } from '../audio/AudioManager.js';

const WORLD_W = 6589;   // +189 vs. original — Seção 3 precisou ficar mais larga (ver _buildLevel)
const WORLD_H = 720;
const GROUND = 640;
const TILE = 32;
const GRAVITY = 1000;

export class Level2Scene extends Phaser.Scene {
  constructor() { super({ key: 'Level2Scene' }); }

  init(data) {
    this.selectedChar = data?.char ?? DEFAULT_CHARACTER;
    this.devMode = data?.devMode ?? false;
    this.keysCollected = 0;
    this.totalKeys = 3;
  }

  create() {
    this.events.off('keyCollected');
    this.events.off('playerDied');

    this._buildBackground();

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.physics.world.gravity.y = GRAVITY;

    this.platforms = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    this.keyGroup = this.physics.add.group({ classType: Key, runChildUpdate: false });
    this.vomits = this.physics.add.group();

    this._buildLevel();

    const cfg = CHARACTERS[this.selectedChar];
    this.spawnPoint = { x: 90, y: 560 };
    this.player = new Player(this, this.spawnPoint.x, this.spawnPoint.y, cfg);
    this.player.devMode = this.devMode; // invencível no modo dev
    this.checkpoint = { ...this.spawnPoint };

    this.player.cursors = this.input.keyboard.createCursorKeys();
    this.player.wasd = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W
    });
    this.player.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.player.jumpKey2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.player.abilityKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    this.physics.add.collider(this.player, this.platforms);
    // Inimigos flutuantes (sono/cálculo/prova, ver Enemy.js `isFloating`)
    // voam livremente — não devem colidir com plataformas. Sem este filtro,
    // um fantasma cruzando a borda de uma plataforma ficava "preso"
    // (a física empurrava/zerava a velocidade de volta) mesmo com a
    // gravidade desligada, e a IA tentando corrigir a velocidade todo
    // frame contra essa colisão causava o mesmo tipo de "piscada" visual
    // do bug de flicker já corrigido em _updateSono().
    this.physics.add.collider(this.enemies, this.platforms, null, (enemy) => !enemy.def.isFloating);

    this.physics.add.overlap(this.player, this.enemies, (pl, en) => {
      if (pl.grabbed) return;

      // Efeito do Sono: lentidão profunda (azul) em vez de enjoo
      if (en.type === 'sono' && !pl.invincible) {
        pl.applySlow(4000);
      }

      pl.takeDamage(en.damage);
      pl.setVelocity((pl.x < en.x ? -1 : 1) * 200, -220);
    });

    this.physics.add.overlap(this.player, this.spikes, () => {
      if (this.player.grabbed) return;
      this._hurtAndRespawn();
    });

    this.physics.add.overlap(this.player, this.keyGroup, (_p, k) => k.collect());
    this.events.on('keyCollected', () => {
      this.keysCollected++;
      audio.sfx('key');
      this._updateKeysHUD();
      if (this.keysCollected >= this.totalKeys) this.door.open();
    });

    this.door = new Door(this, WORLD_W - 130, GROUND - 26, this.totalKeys);
    this.physics.add.overlap(this.player, this.door, () => {
      if (this.door.tryEnter(this.keysCollected)) {
        audio.sfx('door');
        this.scene.start('WinScene', { char: this.selectedChar, graduated: false });
      }
    });

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this._buildHUD();
    this.input.keyboard.on('keydown-ESC', () => {
      audio.sfx('select');
      this.scene.launch('PauseScene', { from: 'Level2Scene' });
      this.scene.pause();
    });
    this.input.keyboard.on('keydown-M', () => audio.toggleMute());

    audio.unlock();
    audio.startTenseMusic();

    this.events.on('playerDied', () => this._onPlayerDied());
  }

  update(time, delta) {
    const sx = this.cameras.main.scrollX;
    this.player.update(delta);

    // Trovões aleatórios
    if (Math.random() < 0.005) {
      this.sky.fillGradientStyle(0xeeeeee, 0xaaaaaa, 0x334455, 0x334455, 1);
      this.sky.fillRect(0, 0, this.scale.width, this.scale.height);
      setTimeout(() => {
        if (this.sky && this.sky.active) {
          this.sky.fillGradientStyle(0x111111, 0x111111, 0x223344, 0x223344, 1);
          this.sky.fillRect(0, 0, this.scale.width, this.scale.height);
        }
      }, 100);
    }

    const cam = this.cameras.main;
    if (this.player.nauseaTimer > 0) {
      cam.setRotation(Math.sin(time / 90) * 0.02);
      cam.setZoom(1.05 + Math.sin(time / 220) * 0.015);
    } else if (cam.rotation !== 0 || cam.zoom !== 1) {
      cam.setRotation(0);
      cam.setZoom(1);
    }

    if (this.player.isAlive && this.player.body.blocked.down) {
      this.checkpoint = { x: this.player.x, y: this.player.y - 6 };
    }

    if (this.player.isAlive && this.player.y > WORLD_H + 40) this._hurtAndRespawn();
  }

  // ════════════════════════════════════════════════════════════════════════
  //  FUNDO / CENÁRIO (tema Meião - tenso, frio, escuro)
  // ════════════════════════════════════════════════════════════════════════
  _buildBackground() {
    const W = this.scale.width, H = this.scale.height;

    // Céu nublado e escuro - gradiente profundo
    this.sky = this.add.graphics().setScrollFactor(0).setDepth(-40);
    this.sky.fillGradientStyle(0x050a0f, 0x050a0f, 0x0d1f2e, 0x0d1f2e, 1);
    this.sky.fillRect(0, 0, W, H);

    // Nuvens escuras procedurais (várias) no fundo - parallax leve
    this.clouds = [];
    for (let i = 0; i < 12; i++) {
      const cx = (i / 12) * WORLD_W + Phaser.Math.Between(-100, 100);
      const cy = Phaser.Math.Between(60, 280);
      const cg = this.add.graphics().setDepth(-35);
      const cr = Phaser.Math.Between(80, 200);
      // Sorteia cada canal RGB separadamente (ver Level3Scene.js) — usar
      // Phaser.Math.Between direto em dois inteiros 0xRRGGBB interpola o
      // número empacotado, não cada canal, podendo sair uma cor viva no meio
      // do caminho em vez de um tom escuro intermediário.
      const cloudColor = Phaser.Display.Color.GetColor(
        Phaser.Math.Between(17, 28), Phaser.Math.Between(21, 37), Phaser.Math.Between(32, 53)
      );
      cg.fillStyle(cloudColor, 0.85);
      cg.fillEllipse(cx, cy, cr * 2, cr * 0.7);
      cg.fillEllipse(cx - cr * 0.4, cy + 15, cr * 1.2, cr * 0.5);
      cg.fillEllipse(cx + cr * 0.4, cy + 20, cr * 1.4, cr * 0.55);
      this.clouds.push({ g: cg, x: cx, speed: 0.02 + i * 0.004 });
    }

    // Janelas de prédios ao longe (só luzes amarelas no céu escuro)
    const buildingGfx = this.add.graphics().setDepth(-32);
    for (let i = 0; i < 30; i++) {
      const bx = i * 220 + Phaser.Math.Between(0, 60);
      const bh = Phaser.Math.Between(80, 200);
      const by = GROUND - bh;
      buildingGfx.fillStyle(0x0d1520, 1);
      buildingGfx.fillRect(bx, by, Phaser.Math.Between(60, 120), bh);
      // janelas
      for (let wy = by + 10; wy < GROUND - 10; wy += 22) {
        for (let wx = bx + 6; wx < bx + 100; wx += 18) {
          if (Math.random() < 0.5) {
            buildingGfx.fillStyle(0xf1c40f, 0.7);
            buildingGfx.fillRect(wx, wy, 8, 10);
          }
        }
      }
    }

    // Efeito de chuva pesada com partículas
    this.rainEmitter = this.add.particles(0, -20, 'spark', {
      x: { min: -100, max: W + 100 }, y: { min: -20, max: 0 },
      lifespan: 900,
      speedY: { min: 600, max: 900 }, speedX: { min: -80, max: -40 },
      scaleX: 0.15, scaleY: 0.6,
      tint: [0x6688aa, 0x4466aa, 0x88aacc],
      frequency: 8, quantity: 4, alpha: { start: 0.7, end: 0.1 }
    }).setScrollFactor(0).setDepth(-20);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  CONSTRUÇÃO DO NÍVEL 2 (Mais focado em buracos e inimigos tensos)
  // ════════════════════════════════════════════════════════════════════════
  _buildLevel() {
    // ════════════════════════════════════════════════════════════════════════
    //  LAYOUT GERAL: 6 seções temáticas distintas
    //  Seção 1 [0-1100]:     Abertura no chão  — Trabalho em Grupo
    //  Seção 2 [1100-2200]:  Plataformas altas — Cálculo flutuante
    //  Seção 3 [2200-3739]:  ABISMO AÉREO (único caminho = plataformas)
    //  Seção 4 [3739-4939]:  Chão com emboscada de Sono
    //  Seção 5 [4939-5939]:  Arena da Prova (mini-chefe)
    //  Seção 6 [5939-WORLD]: Corredor final
    //
    //  Seção 3 é 189px mais larga que a versão original (e todo o resto do
    //  nível foi deslocado +189 pra abrir espaço) — ver nota grande logo
    //  abaixo, dentro da seção 3, sobre por quê.
    // ════════════════════════════════════════════════════════════════════════

    // ── Chão (só onde existe caminho por baixo) ──────────────────────────
    // Nota sobre alinhamento: _addFloor/_addPlatform preenchem tiles de 32px
    // A PARTIR do próprio xStart — se o vão entre dois trechos "encostados"
    // não for múltiplo de 32 relativo ao xStart de cada um, o último tile de
    // um trecho pode ultrapassar a fronteira e sobrepor o primeiro tile do
    // próximo (foi o que causava a plataforma duplicada visível perto da
    // Seção 4/5). Por isso o buraco antes da arena abre exatamente num tile
    // alinhado (4891) e o chão da Arena+Corredor final foi unificado numa
    // única chamada (sem fronteira interna pra desalinhar).
    this._addFloor(0, 1100);           // Seção 1
    // Seção 2: sem chão (plataformas) — mas coloca spikes embaixo
    // Seção 3: ABISMO — nenhum chão, forçando rota aérea
    this._addFloor(3739, 4891);        // Seção 4 (para antes do buraco da arena)
    this._addFloor(4955, WORLD_W);     // Arena da Prova + Corredor final (uma só faixa contínua)

    // ── Spikes no grande abismo (Seções 2 e 3) ──────────────────────────
    // Seção 2: chão de spikes abaixo das plataformas flutuantes
    this._addSpikes(1100, 2200, 688);
    // Seção 3: o grande abismo aéreo — spikes de parede a parede
    this._addSpikes(2200, 3739, 688);

    // Buraco com spike antes da arena (pedra de passagem no meio, ver Seção 4 abaixo)
    this._addSpikes(4891, 4955, 688);
    this.traps = [
      { x1: 1100, x2: 2200 },
      { x1: 2200, x2: 3739 },
    ];

    // ════════════════════════════════════════════════════════════════════════
    //  SEÇÃO 1 [0 - 1100]: ABERTURA — Trabalho em Grupo no chão
    // ════════════════════════════════════════════════════════════════════════
    // Escadaria de plataformas subindo para a Chave 1
    this._addPlatform(220, 560, 3);
    this._addPlatform(380, 480, 3);
    this._addPlatform(540, 400, 3);
    this._addPlatform(700, 320, 4);
    this._addKey(790, 270);              // Chave 1 no cume

    // Dois Trabalhos patrulham o chão e a escada
    this._addEnemy(300, GROUND - 30, 100, 700, 'trabalho');
    this._addEnemy(620, 380, 540, 800, 'trabalho');

    // ════════════════════════════════════════════════════════════════════════
    //  SEÇÃO 2 [1100 - 2200]: PLATAFORMAS FLUTUANTES sobre spikes — Cálculo
    //  gravidade=1000, jumpV=560  → altura máx de pulo ≈ 156px
    //  Diferença vertical entre plataformas: ≤ 120px para ser seguro
    // ════════════════════════════════════════════════════════════════════════
    // Trampolim de entrada (pula direto para a rota aérea)
    this._addPlatform(1060, 520, 3);   // y=520 — transição do chão (GROUND=640)

    // Plataformas em zigzag, dif. vertical ≤ 120px
    //        x     y    tiles
    this._addPlatform(1200, 480, 3);   // +40 sobe
    this._addPlatform(1370, 560, 3);   // -80 desce (fácil)
    this._addPlatform(1540, 460, 3);   // +100 sobe
    this._addPlatform(1700, 560, 3);   // -100 desce
    this._addPlatform(1870, 460, 3);   // +100 sobe
    this._addPlatform(2040, 500, 4);   // plataforma de chegada (largura reduzida
    // de 5 pra 4 tiles — 5 tiles ia até x=2200,
    // sobrepondo a plataforma inicial da Seção 3
    // em x=2180-2200/y=480-512)

    // Cálculo em cada plataforma
    this._addEnemy(1250, 440, 1200, 1460, 'calculo');   // patrulha horiz
    this._addEnemy(1610, 420, 1540, 1780, 'calculo');   // patrulha vertical
    this._addEnemy(1930, 420, 1870, 2100, 'calculo');   // círculo

    // ════════════════════════════════════════════════════════════════════════
    //  SEÇÃO 3 [2200 - 3739]: ABISMO AÉREO OBRIGATÓRIO
    //  Fantasmas bloqueiam cada plataforma — OBRIGATÓRIO matar (ou desviar) pra passar
    //
    //  IMPORTANTE — por que as subidas usam 155px de vão (e não ~70-90px como
    //  o resto do jogo): simulei fisicamente os pulos (gravidade 1000,
    //  jumpVelocity ~555-575, corrida 195-225 conforme o personagem — ver
    //  characters.js) e descobri que o vão original de ~70-90px pra uma SUBIDA
    //  de 100px era impossível pra qualquer personagem — o pulo passa por
    //  cima da plataforma-alvo ainda alto demais e só desce à altura dela
    //  depois de já ter passado por cima, caindo direto no abismo (sem chão
    //  de segurança embaixo, ao contrário da Seção 1). Pra uma subida de
    //  100px, o ponto onde o jogador desce de volta a essa altura fica a
    //  ~185-220px de distância da beira de partida (varia com a velocidade do
    //  personagem); usei 155px de vão + plataforma de 4 tiles (128px) de
    //  largura, testado com margem de erro de ±8px no instante do pulo E nos
    //  3 valores de velocidade dos personagens (195/210/225) — sempre pousa.
    //  Vãos de DESCIDA continuam ~80px (fáceis — descendo não precisa pular,
    //  só andar pra fora da borda; testado sem problema).
    // ════════════════════════════════════════════════════════════════════════
    this._addPlatform(2180, 480, 6);   // plataforma larga de partida (y=480)

    // Rota aérea: 6 plataformas — subidas com vão de 155px (ver nota acima),
    // descidas com vão de 80px
    //        x     y    tiles
    this._addPlatform(2527, 380, 4);   // sobe 100, vão 155 ✓ (testado: 195-225px/s, ±8px de timing)
    this._addPlatform(2735, 460, 4);   // desce 80,  vão 80  ✓
    this._addPlatform(3018, 360, 4);   // sobe 100, vão 155 ✓ (era 2 tiles/estreita — alargada pra 4, senão nem cabe o pouso com margem)
    this._addPlatform(3226, 440, 4);   // desce 80,  vão 80  ✓
    this._addPlatform(3509, 340, 6);   // sobe 100, vão 155 ✓ (larga de chegada)
    this._addKey(3605, 290);           // Chave 2 — só pela rota aérea

    // Fantasma em cada plataforma (bloqueiam fisicamente — devem ser mortos
    // ou desviados; perseguem de forma errante e voam, mas ficam perto do
    // posto quando o jogador não está por perto — ver Enemy.js _updateSono)
    this._addEnemy(2597, 320, 2527, 2775, 'sono');   // na 1ª plat (y=380 → 320)
    this._addEnemy(3080, 300, 3018, 3266, 'sono');   // na 3ª plat (y=360 → 300)
    this._addEnemy(3571, 280, 3509, 3765, 'sono');   // na 5ª plat (y=340 → 280)

    // Cálculo patrulhando entre plataformas (extra dificuldade)
    this._addEnemy(2815, 400, 2735, 2995, 'calculo'); // entre 2ª e 3ª
    this._addEnemy(3306, 380, 3226, 3480, 'calculo'); // entre 4ª e 5ª

    // ════════════════════════════════════════════════════════════════════════
    //  SEÇÃO 4 [3739 - 4955]: EMBOSCADA DO SONO — volta ao chão
    // ════════════════════════════════════════════════════════════════════════
    this._addPlatform(3739, 400, 6);   // plataforma de aterrissagem do abismo

    // Pedra de passagem no meio do buraco de espinhos (4891-4955, ver spikes acima)
    this._addPlatform(4907, GROUND, 1);

    // Sono patrulha o chão (posicionado 80px acima do chão para flutuar bem)
    this._addEnemy(3939, GROUND - 80, 3789, 4289, 'sono');
    this._addEnemy(4289, GROUND - 30, 4089, 4589, 'trabalho');
    this._addEnemy(4589, GROUND - 80, 4389, 4869, 'sono');

    // Plataformas altas com cálculo
    this._addPlatform(3989, 440, 4);
    this._addPlatform(4289, 360, 3);
    this._addEnemy(4049, 390, 3989, 4289, 'calculo');  // padrão vertical

    // ════════════════════════════════════════════════════════════════════════
    //  SEÇÃO 5 [4955 - 5939]: ARENA DA PROVA (mini-chefe)
    // ════════════════════════════════════════════════════════════════════════
    // A plataforma de ataque elevada estava em y=440 — uma subida de 200px a
    // partir do chão (GROUND=640), impossível pra qualquer personagem (altura
    // máxima de pulo é ~156-165px, MESMO pro Weverton). Baixada pra y=540
    // (subida de 100px a partir do chão — o jogador tem o chão inteiro livre
    // pra correr e pular na distância certa, sem a restrição de "beirada
    // curta" das plataformas do abismo aéreo). A 2ª plataforma e a chave
    // descem junto, mantendo a MESMA subida de 80px/vão de 108px entre elas
    // já testado e validado nas 4 velocidades de personagem.
    this._addPlatform(5089, 540, 6);   // plataforma de ataque elevada (subida 100 do chão ✓)
    this._addPlatform(5389, 460, 4);   // plataforma alta (vão 108px + subida 80 — testado OK nas 4 velocidades)
    this._addKey(5469, 410);           // Chave 3 (50px acima da plataforma)
    // Prova flutua no centro da arena
    this._addEnemy(5189, 460, 5009, 5389, 'prova');   // flutua à altura certa
    this._addEnemy(5339, 410, 5289, 5589, 'calculo');  // círculo ao redor

    // ════════════════════════════════════════════════════════════════════════
    //  SEÇÃO 6 [5939 - FIM]: CORREDOR FINAL ATÉ A PORTA
    // ════════════════════════════════════════════════════════════════════════
    this._addEnemy(6089, GROUND - 30, 5989, 6389, 'trabalho');
    this._addEnemy(6289, GROUND - 80, 6189, 6589, 'sono');
    this._addEnemy(6489, GROUND - 30, 6289, WORLD_W - 200, 'calculo');
  }

  _addFloor(xStart, xEnd) {
    // Usa o stone_tile escalado como tile de chão
    for (let x = xStart; x < xEnd; x += TILE) {
      const tile = this.platforms.create(x + TILE / 2, GROUND + TILE / 2, 'stone_tile');
      tile.setDisplaySize(TILE, TILE).refreshBody();
    }
  }

  _addPlatform(xLeft, topY, tiles) {
    for (let i = 0; i < tiles; i++) {
      const tile = this.platforms.create(xLeft + i * TILE + TILE / 2, topY + TILE / 2, 'stone_platform');
      tile.setDisplaySize(TILE, TILE).refreshBody();
    }
  }

  _addSpikes(xStart, xEnd, topY) {
    for (let x = xStart; x < xEnd; x += TILE) {
      const s = this.spikes.create(x + TILE / 2, topY + TILE / 2, 'spike_tile').setTint(0x95a5a6);
      s.body.setSize(24, 16).setOffset(4, 14);
      s.refreshBody();
    }
  }

  _addEnemy(x, y, leftX, rightX, type) {
    this.enemies.add(new Enemy(this, x, y, leftX, rightX, type), true);
  }

  _addKey(x, y) {
    this.keyGroup.add(new Key(this, x, y), true);
  }

  // ════════════════════════════════════════════════════════════════════════
  //  HUD
  // ════════════════════════════════════════════════════════════════════════
  _buildHUD() {
    this.add.rectangle(0, 0, this.scale.width, 52, 0x000000, 0.4)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(40);

    this.add.image(24, 26, 'key_sprite').setScrollFactor(0).setDepth(41).setScale(0.9);
    this.hudKeys = this.add.text(40, 18, `${this.keysCollected}/${this.totalKeys}`, {
      fontFamily: FONT, fontSize: '16px', color: '#f1c40f'
    }).setScrollFactor(0).setDepth(41);

    this.hearts = [];
    for (let i = 0; i < this.player.maxHp; i++) {
      const h = this.add.image(130 + i * 30, 26, 'heart_full')
        .setScrollFactor(0).setDepth(41);
      this.hearts.push(h);
    }

    this.add.text(this.scale.width / 2, 16, 'FASE 2 - O MEIO DO CURSO', {
      fontFamily: FONT, fontSize: '12px', color: '#ffffff'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(41);

    this.hudAbility = this.add.text(this.scale.width - 16, 18,
      `[F] ${CHARACTERS[this.selectedChar].ability}`, {
      fontFamily: FONT, fontSize: '10px', color: '#2ecc71', align: 'right'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(41);

    this.add.text(this.scale.width - 16, this.scale.height - 14, '[ESC] PAUSA', {
      fontFamily: FONT, fontSize: '9px', color: '#5d6d7e'
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(41);

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

  _hurtAndRespawn() {
    if (!this.player.isAlive || this.player.invincible) return;
    this.player.takeDamage(1);
    this.cameras.main.shake(200, 0.012);
    if (this.player.isAlive) {
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
      this.scene.start('GameOverScene', { char: this.selectedChar, phase: 'Level2Scene' });
    });
  }
}
