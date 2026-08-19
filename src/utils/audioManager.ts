// ============================================================================
// Pali Tycoon (บาลีส่วนฐี) - Audio & Procedural BGM Music Engine
// ============================================================================

export type BGMThemeId = 'dharma' | 'zen' | 'festival';

export interface BGMThemeInfo {
  id: BGMThemeId;
  name: string;
  subtitle: string;
  icon: string;
  tempo: number; // BPM
}

export const BGM_THEMES: BGMThemeInfo[] = [
  {
    id: 'dharma',
    name: 'ทิพยดุริยางค์ (Dharma Melodies)',
    subtitle: 'ทำนองระนาดแก้วและขลุ่ยผิว แดนพุทธภูมิ',
    icon: '✨',
    tempo: 76,
  },
  {
    id: 'zen',
    name: 'สมาธิภาวนา (Zen & Singing Bowl)',
    subtitle: 'ขันธิเบตและฮาร์ปแห่งความสงบ',
    icon: '🧘',
    tempo: 60,
  },
  {
    id: 'festival',
    name: 'สมโภชพระอาราม (Temple Celebration)',
    subtitle: 'ท่วงทำนองรื่นเริงฉลองสำนักบาลี',
    icon: '🏯',
    tempo: 94,
  },
];

// Standard Note Frequencies (Hz)
const NOTE = {
  REST: 0,
  D2: 73.42, E2: 82.41, Fs2: 92.50, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, Cs3: 138.59, D3: 146.83, E3: 164.81, Fs3: 185.00, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, Cs4: 277.18, D4: 293.66, E4: 329.63, Fs4: 369.99, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, E5: 659.25, Fs5: 739.99, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, Fs6: 1479.98, A6: 1760.00,
};

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isMuted: boolean = false;
  private isBgmPlaying: boolean = false;
  private bgmVolume: number = 0.35; // default 35% comfortable volume
  private sfxVolume: number = 0.8;
  private currentTheme: BGMThemeId = 'dharma';

  // Scheduler timer for seamless looping BGM
  private schedulerTimer: number | null = null;
  private currentStep: number = 0;
  private nextStepTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('pali_audio_muted');
      if (savedMute !== null) this.isMuted = savedMute === 'true';

      const savedBgmVol = localStorage.getItem('pali_bgm_volume');
      if (savedBgmVol !== null) this.bgmVolume = parseFloat(savedBgmVol) || 0.35;

      const savedTheme = localStorage.getItem('pali_bgm_theme') as BGMThemeId | null;
      if (savedTheme && ['dharma', 'zen', 'festival'].includes(savedTheme)) {
        this.currentTheme = savedTheme;
      }

      const savedBgmOn = localStorage.getItem('pali_bgm_enabled');
      if (savedBgmOn !== 'false') {
        this.isBgmPlaying = true;
      }
    }
  }

  public init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        
        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // BGM Gain
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);

        // SFX Gain
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Handle first user gesture to unlock audio context & start looping BGM
  public handleUserGesture() {
    this.init();
    if (this.isBgmPlaying && !this.schedulerTimer) {
      this.startBGMLoop();
    }
  }

  // ---------------------------------------------------------------------------
  // Master & Mute Controls
  // ---------------------------------------------------------------------------

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pali_audio_muted', String(this.isMuted));
    }
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // ---------------------------------------------------------------------------
  // BGM Looping Controls
  // ---------------------------------------------------------------------------

  public getBGMState(): { isPlaying: boolean; volume: number; theme: BGMThemeId } {
    return {
      isPlaying: this.isBgmPlaying,
      volume: this.bgmVolume,
      theme: this.currentTheme,
    };
  }

  public toggleBGM(): boolean {
    this.isBgmPlaying = !this.isBgmPlaying;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pali_bgm_enabled', String(this.isBgmPlaying));
    }

    if (this.isBgmPlaying) {
      this.init();
      this.startBGMLoop();
    } else {
      this.stopBGMLoop();
    }
    return this.isBgmPlaying;
  }

  public setBGMVolume(val: number) {
    this.bgmVolume = Math.max(0, Math.min(1, val));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pali_bgm_volume', String(this.bgmVolume));
    }
    if (this.ctx && this.bgmGain) {
      this.bgmGain.gain.setTargetAtTime(this.bgmVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getBGMVolume(): number {
    return this.bgmVolume;
  }

  public setBGMTheme(theme: BGMThemeId) {
    this.currentTheme = theme;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pali_bgm_theme', theme);
    }
    // Restart loop smoothly with new theme
    if (this.isBgmPlaying) {
      this.stopBGMLoop();
      this.currentStep = 0;
      this.startBGMLoop();
    }
  }

  public getBGMTheme(): BGMThemeId {
    return this.currentTheme;
  }

  // ---------------------------------------------------------------------------
  // Procedural Music Synthesis Engine
  // ---------------------------------------------------------------------------

  private startBGMLoop() {
    this.init();
    if (!this.ctx) return;
    if (this.schedulerTimer !== null) return;

    this.nextStepTime = this.ctx.currentTime + 0.1;
    this.currentStep = 0;

    const schedule = () => {
      if (!this.ctx || !this.isBgmPlaying) return;

      const lookAhead = 0.25; // schedule 250ms ahead
      while (this.nextStepTime < this.ctx.currentTime + lookAhead) {
        this.playStep(this.currentStep, this.nextStepTime);
        const tempo = this.getCurrentTempo();
        const stepDuration = (60 / tempo) / 2; // 8th note duration
        this.nextStepTime += stepDuration;
        this.currentStep = (this.currentStep + 1) % 64; // 64-step seamless loop
      }

      this.schedulerTimer = window.setTimeout(schedule, 80);
    };

    schedule();
  }

  private stopBGMLoop() {
    if (this.schedulerTimer !== null) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  private getCurrentTempo(): number {
    const info = BGM_THEMES.find((t) => t.id === this.currentTheme);
    return info ? info.tempo : 76;
  }

  // Step Sequencer: Dispatches notes according to active theme
  private playStep(step: number, time: number) {
    if (!this.ctx || !this.bgmGain) return;

    switch (this.currentTheme) {
      case 'dharma':
        this.playDharmaStep(step, time);
        break;
      case 'zen':
        this.playZenStep(step, time);
        break;
      case 'festival':
        this.playFestivalStep(step, time);
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // THEME 1: ทิพยดุริยางค์ (Peaceful Dharma Melodies)
  // ---------------------------------------------------------------------------
  private playDharmaStep(step: number, time: number) {
    // Ranat / Harp Melody Pattern (64 steps)
    const melody: number[] = [
      // Bar 1-2 (D Major)
      NOTE.D5, NOTE.REST, NOTE.E5, NOTE.Fs5, NOTE.A5, NOTE.Fs5, NOTE.E5, NOTE.D5,
      NOTE.Fs5, NOTE.A5, NOTE.B5, NOTE.A5, NOTE.Fs5, NOTE.D5, NOTE.E5, NOTE.REST,
      // Bar 3-4 (G Major)
      NOTE.B4, NOTE.D5, NOTE.E5, NOTE.D5, NOTE.B4, NOTE.A4, NOTE.B4, NOTE.D5,
      NOTE.E5, NOTE.Fs5, NOTE.E5, NOTE.D5, NOTE.B4, NOTE.D5, NOTE.E5, NOTE.REST,
      // Bar 5-6 (B Minor)
      NOTE.Fs5, NOTE.REST, NOTE.E5, NOTE.D5, NOTE.B4, NOTE.A4, NOTE.Fs4, NOTE.A4,
      NOTE.B4, NOTE.D5, NOTE.Fs5, NOTE.A5, NOTE.B5, NOTE.A5, NOTE.Fs5, NOTE.E5,
      // Bar 7-8 (A / Asus4)
      NOTE.E5, NOTE.Fs5, NOTE.E5, NOTE.D5, NOTE.E5, NOTE.A4, NOTE.B4, NOTE.D5,
      NOTE.E5, NOTE.Fs5, NOTE.A5, NOTE.Fs5, NOTE.E5, NOTE.D5, NOTE.D5, NOTE.REST,
    ];

    const note = melody[step];
    if (note && note > 0) {
      // Soft Ranat / Crystal Harp Pluck
      this.synthPluck(note, time, 0.45, 0.22);
    }

    // Celestial Flute Counter-melody (every 4 steps on certain phrases)
    if (step % 8 === 0) {
      const fluteNotes = [NOTE.A5, NOTE.D6, NOTE.Fs5, NOTE.E5, NOTE.D5, NOTE.B5, NOTE.A5, NOTE.D5];
      const fluteNote = fluteNotes[(step / 8) % fluteNotes.length];
      if (fluteNote) {
        this.synthFlute(fluteNote, time, 1.4, 0.15);
      }
    }

    // Pad Chords on beat 1 of every 8 steps
    if (step % 8 === 0) {
      const chordIndex = Math.floor(step / 8);
      const chords: number[][] = [
        [NOTE.D3, NOTE.Fs3, NOTE.A3, NOTE.D4], // D
        [NOTE.D3, NOTE.A3, NOTE.D4, NOTE.Fs4], // D
        [NOTE.G2, NOTE.B3, NOTE.D4, NOTE.G4], // G
        [NOTE.G2, NOTE.D3, NOTE.G3, NOTE.B3], // G
        [NOTE.B2, NOTE.Fs3, NOTE.B3, NOTE.D4], // Bm
        [NOTE.B2, NOTE.D3, NOTE.Fs3, NOTE.B3], // Bm
        [NOTE.A2, NOTE.E3, NOTE.A3, NOTE.Cs4], // A
        [NOTE.A2, NOTE.D3, NOTE.A3, NOTE.E4],  // Asus4
      ];
      const chord = chords[chordIndex % chords.length];
      this.synthPad(chord, time, 2.2, 0.12);
    }

    // Soft Ching Bell on beat 1 and 5 (Thai Ching rhythm)
    if (step % 4 === 0) {
      const isOpen = step % 8 === 0;
      this.synthChing(time, 0.1, isOpen);
    }
  }

  // ---------------------------------------------------------------------------
  // THEME 2: สมาธิภาวนา (Zen Meditation & Tibetan Singing Bowls)
  // ---------------------------------------------------------------------------
  private playZenStep(step: number, time: number) {
    // Deep Tibetan Singing Bowl on 16-step cycles
    if (step % 16 === 0) {
      const bowlFreqs = [NOTE.D3, NOTE.A3, NOTE.G3, NOTE.D3];
      const freq = bowlFreqs[(step / 16) % bowlFreqs.length];
      this.synthSingingBowl(freq, time, 5.0, 0.28);
    }

    // Ambient Harp / Water droplet notes
    const zenMelody: number[] = [
      NOTE.D4, NOTE.REST, NOTE.REST, NOTE.A4, NOTE.REST, NOTE.D5, NOTE.REST, NOTE.REST,
      NOTE.Fs4, NOTE.REST, NOTE.B4, NOTE.REST, NOTE.REST, NOTE.E5, NOTE.REST, NOTE.REST,
      NOTE.G4, NOTE.REST, NOTE.REST, NOTE.D5, NOTE.REST, NOTE.Fs5, NOTE.REST, NOTE.REST,
      NOTE.A4, NOTE.REST, NOTE.E5, NOTE.REST, NOTE.REST, NOTE.A5, NOTE.REST, NOTE.REST,
    ];

    const note = zenMelody[step % zenMelody.length];
    if (note && note > 0) {
      this.synthPluck(note, time, 0.8, 0.16);
    }

    // Warm Ambient Pad
    if (step % 16 === 0) {
      this.synthPad([NOTE.D3, NOTE.A3, NOTE.Fs4], time, 4.0, 0.14);
    }
  }

  // ---------------------------------------------------------------------------
  // THEME 3: สมโภชพระอาราม (Temple Joy & Ranat Celebration)
  // ---------------------------------------------------------------------------
  private playFestivalStep(step: number, time: number) {
    // Cheerful Upbeat Ranat Ek Melody
    const festMelody: number[] = [
      NOTE.D5, NOTE.D5, NOTE.E5, NOTE.Fs5, NOTE.A5, NOTE.A5, NOTE.B5, NOTE.A5,
      NOTE.Fs5, NOTE.E5, NOTE.D5, NOTE.E5, NOTE.Fs5, NOTE.A5, NOTE.D5, NOTE.REST,
      NOTE.B4, NOTE.D5, NOTE.E5, NOTE.Fs5, NOTE.E5, NOTE.D5, NOTE.B4, NOTE.D5,
      NOTE.E5, NOTE.E5, NOTE.Fs5, NOTE.A5, NOTE.E5, NOTE.D5, NOTE.B4, NOTE.REST,
      NOTE.D5, NOTE.Fs5, NOTE.A5, NOTE.B5, NOTE.D6, NOTE.B5, NOTE.A5, NOTE.Fs5,
      NOTE.A5, NOTE.Fs5, NOTE.E5, NOTE.D5, NOTE.E5, NOTE.Fs5, NOTE.D5, NOTE.REST,
      NOTE.A4, NOTE.B4, NOTE.D5, NOTE.E5, NOTE.Fs5, NOTE.E5, NOTE.D5, NOTE.B4,
      NOTE.D5, NOTE.E5, NOTE.Fs5, NOTE.A5, NOTE.D5, NOTE.D5, NOTE.D5, NOTE.REST,
    ];

    const note = festMelody[step % festMelody.length];
    if (note && note > 0) {
      this.synthRanat(note, time, 0.28, 0.24);
    }

    // Rhythmic Woodblock / Temple Krap
    if (step % 2 === 0) {
      this.synthWoodblock(time, 0.08, step % 4 === 0);
    }

    // Bass Ranat Thum Ostinato
    if (step % 4 === 0) {
      const bassNotes = [NOTE.D3, NOTE.G2, NOTE.B2, NOTE.A2];
      const bassNote = bassNotes[Math.floor(step / 16) % bassNotes.length];
      this.synthRanat(bassNote, time, 0.4, 0.2);
    }
  }

  // ---------------------------------------------------------------------------
  // SYNTHESIZER INSTRUMENTS (Web Audio Nodes)
  // ---------------------------------------------------------------------------

  // 1. Gentle Ranat / Harp Pluck
  private synthPluck(freq: number, time: number, duration: number, vol: number) {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, time);
    filter.frequency.exponentialRampToValueAtTime(400, time + duration);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc2.start(time);
    osc.stop(time + duration);
    osc2.stop(time + duration);
  }

  // 2. Bright Traditional Ranat (ระนาดเอกสังเคราะห์)
  private synthRanat(freq: number, time: number, duration: number, vol: number) {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const oscHarmonic = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    // Ranat resonant harmonic
    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.setValueAtTime(freq * 3.02, time);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.5, time);
    filter.Q.setValueAtTime(3.0, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    oscHarmonic.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    oscHarmonic.start(time);
    osc.stop(time + duration);
    oscHarmonic.stop(time + duration);
  }

  // 3. Bamboo Flute / Khlui (ขลุ่ยผิว)
  private synthFlute(freq: number, time: number, duration: number, vol: number) {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Subtle vibrato (5Hz)
    vibrato.frequency.setValueAtTime(5, time);
    vibratoGain.gain.setValueAtTime(3.5, time);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, time);

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.12); // soft breath attack
    gain.gain.setValueAtTime(vol * 0.85, time + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);

    vibrato.start(time);
    osc.start(time);
    vibrato.stop(time + duration);
    osc.stop(time + duration);
  }

  // 4. Warm Ambient Pad Chord
  private synthPad(freqs: number[], time: number, duration: number, vol: number) {
    if (!this.ctx || !this.bgmGain) return;

    freqs.forEach((freq) => {
      if (!this.ctx || !this.bgmGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time);
      filter.frequency.linearRampToValueAtTime(850, time + duration * 0.5);
      filter.frequency.linearRampToValueAtTime(450, time + duration);

      const noteVol = vol / freqs.length;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(noteVol, time + 0.4);
      gain.gain.setValueAtTime(noteVol * 0.9, time + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  // 5. Tibetan Singing Bowl (ขันธิเบต)
  private synthSingingBowl(freq: number, time: number, duration: number, vol: number) {
    if (!this.ctx || !this.bgmGain) return;

    // Dual beating sine oscillators for ethereal resonance
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const oscHarmonic = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq + 1.2, time); // 1.2Hz binaural beating

    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.setValueAtTime(freq * 2.76, time); // metallic overtone

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    oscHarmonic.connect(gain);
    gain.connect(this.bgmGain);

    osc1.start(time);
    osc2.start(time);
    oscHarmonic.start(time);
    osc1.stop(time + duration);
    osc2.stop(time + duration);
    oscHarmonic.stop(time + duration);
  }

  // 6. Thai Ching Bell (ฉิ่ง)
  private synthChing(time: number, vol: number, isOpen: boolean) {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(3200, time);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(4600, time);

    const decay = isOpen ? 0.9 : 0.08;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc2.start(time);
    osc.stop(time + decay);
    osc2.stop(time + decay);
  }

  // 7. Woodblock / Krap (กรับ)
  private synthWoodblock(time: number, vol: number, isHigh: boolean) {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isHigh ? 820 : 640, time);
    osc.frequency.exponentialRampToValueAtTime(isHigh ? 400 : 300, time + 0.04);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  // ---------------------------------------------------------------------------
  // SOUND EFFECTS (SFX)
  // ---------------------------------------------------------------------------

  private getSfxDestination(): AudioNode | null {
    this.init();
    return this.sfxGain || (this.ctx ? this.ctx.destination : null);
  }

  // เสียงระฆังวัด (Thai Temple Bell sound synthesis)
  public playTempleBell() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getSfxDestination();
    if (!dest) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(442, now);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 3.0);
    osc2.stop(now + 3.0);
  }

  // เสียงสาธุ / คำตอบถูกต้อง (Sathu Chime)
  public playSathuChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getSfxDestination();
    if (!dest) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 major chord
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 1.2);
    });
  }

  // เสียงทอยลูกเต๋า (Dice Roll sound effect)
  public playDiceRoll() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getSfxDestination();
    if (!dest) return;

    const rolls = 6;
    for (let i = 0; i < rolls; i++) {
      const now = this.ctx.currentTime + i * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(150 + Math.random() * 200, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  // เสียงซื้อที่ดิน / อัปเกรด (Purchase / Upgrade Sound)
  public playUpgradeSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getSfxDestination();
    if (!dest) return;

    const now = this.ctx.currentTime;
    const freqs = [400, 600, 800, 1200];
    freqs.forEach((freq, index) => {
      if (!this.ctx) return;
      const startTime = now + index * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  // เสียงนับถอยหลังช่วงเตือนภัย (Tick Sound)
  public playTickSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getSfxDestination();
    if (!dest) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, now);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // เสียงหมดเวลา (Timeout Sound)
  public playTimeoutSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getSfxDestination();
    if (!dest) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(130, now + 0.35);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // เสียงส่งเข้าคุก / สนามสอบสนามหลวง (Jail / Siren Alert Sound)
  public playJailSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const dest = this.getSfxDestination();
    if (!dest) return;

    const freqs = [350, 220, 180, 120];
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.2);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.25);
    });
  }
}

export const audioManager = new AudioManager();

