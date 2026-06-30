import Phaser from 'phaser';
import { BootScene       } from './scenes/BootScene.js';
import { TitleScene      } from './scenes/TitleScene.js';
import { MenuScene       } from './scenes/MenuScene.js';
import { Level1Scene     } from './scenes/Level1Scene.js';
import { WinScene        } from './scenes/WinScene.js';
import { HowToPlayScene  } from './scenes/HowToPlayScene.js';
import { CreditsScene    } from './scenes/CreditsScene.js';

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#0d1b2a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [
    BootScene,       // 1° — gera todas as texturas pixel art
    TitleScene,      // 2° — tela inicial com logo
    MenuScene,       // 3° — seleção de personagem
    Level1Scene,     // 4° — fase 1
    WinScene,        // tela de vitória
    HowToPlayScene,  // como jogar
    CreditsScene,    // créditos
  ]
};

new Phaser.Game(config);
