# HANDOFF — UNEMAT Stories (contexto para nova sessão)

> **Para o Claude de uma nova sessão:** leia este arquivo inteiro antes de começar.
> Ele resume o estado do projeto, decisões tomadas e o que está pendente.

## O que é
Jogo 2D de plataforma em pixel art, **UNEMAT Stories**, trabalho da disciplina de
Sistemas Multimídia. Um jogador por vez, 4 personagens jogáveis, 3 fases planejadas
(só a Fase 1 implementada até agora). Objetivo de cada fase: coletar **3 chaves** e
abrir a **porta** para avançar.

## Stack
- **Phaser 3.90** (HTML5/JS) + **Vite** (dev server/bundler). JavaScript puro (sem TypeScript).
- Física **Arcade** (gravidade + colisão).
- Rodar: `npm install` e depois `npm run dev` (abre em `http://localhost:3000`).
- Build de produção: `npm run build`.

## Local do projeto e Git
- Pasta de trabalho: `C:\Users\alexc\Desktop\jogo-multimidia`
  (foi movida do Google Drive porque o sync do Drive corrompia `node_modules`).
- Repositório: `https://github.com/Cristofolinix/Trabalho_Sistemas_Multimidia` (branch `master`).
- Fluxo: trabalhar tudo direto no `master`. `git add -A` → `git commit -m "..."` → `git push`.

## Estrutura
```
src/
  main.js                  # config do Phaser (1280x720, Scale.FIT, pixelArt) + lista de cenas
  config/
    characters.js          # 4 personagens (cor, velocidade, pulo, habilidade, cooldown)
    theme.js               # FONT (Press Start 2P) e paleta de cores
  audio/
    AudioManager.js         # áudio 100% sintetizado via Web Audio (música + SFX)
  utils/
    pixelArt.js            # makeTexture(): gera texturas a partir de grades ASCII + paleta PAL
  entities/
    Player.js              # jogador animado + 4 habilidades (soco/tiro/onda/dash)
    Enemy.js               # inimigo por tipo (ressaca/trote), patrulha + anima
    Key.js                 # chave coletável (flutua, brilho)
    Door.js                # porta final (exige 3 chaves)
  scenes/
    BootScene.js           # carrega spritesheets + gera texturas + cria animações + carrega fonte
    TitleScene.js          # tela inicial: logo UNEMAT (texto azul + estrela verde) + botões
    MenuScene.js           # seleção de personagem (sprites animados)
    Level1Scene.js         # Fase 1 completa (cenário, plataformas, chaves, inimigos, HUD)
    PauseScene.js          # menu de pausa (ESC) — cena sobreposta, botões clicáveis
    AboutScene.js          # "Sobre": como jogar + inimigos (unificado)
    CreditsScene.js        # créditos (personagens + tecnologias + crédito de arte CC0)
    WinScene.js            # vitória da fase
public/assets/             # PNGs dos sprites (Pixel Adventure, Pixel Frog, CC0)
```

## Arte (sprites)
- Personagens e inimigos usam **Pixel Adventure** de **Pixel Frog** (licença **CC0**),
  baixados de um espelho no GitHub (`Spellthorn/pixel_adventure`) para `public/assets/`.
- Mapeamento de personagens: Hugo→Ninja Frog, Alex→Virtual Guy, Berto→Pink Man, Weverton→Mask Dude.
- Inimigos atuais: **Ressaca→Snail (lento)**, **Trote→Chicken (rápido)**.
- Itens/cenário/HUD (chave, porta, tiles, spikes, corações, estrela, confete, fundos) são
  desenhados por código em `pixelArt.js`/`BootScene.js`.
- IMPORTANTE: não há gerador de imagens no ambiente do Claude Code; sprites detalhados
  vêm de packs CC0 ou são desenhados por código (grades ASCII).

## Áudio
- `AudioManager.js` é um singleton com Web Audio API (osciladores). Sem arquivos externos.
- Música de fundo em loop + SFX (pulo, dano, morte, chave, seleção/confirmação, porta,
  vitória, e um som por habilidade). Precisa de gesto do usuário para iniciar (regra dos
  navegadores) — é desbloqueado no primeiro clique/tecla da TitleScene. Tecla **M** = mudo.

## Controles
- Mover: ←→ ou A/D | Pular: ↑, W ou Espaço | Habilidade: F | Pausa: ESC | Mudo: M
- Pulo com coyote-time e jump-buffer; checkpoint automático em piso sólido; cair/spike tira 1 coração.

## Level design da Fase 1 (tema "Calourada" = festa de recepção dos calouros)
- Mundo 6400×720. Rota alta e rota baixa. 3 chaves em plataformas alcançáveis
  (pulos verificados: subidas ≤ ~130px, vãos ≤ ~190px). Uma chave é guardada por inimigo.
- 4 buracos com pedra de passagem no meio + spikes no fundo; spikes de superfície para pular.
- Cenário: céu quente, silhueta do campus com janelas acesas, canhões de luz varrendo o céu,
  confete, caixas de som de palco, placas de boas-vindas com bandeirinhas, balões.

## Decisões / preferências do usuário (IMPORTANTE)
- Fazer commit/push no `master` a cada bloco de trabalho.
- Textos voltados ao JOGADOR não devem copiar o roteiro/briefing original — abstrair o conceito.
- Luzes de festa no Brasil = canhões de luz/holofotes (NÃO luzinhas de varal, que remetem a Natal).
- Dificuldade deve ser desafiadora, mas a fase sempre precisa ser POSSÍVEL de completar.
- Comentários didáticos no código (o usuário precisa explicar na apresentação).

## Pendências em aberto (aguardando decisão do usuário)
1. **Inimigos que "façam sentido"**: galinha/lesma não convencem. Opções levantadas:
   (a) Zumbi para Ressaca + veterano que persegue para Trote (buscar zumbi CC0);
   (b) outros bichos do mesmo pack (porco que investe / fantasma que paira);
   (c) usuário fornece os sprites.
2. **Personagens parecidos com o usuário e 3 colegas**: precisa das descrições físicas
   (cor de pele/cabelo, barba, óculos, roupa) de Hugo, Alex, Berto e Weverton. Decidir também
   se mantém o estilo "mascarado" atual (só ajusta cor) ou troca para personagens humanos (com rosto).

## Próximos passos planejados (do briefing, ainda NÃO feitos)
- Fases 2 (dessaturada/tensa) e 3 (tempestade) com dificuldade crescente.
- Chefe final na Fase 3 ("TCC / Banca" com 3 avaliadores).
- Arco de clima entre fases (paleta/fundo/som) e sequência de vitória (canudo + tempestade dissipa).
- Mais inimigos temáticos por fase.
- Possível troca de placeholders por tilemaps do Tiled.
