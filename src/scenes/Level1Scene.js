import { Player } from '../entities/Player.js';
import { Enemy }  from '../entities/Enemy.js';
import { Key }    from '../entities/Key.js';
import { Door }   from '../entities/Door.js';
import { CHARACTERS, DEFAULT_CHARACTER } from '../config/characters.js';
import { FONT } from '../config/theme.js';

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
    this.isPaused = false;
  }

  create() {
    // ── Fundo em paralaxe (clima de calourada) ───────────────────────────
    this.bg = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'star_bg')
      .setOrigin(0, 0).setScrollFactor(0).setTileScale(2).setDepth(-20);
    const glow = this.add.graphics().setScrollFactor(0).setDepth(-19);
    glow.fillGradientStyle(0x2a0a3a, 0x2a0a3a, 0x0d1b2a, 0x0d1b2a, 0.7);
    glow.fillRect(0, 0, this.scale.width, this.scale.height);

    // ── Física e limites ─────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.physics.world.gravity.y = GRAVITY;

    // ── Grupos ───────────────────────────────────────────────────────────
    this.platforms = this.physics.add.staticGroup();
    this.spikes    = this.physics.add.staticGroup();
    this.enemies   = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    this.keyGroup  = this.physics.add.group({ classType: Key, runChildUpdate: false });

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
      pl.takeDamage(en.damage);
      // empurrão ao tomar dano
      pl.setVelocity((pl.x < en.x ? -1 : 1) * 220, -260);
    });

    this.physics.add.overlap(this.player, this.spikes, () => this._hurtAndRespawn());

    this.physics.add.overlap(this.player, this.keyGroup, (_p, k) => k.collect());
    this.events.on('keyCollected', () => {
      this.keysCollected++;
      this._updateKeysHUD();
      if (this.keysCollected >= this.totalKeys) this.door.open();
    });

    // ── Porta ─────────────────────────────────────────────────────────────
    this.door = new Door(this, WORLD_W - 130, GROUND - 26, this.totalKeys);
    this.physics.add.overlap(this.player, this.door, () => {
      if (this.door.tryEnter(this.keysCollected)) this.scene.start('WinScene');
    });

    // ── Câmera ──────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // ── HUD + pausa ─────────────────────────────────────────────────────────
    this._buildHUD();
    this.input.keyboard.on('keydown-ESC', () => this._togglePause());

    this.events.on('playerDied', () => this._onPlayerDied());
  }

  update(time, delta) {
    if (this.isPaused) return;
    this.bg.tilePositionX = this.cameras.main.scrollX * 0.15;
    this.player.update(delta);

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
    [[1300, 1560], [2500, 2760], [3700, 3960], [5000, 5260]].forEach(([a, b]) =>
      this._addSpikes(a, b, 688));

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
  //  DANO / RESPAWN / PAUSA
  // ════════════════════════════════════════════════════════════════════════
  _hurtAndRespawn() {
    if (!this.player.isAlive || this.player.invincible) return;
    this.player.takeDamage(1);   // tira 1 coração (não cura)
    this.cameras.main.shake(200, 0.012);
    if (this.player.isAlive) {
      // reposiciona no checkpoint preservando a vida atual
      this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
      this.player.setVelocity(0, 0);
    }
  }

  _onPlayerDied() {
    this.cameras.main.shake(400, 0.02);
    this.cameras.main.fade(700, 0, 0, 0);
    this.time.delayedCall(800, () => this.scene.restart());
  }

  _togglePause() {
    if (this.isPaused) { this._resume(); return; }

    this.isPaused = true;
    this.physics.world.pause();

    const W = this.scale.width, H = this.scale.height;
    this.pauseUI = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

    const dim = this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0, 0);
    const title = this.add.text(W / 2, H / 2 - 90, 'PAUSADO', {
      fontFamily: FONT, fontSize: '28px', color: '#f1c40f'
    }).setOrigin(0.5);
    this.pauseUI.add([dim, title]);

    this._pauseButton(W / 2, H / 2 - 10, 'CONTINUAR', 0x27ae60, () => this._resume());
    this._pauseButton(W / 2, H / 2 + 55, 'MENU INICIAL', 0x2980b9, () => {
      this.physics.world.resume();
      this.scene.start('TitleScene');
    });
  }

  _pauseButton(x, y, label, color, cb) {
    const btn = this.add.rectangle(x, y, 280, 46, color, 0.95)
      .setStrokeStyle(2, 0xffffff, 0.4).setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontFamily: FONT, fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setScale(1.05));
    btn.on('pointerout',  () => btn.setScale(1));
    btn.on('pointerdown', cb);
    this.pauseUI.add([btn, txt]);
  }

  _resume() {
    this.isPaused = false;
    this.physics.world.resume();
    this.pauseUI?.destroy();
    this.pauseUI = null;
  }
}
