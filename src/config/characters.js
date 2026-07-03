// Configuração dos 4 personagens jogáveis.
//
// 'visibleH': altura real do desenho em px nativos (pose idle) — Player.js usa para
//             igualar o tamanho visual dos 4, já que cada sprite pack tem espaço vazio diferente.
// 'body':     hitbox em px de MUNDO (Arcade Physics NÃO escala com setSize).
// 'bodyOffset': escalado automaticamente pelo Phaser — unidades diferentes de 'body'.
// 'originX/Y': recentra this.x/this.y no centro visual (evita habilidades saírem deslocadas).
export const CHARACTERS = {
  hugo: {
    key: 'hugo',
    name: 'Hugo',
    color: 0xe74c3c, colorDark: 0xc0392b,
    ability: 'Soco corpo a corpo',
    speed: 210,
    jumpVelocity: -560,
    abilityCooldown: 1200,
    frameW: 16, frameH: 16,
    visibleH: 15,
    body: [7, 13], bodyOffset: [5, 3],
    originX: 0.469, originY: 0.5
  },
  alex: {
    key: 'alex',
    name: 'Alex',
    color: 0x3498db, colorDark: 0x2471a3,
    ability: 'Projetil a distancia',
    speed: 200,
    jumpVelocity: -560,
    abilityCooldown: 1800,
    frameW: 32, frameH: 32,
    visibleH: 15,
    body: [12, 13], bodyOffset: [14, 18.5],
    originX: 0.594, originY: 0.75,   // desenhado na metade inferior do frame
    menuOffsetX: 14
  },
  berto: {
    key: 'berto',
    name: 'Berto',
    color: 0x2ecc71, colorDark: 0x239b56,
    ability: 'Onda de area',
    speed: 195,
    jumpVelocity: -555,
    abilityCooldown: 2600,
    frameW: 32, frameH: 32,
    visibleH: 28,
    body: [12, 24], bodyOffset: [11, 8],
    originX: 0.5, originY: 0.547
  },
  weverton: {
    key: 'weverton',
    name: 'Weverton',
    color: 0xf39c12, colorDark: 0xd68910,
    ability: 'Dash veloz',
    speed: 225,
    jumpVelocity: -575,
    abilityCooldown: 900,
    frameW: 32, frameH: 48,
    visibleH: 39,
    body: [20, 33], bodyOffset: [6, 15],
    originX: 0.484, originY: 0.583
  }
};

export const DEFAULT_CHARACTER = 'hugo';
