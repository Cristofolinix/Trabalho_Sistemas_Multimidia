import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Key } from '../entities/Key.js';
import { Door } from '../entities/Door.js';
import { CHARACTERS, DEFAULT_CHARACTER } from '../config/characters.js';
import { FONT } from '../config/theme.js';
import { audio } from '../audio/AudioManager.js';

const WORLD_W = 6589;
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
    this.player.devMode = this.devMode;
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
    // Inimigos flutuantes não devem colidir com plataformas — ficam "presos" na borda ao cruzá-las.
    this.physics.add.collider(this.enemies, this.platforms, null, (enemy) => !enemy.def.isFloating);

    this.physics.add.overlap(this.player, this.enemies, (pl, en) => {
      if (pl.grabbed) return;

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
    this.player.update(delta);

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

  _buildBackground() {
    const W = this.scale.width, H = this.scale.height;

    this.sky = this.add.graphics().setScrollFactor(0).setDepth(-40);
    this.sky.fillGradientStyle(0x050a0f, 0x050a0f, 0x0d1f2e, 0x0d1f2e, 1);
    this.sky.fillRect(0, 0, W, H);

    this.clouds = [];
    for (let i = 0; i < 12; i++) {
      const cx = (i / 12) * WORLD_W + Phaser.Math.Between(-100, 100);
      const cy = Phaser.Math.Between(60, 280);
      const cg = this.add.graphics().setDepth(-35);
      const cr = Phaser.Math.Between(80, 200);
      // Sorteia cada canal RGB separadamente: interpolar dois inteiros 0xRRGGBB
      // diretamente pode gerar cores vivas no meio do caminho (não tons escuros).
      const cloudColor = Phaser.Display.Color.GetColor(
        Phaser.Math.Between(17, 28), Phaser.Math.Between(21, 37), Phaser.Math.Between(32, 53)
      );
      cg.fillStyle(cloudColor, 0.85);
      cg.fillEllipse(cx, cy, cr * 2, cr * 0.7);
      cg.fillEllipse(cx - cr * 0.4, cy + 15, cr * 1.2, cr * 0.5);
      cg.fillEllipse(cx + cr * 0.4, cy + 20, cr * 1.4, cr * 0.55);
      this.clouds.push({ g: cg, x: cx, speed: 0.02 + i * 0.004 });
    }

    const buildingGfx = this.add.graphics().setDepth(-32);
    for (let i = 0; i < 30; i++) {
      const bx = i * 220 + Phaser.Math.Between(0, 60);
      const bh = Phaser.Math.Between(80, 200);
      const by = GROUND - bh;
      buildingGfx.fillStyle(0x0d1520, 1);
      buildingGfx.fillRect(bx, by, Phaser.Math.Between(60, 120), bh);
      for (let wy = by + 10; wy < GROUND - 10; wy += 22) {
        for (let wx = bx + 6; wx < bx + 100; wx += 18) {
          if (Math.random() < 0.5) {
            buildingGfx.fillStyle(0xf1c40f, 0.7);
            buildingGfx.fillRect(wx, wy, 8, 10);
          }
        }
      }
    }

    this.rainEmitter = this.add.particles(0, -20, 'spark', {
      x: { min: -100, max: W + 100 }, y: { min: -20, max: 0 },
      lifespan: 900,
      speedY: { min: 600, max: 900 }, speedX: { min: -80, max: -40 },
      scaleX: 0.15, scaleY: 0.6,
      tint: [0x6688aa, 0x4466aa, 0x88aacc],
      frequency: 8, quantity: 4, alpha: { start: 0.7, end: 0.1 }
    }).setScrollFactor(0).setDepth(-20);
  }

  _buildLevel() {
    this._addFloor(0, 1100);
    this._addFloor(3739, 4891);
    this._addFloor(4955, WORLD_W);

    this._addSpikes(1100, 2200, 688);
    this._addSpikes(2200, 3739, 688);
    this._addSpikes(4891, 4955, 688);
    this.traps = [
      { x1: 1100, x2: 2200 },
      { x1: 2200, x2: 3739 },
    ];

    // Seção 1: escadaria para a Chave 1
    this._addPlatform(220, 560, 3);
    this._addPlatform(380, 480, 3);
    this._addPlatform(540, 400, 3);
    this._addPlatform(700, 320, 4);
    this._addKey(790, 270);

    this._addEnemy(300, GROUND - 30, 100, 700, 'trabalho');
    this._addEnemy(620, 380, 540, 800, 'trabalho');

    // Seção 2: plataformas em zigzag sobre spikes — Cálculo flutuante
    this._addPlatform(1060, 520, 3);
    this._addPlatform(1200, 480, 3);
    this._addPlatform(1370, 560, 3);
    this._addPlatform(1540, 460, 3);
    this._addPlatform(1700, 560, 3);
    this._addPlatform(1870, 460, 3);
    this._addPlatform(2040, 500, 4);

    this._addEnemy(1250, 440, 1200, 1460, 'calculo');
    this._addEnemy(1610, 420, 1540, 1780, 'calculo');
    this._addEnemy(1930, 420, 1870, 2100, 'calculo');

    // Seção 3: abismo aéreo — vãos de subida maiores (155px) por limitação física do pulo.
    this._addPlatform(2180, 480, 6);
    this._addPlatform(2527, 380, 4);
    this._addPlatform(2735, 460, 4);
    this._addPlatform(3018, 360, 4);
    this._addPlatform(3226, 440, 4);
    this._addPlatform(3509, 340, 6);
    this._addKey(3605, 290);

    this._addEnemy(2597, 320, 2527, 2775, 'sono');
    this._addEnemy(3080, 300, 3018, 3266, 'sono');
    this._addEnemy(3571, 280, 3509, 3765, 'sono');

    this._addEnemy(2815, 400, 2735, 2995, 'calculo');
    this._addEnemy(3306, 380, 3226, 3480, 'calculo');

    // Seção 4: volta ao chão — emboscada do Sono
    this._addPlatform(3739, 400, 6);
    this._addPlatform(4907, GROUND, 1);

    this._addEnemy(3939, GROUND - 80, 3789, 4289, 'sono');
    this._addEnemy(4289, GROUND - 30, 4089, 4589, 'trabalho');
    this._addEnemy(4589, GROUND - 80, 4389, 4869, 'sono');

    this._addPlatform(3989, 440, 4);
    this._addPlatform(4289, 360, 3);
    this._addEnemy(4049, 390, 3989, 4289, 'calculo');

    // Seção 5: arena da Prova (mini-chefe)
    this._addPlatform(5089, 540, 6);
    this._addPlatform(5389, 460, 4);
    this._addKey(5469, 410);
    this._addEnemy(5189, 460, 5009, 5389, 'prova');
    this._addEnemy(5339, 410, 5289, 5589, 'calculo');

    // Seção 6: corredor final
    this._addEnemy(6089, GROUND - 30, 5989, 6389, 'trabalho');
    this._addEnemy(6289, GROUND - 80, 6189, 6589, 'sono');
    this._addEnemy(6489, GROUND - 30, 6289, WORLD_W - 200, 'calculo');
  }

  _addFloor(xStart, xEnd) {
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
