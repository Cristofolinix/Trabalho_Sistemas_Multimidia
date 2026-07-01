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
- Personagens (os 4 jogáveis) ainda usam **Pixel Adventure** de **Pixel Frog** (licença **CC0**),
  baixados de um espelho no GitHub (`Spellthorn/pixel_adventure`) para `public/assets/`.
  Mapeamento atual: Hugo→Ninja Frog, Alex→Virtual Guy, Berto→Pink Man, Weverton→Mask Dude.
  **Isso está para ser trocado — ver "ONDE PARAMOS" abaixo, é a pendência ativa.**
- Inimigos:
  - **Ressaca → ZUMBI (já trocado e commitado)**: pack "128x128 2D Zombies Spritesheet" (CC0,
    OpenGameArt), arquivo `zombie_typeA_walk_spritesheet.png` (garoto pele verde, camisa com
    coração), 4 frames de 71×138px em tira horizontal. Salvo como
    `public/assets/enemy_ressaca_walk.png`. Ajustado em `BootScene.js`
    (`frameWidth:71, frameHeight:138`, animação a 5fps) e em `Enemy.js`
    (`TYPES.ressaca: scale 0.5, body [44,120], offset [14,12]`).
  - **Trote → Chicken** (Pixel Adventure, mantido). Comportamento (IA) de ambos já implementado
    — ver seção de IA mais abaixo.
- Itens/cenário/HUD (chave, porta, tiles, spikes, corações, estrela, confete, fundos) são
  desenhados por código em `pixelArt.js`/`BootScene.js`.
- IMPORTANTE: não há gerador de imagens no ambiente do Claude Code; sprites detalhados
  vêm de packs CC0 (baixados via URL direta) ou são desenhados por código (grades ASCII).
  Fluxo que funcionou bem para o zumbi: (1) achar página do asset no OpenGameArt via
  WebSearch/WebFetch, (2) baixar o PNG direto com Invoke-WebRequest, (3) usar a ferramenta
  Read (visualização de imagem) para conferir o layout antes de fatiar, (4) medir dimensões
  reais com `System.Drawing.Image` no PowerShell antes de definir frameWidth/frameHeight.

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
## ONDE PARAMOS (sessão de 01/07/2026, parte 2) — LEIA PARA CONTINUAR
## ════════════════════════════════════════════════════════════════════════
Esta sessão retomou de um HANDOFF anterior (que já tinha a IA dos inimigos pronta,
ver seção "IA dos inimigos" abaixo). Nesta parte da sessão:

### Já FEITO e commitado/pushado (commit `feat: sprite da Ressaca trocado por zumbi CC0`)
- **Ressaca agora É o zumbi de verdade** (ver seção "Arte" acima para detalhes técnicos).
  Testado com `npx vite build` sem erros. Falta só o usuário rodar `npm run dev` e conferir
  visualmente o tamanho/hitbox em jogo (ninguém rodou o dev server ainda nesta parte).

### PENDENTE — decisão em aberto: sprites dos 4 JOGADORES (humanos)
Contexto da investigação feita nesta sessão: **NÃO existe pack CC0 pronto** (tira horizontal
lateral, idle/walk/jump, 4+ variantes distintas) equivalente ao do zumbi. O que existe:
- Packs modulares (peças soltas: cabeça/corpo/braços, ou arquivos `.xcf` do GIMP) — dá muito
  mais trabalho para montar e é frágil de automatizar bem.
- Packs top-down (perspectiva de cima) — não servem para plataforma lateral.
- Packs de 1 personagem só — deixaria os 4 iguais, só variando cor.

O usuário JÁ ESCOLHEU a direção: **"Integrar humanos (estilo vai destoar)"** — aceitou que o
estilo cartoon/vetorial pode destoar do pixel art do resto do jogo, em troca de melhor
semelhança com os traços reais dos 4 colegas. Três caminhos foram propostos ao usuário para
essa integração (ele ainda NÃO escolheu qual):
1. **Usuário manda um link** de um pack/personagem que ele goste (itch.io/OpenGameArt),
   de preferência com tira lateral (idle/walk/jump) — melhor resultado, mas depende dele.
