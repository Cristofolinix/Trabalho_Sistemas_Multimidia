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
- Personagens (os 4 jogáveis) usam **GrafxKid Sprite Packs** (itch.io, licença **CC0**,
  crédito opcional). Cada um vem de um pack diferente, com tamanho de frame próprio
  (ver `frameW`/`frameH` em `characters.js`) — `Player.js` normaliza a altura visual
  na tela (`TARGET_HEIGHT = 58`) calculando a escala a partir de `this.frame.height`,
  então não importa que os frames de origem tenham tamanhos diferentes.
  Mapeamento atual:
  - **Hugo → Mr. Man** (Sprite Pack 1, frames 16×16). Tem animação de soco dedicada,
    combina com a habilidade dele.
  - **Alex → Agent Mike** (Sprite Pack 4, frames 32×32). Terno escuro, segura uma
    pistola (só estética) — combina com a habilidade de tiro.
  - **Berto → Tommy** (Sprite Pack 3, frames 32×32). Visual casual neutro.
  - **Weverton → Diego** (Sprite Pack 7, frames 32×48). Jaqueta verde militar,
    segura um rifle (só estética, não usado na habilidade de dash).
  - `player_weverton_fall.png` é uma cópia do `Jump` (Diego não tem pose de queda
    dedicada no pack).
  - `player_alex_jump.png`/`player_alex_fall.png` foram recortados de um único
    arquivo `Jump_&_Falling` (2 frames) do Agent Mike.
  - Pesquisa/decisão completa: ver "ONDE PARAMOS" abaixo (sessão de 02/07/2026).
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
## ONDE PARAMOS (sessão de 02/07/2026) — LEIA PARA CONTINUAR
## ════════════════════════════════════════════════════════════════════════

### RESOLVIDO nesta sessão: sprites dos 4 jogadores trocados para humanos de verdade
A pendência do HANDOFF anterior ("sprites dos 4 jogadores") foi fechada. Ver seção
"Arte (sprites)" acima para o mapeamento final (GrafxKid Sprite Packs, CC0) e o porquê
de cada escolha. Testado no dev server: seleção de personagem, corrida, pulo e colisão
com o chão conferidos visualmente para os 4 (ver "Dica de teste" abaixo para repetir).
`npx vite build` sem erros.

### RESOLVIDO (bugs reportados pelo usuário após testar): tamanho do Alex + mira
Depois do primeiro commit desta sessão, o usuário testou e reportou 2 bugs (ambos
corrigidos em commits separados, `cd89d61` e `33afa75`):
1. **Alex (Agent Mike) aparecia bem menor que os outros 3.** Causa: a escala era
   calculada a partir da altura do FRAME (32x32), mas cada personagem usa uma
   fração diferente desse espaço pro desenho em si (Agent Mike só ~47%, os outros
   ~81-94%). Corrigido normalizando pela altura REAL do desenho (`visibleH` em
   `characters.js`, medido manualmente com um script de bounding-box — ver "Dica"
   abaixo). Isso também exigiu recalcular a hitbox (`body`/`bodyOffset`) por
   personagem em vez de usar uma % fixa do frame.
