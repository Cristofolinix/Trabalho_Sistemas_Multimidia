import { Player } from '../entities/Player.js';
import { Enemy }  from '../entities/Enemy.js';
import { Key }    from '../entities/Key.js';
import { Door }   from '../entities/Door.js';
import { CHARACTERS, DEFAULT_CHARACTER } from '../config/characters.js';
import { FONT } from '../config/theme.js';
import { audio } from '../audio/AudioManager.js';

const WORLD_W   = 6000;
const WORLD_H   = 720;
const GROUND    = 640;
const TILE      = 32;
const GRAVITY   = 1000;

export class Level3Scene extends Phaser.Scene {
  constructor() { super({ key: 'Level3Scene' }); }

  init(data) {
    this.selectedChar = data?.char ?? DEFAULT_CHARACTER;
    this.devMode = data?.devMode ?? false;
    this.keysCollected = 0;
    this.totalKeys = 3;
    this.bossesSpawned = false;
    this.arenaSealed = false;
    this.bossesDefeated = false;

    this.windForce = 0;
    this.nextWindChange = 0;
    this.windText = null;
  }

  create() {
    this.events.off('keyCollected');
    this.events.off('playerDied');

    this._buildBackground();

    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.physics.world.gravity.y = GRAVITY;

    this.platforms = this.physics.add.staticGroup();
    this.spikes    = this.physics.add.staticGroup();
    this.enemies   = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    this.keyGroup  = this.physics.add.group({ classType: Key, runChildUpdate: false });
    this.bossProjectiles = this.physics.add.group();

    this._buildLevel();

    const cfg = CHARACTERS[this.selectedChar];
    this.spawnPoint = { x: 90, y: 560 };
    this.player = new Player(this, this.spawnPoint.x, this.spawnPoint.y, cfg);
    this.player.devMode = this.devMode;
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

    this.physics.add.collider(this.player, this.platforms);
    // Inimigos flutuantes não devem colidir com plataformas — ficam "presos" na borda.
    this.physics.add.collider(this.enemies, this.platforms, null, (enemy) => !enemy.def.isFloating);

    this.physics.add.overlap(this.player, this.enemies, (pl, en) => {
      if (pl.grabbed || this.bossesDefeated) return;

      if (en.type === 'sono_acumulado' && !pl.invincible) {
        pl.applySlow(5000);
      }

      pl.takeDamage(en.damage);
      pl.setVelocity((pl.x < en.x ? -1 : 1) * 200, -220);
    });

    this.physics.add.overlap(this.player, this.bossProjectiles, (pl, proj) => {
      if (pl.grabbed || this.bossesDefeated || !proj.active) return;

      // Weverton dashando contra um projétil: devolve homing para o chefe.
      if (pl._dashActive && proj.sourceBoss && proj.sourceBoss.active && !proj.reflected) {
        this._reflectProjectile(proj);
        return;
      }
      if (proj.reflected) return;

      pl.takeDamage(proj.damageAmt);
      pl.setVelocity((pl.x < proj.x ? -1 : 1) * 200, -220);
      this._splat(proj.x, proj.y, proj.splatColor ?? 0xff3333);
      proj.destroy();
    });

    this.physics.add.overlap(this.bossProjectiles, this.enemies, (proj, en) => {
      if (!proj.reflected || !en.active || !en.def.isBoss) return;
      en.kill();
      this._splat(en.x, en.y, 0x2ecc71);
      proj.destroy();
    });

    this.physics.add.collider(this.bossProjectiles, this.platforms, (proj) => {
      this._splat(proj.x, proj.y, proj.splatColor ?? 0xff3333);
      proj.destroy();
    });

    this.physics.add.overlap(this.player, this.spikes, () => {
      if (this.player.grabbed || this.bossesDefeated) return;
      this._hurtAndRespawn();
    });

    this.physics.add.overlap(this.player, this.keyGroup, (_p, k) => k.collect());
    this.events.on('keyCollected', () => {
      this.keysCollected++;
      audio.sfx('key');
      this._updateKeysHUD();
      if (this.keysCollected >= this.totalKeys && this.door) this.door.open();
    });

    this.physics.add.overlap(this.player, this.door, () => {
      if (this.door && this.door.tryEnter(this.keysCollected)) {
        audio.sfx('door');
        this.door.destroy();
        this.door = null;
      }
    });

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this._buildHUD();
    this.input.keyboard.on('keydown-ESC', () => {
      audio.sfx('select');
      this.scene.launch('PauseScene', { from: 'Level3Scene' });
      this.scene.pause();
    });
    this.input.keyboard.on('keydown-M', () => audio.toggleMute());

    audio.unlock();
    audio.startScaryMusic();

    this.events.on('playerDied', () => this._onPlayerDied());
  }

