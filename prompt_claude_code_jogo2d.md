# Briefing para o Claude Code — Jogo 2D pixelado de plataforma

> **Como usar:** abra o Claude Code numa pasta vazia do projeto e cole o conteúdo da seção
> "PROMPT (cole isto)". As seções antes dela são contexto pra você (humano) revisar e ajustar.
> Onde houver `[COLCHETES]`, troque pelo seu valor.

---

## Contexto do projeto (para você revisar antes de colar)

- **Disciplina:** Sistemas Multimídia (trabalho de faculdade).
- **Conceito:** jogo 2D em pixel art, **plataforma** side-scroller (pulo, gravidade,
  plataformas em alturas variadas, buracos) com câmera que segue o jogador na horizontal.
  3 fases. Em cada fase: percorrer o cenário, coletar **3 chaves** e usar as 3 para abrir a
  **porta** que leva à próxima fase.
- **Jogadores:** **um jogador por vez** (decidido), com tela de seleção de personagem.
  São 4 personagens jogáveis (você + 3 colegas), cada um com **uma habilidade distinta**.
- **Identidade visual:** pixel art autoral. A progressão de cor/atmosfera entre as fases é
  parte central do trabalho (ver "Arco de clima").

### Decisões técnicas (confirmadas)
- **Motor:** Phaser **3.90** (HTML5/JS).
- **Dev server/bundler:** Vite (confirmar versão estável atual ao instalar).
- **Editor de mapas:** Tiled (tilemaps importados pelo Phaser).
- **Arte:** sprites externos (Aseprite / LibreSprite / Pixelorama / Piskel). No início, o
  código usa **placeholders** (retângulos coloridos) para já rodar antes da arte ficar pronta.

---

## Arco de clima das 3 fases (especificação de design / multimídia)

A progressão emocional e visual é intencional e deve guiar paleta, fundo e som:

1. **Fase 1 — Calourada:** euforia, festas, novidades. Cores quentes e saturadas, luzes de
   festa, céu de início de noite, trilha animada. Tudo parece fácil.
2. **Fase 2 — O meião:** as coisas começam a ficar obscuras. Paleta dessaturando, tons frios
   e acinzentados, luz mais dura, música mais tensa.
3. **Fase 3 — Reta final:** fundo escuro, nuvens carregadas, vento e relâmpagos, quase
   tempestade. Tensão máxima até o chefe.

**Final (sequência de vitória):** ao derrotar o chefe (TCC / Banca), o personagem ganha o
**canudo**; a tempestade se dissipa, o céu clareia e a paleta volta a esquentar (callback à
Fase 1). É o clímax audiovisual do jogo.

---

## PROMPT (cole isto no Claude Code)

Quero desenvolver um jogo 2D em pixel art de **plataforma** para um trabalho de faculdade.
Você será meu par de programação. Trabalhe de forma **incremental**: primeiro um "vertical
slice" jogável da Fase 1 com arte placeholder, e só depois evoluímos. Não tente implementar
tudo de uma vez.

### Stack e regras técnicas
- Use **Phaser 3.90** com JavaScript e **Vite** como dev server.
- **Regra crítica sobre API:** antes de usar qualquer classe ou método do Phaser, confirme a
  assinatura exata na documentação oficial em https://docs.phaser.io. **Não invente nomes de
  métodos.** Se não tiver certeza de uma API (seguir com a câmera, física Arcade, carregar
  tilemap, animações), me diga explicitamente "preciso confirmar X na doc" em vez de chutar.
- O projeto deve **rodar localmente** com um comando simples (ex.: `npm run dev`) e abrir no
  navegador. Garanta `package.json` e config do Vite corretos.
- Código separado por responsabilidade (cenas, entidades, config); evite um arquivo gigante.
- Comente o código de forma didática (preciso explicar na apresentação).

### Arquitetura desejada (proponha e ajuste se fizer sentido)
- Uma **Scene** por etapa: `BootScene` (carrega assets), `MenuScene` (seleção de personagem),
  `Level1Scene`, `Level2Scene`, `Level3Scene`, `GameOverScene` e `WinScene`.
- Classes de entidade reutilizáveis: `Player`, `Enemy` (base) + variações, `Key`, `Door`.
- Um objeto/config central com os 4 personagens e suas habilidades, fácil de editar.

