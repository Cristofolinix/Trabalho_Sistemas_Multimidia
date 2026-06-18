import Phaser from 'phaser';
import { BootScene   } from './scenes/BootScene.js';
import { Level1Scene } from './scenes/Level1Scene.js';
import { WinScene    } from './scenes/WinScene.js';

// Configuração principal do Phaser.
// Resolução 960×540 (16:9). Ajuste se necessário.
const config = {
  type: Phaser.AUTO,        // usa WebGL se disponível, senão Canvas
  width: 960,
  height: 540,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },   // gravidade global zerada — cada cena define a sua
      debug: false           // mude para true para ver hitboxes durante o dev
    }
  },
  scene: [
    BootScene,    // 1° — gera texturas placeholder
    Level1Scene,  // 2° — fase 1 (vertical slice)
    WinScene      // tela de vitória temporária
  ]
};

// Cria o jogo. O canvas é inserido automaticamente no <body>.
new Phaser.Game(config);
