// BootScene: gera as texturas placeholder com Graphics e inicia o Menu.
// Quando os sprites reais estiverem prontos, carregue-os aqui com this.load.image/spritesheet.
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Cria texturas placeholder usando Graphics (sem arquivos externos)
    this._makeRect('player_placeholder',  32, 44, 0xffffff);
    this._makeRect('enemy_placeholder',   34, 40, 0xffffff);
    this._makeRect('key_placeholder',     18, 18, 0xffffff);
    this._makeRect('door_placeholder',    40, 64, 0xffffff);
    this._makeRect('platform_tile',       32, 32, 0x7f8c8d);
    this._makeRect('floor_tile',          32, 32, 0x5d6d7e);
  }

  // Desenha um retângulo branco e o transforma em textura reutilizável
  _makeRect(key, w, h, color) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(color, 1);
    g.fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  create() {
    this.scene.start('Level1Scene');
  }
}
