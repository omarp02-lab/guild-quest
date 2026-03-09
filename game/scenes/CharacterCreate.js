/* ── CharacterCreate Scene ─────────────────────────────────────────────
   Manages the HTML character creation overlay. Stores player data in
   window.GQ.player and then starts the Village scene.
──────────────────────────────────────────────────────────────────────── */

window.GQ = window.GQ || {};

GQ.CharacterCreate = class CharacterCreate extends Phaser.Scene {

  constructor () { super({ key: 'CharacterCreate' }); }

  create () {
    // Draw a simple dark background so the overlay looks clean
    const W = this.scale.width;
    const H = this.scale.height;
    const bg = this.add.graphics();
    bg.fillStyle(0x0d0a0e);
    bg.fillRect(0, 0, W, H);

    // Render hero sprites into the canvas elements
    this._renderHeroCanvases();

    // Show the HTML overlay
    const overlay = document.getElementById('char-create');
    overlay.classList.remove('hidden');

    // Start village music on first touch/click of the opening screen
    overlay.addEventListener('pointerdown', () => GQ.Audio.play(this, 'music-village'), { once: true });

    // ── Wire up the overlay UI ─────────────────────────────────────────
    const nameInput = document.getElementById('hero-name');
    const beginBtn  = document.getElementById('begin-btn');
    const archBtns  = document.querySelectorAll('.arch');
    let selectedArch = null;

    const updateBeginState = () => {
      const hasName = nameInput.value.trim().length > 0;
      beginBtn.disabled = !(hasName && selectedArch);
    };

    nameInput.addEventListener('input', updateBeginState);

    archBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        archBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedArch = btn.dataset.arch;
        updateBeginState();
      });
    });

    beginBtn.addEventListener('click', () => {
      // Resume AudioContext now — this click IS the required user gesture
      const ctx = this.sound.context;
      if (ctx && ctx.state === 'suspended') ctx.resume();

      const name = nameInput.value.trim() || 'HERO';
      window.GQ.player = { name: name.toUpperCase(), archetype: selectedArch };

      // Reset form for next play-through
      nameInput.value = '';
      archBtns.forEach(b => b.classList.remove('selected'));
      selectedArch = null;
      beginBtn.disabled = true;

      overlay.classList.add('hidden');
      this.scene.start('Village');
    });

    // Allow Enter key on name field to focus arch selection
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') archBtns[0].focus();
    });

    // Auto-focus name field
    setTimeout(() => nameInput.focus(), 100);
  }

  // ── Render Phaser canvas textures into HTML canvas elements ──────────
  _renderHeroCanvases () {
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`hero-canvas-${i}`);
      if (!el) continue;
      try {
        const tex = this.textures.get(`hero_${i}`);
        if (!tex) continue;
        const srcImg = tex.source[0].image; // underlying canvas from createCanvas()
        const ctx2d  = el.getContext('2d');
        ctx2d.imageSmoothingEnabled = false;
        ctx2d.clearRect(0, 0, el.width, el.height);
        ctx2d.drawImage(srcImg, 0, 0, el.width, el.height);
      } catch (e) {
        // Fallback: plain fill if texture not available
        const ctx2d = el.getContext('2d');
        ctx2d.fillStyle = '#2a2a3a';
        ctx2d.fillRect(0, 0, el.width, el.height);
      }
    }
  }
};
