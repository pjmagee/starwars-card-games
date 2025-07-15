// Sound effects utility for Pazaak game
export class SoundEffects {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private volume: number = 0.5;
  private enabled: boolean = true;

  constructor() {
    this.preloadSounds();
  }

  private preloadSounds() {
    const sounds = [
      'draw_stand_fx.wav',
      'shuffle_fx.wav',
      'credit_chip_win_fx.wav',
      'card_draw_fx.wav'
    ];

    sounds.forEach(soundFile => {
      const audio = new Audio(`/${soundFile}`);
      audio.preload = 'auto';
      audio.volume = this.volume;
      this.audioCache.set(soundFile, audio);
    });
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.audioCache.forEach(audio => {
      audio.volume = this.volume;
    });
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public playDrawStand() {
    this.playSound('draw_stand_fx.wav');
  }

  public playShuffle() {
    this.playSound('shuffle_fx.wav');
  }

  public playWin() {
    this.playSound('credit_chip_win_fx.wav');
  }

  public playCardDraw() {
    this.playSound('card_draw_fx.wav');
  }

  private playSound(soundFile: string) {
    if (!this.enabled) return;

    const audio = this.audioCache.get(soundFile);
    if (audio) {
      // Reset audio to beginning if it's already playing
      audio.currentTime = 0;
      audio.play().catch(error => {
        console.warn(`Failed to play sound ${soundFile}:`, error);
      });
    }
  }
}

// Create singleton instance
export const soundEffects = new SoundEffects();
