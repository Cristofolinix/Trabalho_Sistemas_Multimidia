import { Player } from '../entities/Player.js';
import { Enemy }  from '../entities/Enemy.js';
import { Key }    from '../entities/Key.js';
import { Door }   from '../entities/Door.js';
import { CHARACTERS, DEFAULT_CHARACTER } from '../config/characters.js';

// Fase 1 — Calourada: vertical slice com placeholders.
// Mundo 4800 × 600 px; tela 960 × 540 px.
const WORLD_W = 4800;
const WORLD_H = 600;

export class Level1Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Level1Scene' });
  }

  // O personagem escolhido pode ser passado via this.scene.start('Level1Scene', { char: 'alex' })
  init(data) {
    this.selectedChar = data?.char ?? DEFAULT_CHARACTER;
    this.keysCollected = 0;
    this.totalKeys = 3;
  }

  create() {
    // ── Fundo ─────────────────────────────────────────────────────────────
    // Gradiente laranja/roxo (clima de calourada — céu de início de noite)
    this.add.rectangle(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 0x1a1a2e)
      .setScrollFactor(0.2); // paralaxe leve no fundo

    // Bloco de cor no céu
    this.add.rectangle(WORLD_W / 2, 150, WORLD_W, 300, 0x16213e)
      .setScrollFactor(0.3);

    // ── Física ─────────────────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.physics.world.gravity.y = 600;

    // ── Plataformas estáticas ──────────────────────────────────────────────
    this.platforms = this.physics.add.staticGroup();
    this._buildLevel();

    // ── Jogador ───────────────────────────────────────────────────────────
    const charConfig = CHARACTERS[this.selectedChar];
    this.player = new Player(this, 80, 460, charConfig);

    // Teclas de controle
    this.player.cursors = this.input.keyboard.createCursorKeys();
    this.player.wasd    = this.input.keyboard.addKeys({
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up:    Phaser.Input.Keyboard.KeyCodes.W
    });
    this.player.jumpKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.player.jumpKey2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.player.abilityKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    // Colisão jogador ↔ plataformas
    this.physics.add.collider(this.player, this.platforms);

    // ── Inimigos ──────────────────────────────────────────────────────────
    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    this._spawnEnemies();

    // Colisão inimigos ↔ plataformas
    this.physics.add.collider(this.enemies, this.platforms);

    // Overlap jogador ↔ inimigo → dano
    this.physics.add.overlap(this.player, this.enemies, () => {
      this.player.takeDamage();
    });

    // ── Chaves ────────────────────────────────────────────────────────────
    this.keyGroup = this.physics.add.group({ classType: Key, runChildUpdate: false });
    this._spawnKeys();

    // Coleta de chave ao tocar
    this.physics.add.overlap(this.player, this.keyGroup, (_player, key) => {
      key.collect();
    });

    // Evento de chave coletada (emitido por Key.collect)
    this.events.on('keyCollected', () => {
      this.keysCollected++;
      this.hudKeys.setText(`Chaves: ${this.keysCollected}/${this.totalKeys}`);
    });

    // ── Porta ─────────────────────────────────────────────────────────────
    this.door = new Door(this, WORLD_W - 120, 460, this.totalKeys);
    this.physics.add.collider(this.door, this.platforms);

    // Overlap jogador ↔ porta
    this.physics.add.overlap(this.player, this.door, () => {
      if (this.door.tryEnter(this.keysCollected)) {
        this._nextScene();
      }
    });

    // ── Câmera ─────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);

    // ── HUD ───────────────────────────────────────────────────────────────
    this._buildHUD();

    // Evento de morte do jogador
    this.events.on('playerDied', () => this._onPlayerDied());

    // Temporizador de checagem de queda (jogador saiu do mundo)
    this.time.addEvent({
      delay: 200,
      callback: this._checkFall,
      callbackScope: this,
      loop: true
    });
  }

  update(time, delta) {
    this.player.update(delta);

    // Atualiza inimigos manualmente (runChildUpdate já faz isso, mas garantimos)
    this.enemies.getChildren().forEach(e => e.update());
  }

  // ── Construção do mapa ───────────────────────────────────────────────────
  _buildLevel() {
    // Chão contínuo em blocos de 32 px, com buracos onde não há tile
    const floorSegments = [
      { start: 0,    end: 800  },  // trecho inicial
      { start: 900,  end: 1600 },  // buraco em 800–900
      { start: 1700, end: 2400 },  // buraco em 1600–1700
      { start: 2500, end: 3200 },
      { start: 3300, end: 4000 },
      { start: 4100, end: 4800 }   // trecho final
    ];

    floorSegments.forEach(seg => {
      for (let x = seg.start; x < seg.end; x += 32) {
        this.platforms.create(x + 16, WORLD_H - 16, 'floor_tile').refreshBody();
      }
    });

    // Plataformas elevadas (alturas variadas)
    const platDefs = [
      // [x, y, largura em tiles]
      [300,  420, 4],
      [500,  360, 5],
      [750,  300, 4],
      [1050, 380, 6],
      [1300, 310, 4],
      [1550, 420, 3],
      [1850, 350, 5],
      [2100, 280, 4],
      [2350, 380, 6],
      [2650, 300, 4],
      [2900, 360, 5],
      [3150, 420, 4],
      [3400, 280, 6],
      [3700, 350, 4],
      [3950, 420, 5],
      [4200, 310, 4],
      [4500, 380, 5]
    ];

    platDefs.forEach(([px, py, tiles]) => {
      for (let i = 0; i < tiles; i++) {
        this.platforms.create(px + i * 32 + 16, py, 'platform_tile').refreshBody();
      }
    });
  }

  // ── Spawn de inimigos ────────────────────────────────────────────────────
  _spawnEnemies() {
    const defs = [
      // [x, y, patrulhaEsq, patrulhaDir]
      [600,  510, 500,  750],
      [1200, 510, 1050, 1400],
      [2000, 510, 1800, 2300],
      [2800, 510, 2600, 3100],
      [3600, 510, 3400, 3900],
      [4300, 510, 4150, 4600]
    ];

    defs.forEach(([x, y, l, r]) => {
      const e = new Enemy(this, x, y, l, r);
      this.enemies.add(e, true);
    });
  }

  // ── Spawn de chaves ──────────────────────────────────────────────────────
  _spawnKeys() {
    const positions = [
      [520,  330],  // sobre plataforma elevada
      [1320, 280],  // plataforma alta — requer pulo
      [3420, 250]   // plataforma alta no trecho final
    ];

    positions.forEach(([x, y]) => {
      const k = new Key(this, x, y);
      this.keyGroup.add(k, true);
    });
  }

  // ── HUD ──────────────────────────────────────────────────────────────────
  _buildHUD() {
    const style = { fontSize: '16px', fill: '#ffffff', backgroundColor: '#000000aa', padding: { x: 6, y: 3 } };

    // Chaves — canto superior esquerdo
    this.hudKeys = this.add.text(16, 16, `Chaves: 0/${this.totalKeys}`, style)
      .setScrollFactor(0)  // fica fixo na tela
      .setDepth(10);

    // Vida — ao lado
    this.hudHp = this.add.text(16, 44, `Vida: ♥♥♥`, style)
      .setScrollFactor(0)
      .setDepth(10);

    // Fase
    this.add.text(this.cameras.main.width / 2, 16, 'FASE 1 — Calourada', style)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(10);

    // Habilidade — canto superior direito
    this.hudAbility = this.add.text(
      this.cameras.main.width - 16, 16,
      `[F] ${CHARACTERS[this.selectedChar].ability.split('—')[0].trim()} ✓`,
      { ...style, align: 'right' }
    ).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

    // Atualiza vida a cada evento de dano
    this.events.on('playerDied',  () => this._updateHpHUD());
    this.player.on('damage',      () => this._updateHpHUD()); // caso queira emitir no futuro
    // Atualização contínua (polling simples)
    this.time.addEvent({
      delay: 100,
      callback: () => {
        this._updateHpHUD();
        this._updateAbilityHUD();
      },
      callbackScope: this,
      loop: true
    });
  }

  _updateAbilityHUD() {
    const cd = this.player.abilityCooldown;
    const charName = CHARACTERS[this.selectedChar].ability.split('—')[0].trim();
    if (cd > 0) {
      this.hudAbility.setText(`[F] ${charName} ${(cd / 1000).toFixed(1)}s`);
      this.hudAbility.setStyle({ fill: '#e74c3c' });
    } else {
      this.hudAbility.setText(`[F] ${charName} ✓`);
      this.hudAbility.setStyle({ fill: '#2ecc71' });
    }
  }

  _updateHpHUD() {
    const hearts = '♥'.repeat(Math.max(0, this.player.hp)) +
                   '♡'.repeat(Math.max(0, this.player.maxHp - this.player.hp));
    this.hudHp.setText(`Vida: ${hearts}`);
  }

  // ── Eventos de fim de jogo ────────────────────────────────────────────────
  _checkFall() {
    // Se o jogador caiu abaixo do mundo, perde uma vida e volta ao início
    if (this.player.isAlive && this.player.y > WORLD_H + 50) {
      this.player.takeDamage();
      if (this.player.isAlive) {
        this.player.respawn(80, 460);
        this.cameras.main.shake(300, 0.01);
      }
    }
  }

  _onPlayerDied() {
    this.cameras.main.shake(500, 0.02);
    this.time.delayedCall(800, () => {
      this.scene.restart();
    });
  }

  _nextScene() {
    // Por ora leva à WinScene; trocar por 'Level2Scene' quando implementado
    this.scene.start('WinScene');
  }
}
