// Paleta de cores compartilhada entre todos os sprites
export const PAL = {
  '.': null,        // transparente
  '0': 0x000000,   // preto
  '1': 0xffffff,   // branco
  'S': 0xf5cba7,   // pele clara
  's': 0xd4a574,   // pele sombra
  'H': 0x2c1810,   // cabelo escuro
  'h': 0x5d3a1a,   // cabelo médio
  // Hugo — vermelho
  'R': 0xe74c3c,
  'r': 0xc0392b,
  // Alex — azul
  'B': 0x3498db,
  'b': 0x2471a3,
  // Berto — verde
  'G': 0x2ecc71,
  'g': 0x239b56,
  // Weverton — laranja
  'O': 0xf39c12,
  'o': 0xd68910,
  // Genérico
  'P': 0x1a252f,   // calça escura
  'p': 0x2c3e50,   // calça clara
  'Y': 0xf1c40f,   // amarelo (chave/fogo)
  'y': 0xd4ac0d,   // amarelo escuro
  // Inimigo Ressaca — roxo esverdeado, olheiras
  'M': 0x7d3c98,
  'm': 0x6c3483,
  'Z': 0x1e8449,   // verde doentio
  'z': 0x196f3d,
  // Inimigo Trote — laranja/vermelho
  'T': 0xe67e22,
  't': 0xca6f1e,
  // Fogo / tocha (logo UNEMAT)
  'F': 0xff6b35,   // laranja fogo
  'f': 0xffa500,   // laranja claro
  'W': 0xffdd57,   // amarelo quente
  'w': 0xffe066,   // amarelo brilhante
  // Madeira / estrutura
  'N': 0x8b6914,
  'n': 0x5d4037,
  // Plataforma / chão
  'L': 0x7f8c8d,
  'l': 0x5d6d7e,
  'k': 0x95a5a6,   // plataforma claro
  // Porta
  'D': 0x884400,
  'd': 0x5d2e00,
  'A': 0xf0b429,   // metal dourado
  'a': 0xc8932a,
  // Estrela / HUD
  'V': 0xe8daef,
};

/**
 * Gera uma textura Phaser a partir de um array de strings (pixel art).
 * @param {Phaser.Scene} scene
 * @param {string}       key       - chave da textura no cache
 * @param {number}       px        - tamanho de cada "pixel" em px reais
 * @param {string[]}     rows      - linhas da arte
 * @param {object}       palette   - mapa char → cor hex (usa PAL por padrão)
 */
export function makeTexture(scene, key, px, rows, palette = PAL) {
  const cols = rows[0].length;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = palette[row[x]];
      if (color != null) {
        g.fillStyle(color, 1);
        g.fillRect(x * px, y * px, px, px);
      }
    }
  });

  g.generateTexture(key, cols * px, rows.length * px);
  g.destroy();
}
