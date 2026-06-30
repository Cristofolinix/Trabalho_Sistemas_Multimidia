import Phaser from 'phaser';
import { BootScene       } from './scenes/BootScene.js';
import { TitleScene      } from './scenes/TitleScene.js';
import { MenuScene       } from './scenes/MenuScene.js';
import { Level1Scene     } from './scenes/Level1Scene.js';
import { WinScene        } from './scenes/WinScene.js';
import { AboutScene      } from './scenes/AboutScene.js';
import { CreditsScene    } from './scenes/CreditsScene.js';

// Resolução interna do jogo. O Scale Manager (FIT) escala isto para
// preencher a janela do navegador mantendo a proporção 16:9.
export const GAME_W = 1280;
export const GAME_H = 720;

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#0d1b2a',
  pixelArt: true,          // desativa suavização — pixels nítidos
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,            // escala para caber na janela
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [
    BootScene,       // gera texturas pixel art
    TitleScene,      // tela inicial (logo UNEMAT)
    MenuScene,       // seleção de personagem
    Level1Scene,     // fase 1
    WinScene,        // vitória
    AboutScene,      // sobre (como jogar + inimigos)
    CreditsScene,    // créditos
  ]
};

new Phaser.Game(config);
