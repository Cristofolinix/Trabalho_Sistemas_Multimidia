// Configuração central dos 4 personagens jogáveis.
// 'color' é a cor da camisa; 'colorDark' é a sombra (usada no sprite).
//
// Cada personagem vem de um GrafxKid Sprite Pack diferente (CC0, itch.io), cada
// um com seu próprio tamanho de frame (frameW/frameH) e, mais importante, sua
// própria quantidade de "espaço vazio" dentro do frame — por isso NÃO dá pra
// calcular a escala só a partir do tamanho do frame (ex: o Agent Mike só ocupa
// metade da altura do canvas 32x32 dele, enquanto o Tommy ocupa quase tudo).
// 'visibleH' é a altura real do desenho (medida manualmente, em px nativos, na
// pose de idle) — é isso que Player.js usa para igualar o tamanho visual dos 4.
// 'body'/'bodyOffset' são a hitbox em px nativos (mesmo padrão do TYPES em
// Enemy.js), medidos a partir do recorte visível de cada sprite.
export const CHARACTERS = {
  hugo: {
    key: 'hugo',
    name: 'Hugo',
    color: 0xe74c3c, colorDark: 0xc0392b,
    ability: 'Soco corpo a corpo',
    speed: 210,
    jumpVelocity: -560,
    abilityCooldown: 1200,
    frameW: 16, frameH: 16,          // Mr. Man (Sprite Pack 1)
    visibleH: 15,
    body: [7, 13], bodyOffset: [5, 3]
  },
  alex: {
    key: 'alex',
    name: 'Alex',
    color: 0x3498db, colorDark: 0x2471a3,
    ability: 'Projetil a distancia',
    speed: 200,
    jumpVelocity: -560,
    abilityCooldown: 1800,
    frameW: 32, frameH: 32,          // Agent Mike (Sprite Pack 4)
    visibleH: 15,
    body: [12, 13], bodyOffset: [14, 19]
  },
  berto: {
    key: 'berto',
    name: 'Berto',
    color: 0x2ecc71, colorDark: 0x239b56,
    ability: 'Onda de area',
    speed: 195,
    jumpVelocity: -555,
    abilityCooldown: 2600,
    frameW: 32, frameH: 32,          // Tommy (Sprite Pack 3)
    visibleH: 28,
    body: [12, 24], bodyOffset: [11, 8]
  },
  weverton: {
    key: 'weverton',
    name: 'Weverton',
    color: 0xf39c12, colorDark: 0xd68910,
    ability: 'Dash veloz',
    speed: 225,
    jumpVelocity: -575,
    abilityCooldown: 900,
    frameW: 32, frameH: 48,          // Diego (Sprite Pack 7)
    visibleH: 39,
    body: [20, 33], bodyOffset: [6, 15]
  }
};

export const DEFAULT_CHARACTER = 'hugo';