2. **Tiro do Alex passava por cima das galinhas.** Causa mais sutil: o sprite do
   Agent Mike não é desenhado centralizado no frame (fica na metade de baixo do
   canvas), mas `this.x`/`this.y` do Player sempre foi o CENTRO DO FRAME (origem
   padrão do Phaser, 0.5/0.5) — então toda habilidade que mira a partir de `this.y`
   saía deslocada da posição visual real. Corrigido com `setOrigin()` por
   personagem (`originX`/`originY` em `characters.js`), recentrando `this.x/y` no
   centro visual de cada sprite. **Pegadinha:** mudar o origin DEPOIS que o body
   físico já existe (`scene.physics.add.existing(this)`) faz o `body.setOffset()`
   se comportar de um jeito difícil de prever a partir da fórmula "teórica" do
   Phaser — não vale a pena tentar deduzir a fórmula exata, é mais rápido calibrar
   ao vivo comparando `body.bottom` entre os 4 personagens até baterem (todos devem
   dar o mesmo valor quando parados no chão — nesta fase, 640).
   Também descobri que `body.setSize()`/`setOffset()` **não escalam automaticamente**
   com `setScale()` neste projeto (valores são em px de mundo direto, não "nativos
   vezes escala" como eu supunha inicialmente) — importante lembrar se for mexer em
   hitbox de novo.

**Pegadinha de teste** (custou bastante tempo nesta sessão): ao testar via
`preview_eval` com `await new Promise(r => setTimeout(r, N))`, o "tempo de jogo"
simulado às vezes anda MUITO mais devagar que N ms reais (a aba fica em segundo
plano/sem foco pro Chrome controlado remotamente, e o `requestAnimationFrame` do
Phaser é throttled). Isso fez um personagem parecer "preso flutuando no ar" quando
na verdade só precisava de mais tempo real pra assentar. Se um teste parecer
travado, **repita a leitura em uma chamada separada** (o tempo real entre chamadas
do `preview_eval` costuma ser suficiente) antes de concluir que há um bug de física.

**Erros cometidos e corrigidos ao longo da sessão** (útil para não repetir):
- Tentei primeiro o pack "MV Platformer" (MoikMellah, OpenGameArt) — o usuário rejeitou:
  Berto/Weverton saíram com sprites **femininos** (o pack só tinha personagens fantasy
  prontos, tipo "warrior"/"mage"/"knight", e usei bases femininas para 2 deles sem
  perceber) e o estilo (proporções realistas, tipo RPG) destoava do "baixinho/cartunesco"
  que o usuário queria manter (o Pixel Adventure antigo já tinha esse estilo e ele gostava).
  **Licença dos personagens deve ser sempre MASCULINA aqui** (representam 4 amigos reais)
  e o estilo deve ser baixinho/cartunesco tipo Pixel Adventure, não realista.
  → Revertido com `git checkout` (nada tinha sido commitado ainda).
- Segunda tentativa (GrafxKid) quase descartei Agent Mike/Diego por segurarem arma
  (pistola/rifle) em todo frame — o usuário corrigiu que isso não é problema real
  (é só pixel art bem simples, sem peso nenhum). Não vale a pena ficar excessivamente
  cauteloso com esse tipo de prop cosmético em jogos assim.
- **Onion Lad, Barry Cherry, Big Red, o "Rei" de Kings and Pigs**: todos pareciam humanos
  pela descrição textual da página do itch.io, mas na verdade são vegetal/fruta/monstro
  redondo/goblin verde. **Sempre conferir a imagem de capa pública antes de baixar o pack
  inteiro** (ver "Dica de fluxo" abaixo — evita ciclos de baixar→abrir→descartar).

### Pendência ativa: nenhuma tarefa de arte em aberto no momento
Próximo passo é escolha livre do usuário — ver "Próximos passos planejados" abaixo
(Fases 2/3, tilemaps Tiled, etc.) ou aguardar novo pedido.

### Dica de teste (dev) — IMPORTANTE, usar exatamente este fluxo
Phaser não expõe o jogo no `window` por padrão. Para testar cenas via `preview_eval`/console:
1. Adicionar temporariamente em `main.js`, substituindo `new Phaser.Game(config);`:
   ```js
   const __game = new Phaser.Game(config);
   if (import.meta.env.DEV) window.__game = __game;
   ```
2. `window.__game.scene.start('MenuScene')` ou `window.__game.scene.start('Level1Scene', { char: 'hugo' })`.
3. Para inspecionar/mover o player: `window.__game.scene.getScene('Level1Scene').player`.
4. **REMOVER antes de commitar** (o handoff anterior já avisava disso, reforçando).
- Ao usar a ferramenta de preview (`preview_start`), o `serverId`/porta retornados pelo
  MCP às vezes NÃO batem com a porta real que o Vite escolheu (`vite.config.js` tem
  `server.port: 3000` fixo; se a 3000 estiver ocupada o Vite sobe sozinho na 3001, mas
  a ferramenta de preview pode continuar apontando pra outra porta livre que ela mesma
  reservou). Se `preview_screenshot` mostrar tela preta / `chrome-error://`, checar a
  porta real nos logs do servidor (`preview_logs`) e navegar manualmente com
  `preview_eval`: `window.location.href = "http://localhost:<porta real>"`.
- Cliques via `preview_click`/coordenadas em cima do `<canvas>` do Phaser são pouco
  confiáveis (o clique cai em coordenada errada e não acerta os botões da UI). Mais
  rápido pular direto pra cena com `window.__game.scene.start(...)` do que tentar clicar.

### Dica de fluxo para baixar/integrar sprites CC0 (atualizado nesta sessão)
1. `WebSearch`/`WebFetch` para achar a página do asset. **OpenGameArt** é fácil (link
   direto de zip). **itch.io bloqueia download automatizado** (Cloudflare bot-protection
   — o fluxo de CSRF token + `/download_url` retorna uma URL assinada, mas o `curl` final
   sempre recebe 302 de volta pra página do jogo; só funciona com navegador de verdade).
   Nesses casos, **pedir pro usuário baixar manualmente** e salvar em `C:\Users\alexc\Downloads`
   — de lá dá pra ler puro Bash/PowerShell normalmente.
2. **Antes de pedir pro usuário baixar o pacote inteiro**, confira a capa/preview pública
   do itch.io (`img.itch.zone/...`, sempre acessível sem auth — pegar a URL com
   `curl -s <página> | grep -oE 'https://img\.itch\.zone/[^"]*original[^"]*'`) pra checar
   visualmente se o personagem é humano mesmo (nomes/descrições enganam — ver erros acima).
3. Baixar o PNG/zip com `Invoke-WebRequest -Uri <url> -OutFile <destino> -UseBasicParsing`
   (funciona bem pra OpenGameArt/Kenney; não funciona pra itch.io, ver item 1).
4. Usar `Read` na imagem baixada pra ver visualmente o spritesheet antes de fatiar.
5. Medir dimensões reais: PowerShell com `[System.Drawing.Bitmap]::FromFile(...)` →
   `$img.Width/$img.Height`. Ao montar `Rectangle` pra recorte, usar sempre
   `[System.Drawing.Rectangle]::new(x,y,w,h)` (sintaxe `New-Object ...Rectangle(a,b,c,d)`
   é ambígua no PowerShell e falha silenciosamente/gera imagem em branco sem erro óbvio).
6. Ajustar `frameWidth/frameHeight` no `load.spritesheet` da `BootScene.js` — hoje isso é
   por personagem via `CHARACTERS[c].frameW/frameH` em `characters.js` (packs diferentes
   têm frames de tamanhos diferentes). `Player.js` normaliza a escala sozinho a partir de
   `this.frame.height` (constante `TARGET_HEIGHT`), então não precisa mexer na escala à mão.
7. Rodar `npx vite build` pra checar que não há erro, DEPOIS testar visualmente com
   `preview_start`/`npm run dev` (build não pega problema de proporção/hitbox, só sintaxe).

## Preferências do usuário reforçadas nesta sessão
- Continua valendo: commit/push no `master` a cada bloco; textos abstraem o briefing;
  luzes = canhões de luz; fase sempre possível; comentários didáticos no código.
- Avisar sobre decisões que dependem do usuário em vez de assumir — inclusive perguntar
  antes de escolher entre alternativas de arte/estilo, não só entre alternativas técnicas.
- **Personagens jogáveis devem ser sempre masculinos** (representam 4 amigos reais do
  usuário) — nunca usar base feminina de um pack "genérico", mesmo como solução temporária.
- **Estilo visual dos jogadores = baixinho/cartunesco** (tipo Pixel Adventure/GrafxKid),
  não realista/proporção RPG — mesmo que o traço "destoe" do resto do pixel art do jogo.
- Não precisa bater exatamente com as descrições físicas dadas (shorts, óculos, jeans,
  topete, camisa verde) — usar o que houver disponível "vagamente" no mesmo estilo já
  é aceitável, o usuário prioriza estilo consistente sobre fidelidade literal.
- Props cosméticos (arma, espada) na pose idle/andando de um sprite não são um problema
  em si — não descartar uma opção só por causa disso sem perguntar primeiro.

## Próximos passos planejados (do briefing, ainda NÃO feitos)
- Fases 2 (dessaturada/tensa) e 3 (tempestade) com dificuldade crescente.
- Chefe final na Fase 3 ("TCC / Banca" com 3 avaliadores).
- Arco de clima entre fases (paleta/fundo/som) e sequência de vitória (canudo + tempestade dissipa).
- Mais inimigos temáticos por fase.
- Possível troca de placeholders por tilemaps do Tiled.
