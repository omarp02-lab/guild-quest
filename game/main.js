/* ── Guild Quest — Phaser 3 Config ─────────────────────────────────── */

const config = {
  type:            Phaser.AUTO,
  backgroundColor: '#0d0a0e',
  parent:          'game-container',
  pixelArt:        true,
  scale: {
    mode:       Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  scene: [
    GQ.Preload,
    GQ.CharacterCreate,
    GQ.Village,
    GQ.Interior,
    GQ.GuildMaster,
    GQ.Results,
  ],
};

window.GQ.game = new Phaser.Game(config);
