// Configuração central dos 4 personagens jogáveis.
// Edite aqui para ajustar stats sem mexer nas cenas.
export const CHARACTERS = {
  hugo: {
    key: 'hugo',
    name: 'Hugo',
    color: 0xe74c3c,
    ability: 'Corpo a corpo — soco rápido à frente',
    speed: 200,
    jumpVelocity: -420,
    abilityCooldown: 1500
  },
  alex: {
    key: 'alex',
    name: 'Alex',
    color: 0x3498db,
    ability: 'À distância — lança projétil',
    speed: 190,
    jumpVelocity: -400,
    abilityCooldown: 2000
  },
  berto: {
    key: 'berto',
    name: 'Berto',
    color: 0x2ecc71,
    ability: 'Poder de área — onda que elimina inimigos próximos',
    speed: 180,
    jumpVelocity: -410,
    abilityCooldown: 3000
  },
  weverton: {
    key: 'weverton',
    name: 'Weverton',
    color: 0xf39c12,
    ability: 'Mobilidade — dash horizontal rápido',
    speed: 220,
    jumpVelocity: -430,
    abilityCooldown: 1000
  }
};

export const DEFAULT_CHARACTER = 'hugo';