  update(time, delta) {
    if (this.bossesDefeated) {
      this.player.update(delta);
      return;
    }

    this.player.update(delta);

    if (this.clouds) {
      const sx = this.cameras.main.scrollX;
      this.clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -300) c.x = WORLD_W + 100;
        c.g.setX(c.x - (sx * (c.speed * 0.1)));
      });
    }

    if (!this.bossesSpawned && Math.random() < 0.007) {
      this.cameras.main.flash(Phaser.Math.Between(150, 250), 255, 255, 255);
      audio.tone({ freq: 45, slideTo: 10, dur: 1.2, type: 'square', vol: 0.14 });
    }

    this._updateWind(time);

    // Revela a arena antes da porta para o jogador ver os chefes se aproximando.
    if (!this.bossesSpawned && this.player.x > 4620) {
      this._spawnBossArena();
    }
    // Sela a arena apenas depois que o jogador já passou por ela, não antes.
    if (this.bossesSpawned && !this.arenaSealed && this.player.x > 4816) {
      this._sealArena();
    }

    if (this.player.isAlive && this.player.y > WORLD_H + 40) this._hurtAndRespawn();
  }

  _updateWind(time) {
    if (time > this.nextWindChange) {
      const roll = Phaser.Math.Between(1, 3);
      if (roll === 1) {
        this.windForce = -120;
        this._showWindHUD('VENTO FORTE PARA A ESQUERDA! <<');
      } else if (roll === 2) {
        this.windForce = 120;
        this._showWindHUD('VENTO FORTE PARA A DIREITA! >>');
      } else {
        this.windForce = 0;
        this._showWindHUD('');
      }
      this.nextWindChange = time + Phaser.Math.Between(4000, 7000);
    }

    if (this.windForce !== 0 && this.player.isAlive && !this.player.body.blocked.down && !this.player._dashActive) {
      this.player.body.velocity.x += this.windForce * 0.08;
    }
  }

  _showWindHUD(msg) {
    if (!this.windText) return;
    this.windText.setText(msg);
    if (msg) {
      this.windText.setAlpha(1);
    } else {
      this.windText.setAlpha(0);
    }
  }

  _buildBackground() {
    const W = this.scale.width, H = this.scale.height;

    this.sky = this.add.graphics().setScrollFactor(0).setDepth(-40);
    this.sky.fillGradientStyle(0x020406, 0x020406, 0x090f14, 0x090f14, 1);
    this.sky.fillRect(0, 0, W, H);

    this.victorySky = this.add.graphics().setScrollFactor(0).setDepth(-31);
    this.victorySky.fillGradientStyle(0x3498db, 0x3498db, 0xaed6f1, 0xf1c40f, 1);
    this.victorySky.fillRect(0, 0, W, H);
    this.victorySky.setAlpha(0);

    this.clouds = [];
    for (let i = 0; i < 14; i++) {
      const cx = (i / 14) * WORLD_W + Phaser.Math.Between(-100, 100);
      const cy = Phaser.Math.Between(40, 220);
      const cg = this.add.graphics().setDepth(-35);
      const cr = Phaser.Math.Between(100, 240);
      // Sorteia cada canal RGB separadamente: interpolar dois inteiros 0xRRGGBB
      // diretamente pode gerar cores vivas no meio do caminho.
      const cloudColor = Phaser.Display.Color.GetColor(
        Phaser.Math.Between(5, 15), Phaser.Math.Between(7, 19), Phaser.Math.Between(10, 26)
      );
      cg.fillStyle(cloudColor, 0.9);
      cg.fillEllipse(cx, cy, cr * 2, cr * 0.7);
      cg.fillEllipse(cx - cr * 0.3, cy + 10, cr * 1.2, cr * 0.5);
      this.clouds.push({ g: cg, x: cx, speed: 0.05 + i * 0.006 });
    }

    const buildingGfx = this.add.graphics().setDepth(-32);
    for (let i = 0; i < 28; i++) {
      const bx = i * 240 + Phaser.Math.Between(0, 50);
      const bh = Phaser.Math.Between(120, 260);
      const by = GROUND - bh;
      buildingGfx.fillStyle(0x05090f, 1);
      buildingGfx.fillRect(bx, by, Phaser.Math.Between(80, 140), bh);
      for (let wy = by + 12; wy < GROUND - 12; wy += 26) {
        for (let wx = bx + 8; wx < bx + 120; wx += 22) {
          if (Math.random() < 0.07) {
            buildingGfx.fillStyle(0xd35400, 0.45);
            buildingGfx.fillRect(wx, wy, 10, 12);
          }
        }
      }
    }

    this.rainEmitter = this.add.particles(0, -20, 'spark', {
      x: { min: -200, max: W + 200 }, y: { min: -20, max: 0 },
      lifespan: 800,
      speedY: { min: 750, max: 1000 }, speedX: { min: -150, max: -80 },
      scaleX: 0.12, scaleY: 0.7,
      tint: [0x445577, 0x334466, 0x556688],
      frequency: 4, quantity: 6, alpha: { start: 0.6, end: 0.05 }
    }).setScrollFactor(0).setDepth(-20);
  }

  _buildLevel() {
    const floor = [
      [0, 1200],
      [1450, 2400],
      [2700, 3700],
      [3950, WORLD_W]
    ];
    floor.forEach(([a, b]) => this._addFloor(a, b));

    const pits = [[1200, 1450], [2400, 2700], [3700, 3950]];
    pits.forEach(([a, b]) => this._addSpikes(a, b, 688));
    this.traps = pits.map(([x1, x2]) => ({ x1, x2 }));

    // Seção 1: entrada e Chave 1
    this._addPlatform(300, 520, 3);
    this._addPlatform(480, 420, 3);
    this._addPlatform(680, 320, 3);
    this._addKey(720, 270);

    this._addEnemy(400, GROUND - 30, 200, 1100, 'tcc_mob');
    this._addEnemy(680, GROUND - 80, 500, 900, 'sono_acumulado');

    // Seção 2: zigzag aéreo com Chave 2
    this._addPlatform(1380, 540, 3);
    this._addPlatform(1520, 440, 3);
    this._addPlatform(1680, 340, 3);
    this._addPlatform(1850, 440, 3);
    this._addPlatform(2020, 320, 4);
    this._addKey(2080, 270);

    this._addEnemy(1550, 380, 1520, 1800, 'sono_acumulado');
    this._addEnemy(1900, GROUND - 30, 1750, 2300, 'tcc_mob');

    // Seção 3: travessia sobre abismo 3
    this._addPlatform(2500, 520, 4);
    this._addPlatform(2800, 420, 4);
    this._addPlatform(3100, 320, 4);
    this._addPlatform(3400, 420, 4);
    this._addKey(3150, 270);

    this._addEnemy(2850, 360, 2800, 3050, 'sono_acumulado');
    this._addEnemy(3450, 360, 3400, 3650, 'sono_acumulado');

    // Seção 4: emboscada antes da banca
    this._addEnemy(4100, GROUND - 30, 4000, 4500, 'tcc_mob');
    this._addEnemy(4300, GROUND - 30, 4150, 4650, 'tcc_mob');
    this._addEnemy(4500, GROUND - 80, 4350, 4800, 'sono_acumulado');

    this.door = new Door(this, 4800, GROUND - 26, this.totalKeys);
  }

  _spawnBossArena() {
    this.bossesSpawned = true;

    for (let x = 4800; x < WORLD_W; x += TILE) {
      const roof = this.platforms.create(x + TILE / 2, 200, 'stone_platform');
      roof.setDisplaySize(TILE, TILE).refreshBody();
    }

    const rightWall = this.platforms.create(WORLD_W - 16, GROUND - 200, 'stone_platform');
    rightWall.setDisplaySize(32, 400).refreshBody();

    this.bossTcc = new Enemy(this, 5300, 340, 4900, 5600, 'boss_tcc');
    this.bossBanca = new Enemy(this, 5800, 450, 5700, 5900, 'boss_banca');

    this.enemies.add(this.bossTcc, true);
    this.enemies.add(this.bossBanca, true);

    this.bossTcc.body.setAllowGravity(false);

    const txt = this.add.text(this.scale.width / 2, 220, 'APRESENTACAO FINAL DE TCC!', {
      fontFamily: FONT, fontSize: '20px', color: '#e74c3c'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(45);

    this.tweens.add({
      targets: txt, scaleX: 1.2, scaleY: 1.2, duration: 600, yoyo: true, repeat: 1,
      onComplete: () => txt.destroy()
    });

    audio.startBossMusic();
  }

  _sealArena() {
    this.arenaSealed = true;
    const gate = this.platforms.create(4816, GROUND - 128, 'stone_platform');
    gate.setDisplaySize(32, 256).refreshBody();

    if (this.player) {
      this.player.abilityMaxCooldown = 500;
    }
  }

  spawnBossProjectile(boss, type) {
    if (this.bossesDefeated || !this.player.isAlive) return;

    const dirX = this.player.x >= boss.x ? 1 : -1;
    let proj;

    if (type === 'tcc') {
      proj = this.bossProjectiles.create(boss.x + dirX * 24, boss.y, 'projectile');
      proj.setTint(0xff3333);
      proj.damageAmt = 1;
      proj.splatColor = 0xff3333;
      proj.body.setAllowGravity(false);
      proj.setDepth(15);
      proj.sourceBoss = boss;

      const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
      this.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), 320, proj.body.velocity);
      audio.sfx('vomit');
    } else {
      proj = this.bossProjectiles.create(boss.x + dirX * 24, boss.y - 10, 'projectile');
      proj.setTint(0xf5f0dc);
      proj.damageAmt = 1;
      proj.splatColor = 0xf5f0dc;
      proj.body.setAllowGravity(false);
      proj.setDepth(15);
      proj.sourceBoss = boss;

      const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
      this.physics.velocityFromAngle(Phaser.Math.RadToDeg(angle), 220, proj.body.velocity);
      audio.sfx('throw');
    }

    this.time.delayedCall(4000, () => { if (proj.active) proj.destroy(); });
  }

  // Projétil refletido pelo dash do Weverton: vira verde e persegue o chefe (homing a cada 50ms).
  _reflectProjectile(proj) {
    const boss = proj.sourceBoss;
    proj.reflected = true;
    proj.setTint(0x2ecc71);
    proj.body.setAllowGravity(false);
    const homingSpeed = 480;

    const homingTimer = this.time.addEvent({
      delay: 50,
      repeat: 60,
      callback: () => {
        if (!proj.active || !boss.active) {
          homingTimer.remove();
          return;
        }
        const angle = Phaser.Math.Angle.Between(proj.x, proj.y, boss.x, boss.y);
        this.physics.velocityFromRotation(angle, homingSpeed, proj.body.velocity);
      }
    });

    proj.once('destroy', () => homingTimer.remove());
    audio.sfx('confirm');
  }

  _splat(x, y, tint) {
    const s = this.add.particles(x, y, 'projectile', {
      lifespan: 300, speed: { min: 60, max: 140 },
      scale: { start: 0.8, end: 0 }, quantity: 8, tint: tint
    }).setDepth(16);
    s.explode(8, x, y);
    this.time.delayedCall(350, () => s.destroy());
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

  checkBossDeaths() {
    if (this.bossesDefeated || !this.bossesSpawned) return;

    if ((!this.bossTcc || !this.bossTcc.active) && (!this.bossBanca || !this.bossBanca.active)) {
      this._triggerFinalVictorySequence();
    }
  }

  _triggerFinalVictorySequence() {
    this.bossesDefeated = true;

    this.bossProjectiles.clear(true, true);

    if (this.rainEmitter) this.rainEmitter.stop();
    this.windForce = 0;
    this._showWindHUD('');

    if (this.victorySky) {
      this.tweens.add({
        targets: this.victorySky,
        alpha: 1,
        duration: 2500
      });
    }

    audio.startHappyMusic();

    const spawnX = this.player.x + (this.player.x < 5500 ? 120 : -120);
    this.capeloItem = this.physics.add.image(spawnX, 220, 'capelo').setScale(0.08).setDepth(20);
    this.canudoItem = this.physics.add.image(spawnX + 60, 240, 'canudo').setScale(0.08).setDepth(20);

    this.capeloItem.body.setAllowGravity(false);
    this.canudoItem.body.setAllowGravity(false);

    this.tweens.add({
      targets: [this.capeloItem, this.canudoItem],
      y: GROUND - 60,
      duration: 2200,
      ease: 'Bounce.easeOut'
    });

    const winOverlap = this.physics.add.overlap(this.player, [this.capeloItem, this.canudoItem], () => {
      this.physics.world.removeCollider(winOverlap);
      this.capeloItem.destroy();
      this.canudoItem.destroy();

      this.player.grabbed = true;
      this.player.setVelocity(0, 0);
      this.player.play(`${this.selectedChar}-idle`);

      audio.sfx('win');

      const conf = this.add.particles(this.player.x, this.player.y - 120, 'confetti', {
        lifespan: 1600, speed: { min: 100, max: 280 },
        scale: { start: 1, end: 0 }, quantity: 12, gravityY: 200,
        tint: [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6]
      }).setDepth(22);
      conf.explode(80, this.player.x, this.player.y - 40);

      this.time.delayedCall(3500, () => {
        this.scene.start('WinScene', { char: this.selectedChar, graduated: true });
      });
    });
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

    this.add.text(this.scale.width / 2, 16, 'FASE 3 - APRESENTACAO TCC', {
      fontFamily: FONT, fontSize: '12px', color: '#e74c3c'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(41);

    this.hudAbility = this.add.text(this.scale.width - 16, 18,
      `[F] ${CHARACTERS[this.selectedChar].ability}`, {
        fontFamily: FONT, fontSize: '10px', color: '#2ecc71', align: 'right'
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(41);

    this.add.text(this.scale.width - 16, this.scale.height - 14, '[ESC] PAUSA', {
      fontFamily: FONT, fontSize: '9px', color: '#5d6d7e'
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(41);

    this.windText = this.add.text(this.scale.width / 2, 80, '', {
      fontFamily: FONT, fontSize: '12px', color: '#f1c40f'
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(41).setAlpha(0);

    this.time.addEvent({
      delay: 100, loop: true, callback: () => {
        this._updateHeartsHUD();
        this._updateAbilityHUD();
        this.checkBossDeaths();
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
      this.player.slowTimer = 0;
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
      this.scene.start('GameOverScene', { char: this.selectedChar, phase: 'Level3Scene' });
    });
  }
}
