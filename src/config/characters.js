// Configuração central dos 4 personagens jogáveis.
// 'color' é a cor da camisa; 'colorDark' é a sombra (usada no sprite).
export const CHARACTERS = {
  hugo: {
    key: 'hugo',
    name: 'Hugo',
    color: 0xe74c3c, colorDark: 0xc0392b,
    ability: 'Soco corpo a corpo',
    speed: 210,
    jumpVelocity: -560,
    abilityCooldown: 1200,
    frameW: 16, frameH: 16   // Mr. Man (GrafxKid Sprite Pack 1, CC0)
  },
  alex: {
    key: 'alex',
    name: 'Alex',
    color: 0x3498db, colorDark: 0x2471a3,
    ability: 'Projetil a distancia',
    speed: 200,
    jumpVelocity: -560,
    abilityCooldown: 1800,
    frameW: 32, frameH: 32   // Agent Mike (GrafxKid Sprite Pack 4, CC0)
  },
  berto: {
    key: 'berto',
    name: 'Berto',
    color: 0x2ecc71, colorDark: 0x239b56,
    ability: 'Onda de area',
    speed: 195,
    jumpVelocity: -555,
    abilityCooldown: 2600,
    frameW: 32, frameH: 32   // Tommy (GrafxKid Sprite Pack 3, CC0)
  },
  weverton: {
    key: 'weverton',
    name: 'Weverton',
    color: 0xf39c12, colorDark: 0xd68910,
    ability: 'Dash veloz',
    speed: 225,
    jumpVelocity: -575,
    abilityCooldown: 900,
    frameW: 32, frameH: 48   // Diego (GrafxKid Sprite Pack 7, CC0)
  }
};

export const DEFAULT_CHARACTER = 'hugo';
