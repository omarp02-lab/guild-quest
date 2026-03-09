/* ── Preload Scene ─────────────────────────────────────────────────────
   Generates all procedural textures in a FF1/DQ1 pixel-art style.
   Each character has a DISTINCT silhouette — no two look the same.
──────────────────────────────────────────────────────────────────────── */

window.GQ = window.GQ || {};

GQ.Preload = class Preload extends Phaser.Scene {

  constructor () { super({ key: 'Preload' }); }

  preload () {
    const W = this.scale.width;
    const H = this.scale.height;

    const bg = this.add.graphics();
    bg.fillStyle(0x0d0a0e);
    bg.fillRect(0, 0, W, H);

    // Roguelike character spritesheet — 16×16 tiles, 1px spacing
    this.load.spritesheet('rogueChars',
      'assets/kenney_roguelike-characters/Spritesheet/roguelikeChar_transparent.png',
      { frameWidth: 16, frameHeight: 16, spacing: 1 }
    );

    // Tiled village map + tileset images
    const v = Date.now();
    this.load.json('village-map',  'village.tmj?v='  + v);
    this.load.json('castle-map',   'castle.tmj?v='   + v);
    this.load.json('inn-map',      'inn.tmj?v='      + v);
    this.load.json('library-map',  'library.tmj?v='  + v);
    this.load.json('market-map',   'market.tmj?v='   + v);
    this.load.json('studio-map',   'studio.tmj?v='   + v);
    this.load.json('tent-map',     'tent.tmj?v='     + v);
    this.load.image('ts-packed', 'assets/kenney_tiny-town/Tilemap/tilemap_packed.png');
    this.load.image('ts-spaced', 'assets/kenney_tiny-town/Tilemap/tilemap.png');
    this.load.image('ts-like2',  'assets/kenney_roguelike-rpg-pack/Spritesheet/roguelikeSheet_transparent.png');

    // ── Audio ────────────────────────────────────────────────────────
    this.load.audio('music-village',  'assets/audio/village.ogg');
    this.load.audio('music-interior', 'assets/audio/interior.ogg');
    this.load.audio('music-results',  'assets/audio/results.ogg');
    this.load.audio('music-fanfare',  'assets/audio/fanfare.ogg');

    this.add.text(W / 2, H / 2 - 60, 'GUILD QUEST', {
      fontFamily: "'Press Start 2P'",
      fontSize: '20px',
      color: '#F59E0B',
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 20, 'LOADING...', {
      fontFamily: "'Press Start 2P'",
      fontSize: '8px',
      color: '#5a5248',
    }).setOrigin(0.5);

    const barW = 260, barX = W / 2 - 130, barY = H / 2 + 10;
    const barBg = this.add.graphics();
    barBg.lineStyle(2, 0x5a5248);
    barBg.strokeRect(barX, barY, barW, 14);

    const barFill = this.add.graphics();
    this.load.on('progress', (v) => {
      barFill.clear();
      barFill.fillStyle(0xF59E0B);
      barFill.fillRect(barX + 2, barY + 2, (barW - 4) * v, 10);
    });
  }

  // ── Tile ID assignments — adjust using char-picker.html ──────────────
  // ── Character layer assignments ───────────────────────────────────────
  // Each value is an array of frame IDs drawn bottom-to-top.
  // Use char-picker.html to build these visually, then paste here.
  static get CHAR_FRAMES () {
    return {
      // ── Selectable heroes (unlabeled on character creation screen) ──
      hero_1:          [108, 115, 73, 139, 200],
      hero_2:          [108, 122, 381, 133, 368],
      hero_3:          [270, 142],
      hero_4:          [325, 479],
      hero_5:          [2, 283, 130, 45, 461, 594],
      // ── NPCs ─────────────────────────────────────────────────────────
      npc_guildmaster: [162, 495, 489, 435, 31, 255],
      npc_librarian:   [56, 55, 228, 165, 508],
      npc_artisan:     [58, 163, 55, 54, 55, 174, 327, 128, 137, 258],
      npc_blacksmith:  [1, 55, 283, 57, 293, 103],
      npc_mason:       [108, 385],
      npc_vendor:      [487, 608],
      npc_inn_keeper:  [541],
      npc_hermit:      [113, 486],
      npc_bard:        [109, 67, 327, 20, 352],
    };
  }

  create () {
    this._extractCharTextures();
    GQ.Audio.initBtn();
    this.time.delayedCall(300, () => this.scene.start('CharacterCreate'));
  }

  _extractCharTextures () {
    const src = this.textures.get('rogueChars');
    for (const [key, layers] of Object.entries(GQ.Preload.CHAR_FRAMES)) {
      const canvas = this.textures.createCanvas(key, 16, 16);
      const ctx    = canvas.getContext();
      for (const frameId of layers) {
        const frame = src.get(frameId);
        ctx.drawImage(
          frame.source.image,
          frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
          0, 0, 16, 16
        );
      }
      canvas.refresh();
    }
  }

  // ── Helper: create a 16×28 texture from a drawing callback ──────────
  // (kept for reference — characters now use the roguelike spritesheet)
  _makeSprite (key, drawFn) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(8, 27, 14, 5);
    drawFn(g);
    g.generateTexture(key, 16, 28);
    g.destroy();
  }

  // ────────────────────────────────────────────────────────────────────
  //  Legacy procedural sprites (no longer used — see CHAR_FRAMES above)
  // ────────────────────────────────────────────────────────────────────

  _makeHeroSprites () {
    // ── MAGE: tall pointed blue wizard hat ───────────────────────────
    this._makeSprite('hero_mage', (g) => {
      const SKIN = 0xF5CBA7, HAT = 0x2244cc, ROBE = 0x1a3399, TRIM = 0x88aaff;
      // Hat (tall narrow point)
      g.fillStyle(HAT);
      g.fillRect(7, 0, 2, 3);   // tip
      g.fillRect(6, 3, 4, 2);   // upper hat
      g.fillRect(5, 5, 6, 2);   // mid hat
      g.fillRect(3, 7, 10, 2);  // brim (wide)
      // Face
      g.fillStyle(SKIN);
      g.fillRect(5, 9, 6, 6);
      g.fillStyle(0x1A1612);    // eyes
      g.fillRect(6, 11, 2, 2);
      g.fillRect(9, 11, 2, 2);
      // Robe body (wide flowing)
      g.fillStyle(ROBE);
      g.fillRect(2, 15, 12, 9);
      g.fillStyle(TRIM);
      g.fillRect(2, 15, 12, 2); // collar trim
      g.fillRect(7, 15, 2, 9);  // center stripe
      // Sleeves
      g.fillStyle(ROBE);
      g.fillRect(0, 15, 2, 7);
      g.fillRect(14, 15, 2, 7);
      // Robe bottom (flares out — wider)
      g.fillStyle(ROBE);
      g.fillRect(1, 24, 14, 4);
    });

    // ── WARRIOR: full helmet, armor ──────────────────────────────────
    this._makeSprite('hero_warrior', (g) => {
      const SKIN = 0xF5CBA7, HELM = 0xaa2222, ARMOR = 0x882222, METAL = 0x888888;
      // Helmet (full coverage)
      g.fillStyle(HELM);
      g.fillRect(3, 1, 10, 10);
      // Visor (dark cutout)
      g.fillStyle(0x220000);
      g.fillRect(4, 5, 8, 4);
      // Cheek guards
      g.fillStyle(HELM);
      g.fillRect(3, 5, 1, 6);
      g.fillRect(12, 5, 1, 6);
      // Helmet crest/plume
      g.fillStyle(0xffff44);
      g.fillRect(7, 0, 2, 3);
      // Face under visor
      g.fillStyle(SKIN);
      g.fillRect(5, 6, 6, 2);
      // Body armor (broad, strong)
      g.fillStyle(ARMOR);
      g.fillRect(2, 11, 12, 11);
      // Armor detail
      g.fillStyle(METAL);
      g.fillRect(3, 12, 10, 2); // chest band
      g.fillRect(7, 12, 2, 10); // center line
      // Arms (armored)
      g.fillStyle(ARMOR);
      g.fillRect(0, 12, 2, 8);
      g.fillRect(14, 12, 2, 8);
      // Greaves/legs
      g.fillStyle(ARMOR);
      g.fillRect(3, 22, 4, 6);
      g.fillRect(9, 22, 4, 6);
      // Boot buckle
      g.fillStyle(METAL);
      g.fillRect(3, 24, 4, 2);
      g.fillRect(9, 24, 4, 2);
    });

    // ── BARD: wide floppy hat with feather ───────────────────────────
    this._makeSprite('hero_bard', (g) => {
      const SKIN = 0xF5CBA7, HAT = 0x992299, TUNIC = 0xcc44aa, TRIM = 0xffaadd;
      // Wide hat (extends well beyond head)
      g.fillStyle(HAT);
      g.fillRect(0, 4, 16, 4);  // very wide brim
      g.fillRect(4, 1, 8, 5);   // hat body (above brim)
      // Feather
      g.fillStyle(0xffee22);
      g.fillRect(12, 0, 2, 6);  // feather shaft
      g.fillRect(13, 1, 2, 4);
      // Face (visible below hat brim)
      g.fillStyle(SKIN);
      g.fillRect(5, 8, 6, 6);
      g.fillStyle(0x1A1612);
      g.fillRect(6, 10, 2, 2);
      g.fillRect(9, 10, 2, 2);
      // Smile
      g.fillRect(7, 13, 3, 1);
      // Tunic body
      g.fillStyle(TUNIC);
      g.fillRect(3, 14, 10, 10);
      g.fillStyle(TRIM);
      g.fillRect(3, 14, 10, 2);  // collar
      g.fillRect(7, 14, 2, 10); // center button line
      // Arms
      g.fillStyle(TUNIC);
      g.fillRect(1, 14, 2, 7);
      g.fillRect(13, 14, 2, 7);
      // Legs
      g.fillStyle(0x662266);
      g.fillRect(3, 24, 4, 4);
      g.fillRect(9, 24, 4, 4);
    });

    // ── MERCHANT: tall top hat, fine coat ────────────────────────────
    this._makeSprite('hero_merchant', (g) => {
      const SKIN = 0xF5CBA7, HAT = 0x1a1208, COAT = 0x7a5520, GOLD = 0xF59E0B;
      // Tall top hat
      g.fillStyle(HAT);
      g.fillRect(5, 0, 6, 8);   // hat body (tall)
      g.fillRect(3, 7, 10, 2);  // hat brim
      // Hat band
      g.fillStyle(GOLD);
      g.fillRect(5, 6, 6, 2);
      // Face
      g.fillStyle(SKIN);
      g.fillRect(5, 9, 6, 6);
      g.fillStyle(0x1A1612);
      g.fillRect(6, 11, 2, 2);
      g.fillRect(9, 11, 2, 2);
      // Monocle
      g.fillStyle(GOLD);
      g.fillRect(9, 10, 3, 3);
      g.fillStyle(SKIN);
      g.fillRect(10, 11, 1, 1);
      // Fine coat
      g.fillStyle(COAT);
      g.fillRect(2, 15, 12, 11);
      // Lapels
      g.fillStyle(0xc8a050);
      g.fillRect(5, 15, 3, 5);
      g.fillRect(8, 15, 3, 5);
      // Gold buttons
      g.fillStyle(GOLD);
      g.fillRect(7, 16, 2, 2);
      g.fillRect(7, 20, 2, 2);
      // Coat tails
      g.fillStyle(COAT);
      g.fillRect(2, 26, 4, 2);
      g.fillRect(10, 26, 4, 2);
      // Legs
      g.fillStyle(0x2a1a08);
      g.fillRect(4, 26, 3, 2);
      g.fillRect(9, 26, 3, 2);
    });
  }

  // ────────────────────────────────────────────────────────────────────
  //  NPC sprites  (16 × 28 px, each with a UNIQUE silhouette)
  // ────────────────────────────────────────────────────────────────────

  _makeNPCSprites () {

    // ── HERMIT: large hood, hunched green cloak ──────────────────────
    this._makeSprite('npc_hermit', (g) => {
      const HOOD = 0x3d5a2a, CLOAK = 0x4a6a30, SKIN = 0xD4A876;
      // Hood (large, covers most of head)
      g.fillStyle(HOOD);
      g.fillRect(3, 1, 10, 12); // hood body
      g.fillRect(2, 4, 12, 9);  // hood width (wider middle)
      // Face barely visible in shadow
      g.fillStyle(SKIN);
      g.fillRect(6, 7, 4, 4);
      g.fillStyle(0x000000, 0.6);
      g.fillRect(6, 7, 4, 4);   // shadow tint
      g.fillStyle(0x1A1612);
      g.fillRect(7, 8, 1, 2);   // left eye
      g.fillRect(9, 8, 1, 2);   // right eye
      // Cloak body (wide, floor-length)
      g.fillStyle(CLOAK);
      g.fillRect(1, 13, 14, 12);
      // Cloak texture lines
      g.fillStyle(HOOD);
      g.fillRect(1, 16, 1, 9);
      g.fillRect(14, 16, 1, 9);
      // Staff
      g.fillStyle(0x8B6914);
      g.fillRect(14, 2, 2, 24);
      g.fillStyle(0xF59E0B);
      g.fillRect(14, 1, 2, 3);  // staff top gem
    });

    // ── ACADEMY MASTER: mortarboard, blue robes, scroll ─────────────
    this._makeSprite('npc_academy', (g) => {
      const SKIN = 0xF5CBA7, CAP = 0x1a1a3a, ROBE = 0x1e3a88, TRIM = 0xF59E0B;
      // Mortarboard flat top
      g.fillStyle(CAP);
      g.fillRect(2, 4, 12, 2);  // wide flat top
      g.fillRect(5, 6, 6, 4);   // cap body (below flat top)
      // Tassel
      g.fillStyle(TRIM);
      g.fillRect(13, 3, 1, 1);  // top
      g.fillRect(13, 5, 1, 5);  // hanging down
      // Face
      g.fillStyle(SKIN);
      g.fillRect(5, 9, 6, 6);
      g.fillStyle(0x1A1612);
      g.fillRect(6, 11, 2, 2);
      g.fillRect(9, 11, 2, 2);
      // Glasses
      g.fillStyle(0x888888);
      g.fillRect(5, 11, 3, 3);
      g.fillRect(8, 11, 3, 3);
      g.fillRect(8, 12, 1, 1);  // bridge
      // Academic robe
      g.fillStyle(ROBE);
      g.fillRect(2, 15, 12, 11);
      g.fillStyle(TRIM);
      g.fillRect(2, 15, 12, 2); // collar band
      g.fillRect(2, 15, 3, 11); // left stripe (honor)
      // Scroll held out (right arm)
      g.fillStyle(ROBE);
      g.fillRect(14, 15, 2, 7);
      g.fillStyle(0xFFF8F0);
      g.fillRect(14, 16, 3, 5); // scroll
      g.fillStyle(0x8B6914);
      g.fillRect(14, 15, 1, 7);
      g.fillRect(16, 15, 1, 7);
      // Legs
      g.fillStyle(0x0a1a44);
      g.fillRect(4, 26, 3, 2);
      g.fillRect(9, 26, 3, 2);
    });

    // ── MASTER CRAFTSMAN: bald, thick beard, leather apron ──────────
    this._makeSprite('npc_master', (g) => {
      const SKIN = 0xE8B88A, BEARD = 0x8a6a40, APRON = 0x8B4513, SHIRT = 0x553322;
      // Head (wider, no hat — bald)
      g.fillStyle(SKIN);
      g.fillRect(4, 2, 8, 8);   // head (wide, bald)
      g.fillStyle(BEARD);
      g.fillRect(3, 2, 1, 2);   // stubble temple L
      g.fillRect(12, 2, 1, 2);  // stubble temple R
      // Thick beard (wide)
      g.fillStyle(BEARD);
      g.fillRect(3, 7, 10, 6);  // big beard
      g.fillRect(4, 6, 8, 2);   // upper beard
      // Eyes above beard
      g.fillStyle(0x1A1612);
      g.fillRect(5, 4, 2, 2);
      g.fillRect(9, 4, 2, 2);
      // Bushy eyebrows
      g.fillStyle(BEARD);
      g.fillRect(5, 3, 3, 1);
      g.fillRect(9, 3, 3, 1);
      // Stocky shirt (wide)
      g.fillStyle(SHIRT);
      g.fillRect(1, 13, 14, 10);
      // Leather apron (center, front)
      g.fillStyle(APRON);
      g.fillRect(4, 14, 8, 12);
      // Apron pocket
      g.fillStyle(0x6B3410);
      g.fillRect(5, 18, 4, 3);
      // Strong arms
      g.fillStyle(SHIRT);
      g.fillRect(0, 13, 1, 8);
      g.fillRect(15, 13, 1, 8);
      // Hammer in hand
      g.fillStyle(0x888888);
      g.fillRect(14, 13, 2, 6);
      g.fillStyle(0x666666);
      g.fillRect(13, 13, 4, 3);
      // Boots
      g.fillStyle(0x3a2010);
      g.fillRect(3, 25, 4, 3);
      g.fillRect(9, 25, 4, 3);
    });

    // ── MARKET VENDOR: wide sun hat, striped apron, jolly ────────────
    this._makeSprite('npc_vendor', (g) => {
      const SKIN = 0xF5CBA7, HAT = 0xd4b030, APRON = 0xffffff, SHIRT = 0xcc4422;
      // Very wide sun hat
      g.fillStyle(HAT);
      g.fillRect(0, 3, 16, 3);  // brim (full canvas width)
      g.fillRect(3, 0, 10, 5);  // hat body
      // Hat ribbon
      g.fillStyle(0xaa8820);
      g.fillRect(3, 4, 10, 1);
      // Chubby face (wider)
      g.fillStyle(SKIN);
      g.fillRect(4, 6, 8, 7);
      g.fillStyle(0x1A1612);
      g.fillRect(6, 8, 2, 2);   // eyes
      g.fillRect(9, 8, 2, 2);
      // Rosy cheeks
      g.fillStyle(0xF4A0A0, 0.7);
      g.fillRect(4, 10, 3, 2);
      g.fillRect(9, 10, 3, 2);
      // Big smile
      g.fillStyle(0x1A1612);
      g.fillRect(6, 12, 5, 1);
      // Shirt
      g.fillStyle(SHIRT);
      g.fillRect(2, 13, 12, 10);
      // White apron with stripes
      g.fillStyle(APRON);
      g.fillRect(4, 14, 8, 11);
      g.fillStyle(0xdddddd);
      g.fillRect(5, 15, 1, 9);
      g.fillRect(8, 15, 1, 9);
      g.fillRect(11, 15, 1, 9);
      // Wide body arms
      g.fillStyle(SHIRT);
      g.fillRect(0, 14, 2, 7);
      g.fillRect(14, 14, 2, 7);
      // Shoes
      g.fillStyle(0x4a3010);
      g.fillRect(3, 25, 4, 3);
      g.fillRect(9, 25, 4, 3);
    });

    // ── SCHOLAR NPC: small cap, open book ────────────────────────────
    this._makeSprite('npc_scholar', (g) => {
      const SKIN = 0xF5CBA7, CAP = 0x2244aa, ROBE = 0x1e3a7a;
      // Small round skullcap
      g.fillStyle(CAP);
      g.fillRect(5, 2, 6, 4);
      g.fillRect(4, 3, 8, 3);
      // Face
      g.fillStyle(SKIN);
      g.fillRect(5, 6, 6, 6);
      g.fillStyle(0x1A1612);
      g.fillRect(6, 8, 2, 2);
      g.fillRect(9, 8, 2, 2);
      // Wrinkles (older scholar)
      g.fillStyle(0xccaa88);
      g.fillRect(6, 11, 1, 1);
      g.fillRect(9, 11, 1, 1);
      // Robes
      g.fillStyle(ROBE);
      g.fillRect(3, 12, 10, 13);
      g.fillStyle(0x88aadd);
      g.fillRect(3, 12, 10, 2);
      // Book held open (both arms extended)
      g.fillStyle(ROBE);
      g.fillRect(0, 13, 3, 6);
      g.fillRect(13, 13, 3, 6);
      g.fillStyle(0xFFF8F0);    // book pages
      g.fillRect(0, 14, 3, 4);
      g.fillRect(13, 14, 3, 4);
      g.fillStyle(0x8B4513);    // book cover
      g.fillRect(1, 14, 1, 4);
      g.fillRect(13, 14, 1, 4);
    });

    // ── ARTISAN NPC: colorful beret, paint palette ───────────────────
    this._makeSprite('npc_artisan', (g) => {
      const SKIN = 0xF5CBA7, BERET = 0x992299, SMOCK = 0xffffff;
      // Beret (offset/tilted to one side)
      g.fillStyle(BERET);
      g.fillRect(3, 2, 10, 3);  // beret body
      g.fillRect(5, 1, 8, 3);   // beret top
      g.fillRect(11, 1, 2, 2);  // beret tilt bump
      // Paint smudge on beret
      g.fillStyle(0xffaa00);
      g.fillRect(5, 2, 2, 2);
      g.fillStyle(0x44aaff);
      g.fillRect(8, 2, 2, 1);
      // Face
      g.fillStyle(SKIN);
      g.fillRect(5, 5, 6, 7);
      g.fillStyle(0x1A1612);
      g.fillRect(6, 7, 2, 2);
      g.fillRect(9, 7, 2, 2);
      // Paint smudge on cheek
      g.fillStyle(0xff6633);
      g.fillRect(5, 10, 2, 1);
      // Smock (white with paint splatters)
      g.fillStyle(SMOCK);
      g.fillRect(3, 12, 10, 14);
      // Colorful paint splatters
      g.fillStyle(0xff0000); g.fillRect(4, 14, 2, 2);
      g.fillStyle(0x0044ff); g.fillRect(9, 17, 2, 2);
      g.fillStyle(0xffcc00); g.fillRect(6, 20, 3, 2);
      g.fillStyle(0x00aa44); g.fillRect(10, 22, 2, 2);
      // Palette held out
      g.fillStyle(SMOCK);
      g.fillRect(0, 13, 3, 5);
      g.fillStyle(0x8B4513);    // palette wood
      g.fillRect(0, 14, 3, 4);
      g.fillStyle(0xff0000); g.fillRect(0, 14, 1, 1);
      g.fillStyle(0x0044ff); g.fillRect(1, 14, 1, 1);
      g.fillStyle(0xffcc00); g.fillRect(2, 14, 1, 1);
      // Brush in other hand
      g.fillStyle(SMOCK);
      g.fillRect(13, 13, 3, 5);
      g.fillStyle(0x8B4513);
      g.fillRect(14, 14, 1, 8);
      g.fillStyle(0x4499ff);
      g.fillRect(14, 20, 1, 3);
    });

    // ── TRAINING GUARD: full plate armor, shield ─────────────────────
    this._makeSprite('npc_training', (g) => {
      const ARMOR = 0xcc2222, METAL = 0xaaaaaa, DARK = 0x880000;
      // Great helm (full face coverage, visor)
      g.fillStyle(METAL);
      g.fillRect(3, 1, 10, 10);
      g.fillStyle(DARK);
      g.fillRect(4, 4, 8, 5);   // visor opening
      g.fillStyle(0x222222);
      g.fillRect(5, 5, 6, 3);   // dark interior
      // Helmet crest
      g.fillStyle(0xff4444);
      g.fillRect(7, 0, 2, 2);
      g.fillRect(6, 0, 4, 1);
      // Plate body
      g.fillStyle(ARMOR);
      g.fillRect(2, 11, 12, 12);
      // Plate detail (rivets/lines)
      g.fillStyle(METAL);
      g.fillRect(2, 12, 12, 1);  // shoulder line
      g.fillRect(7, 11, 2, 12);  // center line
      g.fillRect(3, 14, 2, 2);   // rivet L
      g.fillRect(11, 14, 2, 2);  // rivet R
      // Shield (left arm)
      g.fillStyle(ARMOR);
      g.fillRect(0, 12, 2, 9);
      g.fillStyle(0x660000);
      g.fillRect(0, 12, 2, 9);
      g.fillStyle(METAL);
      g.fillRect(0, 15, 2, 3);   // shield boss
      // Sword (right arm)
      g.fillStyle(ARMOR);
      g.fillRect(14, 11, 2, 8);
      g.fillStyle(METAL);
      g.fillRect(14, 14, 2, 12); // blade
      g.fillStyle(0xF59E0B);
      g.fillRect(13, 17, 4, 2);  // crossguard
      // Greaves
      g.fillStyle(METAL);
      g.fillRect(3, 23, 4, 5);
      g.fillRect(9, 23, 4, 5);
    });

    // ── MERCHANT NPC: tall top hat, fine coat ────────────────────────
    this._makeSprite('npc_merchant', (g) => {
      const SKIN = 0xF5CBA7, HAT = 0x2a1a08, COAT = 0xc8a020, GOLD = 0xF59E0B;
      // Tall stovepipe hat
      g.fillStyle(HAT);
      g.fillRect(5, 0, 6, 7);
      g.fillRect(3, 6, 10, 2);  // brim
      g.fillStyle(GOLD);
      g.fillRect(5, 6, 6, 1);   // hatband
      // Face
      g.fillStyle(SKIN);
      g.fillRect(5, 8, 6, 6);
      g.fillStyle(0x1A1612);
      g.fillRect(6, 10, 2, 2);
      g.fillRect(9, 10, 2, 2);
      // Pencil mustache
      g.fillStyle(0x5a3010);
      g.fillRect(7, 13, 3, 1);
      // Fancy coat with tails
      g.fillStyle(COAT);
      g.fillRect(2, 14, 12, 12);
      g.fillStyle(GOLD);
      g.fillRect(2, 14, 12, 2);  // collar gold
      g.fillRect(6, 14, 4, 5);   // lapels
      // Gold buttons
      g.fillStyle(GOLD);
      g.fillRect(7, 17, 2, 2);
      g.fillRect(7, 21, 2, 2);
      // Arms
      g.fillStyle(COAT);
      g.fillRect(0, 15, 2, 8);
      g.fillRect(14, 15, 2, 8);
      // Gold cuffs
      g.fillStyle(GOLD);
      g.fillRect(0, 21, 2, 2);
      g.fillRect(14, 21, 2, 2);
      // Trousers
      g.fillStyle(0x1a1208);
      g.fillRect(4, 26, 3, 2);
      g.fillRect(9, 26, 3, 2);
    });

    // ── GUILD MASTER: ornate crown, flowing gold robes ───────────────
    this._makeSprite('npc_guildmaster', (g) => {
      const SKIN = 0xF5CBA7, CROWN = 0xF59E0B, ROBE = 0xc8a020, INNER = 0xfff0c0;
      // Crown (elaborate, 3 points)
      g.fillStyle(CROWN);
      g.fillRect(4, 2, 8, 5);   // crown band
      g.fillRect(5, 0, 2, 4);   // left spike
      g.fillRect(7, 0, 2, 3);   // center dip
      g.fillRect(9, 0, 2, 4);   // right spike (but actually make center tallest)
      g.fillRect(7, 0, 2, 5);   // center spike (taller)
      // Crown gems
      g.fillStyle(0xff2222);
      g.fillRect(5, 2, 2, 2);
      g.fillStyle(0x2244ff);
      g.fillRect(9, 2, 2, 2);
      g.fillStyle(0x22cc22);
      g.fillRect(7, 1, 2, 2);
      // Face (stately, older)
      g.fillStyle(SKIN);
      g.fillRect(4, 7, 8, 6);
      g.fillStyle(0x1A1612);
      g.fillRect(5, 9, 2, 2);
      g.fillRect(9, 9, 2, 2);
      // Beard (distinguished)
      g.fillStyle(0xddddcc);
      g.fillRect(4, 11, 8, 5);
      g.fillRect(5, 13, 6, 3);
      // Grand robes (wide, floor length)
      g.fillStyle(ROBE);
      g.fillRect(0, 13, 16, 14);
      // Inner robe
      g.fillStyle(INNER);
      g.fillRect(5, 14, 6, 12);
      // Robe trim (gold border on outside)
      g.fillStyle(0xf0c040);
      g.fillRect(0, 13, 2, 14);
      g.fillRect(14, 13, 2, 14);
      g.fillRect(0, 13, 16, 2);
      // Medallion
      g.fillStyle(CROWN);
      g.fillRect(7, 18, 2, 2);
      // Robe symbols
      g.fillStyle(0xf0c040);
      g.fillRect(2, 18, 2, 3);
      g.fillRect(12, 18, 2, 3);
    });
  }

  // ── Helper: create a 16×28 texture from a drawing callback ──────────
  _makeSprite (key, drawFn) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // Drop shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(8, 27, 14, 5);
    // Draw sprite
    drawFn(g);
    // Black outline pass (1px border on all non-transparent pixels — approximate)
    // We achieve this by drawing a slightly larger dark version first,
    // but since Phaser graphics don't support per-pixel operations easily,
    // we use a simple border technique: just draw outlines on major shapes.
    g.generateTexture(key, 16, 28);
    g.destroy();
  }
};
