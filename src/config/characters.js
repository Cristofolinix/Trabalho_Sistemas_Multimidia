// Configuração central dos 4 personagens jogáveis.
// Edite aqui para ajustar stats sem mexer nas cenas.
export const CHARACTERS = {
  hugo: {
    name: 'Hugo',
    color: 0xe74c3c,   // vermelho
    ability: 'Corpo a corpo — ataque rápido de curta distância',
    speed: 200,
    jumpVelocity: -420
  },
  alex: {
    name: 'Alex',
    color: 0x3498db,   // azul
    ability: 'À distância — lança projétil',
    speed: 190,
    jumpVelocity: -400
  },
  berto: {
    name: 'Berto',
    color: 0x2ecc71,   // verde
    ability: 'Poder de área — dano em volta',
    speed: 180,
    jumpVelocity: -410
  },
  weverton: {
    name: 'Weverton',
    color: 0xf39c12,   // laranja
    ability: 'Mobilidade — dash ou escudo temporário',
    speed: 220,
    jumpVelocity: -430
  }
};

// Personagem padrão usado enquanto a MenuScene não existe
export const DEFAULT_CHARACTER = 'hugo';
