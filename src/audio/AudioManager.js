// Áudio 100% sintetizado via Web Audio API (sem arquivos externos).
// Música de fundo em loop + efeitos sonoros. Bom para a apresentação:
// demonstra geração procedural de áudio.
class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicOn = false;
    this._musicTimer = null;
    this._step = 0;
  }

  _ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  }

  // Deve ser chamado após um gesto do usuário (clique/tecla)
  unlock() { this._ensure(); }

  // Toca um tom curto com envelope
  tone({ freq, dur = 0.12, type = 'square', vol = 0.2, slideTo = null, delay = 0, dest = null }) {
    if (!this._ensure() || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(dest || this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  // Efeitos sonoros nomeados
  sfx(name) {
    switch (name) {
      case 'jump':    this.tone({ freq: 340, slideTo: 680, dur: 0.14, type: 'square', vol: 0.16 }); break;
      case 'select':  this.tone({ freq: 520, dur: 0.06, type: 'square', vol: 0.13 }); break;
      case 'confirm': this.tone({ freq: 520, dur: 0.08, vol: 0.16 });
                      this.tone({ freq: 784, dur: 0.10, delay: 0.07, vol: 0.16 }); break;
      case 'key':     this.tone({ freq: 880,  dur: 0.07, type: 'triangle', vol: 0.18 });
                      this.tone({ freq: 1320, dur: 0.12, delay: 0.06, type: 'triangle', vol: 0.18 }); break;
      case 'hurt':    this.tone({ freq: 320, slideTo: 90, dur: 0.26, type: 'sawtooth', vol: 0.22 }); break;
      case 'ability': this.tone({ freq: 200, slideTo: 900, dur: 0.18, type: 'sawtooth', vol: 0.16 }); break;
      case 'punch':   this.tone({ freq: 160, slideTo: 60, dur: 0.12, type: 'square', vol: 0.2 }); break;
      case 'shoot':   this.tone({ freq: 700, slideTo: 1200, dur: 0.1, type: 'square', vol: 0.14 }); break;
      case 'wave':    this.tone({ freq: 120, slideTo: 500, dur: 0.3, type: 'sine', vol: 0.18 }); break;
      case 'dash':    this.tone({ freq: 600, slideTo: 1400, dur: 0.16, type: 'sawtooth', vol: 0.14 }); break;
      case 'door':    this.tone({ freq: 392, dur: 0.12, vol: 0.16 });
                      this.tone({ freq: 587, dur: 0.16, delay: 0.1, vol: 0.16 }); break;
      case 'win':     [523, 659, 784, 1047].forEach((f, i) =>
                        this.tone({ freq: f, dur: 0.2, delay: i * 0.13, type: 'triangle', vol: 0.2 })); break;
      case 'die':     [440, 330, 247, 147].forEach((f, i) =>
                        this.tone({ freq: f, dur: 0.22, delay: i * 0.11, type: 'sawtooth', vol: 0.2 })); break;
      // Galinha agarrando o jogador (cacarejo rápido subindo)
      case 'grab':    this.tone({ freq: 300, slideTo: 620, dur: 0.09, type: 'square', vol: 0.18 });
                      this.tone({ freq: 360, slideTo: 700, dur: 0.09, delay: 0.1, type: 'square', vol: 0.16 }); break;
      // Arremesso do jogador na armadilha (whoosh grave)
      case 'throw':   this.tone({ freq: 520, slideTo: 120, dur: 0.22, type: 'sawtooth', vol: 0.2 }); break;
      // Zumbi cuspindo vômito (jato "molhado" grave)
      case 'vomit':   this.tone({ freq: 180, slideTo: 60, dur: 0.28, type: 'sawtooth', vol: 0.2 }); break;
      // Jogador fica enjoado (tom instável/ondulado)
      case 'nausea':  this.tone({ freq: 240, slideTo: 180, dur: 0.4, type: 'sine', vol: 0.2 });
                      this.tone({ freq: 200, slideTo: 260, dur: 0.4, delay: 0.15, type: 'sine', vol: 0.16 }); break;
    }
  }

  // Jingle triste para a tela de Game Over: melodia descendente em modo menor,
  // tocada uma única vez (não é loop).
  gameOverJingle() {
    const melody = [440, 415, 392, 349, 330, 294, 262];   // descendo, tom menor
    melody.forEach((f, i) => this.tone({
      freq: f, dur: 0.5, delay: i * 0.32, type: 'sine', vol: 0.14
    }));
    // acorde grave final, sustentado
    this.tone({ freq: 131, dur: 1.6, delay: melody.length * 0.32, type: 'triangle', vol: 0.1 });
  }

  // Música de fundo: loop alegre (pentatônica) com baixo — clima de festa
  startMusic() {
    if (!this._ensure() || this.musicOn) return;
    this.musicOn = true;
    this._step = 0;

    // Melodia (Hz) — C maior pentatônica animada
    const melody = [
      523, 659, 784, 659, 587, 784, 659, 523,
      587, 698, 880, 698, 659, 784, 587, 523,
    ];
    const bass = [131, 0, 196, 0, 165, 0, 196, 0];
    const stepDur = 0.20;

    const tick = () => {
      if (!this.musicOn) return;
      const i = this._step;
      const m = melody[i % melody.length];
      if (m) this.tone({ freq: m, dur: stepDur * 0.85, type: 'triangle', vol: 0.05 });
      const b = bass[i % bass.length];
      if (b) this.tone({ freq: b, dur: stepDur * 1.6, type: 'square', vol: 0.04 });
      // contratempo (hi-hat sintético) nos tempos pares
      if (i % 2 === 1) this.tone({ freq: 2000, dur: 0.03, type: 'square', vol: 0.015 });
      this._step++;
    };
    tick();
    this._musicTimer = setInterval(tick, stepDur * 1000);
  }

  stopMusic() {
    this.musicOn = false;
    if (this._musicTimer) { clearInterval(this._musicTimer); this._musicTimer = null; }
  }

  // Música Tensa para a Fase 2: BPM lento, escala menor, baixo pesado
  startTenseMusic() {
    // Para qualquer música anterior (inclusive a alegre da Fase 1)
    this.stopMusic();
    if (!this._ensure()) return;
    this.musicOn = true;
    this._step = 0;

    // Escala menor sombria
    const melody = [
      329, 0, 349, 0, 293, 0, 329, 0,
      220, 0, 261, 0, 246, 0, 164, 0
    ];
    const bass = [82, 82, 0, 82, 73, 73, 0, 73]; // Muito grave, batida cardíaca
    const stepDur = 0.35; // Mais lento (tenso)

    const tick = () => {
      if (!this.musicOn) return;
      const i = this._step;
      const m = melody[i % melody.length];
      if (m) this.tone({ freq: m, dur: stepDur * 0.9, type: 'sawtooth', vol: 0.04 });
      const b = bass[i % bass.length];
      if (b) this.tone({ freq: b, dur: stepDur * 0.4, type: 'square', vol: 0.06 });
      
      // Batida pesada ocasional (como um trovão distante)
      if (i % 8 === 0) this.tone({ freq: 50, slideTo: 20, dur: 0.8, type: 'square', vol: 0.08 });
      
      this._step++;
    };
    tick();
    this._musicTimer = setInterval(tick, stepDur * 1000);
  }

  // Música Sombria e Assustadora para a Fase 3
  startScaryMusic() {
    this.stopMusic();
    if (!this._ensure()) return;
    this.musicOn = true;
    this._step = 0;

    // Escala dissonante escura — cada nota da melodia toca JUNTO com uma
    // segunda voz quase colada (intervalo de segunda menor), criando um
    // batimento/atrito constante (a base do "desconforto" em trilhas de
    // terror). Ritmo irregular (silêncios em posições diferentes a cada
    // volta) em vez de um compasso previsível.
    const melody = [
      110, 0, 0, 117, 98, 0, 117, 0,
      147, 0, 155, 0, 0, 98, 0, 147,
    ];
    const bass = [55, 55, 0, 58, 55, 0, 49, 0, 55, 0, 58, 55, 49, 0, 55, 0]; // sub-bass pesado, batida irregular
    const stepDur = 0.40;

    const tick = () => {
      if (!this.musicOn) return;
      const i = this._step;
      const m = melody[i % melody.length];
      if (m) {
        // Volume bem mais alto que antes (0.05→0.09) + segunda voz
        // dissonante (m*1.06 ≈ meio-tom acima) mais baixa por trás,
        // dando o atrito característico de trilha de terror.
        this.tone({ freq: m, dur: stepDur * 0.95, type: 'sawtooth', vol: 0.09 });
        this.tone({ freq: m * 1.06, dur: stepDur * 0.95, type: 'sine', vol: 0.045 });
      }
      const b = bass[i % bass.length];
      if (b) this.tone({ freq: b, dur: stepDur * 0.6, type: 'triangle', vol: 0.14 });

      // Vento uivante grave, quase contínuo (mais presente que antes)
      if (i % 3 === 0) {
        this.tone({ freq: 320, slideTo: 60, dur: 0.9, type: 'sawtooth', vol: 0.03 });
      }

      // "Jump scare" sonoro: estridente, alto e IMPREVISÍVEL (chance
      // aleatória a cada passo, não um ponto fixo do compasso) — muito mais
      // audível que a versão anterior (vol 0.025), que ficava mais baixa
      // que o resto da música e passava despercebida.
      if (Math.random() < 0.05) {
        this.tone({ freq: 1400, slideTo: 400, dur: 0.5, type: 'sawtooth', vol: 0.18 });
        this.tone({ freq: 2000, dur: 0.12, type: 'square', vol: 0.15 });
      }

      this._step++;
    };
    tick();
    this._musicTimer = setInterval(tick, stepDur * 1000);
  }

  // Música Alegre/Festiva para a Vitória da Formatura
  startHappyMusic() {
    this.stopMusic();
    if (!this._ensure()) return;
    this.musicOn = true;
    this._step = 0;

    // Fanfarra alegre em dó maior / escala maior brilhante
    const melody = [
      523, 659, 784, 1047, 784, 1047, 1318, 0,
      880, 1047, 1318, 1568, 1318, 1568, 2093, 0
    ];
    const bass = [131, 196, 165, 196, 220, 262, 220, 262];
    const stepDur = 0.16; // Bem rápida e animada!

    const tick = () => {
      if (!this.musicOn) return;
      const i = this._step;
      const m = melody[i % melody.length];
      if (m) this.tone({ freq: m, dur: stepDur * 0.85, type: 'triangle', vol: 0.04 });
      const b = bass[i % bass.length];
      if (b) this.tone({ freq: b, dur: stepDur * 1.5, type: 'square', vol: 0.035 });
      
      // Caixa de bateria (noise simples) nos contra-tempos
      if (i % 2 === 1) {
        this.tone({ freq: 1500, dur: 0.02, type: 'square', vol: 0.01 });
      }
      this._step++;
    };
    tick();
    this._musicTimer = setInterval(tick, stepDur * 1000);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.6;
    return this.muted;
  }
}

// Instância única compartilhada por todas as cenas
export const audio = new AudioManager();
