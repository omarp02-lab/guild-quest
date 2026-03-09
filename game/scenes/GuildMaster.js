/* ── GuildMaster Scene ─────────────────────────────────────────────────
   Dramatic reveal sequence. Runs the recommendation, then transitions
   to the Results scene with a fanfare moment.
──────────────────────────────────────────────────────────────────────── */

window.GQ = window.GQ || {};

GQ.GuildMaster = class GuildMaster extends Phaser.Scene {

  constructor () { super({ key: 'GuildMaster' }); }

  init (data) {
    this._profile = data.profile || {};
  }

  create () {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Dark background ────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillStyle(0x0d0a0e);
    bg.fillRect(0, 0, W, H);

    // ── Star particles (simple twinkling dots) ─────────────────────────
    for (let i = 0; i < 60; i++) {
      const star = this.add.graphics();
      star.fillStyle(0xFFFFFF, Math.random() * 0.5 + 0.1);
      star.fillRect(
        Math.random() * W,
        Math.random() * H,
        Math.random() < 0.3 ? 2 : 1,
        Math.random() < 0.3 ? 2 : 1
      );
    }

    // ── Gold border frame ──────────────────────────────────────────────
    const frame = this.add.graphics();
    frame.lineStyle(3, 0xF59E0B);
    frame.strokeRect(10, 10, W - 20, H - 20);
    frame.lineStyle(1, 0xD97706, 0.4);
    frame.strokeRect(16, 16, W - 32, H - 32);

    // ── Guild Master sprite ────────────────────────────────────────────
    const gm = this.add.image(W / 2, H / 2 - 60, 'npc_guildmaster')
      .setScale(5)
      .setAlpha(0);

    // ── Text objects ──────────────────────────────────────────────────
    const eyebrow = this.add.text(W / 2, H / 2 + 30, 'THE GUILD MASTER SPEAKS', {
      fontFamily: "'Press Start 2P'",
      fontSize:   '9px',
      color:      '#D97706',
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0);

    const pName = (window.GQ.player && window.GQ.player.name) || 'HERO';
    const mainText = this.add.text(W / 2, H / 2 + 55, `"${pName}..."`, {
      fontFamily: "'Press Start 2P'",
      fontSize:   '11px',
      color:      '#FFF8F0',
      align:      'center',
    }).setOrigin(0.5).setAlpha(0);

    const subText = this.add.text(W / 2, H / 2 + 90, 'YOUR PATH HAS BEEN REVEALED.', {
      fontFamily: "'Press Start 2P'",
      fontSize:   '9px',
      color:      '#F59E0B',
    }).setOrigin(0.5).setAlpha(0);

    // ── Animate in sequence ────────────────────────────────────────────
    this.tweens.add({
      targets:  gm,
      alpha:    1,
      y:        H / 2 - 70,
      duration: 800,
      ease:     'Sine.easeOut',
      onComplete: () => {
        // Subtle float
        this.tweens.add({
          targets:  gm,
          y:        H / 2 - 60,
          duration: 1800,
          yoyo:     true,
          repeat:   -1,
          ease:     'Sine.easeInOut',
        });
      }
    });

    this.time.delayedCall(600, () => {
      this.tweens.add({ targets: eyebrow, alpha: 1, duration: 500 });
    });

    this.time.delayedCall(1100, () => {
      this.tweens.add({ targets: mainText, alpha: 1, duration: 600, ease: 'Sine.easeOut' });
    });

    this.time.delayedCall(1800, () => {
      this.tweens.add({ targets: subText, alpha: 1, duration: 600 });
    });

    // ── Gold shimmer on frame ──────────────────────────────────────────
    this.tweens.add({
      targets:  frame,
      alpha:    0.6,
      duration: 1000,
      yoyo:     true,
      repeat:   -1,
    });

    // ── Transition to Results after 3.5 s ─────────────────────────────
    this.time.delayedCall(3500, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        const results = GQ.recommend(this._profile);
        this.scene.start('Results', { results });
      });
    });
  }
};
