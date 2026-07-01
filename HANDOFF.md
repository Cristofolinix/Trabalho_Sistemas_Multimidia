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
- A pasta de trabalho VARIA por máquina (o projeto é sincronizado só via Git, não pelo caminho).
  Em cada máquina nova: `git clone`, instalar Node.js (se não tiver) e rodar `npm install`
  (o `node_modules/` é local ao projeto e está no `.gitignore`).
- NÃO deixar o projeto dentro de pasta sincronizada por Google Drive/OneDrive (corrompe `node_modules`).
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
    Enemy.js               # inimigo por tipo + IA: trote persegue/agarra/arrasta/arremessa;
                           #   ressaca patrulha e cospe vômito (máquina de estados)
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
- Inimigos: **Ressaca** (sprite atual = Snail; será trocado por ZUMBI, ver abaixo) e
  **Trote → Chicken** (mantém a galinha). O COMPORTAMENTO já foi reescrito (ver "Onde paramos").
- Itens/cenário/HUD (chave, porta, tiles, spikes, corações, estrela, confete, fundos) são
  desenhados por código em `pixelArt.js`/`BootScene.js`.
- IMPORTANTE: não há gerador de imagens no ambiente do Claude Code; sprites detalhados
  vêm de packs CC0 ou são desenhados por código (grades ASCII).

## Áudio
- `AudioManager.js` é um singleton com Web Audio API (osciladores). Sem arquivos externos.
- Música de fundo em loop + SFX (pulo, dano, morte, chave, seleção/confirmação, porta,
  vitória, e um som por habilidade). Precisa de gesto do usuário para iniciar (regra dos
  navegadores) — é desbloqueado no primeiro clique/tecla da TitleScene. Tecla **M** = mudo.
- SFX novos (sessão atual): `grab` (galinha agarra), `throw` (arremesso na armadilha),
  `vomit` (cuspe do zumbi), `nausea` (jogador enjoa).

## Controles
- Mover: ←→ ou A/D | Pular: ↑, W ou Espaço | Habilidade: F | Pausa: ESC | Mudo: M
- Pulo com coyote-time e jump-buffer; checkpoint automático em piso sólido; cair/spike tira 1 coração.
- **Náusea (novo):** quando o vômito do zumbi acerta, por 10s os controles esquerda/direita
  ficam invertidos e a câmera balança (rotação em onda + leve zoom). Some ao respawnar.

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

## ════════════════════════════════════════════════════════════════════════
## ONDE PARAMOS (sessão de 01/07/2026) — LEIA PARA CONTINUAR
## ════════════════════════════════════════════════════════════════════════

### Já FEITO e commitado/pushado nesta sessão (commit `feat: IA dos inimigos...`)
- **Trote (galinha)**: agora PERSEGUE o jogador; ao encostar, AGARRA, carrega o jogador
  até a beira da armadilha (buraco com espinhos) mais próxima e o JOGA dentro.
  Máquina de estados em `Enemy.js`: patrol → chase → carry → return.
- **Ressaca (zumbi)**: CUSPE VÔMITO em arco no jogador (auto-mira quando ele está no alcance).
  Ao acertar → jogador ENJOA por 10s: controles invertidos + câmera balançando (efeito em
  `Level1Scene.update`) + tint verde + texto "ENJOADO!".
- Suporte no `Player.js` (estados `nauseaTimer` e `grabbed`), grupo `vomits` e `traps` em
  `Level1Scene.js`, novos SFX no `AudioManager.js`.
- `.gitignore` passou a ignorar a pasta local `.claude/`.
- Tudo testado rodando o jogo (Vite) — sem erros de runtime.

### PENDENTE — trocar os SPRITES (comportamento já pronto, falta só a arte)
O usuário decidiu: **Ressaca = baixar zumbi CC0**; **Jogadores = buscar pack CC0 de humanos**.
Assets são baixados por download direto do **OpenGameArt** (tem URL de arquivo direta) e
depois VISUALIZADOS com a ferramenta de leitura de imagem para descobrir o layout dos frames
antes de fatiar. (itch.io geralmente não dá link direto, evitar.)

1. **Sprite do ZUMBI (Ressaca)** — candidato CC0 já avaliado e aprovado visualmente:
   - Pack: "128x128 2D Zombies Spritesheet" (CC0) — https://opengameart.org/content/128x128-2d-zombies-spritesheet
   - Arquivo bom: `zombie_typeA_walk_spritesheet.png` (garoto de pele verde, camisa com coração)
     https://opengameart.org/sites/default/files/zombie_typeA_walk_spritesheet.png
     → strip HORIZONTAL de 4 frames de caminhada, vista lateral. Dá pra usar direto.
   - TODO: baixar para `public/assets/enemy_ressaca_walk.png` (ou novo nome), ajustar em
     `BootScene.js` o `frameWidth/frameHeight` (ver dimensões reais do PNG) e a animação
     `ressaca-walk`, e conferir `scale/body/offset` no TYPES.ressaca de `Enemy.js`.
   - Obs.: estilo é cartoon suave (não pixel puro); como o jogo usa `pixelArt:true`, checar
     se ao escalar fica aceitável. Alternativa top-down CC0 (pior): zombie_n_skeleton2.png.

2. **Sprites dos 4 JOGADORES (humanos CC0)** — AINDA NÃO buscado um pack definitivo.
   Roupas que o usuário pediu (para aproximar cada personagem):
   - **Hugo**: de shorts.
   - **Alex**: calça e jaqueta pretas.
   - **Berto**: calça jeans e óculos.
   - **Weverton**: topete e camisa verde.
   O usuário aceitou que as roupas podem NÃO bater exatamente. Precisa de idle/run/jump/fall
   por personagem (ver STATES em `BootScene.js`). Hoje usam Pixel Adventure 32×32; ao trocar,
   ajustar `BootScene` (load + anims), `Player.js` (scale/hitbox) e `characters.js` se preciso.
   Mapeamento de cor atual em `characters.js`: Hugo=vermelho, Alex=azul, Berto=verde, Weverton=laranja.

### Dica de teste (dev)
Phaser não expõe o jogo no `window`. Para testar cenas via console/eval, adicione
temporariamente em `main.js`: `if (import.meta.env.DEV) window.__game = <a instância>;`
e depois `window.__game.scene.start('Level1Scene', { char: 'hugo' })`. REMOVER antes de commitar.

## Preferências do usuário reforçadas nesta sessão
- Continua valendo: commit/push no `master` a cada bloco; textos abstraem o briefing;
  luzes = canhões de luz; fase sempre possível; comentários didáticos no código.
- **Avisar sobre decisões que dependem do usuário em vez de assumir.**

## Próximos passos planejados (do briefing, ainda NÃO feitos)
- Fases 2 (dessaturada/tensa) e 3 (tempestade) com dificuldade crescente.
- Chefe final na Fase 3 ("TCC / Banca" com 3 avaliadores).
- Arco de clima entre fases (paleta/fundo/som) e sequência de vitória (canudo + tempestade dissipa).
- Mais inimigos temáticos por fase.
- Possível troca de placeholders por tilemaps do Tiled.
