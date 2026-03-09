/* ── GQ.Audio — global music manager ──────────────────────────────────
   Wraps Phaser's shared sound manager so music persists across scenes.
──────────────────────────────────────────────────────────────────────── */

window.GQ = window.GQ || {};

GQ.Audio = {
  _sound:   null,   // active looping sound object
  _current: null,   // key of the track currently loaded
  _muted:   false,

  // ── Start (or continue) a looping track ─────────────────────────
  play (scene, key) {
    // Already playing this track — do nothing
    if (this._current === key && this._sound && this._sound.isPlaying) return;

    // Stop any previous track
    if (this._sound) {
      this._sound.stop();
      this._sound.destroy();
      this._sound = null;
    }

    this._current = key;
    this._sound   = scene.sound.add(key, { loop: true, volume: 0.55 });

    if (!this._muted) this._sound.play();
  },

  // ── Play a one-shot (fanfare, stinger) ──────────────────────────
  playOnce (scene, key, volume) {
    const s = scene.sound.add(key, { loop: false, volume: volume || 0.75 });
    if (!this._muted) s.play();
    // Auto-destroy when done
    s.once('complete', () => s.destroy());
  },

  // ── Stop current looping track ──────────────────────────────────
  stop () {
    if (this._sound) {
      this._sound.stop();
      this._sound.destroy();
      this._sound = null;
    }
    this._current = null;
  },

  // ── Toggle mute, returns new muted state ────────────────────────
  toggleMute () {
    this._muted = !this._muted;
    if (this._sound) {
      if (this._muted) this._sound.pause();
      else             this._sound.resume();
    }
    this._updateBtn();
    return this._muted;
  },

  // ── Wire up the mute button in index.html ───────────────────────
  initBtn () {
    const btn = document.getElementById('mute-btn');
    if (!btn) return;
    btn.addEventListener('click', () => this.toggleMute());
    this._updateBtn();
  },

  _updateBtn () {
    const btn = document.getElementById('mute-btn');
    if (btn) btn.textContent = this._muted ? '🔇' : '🔊';
  },
};
