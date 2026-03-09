/* ── Guild Quest — Phaser 3 Config ─────────────────────────────────── */

// Mobile (coarse pointer / small screen): fill the viewport with RESIZE.
// Desktop (fine pointer / large screen): scale a fixed 800×560 canvas to
// fit the window, matching the original behaviour before mobile work.
const _mobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 1024;

const config = {
  type:            Phaser.AUTO,
  backgroundColor: '#0d0a0e',
  parent:          'game-container',
  pixelArt:        true,
  scale: _mobile ? {
    mode:       Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
  } : {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.NO_CENTER,
    width:      800,
    height:     560,
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