### Vertical slice da Fase 1 (faça PRIMEIRO, só isto)
Quero rodar e jogar isto antes de qualquer outra coisa:
1. Fase **esticada na horizontal** (bem maior que a tela), com chão, **plataformas em alturas
   diferentes** e **alguns buracos** (queda = perder vida ou voltar a um checkpoint), usando
   **física Arcade** (gravidade + colisão).
2. **Jogador placeholder** (retângulo) que anda (setas ou A/D) e **pula** (espaço), com
   colisão correta em chão e plataformas.
3. **Câmera seguindo o jogador** na horizontal, com **bounds** iguais ao tamanho da fase, pra
   não mostrar área fora do mapa.
4. **3 chaves** (placeholders) espalhadas, algumas exigindo pulo pra alcançar. Ao coletar, o
   HUD atualiza "Chaves: X/3".
5. **Porta** no fim que só leva à próxima cena com as 3 chaves; sem elas, mostra mensagem
   ("Faltam chaves").
6. **Inimigo placeholder** que patrulha um trecho; encostar tira vida. HUD de vida.

Pare aqui e me mostre como rodar. Vamos validar antes de seguir.

### Próximos passos (NÃO faça agora — só pra você saber o rumo)
- Sistema de combate por personagem (4 habilidades distintas: corpo a corpo, à distância,
  poder de área, mobilidade/dash).
- Tela de seleção de personagem na `MenuScene`.
- Mais inimigos com tema de faculdade (ver lista abaixo).
- Fases 2 e 3 com dificuldade crescente e **chefe final** ("TCC / Banca") na Fase 3 — ideia:
  a Banca tem 3 avaliadores, cada um com um padrão de ataque.
- **Arco de clima** entre as fases (paleta/fundo/som) e a **sequência de vitória** (canudo +
  tempestade se dissipa + céu clareia). Implementável com troca de fundo, tint, partículas
  (chuva/vento) e tween de transição — confirmar APIs na doc.
- Substituir placeholders por **sprites pixel art** e tilemaps do Tiled (vou entregar PNGs e
  arquivos `.tmj`/`.json`; deixe o código preparado pra carregá-los).
- Telas de vitória/derrota e transições entre fases.

### Conteúdo de referência (para quando formos detalhar)
- **Personagens e habilidades (ajustável):**
  1. `Hugo` — corpo a corpo (ataque rápido de curta distância).
  2. `Alex` — à distância (projétil).
  3. `Berto` — poder de área (dano/efeito em volta).
  4. `Weverton` — mobilidade/defesa (dash ou escudo temporário).
- **Inimigos por fase (tema: universidade pública, aulas à noite):**
  - Fase 1 (leve/cômico): "Ressaca" (lento, cambaleante), "Trote" (anda em bando).
  - Fase 2 (obscuro): "Sono" (causa lentidão/visão escurecendo ao encostar), "Trabalho em
    Grupo" (anda em bando, metade some no meio), "Wi-Fi do Campus" (pisca entre visível e
    invisível), "Prova de 20 Questões" (resistente, bom como mini-chefe).
  - Fase 3 (tempestade): versões fortes (ex.: "Sono acumulado"), "Disciplina Pendente"
    (bloqueia caminho). Chefe: "TCC / Banca".

### Como quero trabalhar com você
- Explique brevemente **o que** vai fazer antes de fazer.
- Mudanças pequenas e testáveis; depois de cada bloco, diga como rodar/testar.
- Se eu pedir algo que vai complicar a manutenção, me alerte e proponha alternativa simples.
- Se faltar informação pra decidir algo, **pergunte** em vez de assumir.

Comece confirmando a stack, criando a estrutura inicial e implementando **apenas o vertical
slice da Fase 1** descrito acima.

---

## Checklist de aceite do vertical slice (para você conferir)
- [ ] `npm run dev` abre o jogo no navegador sem erro de console.
- [ ] Personagem anda e pula; colide com chão e plataformas em alturas diferentes.
- [ ] Buracos causam queda (perda de vida ou checkpoint).
- [ ] Câmera segue na horizontal e não mostra área fora do mapa.
- [ ] As 3 chaves são coletáveis e o HUD atualiza "Chaves: X/3".
- [ ] A porta só leva à próxima cena com as 3 chaves.
- [ ] Inimigo patrulha e causa dano ao encostar; HUD de vida funciona.

## Notas finais
- Sprites/animações: exporte spritesheet (PNG) do Aseprite/Piskel e carregue como folha de
  sprites no Phaser — confirme o método de carregamento na doc.
- Antes da apresentação, gere um build de produção (Vite) pra rodar offline numa pasta, caso a
  internet da faculdade falhe.
