// Vitest test setup: provide minimal browser API shims used by game code.
class AudioMock {
  src: string;
  preload: string = 'auto';
  volume: number = 1;
  loop: boolean = false;
  paused = true;
  currentTime = 0;
  playbackRate = 1;
  constructor(src?: string) { this.src = src || ''; }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  cloneNode() { return new AudioMock(this.src); }
  addEventListener() { /* no-op */ }
  removeEventListener() { /* no-op */ }
  load() { /* no-op */ }
  dispatchEvent() { return true; }
}
// @ts-expect-error - augment Node global with Audio for tests
(global as unknown as { Audio: typeof AudioMock }).Audio = AudioMock;
export {};
