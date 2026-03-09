/* ── Guild Quest — Phaser 3 Config ─────────────────────────────────── */

const config = {
  type:            Phaser.AUTO,
  width:           800,
  height:          560,
  backgroundColor: '#0d0a0e',
  parent:          'game-container',
  pixelArt:        true,
  scale: {
    mode:       Phaser.Scale.FIT,
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
