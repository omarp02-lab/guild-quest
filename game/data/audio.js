/* ── GQ.Audio — global music manager ──────────────────────────────────
   Uses HTML5 <audio> elements instead of Web Audio API.
   HTML5 audio uses the iOS 'playback' session category, which plays
   through the device speaker even when the hardware silent switch is on.
   Web Audio uses 'ambient' which is silenced by the silent switch.
──────────────────────────────────────────────────────────────────────── */

window.GQ = window.GQ || {};

GQ.Audio = {
  _el:      null,   // active HTMLAudioElement (looping track)
  _current: null,   // key of the active track
  _muted:   false,
  _oneshots: new Set(),  // active one-shot elements kept alive until done

  // Map audio keys to file paths
  _urls: {
    'music-village':  'assets/audio/village.ogg',
    'music-interior': 'assets/audio/interior.ogg',
    'music-results':  'assets/audio/results.ogg',
    'music-fanfare':  'assets/audio/fanfare.ogg',
  },

  // ── Start (or continue) a looping track ─────────────────────────
  play (scene, key) {
    if (this._current === key && this._el && !this._el.paused) return;

    this.stop();
    this._current = key;

    const el = new Audio(this._urls[key]);
    el.loop   = true;
    el.volume = 0.55;
    this._el  = el;

    if (!this._muted) el.play().catch(() => {
      // iOS occasionally rejects play() during scene transitions even when audio
      // is already unlocked. Retry once after a short delay.
      setTimeout(() => {
        if (this._el === el && !this._muted) el.play().catch(() => {});
      }, 150);
    });
  },

  // ── Play a one-shot (fanfare, stinger) ──────────────────────────
  playOnce (scene, key, volume) {
    const el = new Audio(this._urls[key]);
    el.volume = volume || 0.75;
    el.addEventListener('ended', () => this._oneshots.delete(el));
    this._oneshots.add(el);
    if (!this._muted) el.play().catch(() => {});
  },

  // ── Stop current looping track ──────────────────────────────────
  stop () {
    if (this._el) {
      this._el.pause();
      this._el.src = '';
      this._el = null;
    }
    this._current = null;
  },

  // ── Toggle mute, returns new muted state ────────────────────────
  toggleMute () {
    this._muted = !this._muted;
    if (this._el) {
      if (this._muted) this._el.pause();
      else             this._el.play().catch(() => {});
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
