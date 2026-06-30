// Tema visual compartilhado por todas as cenas.

// Fonte pixelada (carregada via Google Fonts no index.html).
// Fallback monospace caso a fonte não carregue.
export const FONT = '"Press Start 2P", monospace';

// Cores da identidade UNEMAT
export const COLORS = {
  unematBlue:  '#1b3a6b',   // azul institucional
  unematGreen: '#2e8b3d',   // verde da estrela
  gold:        '#f1c40f',
  white:       '#ffffff',
  dark:        '#0d1b2a',
  panel:       '#16213e',
  red:         '#e74c3c',
  blue:        '#3498db',
  green:       '#2ecc71',
  orange:      '#f39c12',
  gray:        '#7f8c8d',
};

// Estilo de texto padrão (pixel font). size em px.
export function textStyle(size, fill = COLORS.white, extra = {}) {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color: fill,
    ...extra,
  };
}
