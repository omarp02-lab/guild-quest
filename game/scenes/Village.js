/* ── Village Scene ─────────────────────────────────────────────────────
   Renders the Tiled village.tmj map as a canvas texture.
   Camera follows the player. 9 NPCs build the learning profile.
──────────────────────────────────────────────────────────────────────── */

window.GQ = window.GQ || {};

GQ.Village = class Village extends Phaser.Scene {

  constructor () { super({ key: 'Village' }); }

  // World dimensions (35×25 tiles at 32px each)
  static get W () { return 1120; }
  static get H () { return 800; }

  // ── Lifecycle ──────────────────────────────────────────────────────

  create (data) {
    const W = GQ.Village.W;
    const H = GQ.Village.H;

    // ── Global profile/completed (persists across Village↔Interior) ──
    if (!window.GQ.profile) {
      window.GQ.profile = {
        budget:    null,
        structure: null,
        level:     null,
        interests: {
          creative_arts:     null,
          lifestyle_hobbies: null,
          languages:         null,
          technology:        null,
          business_career:   null,
          home_trade:        null,
          music:             null,
        },
      };
      window.GQ.completed = new Set();
      window.GQ.dismissed = new Set();

    }
    this._profile   = window.GQ.profile;
    this._completed = window.GQ.completed;

    this._dialogueOpen  = false;
    this._enteringDoor  = false;
    this._interactables = [];
    // Cooldown after returning from interior so player can't immediately re-enter
    this._doorCooldown  = (data && data.returnX) ? true : false;
    if (this._doorCooldown) {
      this.time.delayedCall(1500, () => { this._doorCooldown = false; });
    }
    this._guildMasterUnlocked = this._completed.size >= 9;

    // ── Music ───────────────────────────────────────────────────────
    GQ.Audio.play(this, 'music-village');

    // ── Portrait warning (show if needed, update on rotate) ──────────
    this._updatePortraitWarn();
    this._orientHandler = () => this._updatePortraitWarn();
    window.addEventListener('orientationchange', this._orientHandler);
    window.addEventListener('resize', this._orientHandler);

    // ── Tiled map background + door/collision rects ──────────────────
    this._drawMap();

    // ── Player sprite ───────────────────────────────────────────────
    const arch = (window.GQ.player && window.GQ.player.archetype) || '1';
    // If returning from an interior, restore position; else start center-bottom
    const startX = (data && data.returnX) ? data.returnX : W / 2;
    const startY = (data && data.returnY) ? data.returnY : H - 80;
    this._player = this.add.image(startX, startY, `hero_${arch}`)
      .setDepth(5).setScale(2);

    // ── Camera follows player ────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.startFollow(this._player, true, 0.12, 0.12);

    // ── Dialogue box ────────────────────────────────────────────────
    this._dialogue = new GQ.DialogueBox(this);

    // ── Input ────────────────────────────────────────────────────────
    this._cursors   = this.input.keyboard.createCursorKeys();
    this._wasd      = this.input.keyboard.addKeys('W,A,S,D');
    this._eKey      = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this._spaceKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ── NPCs ─────────────────────────────────────────────────────────
    this._placeNPCs();

    // ── HUD (fixed to camera) ────────────────────────────────────────
    this._buildControlsHUD();
    this._buildProgressUI();
    this._buildDpad();

    // ── Announcement banner (fixed) ──────────────────────────────────
    this._annText = this.add.text(400, 28, '', {
      fontFamily: "'Press Start 2P'",
      fontSize:   '9px',
      color:      '#F59E0B',
      stroke:     '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20).setAlpha(0).setScrollFactor(0);

    // ── Player name tag (follows player via update) ──────────────────
    const pName = (window.GQ.player && window.GQ.player.name) || 'HERO';
    this._playerNameTag = this.add.text(0, 0, pName, {
      fontFamily: "'Press Start 2P'",
      fontSize:   '7px',
      color:      '#F59E0B',
      stroke:     '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6);

    // Restore progress UI state when returning from interior
    this._updateProgressUI();

    // Show welcome only on first entry (not when returning from interior)
    if (!data || !data.returnX) {
      this.time.delayedCall(600,  () => this._showAnnouncement('WELCOME TO GUILD VILLAGE'));
    }

    // Re-flash unlock if already complete
    if (this._guildMasterUnlocked) {
      this.time.delayedCall(800, () => this._showAnnouncement('ALL DONE — ENTER THE CASTLE!'));
    }

    // Fade in from interior transitions
    this.cameras.main.fadeIn(300);
  }

  update (time, delta) {
    if (this._dialogueOpen || this._enteringDoor) return;

    const dt     = delta / 1000;
    const speed  = 200;
    const player = this._player;

    let dx = 0, dy = 0;
    if (this._cursors.left.isDown  || this._wasd.A.isDown || this._dpadState.left)  dx = -speed;
    if (this._cursors.right.isDown || this._wasd.D.isDown || this._dpadState.right) dx =  speed;
    if (this._cursors.up.isDown    || this._wasd.W.isDown || this._dpadState.up)    dy = -speed;
    if (this._cursors.down.isDown  || this._wasd.S.isDown || this._dpadState.down)  dy =  speed;

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
    if (dx < 0) player.setFlipX(true);
    if (dx > 0) player.setFlipX(false);

    if (this._controlsHud && (dx !== 0 || dy !== 0)) {
      window.GQ.controlsDismissed = true;
      const targets = this._controlsHud;
      this._controlsHud = null;
      this.tweens.add({ targets, alpha: 0, duration: 800, onComplete: () => targets.forEach(o => o.destroy()) });
    }

    const W = GQ.Village.W, H = GQ.Village.H;
    const newX = Phaser.Math.Clamp(player.x + dx * dt, 22, W - 22);
    const newY = Phaser.Math.Clamp(player.y + dy * dt, 22, H - 22);
    const pRect = { x: newX - 12, y: newY - 8, w: 24, h: 18 };

    if (!this._collidesWithWall(pRect)) {
      player.setPosition(newX, newY);
    } else {
      const rX = { x: newX - 12, y: player.y - 8, w: 24, h: 18 };
      if (!this._collidesWithWall(rX)) player.setX(newX);
      const rY = { x: player.x - 12, y: newY - 8, w: 24, h: 18 };
      if (!this._collidesWithWall(rY)) player.setY(newY);
    }

    // Name tag follows player in world space
    this._playerNameTag.setPosition(player.x, player.y + 26);

    // NPC interaction prompts + talk trigger (E or Space)
    const nearest = this._getNearestInteractable();
    for (const obj of this._interactables) {
      obj.prompt.setAlpha(obj === nearest ? 1 : 0);
    }
    if (nearest && Phaser.Input.Keyboard.JustDown(this._spaceKey)) {
      this._triggerInteract(nearest);
    }

  }

  // ── Tiled map renderer ──────────────────────────────────────────────

  _drawMap () {
    const SCALE = 2, TILE = 16, TS = TILE * SCALE;
    const mapData = this.cache.json.get('village-map');
    const W = mapData.width  * TS;   // 1120
    const H = mapData.height * TS;   // 800

    const packedImg = this.textures.get('ts-packed').getSourceImage();
    const spacedImg = this.textures.get('ts-spaced').getSourceImage();
    const like2Img  = this.textures.get('ts-like2').getSourceImage();

    const TILESETS = [
      { firstgid: 1,   cols: 11, step: 17, img: packedImg },
      { firstgid: 111, cols: 12, step: 16, img: packedImg },
      { firstgid: 243, cols: 12, step: 17, img: spacedImg },
      { firstgid: 375, cols: 57, step: 17, img: like2Img  },
    ];

    const H_FLIP  = 0x80000000;
    const V_FLIP  = 0x40000000;
    const D_FLIP  = 0x20000000;
    const FLAG_ALL = H_FLIP | V_FLIP | D_FLIP;

    const tilesetFor = (id) => {
      let ts = TILESETS[0];
      for (const t of TILESETS) { if (id >= t.firstgid) ts = t; }
      return ts;
    };

    // Remove previous canvas texture if re-entering from interior
    if (this.textures.exists('village-bg')) this.textures.remove('village-bg');

    const tex = this.textures.createCanvas('village-bg', W, H);
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;

    const drawGid = (gid, tx, ty) => {
      if (!gid) return;
      const flipH = (gid & H_FLIP) !== 0;
      const flipV = (gid & V_FLIP) !== 0;
      const flipD = (gid & D_FLIP) !== 0;
      const id    = gid & ~FLAG_ALL;
      if (!id) return;
      const ts    = tilesetFor(id);
      const local = id - ts.firstgid;
      const sx    = (local % ts.cols) * ts.step;
      const sy    = Math.floor(local / ts.cols) * ts.step;
      const dx    = tx * TS, dy = ty * TS;

      ctx.save();
      ctx.translate(dx + TS / 2, dy + TS / 2);
      if      ( flipD && !flipH && !flipV) { ctx.rotate( Math.PI / 2); ctx.scale( 1, -1); }
      else if ( flipD &&  flipH && !flipV) { ctx.rotate( Math.PI / 2); }
      else if ( flipD && !flipH &&  flipV) { ctx.rotate(-Math.PI / 2); }
      else if ( flipD &&  flipH &&  flipV) { ctx.rotate(-Math.PI / 2); ctx.scale( 1, -1); }
      else if (!flipD &&  flipH && !flipV) { ctx.scale(-1,  1); }
      else if (!flipD && !flipH &&  flipV) { ctx.scale( 1, -1); }
      else if (!flipD &&  flipH &&  flipV) { ctx.rotate(Math.PI); }
      ctx.drawImage(ts.img, sx, sy, TILE, TILE, -TS / 2, -TS / 2, TS, TS);
      ctx.restore();
    };

    for (const layer of mapData.layers) {
      if (layer.type !== 'tilelayer' || !layer.visible) continue;
      const { data, width } = layer;
      for (let i = 0; i < data.length; i++) {
        if (!data[i]) continue;
        drawGid(data[i], i % width, Math.floor(i / width));
      }
    }

    tex.refresh();
    this.add.image(0, 0, 'village-bg').setOrigin(0, 0).setDepth(0);

    // ── Collision rectangles from Tiled object layer ──────────────────
    this._collisionRects = [];
    const collLayer = mapData.layers.find(
      l => l.type === 'objectgroup' && l.name !== 'Doors' && l.name !== 'npc'
    );
    if (collLayer) {
      for (const obj of collLayer.objects) {
        this._collisionRects.push({
          x: obj.x * SCALE,      y: obj.y * SCALE,
          w: obj.width  * SCALE, h: obj.height * SCALE,
        });
      }
    }

    // ── Door interactables from "Doors" layer (proximity + Space to enter) ──
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    const doorsLayer = mapData.layers.find(l => l.name === 'Doors');
    if (doorsLayer) {
      for (const obj of doorsLayer.objects) {
        const targetProp = (obj.properties || []).find(p => p.name === 'target');
        if (!targetProp) continue;
        const cx     = obj.x * SCALE + (obj.width  * SCALE) / 2;
        const cy     = obj.y * SCALE + (obj.height * SCALE) / 2;
        const bottom = (obj.y + obj.height) * SCALE;
        const prompt = this.add.text(cx, cy - 30, isMobile ? '▶  TO ENTER' : '[SPACE] TO ENTER', {
          fontFamily: "'Press Start 2P'", fontSize: '7px', color: '#ffffff',
          stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(6).setAlpha(0);
        this._interactables.push({ x: cx, y: cy, prompt, isDoor: true, target: targetProp.value, bottom });
      }
    }
  }

  // ── NPC placement ───────────────────────────────────────────────────

  _placeNPCs () {
    const mapData = this.cache.json.get('village-map');
    const SCALE = 2;

    // TMJ stores name/type as custom properties, NOT top-level obj.name/obj.type
    const npcLayer = mapData.layers.find(l => l.name === 'npc');
    if (npcLayer) {
      for (const obj of npcLayer.objects) {
        const getProp = (n) => (obj.properties || []).find(p => p.name === n)?.value;
        const npcName    = getProp('name');
        const npcTexture = getProp('type');
        if (npcName) this._addNPCFromDef(obj.x * SCALE, obj.y * SCALE, npcName, npcTexture);
      }
    }

    // ── Hardcoded outdoor NPC ─────────────────────────────────────────
    this._addNPCFromDef(160, 608, 'TRAVELER');

    // ── Sign ──────────────────────────────────────────────────────────
    const signPrompt = this.add.text(232, 628, window.matchMedia('(pointer: coarse)').matches ? '▶  TO READ' : '[SPACE] TO READ', {
      fontFamily: "'Press Start 2P'", fontSize: '7px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6).setAlpha(0);
    this._interactables.push({ x: 232, y: 668, prompt: signPrompt, isSign: true, range: 102 });
  }

  _addNPCFromDef (x, y, npcName, textureOverride) {
    const def = GQ.NPC_DATA[npcName];
    if (!def) return null;
    const texture  = textureOverride || def.texture;
    const sprite   = this.add.image(x, y, texture).setScale(2).setDepth(4);

    const tag = this.add.text(x, y - 26, npcName, {
      fontFamily: "'Press Start 2P'",
      fontSize:   '7px',
      color:      '#F59E0B',
      stroke:     '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    const prompt = this.add.text(x, y - 40, isMobile ? '▶  TO TALK' : '[SPACE] TO TALK', {
      fontFamily: "'Press Start 2P'",
      fontSize:   '7px',
      color:      '#ffffff',
      stroke:     '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6).setAlpha(0);

    const questKey = def.craftRole || def.choices?.[0]?.value?.key;
    const npcObj = { x, y, sprite, tag, prompt, def, name: npcName, questKey };
    this._interactables.push(npcObj);
    return npcObj;
  }

  // ── Door entry ──────────────────────────────────────────────────────

  _enterDoor (target, returnX, returnY) {
    if (this._enteringDoor) return;
    this._enteringDoor = true;

    const DOOR_NPCS = {
      library: 'LIBRARIAN', studio: 'CRAFTSPERSON', tent: 'HERMIT',
      market:  'MARKET VENDOR', inn: 'INN KEEPER', castle: 'GUILD MASTER',
    };

    this.cameras.main.fade(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('Interior', {
        mapKey:  target + '-map',
        npcName: DOOR_NPCS[target] || null,
        returnX,
        returnY: returnY + 40,
      });
    });
  }

  // ── Interaction ─────────────────────────────────────────────────────

  _triggerInteract (npc) {
    if (npc.isDoor) {
      if (!this._doorCooldown) this._enterDoor(npc.target, this._player.x, npc.bottom);
      return;
    }

    if (npc.isSign) {
      this._dialogueOpen = true;
      this._dialogue.show('NOTICE', [
        'Wisdom awaits. Speak with the Guildmaster... but only after you speak with the villagers.',
      ], null, () => { this._dialogueOpen = false; });
      return;
    }

    const def      = npc.def;
    const questKey = npc.questKey;

    // Already completed?
    if (questKey && this._completed.has(questKey)) {
      this._showRevisit(npc);
      return;
    }

    this._runNPCDialogue(npc);
  }

  _showRevisit (npc) {
    this._dialogueOpen = true;
    const key = npc.questKey;
    if (!window.GQ.dismissed.has(key)) {
      window.GQ.dismissed.add(key);
      this._dialogue.show(npc.name, ["We've already had a good chat. Safe travels!"], null,
        () => { this._dialogueOpen = false; });
      return;
    }
    this._dialogue.show(npc.name, ['Do you want to chat again?'], [
      { label: 'Yes, please.', value: 'yes' },
      { label: 'Not right now.', value: 'no' },
    ], (value) => {
      if (value === 'yes') {
        this._runNPCDialogue(npc);
      } else {
        this._dialogueOpen = false;
      }
    });
  }

  _runNPCDialogue (npc) {
    const def = npc.def;
    this._dialogueOpen = true;
    this._dialogue.show(npc.name, def.lines, def.choices || [], (value) => {
      const postLine = (value && value.postLine) || def.postLine;
      if (value && postLine) {
        this._dialogue.show(npc.name, [postLine], null, () => {
          this._dialogueOpen = false;
          this._applyChoice(value);
        });
      } else {
        this._dialogueOpen = false;
        if (value) this._applyChoice(value);
      }
    });
  }

  _applyChoice (value) {
    if (!value) return;
    if (value.isInterest) {
      this._profile.interests[value.key] = value.val;
      this._complete(value.key, 'INTEREST NOTED ✓');
    } else {
      this._profile[value.key] = value.val;
      const LABELS = {
        budget:    'ITEM TAKEN ✓',
        structure: 'STUDY STYLE CHOSEN ✓',
        level:     'KNOWLEDGE NOTED ✓',
      };
      this._complete(value.key, LABELS[value.key] || '✓');
    }
  }

  _complete (key, announcement = '✓') {
    if (!this._completed.has(key)) {
      this._completed.add(key);
      this._updateProgressUI();
      if (this._completed.size === 9) this._unlockGuildMaster();
    }
    this._showAnnouncement(announcement);
  }

  _getNearestInteractable () {
    const px = this._player.x, py = this._player.y;
    const DEFAULT_RANGE = 70;
    let nearest = null, nearDist = Infinity;
    for (const obj of this._interactables) {
      const range = obj.range || DEFAULT_RANGE;
      const d = Phaser.Math.Distance.Between(px, py, obj.x, obj.y);
      if (d < range && d < nearDist) { nearDist = d; nearest = obj; }
    }
    return nearest;
  }

  // ── Unlock Guild Master ─────────────────────────────────────────────

  _unlockGuildMaster () {
    this._guildMasterUnlocked = true;
    this.cameras.main.flash(500, 245, 158, 11, true);
    this.time.delayedCall(600, () => {
      this._showAnnouncement('ALL DONE — ENTER THE CASTLE!');
    });
  }

  // ── HUD ─────────────────────────────────────────────────────────────

  _buildControlsHUD () {
    this._controlsHud = null;
    if (window.GQ.controlsDismissed) return;
    const hud = this.add.graphics().setDepth(18).setScrollFactor(0);
    hud.fillStyle(0x1A1612, 0.88);
    hud.fillRect(608, 6, 186, 58);
    hud.lineStyle(2, 0x5a5248);
    hud.strokeRect(608, 6, 186, 58);
    const heading = this.add.text(614, 14, 'CONTROLS', {
      fontFamily: "'Press Start 2P'",
      fontSize:   '6px',
      color:      '#F59E0B',
    }).setDepth(19).setScrollFactor(0);
    const txt = this.add.text(614, 30, 'Use keyboard arrows to move', {
      fontFamily: "'Press Start 2P'",
      fontSize:   '6px',
      color:      '#a89f94',
      wordWrap:   { width: 170 },
      lineSpacing: 6,
    }).setDepth(19).setScrollFactor(0);
    this._controlsHud = [hud, heading, txt];
  }

  _buildProgressUI () {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;
    bar.innerHTML = '';
    this._pips = [];
    for (let i = 0; i < 9; i++) {
      const pip = document.createElement('div');
      pip.className = 'progress-pip';
      bar.appendChild(pip);
      this._pips.push(pip);
    }
    bar.style.display = 'flex';
  }

  _updateProgressUI () {
    if (!this._pips) return;
    const n = this._completed.size;
    this._pips.forEach((p, i) => p.classList.toggle('done', i < n));
  }

  _showAnnouncement (msg) {
    this._annText.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this._annText);
    this.tweens.add({ targets: this._annText, alpha: 0, duration: 2400, delay: 1400 });
  }

  // ── Collision ───────────────────────────────────────────────────────

  _collidesWithWall (rect) {
    // World boundary
    if (rect.x < 0 || rect.y < 0 ||
        rect.x + rect.w > GQ.Village.W ||
        rect.y + rect.h > GQ.Village.H) return true;

    // Tiled collision rectangles
    for (const wall of this._collisionRects) {
      if (this._rectsOverlap(rect, wall)) return true;
    }

    // NPC bodies block the player (doors and signs do not)
    for (const npc of this._interactables) {
      if (npc.isDoor || npc.isSign) continue;
      const nr = { x: npc.x - 14, y: npc.y - 14, w: 28, h: 28 };
      if (this._rectsOverlap(rect, nr)) return true;
    }

    return false;
  }

  _rectsOverlap (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ── D-pad ───────────────────────────────────────────────────────────

  _buildDpad () {
    this._dpadState = { up: false, down: false, left: false, right: false };
    document.getElementById('dpad')?.remove();

    const dpad = document.createElement('div');
    dpad.id = 'dpad';
    dpad.innerHTML = `
      <div></div><button class="dpad-btn" id="dpad-up">▲</button><div></div>
      <button class="dpad-btn" id="dpad-left">◄</button>
      <button class="dpad-btn dpad-center" id="dpad-e">▶</button>
      <button class="dpad-btn" id="dpad-right">►</button>
      <div></div><button class="dpad-btn" id="dpad-down">▼</button><div></div>
    `;
    document.body.appendChild(dpad);

    for (const d of ['up', 'down', 'left', 'right']) {
      const btn = document.getElementById(`dpad-${d}`);
      if (!btn) continue;
      btn.addEventListener('pointerdown',  () => { this._dpadState[d] = true;  });
      btn.addEventListener('pointerup',    () => { this._dpadState[d] = false; });
      btn.addEventListener('pointerleave', () => { this._dpadState[d] = false; });
    }

    const eBtn = document.getElementById('dpad-e');
    if (eBtn) {
      eBtn.addEventListener('pointerdown', () => {
        if (this._dialogueOpen) {
          window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
          return;
        }
        const n = this._getNearestInteractable();
        if (n) this._triggerInteract(n);
      });
    }

    this._placeDpad();
    window.addEventListener('resize', this._placeDpad.bind(this), { once: true });
  }

  _updatePortraitWarn () {
    const warn = document.getElementById('portrait-warn');
    if (!warn) return;
    const portrait = window.innerHeight > window.innerWidth;
    warn.style.display = (portrait && window.matchMedia('(pointer: coarse)').matches) ? 'flex' : 'none';
    if (!portrait) this._placeDpad();
  }

  _placeDpad () {
    const canvas = document.querySelector('#game-container canvas');
    const dpad   = document.getElementById('dpad');
    if (!canvas || !dpad) return;
    const r = canvas.getBoundingClientRect();
    dpad.style.left   = (r.left   + 16) + 'px';
    dpad.style.bottom = (window.innerHeight - r.bottom + 24) + 'px';
  }

  shutdown () {
    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.display = 'none';
    document.getElementById('dpad')?.remove();
    const warn = document.getElementById('portrait-warn');
    if (warn) warn.style.display = 'none';
    window.removeEventListener('orientationchange', this._orientHandler);
    window.removeEventListener('resize', this._orientHandler);
  }
};
