// Porta no fim da fase. Só deixa passar com todas as chaves.
export class Door extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, totalKeys) {
    super(scene, x, y, 'door_placeholder');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    this.totalKeys = totalKeys;
    this.setTint(0x95a5a6);   // cinza = fechada

    // Texto de instrução acima da porta
    this.label = scene.add.text(x, y - 50, 'SAÍDA', {
      fontSize: '12px',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
  }

  // Testa se o jogador pode entrar
  tryEnter(keysCollected) {
    if (keysCollected >= this.totalKeys) {
      return true;   // deixa a cena tratar a transição
    }

    // Mostra aviso temporário
    const falta = this.totalKeys - keysCollected;
    const msg = this.scene.add.text(
      this.x, this.y - 80,
      `Faltam ${falta} chave(s)!`,
      { fontSize: '14px', fill: '#e74c3c', backgroundColor: '#000' }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(10);

    // Some depois de 2 segundos
    this.scene.time.delayedCall(2000, () => msg.destroy());

    return false;
  }
}