2. **Kenney "Toon Characters" (CC0)** — humanos cartoon com variações (óculos, chapéu, etc.),
   dá pra aproximar. Não é pixel. Claude pesquisa e integra sozinho.
3. **Recolorir no estilo do zumbi** — gerar 4 "estudantes" reaproveitando o traço do kit do
   zumbi (pele humana, camisas nas cores de cada um). Fica coeso com o inimigo, mas pouca
   variação de rosto/traços.
- **Minha recomendação dada ao usuário: opção 1** (ele manda o link) — garante o melhor
  resultado real. Se ele preferir eu decidir sozinho, ir de **opção 2 (Kenney)**.

**Descrições físicas que o usuário deu para aproximar cada personagem** (para quando os
sprites forem escolhidos/integrados):
- **Hugo**: de shorts.
- **Alex**: calça e jaqueta pretas.
- **Berto**: calça jeans e óculos.
- **Weverton**: topete e camisa verde.
(O usuário aceitou que as roupas podem não bater exatamente com a arte disponível.)

**Quando for integrar**: precisa de idle/run/jump/fall por personagem (ver `STATES` em
`BootScene.js`). Hoje usam Pixel Adventure 32×32; ao trocar, ajustar `BootScene.js`
(load + `_makeAnimations`), `Player.js` (scale/hitbox em torno da linha do `setScale`/
`body.setSize`/`body.setOffset` no construtor) e `characters.js` se os nomes de arquivo
mudarem. Mapeamento de cor atual em `characters.js`: Hugo=vermelho, Alex=azul, Berto=verde,
Weverton=laranja — pode reaproveitar essas cores nas camisas dos novos sprites se fizer sentido.

**PRIMEIRA COISA A FAZER na nova sessão**: perguntar ao usuário qual das 3 opções acima ele
escolhe (ou se ele já tem um link para mandar). Não escolher por ele.

### Dica de teste (dev)
Phaser não expõe o jogo no `window`. Para testar cenas via console/eval, adicione
temporariamente em `main.js`: `if (import.meta.env.DEV) window.__game = <a instância>;`
e depois `window.__game.scene.start('Level1Scene', { char: 'hugo' })`. REMOVER antes de commitar.

### Dica de fluxo para baixar/integrar sprites CC0 (o que funcionou)
1. `WebSearch`/`WebFetch` para achar a página do asset (OpenGameArt é mais confiável que
   itch.io para link direto de arquivo).
2. Baixar o PNG com `Invoke-WebRequest -Uri <url> -OutFile <destino> -UseBasicParsing`.
3. Usar `Read` na imagem baixada para ver visualmente o spritesheet antes de fatiar.
4. Medir dimensões reais: PowerShell com `[System.Drawing.Image]::FromFile(...)` →
   `$img.Width/$img.Height`, dividir pelo número de frames visíveis.
5. Ajustar `frameWidth/frameHeight` no `load.spritesheet` da `BootScene.js`, `frameRate` na
   animação, e `scale/body/offset` no arquivo da entidade correspondente (`Enemy.js`/`Player.js`).
6. Rodar `npx vite build` para checar que não há erro antes de pedir para o usuário testar
   visualmente com `npm run dev` (build não pega problemas de proporção/hitbox, só de sintaxe).

## Preferências do usuário reforçadas nesta sessão
- Continua valendo: commit/push no `master` a cada bloco; textos abstraem o briefing;
  luzes = canhões de luz; fase sempre possível; comentários didáticos no código.
- **Avisar sobre decisões que dependem do usuário em vez de assumir — inclusive perguntar
  antes de escolher entre alternativas de arte/estilo, não só entre alternativas técnicas.**

## Próximos passos planejados (do briefing, ainda NÃO feitos)
- Fases 2 (dessaturada/tensa) e 3 (tempestade) com dificuldade crescente.
- Chefe final na Fase 3 ("TCC / Banca" com 3 avaliadores).
- Arco de clima entre fases (paleta/fundo/som) e sequência de vitória (canudo + tempestade dissipa).
- Mais inimigos temáticos por fase.
- Possível troca de placeholders por tilemaps do Tiled.
