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

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.6;
    return this.muted;
  }
}

// Instância única compartilhada por todas as cenas
export const audio = new AudioManager();
