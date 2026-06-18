// Tela de vitória temporária — substituir pela sequência completa depois.
export class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WinScene' });
  }

  create() {
    const cx = this.cameras.main.width  / 2;
    const cy = this.cameras.main.height / 2;

    this.add.rectangle(cx, cy, this.cameras.main.width, this.cameras.main.height, 0x1a1a2e);

    this.add.text(cx, cy - 60, '🎉 Fase 1 Concluída!', {
      fontSize: '32px', fill: '#f1c40f'
    }).setOrigin(0.5);

    this.add.text(cx, cy, 'Próxima fase em breve...', {
      fontSize: '18px', fill: '#ecf0f1'
    }).setOrigin(0.5);

    this.add.text(cx, cy + 60, 'Pressione ESPAÇO para jogar novamente', {
      fontSize: '14px', fill: '#bdc3c7'
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('Level1Scene');
    });
  }
}
