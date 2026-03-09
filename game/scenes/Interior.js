/* ── Interior Scene ─────────────────────────────────────────────────────
   Renders a Tiled interior map (castle/inn/library/market/studio/tent).
   Called from Village when player enters a building door.
   Init data: { mapKey, npcName, returnX, returnY }
──────────────────────────────────────────────────────────────────────── */

window.GQ = window.GQ || {};

GQ.Interior = class Interior extends Phaser.Scene {

  constructor () { super({ key: 'Interior' }); }

  init (data) {
    this._mapKey   = data.mapKey;
    this._npcName  = data.npcName;
    this._returnX  = data.returnX;
    this._returnY  = data.returnY;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────

  create () {
    this._dialogueOpen  = false;
    this._interactables = [];

    // ── Music ──────────────────────────────────────────────────────
    GQ.Audio.play(this, 'music-interior');

    // ── Draw interior map ──────────────────────────────────────────
    this._drawMap();

    // ── Player at center-bottom of interior ────────────────────────
    const arch = (window.GQ.player && window.GQ.player.archetype) || '1';
    this._player = this.add.image(
      this._ox + this._mapW / 2,
      this._oy + this._mapH - 24,
      `hero_${arch}`
    ).setDepth(5).setScale(4);

    // ── Input ──────────────────────────────────────────────────────
    this._cursors  = this.input.keyboard.createCursorKeys();
    this._wasd     = this.input.keyboard.addKeys('W,A,S,D');
    this._eKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // ── Dialogue box ───────────────────────────────────────────────
    this._dialogue = new GQ.DialogueBox(this);

    // ── NPC from map npc layer ─────────────────────────────────────
    this._placeNPC();

    // ── D-pad ──────────────────────────────────────────────────────
    this._buildDpad();

    // ── Announcement text ──────────────────────────────────────────
    this._annText = this.add.text(400, 28, '', {
      fontFamily: "'Press Start 2P'",
      fontSize:   '9px',
      color:      '#F59E0B',
      stroke:     '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20).setAlpha(0);
  }

  update (_time, delta) {
    if (this._dialogueOpen) return;

    const dt     = delta / 1000;
    const speed  = 160;
    const player = this._player;
    const ds     = this._dpadState;

    let dx = 0, dy = 0;
    if (this._cursors.left.isDown  || this._wasd.A.isDown || ds.left)  dx = -speed;
    if (this._cursors.right.isDown || this._wasd.D.isDown || ds.right) dx =  speed;
    if (this._cursors.up.isDown    || this._wasd.W.isDown || ds.up)    dy = -speed;
    if (this._cursors.down.isDown  || this._wasd.S.isDown || ds.down)  dy =  speed;

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
    if (dx < 0) player.setFlipX(true);
    if (dx > 0) player.setFlipX(false);

    const newX = Phaser.Math.Clamp(player.x + dx * dt, this._ox + 16, this._ox + this._mapW - 16);
    const newY = Phaser.Math.Clamp(player.y + dy * dt, this._oy + 16, this._oy + this._mapH - 8);

    const pRect = { x: newX - 12, y: newY - 8, w: 24, h: 18 };
    if (!this._collidesWithWall(pRect)) {
      player.setPosition(newX, newY);
    } else {
      const rX = { x: newX - 12, y: player.y - 8, w: 24, h: 18 };
      if (!this._collidesWithWall(rX)) player.setX(newX);
      const rY = { x: player.x - 12, y: newY - 8, w: 24, h: 18 };
      if (!this._collidesWithWall(rY)) player.setY(newY);
    }

    // Exit zone: walk to bottom edge of interior
    if (player.y >= this._oy + this._mapH - 22) {
      this._exitInterior();
      return;
    }

    // NPC interaction prompts
    const nearest = this._getNearestInteractable();
    for (const obj of this._interactables) {
      obj.prompt.setAlpha(obj === nearest ? 1 : 0);
    }
    if (nearest && Phaser.Input.Keyboard.JustDown(this._spaceKey)) {
      this._triggerInteract(nearest);
    }
  }

  // ── Map rendering ──────────────────────────────────────────────────

  _drawMap () {
    const TILE    = 16;
    const mapData = this.cache.json.get(this._mapKey);

    // Calculate scale to fit the interior in the viewport with padding
    const SCALE = Math.min(
      Math.floor(760 / (mapData.width  * TILE)),
      Math.floor(520 / (mapData.height * TILE))
    );
    const TS = TILE * SCALE;
    const W  = mapData.width  * TS;
    const H  = mapData.height * TS;

    this._ox    = Math.floor((800 - W) / 2);
    this._oy    = Math.floor((560 - H) / 2);
    this._mapW  = W;
    this._mapH  = H;
    this._scale = SCALE;

    // Map TSX source keywords → loaded texture keys + tileset params
    const TILESET_MAP = [
      { keyword: 'tiny-town', img: 'ts-packed', cols: 11, step: 17 },
      { keyword: 'Take 2',    img: 'ts-packed', cols: 12, step: 16 },
      { keyword: 'tiles2',    img: 'ts-spaced', cols: 12, step: 17 },
      { keyword: 'like2',     img: 'ts-like2',  cols: 57, step: 17 },
    ];

    const TILESETS = mapData.tilesets.map(ts => {
      const src  = ts.source || '';
      const spec = TILESET_MAP.find(m => src.includes(m.keyword)) || TILESET_MAP[1];
      return {
        firstgid: ts.firstgid,
        cols:     spec.cols,
        step:     spec.step,
        img:      this.textures.get(spec.img).getSourceImage(),
      };
    });

    const H_FLIP  = 0x80000000, V_FLIP = 0x40000000, D_FLIP = 0x20000000;
    const FLAG_ALL = H_FLIP | V_FLIP | D_FLIP;

    const tilesetFor = (id) => {
      let ts = TILESETS[0];
      for (const t of TILESETS) { if (id >= t.firstgid) ts = t; }
      return ts;
    };

    // Remove old texture if re-entering same map
    const texKey = `interior-${this._mapKey}`;
    if (this.textures.exists(texKey)) this.textures.remove(texKey);

    const tex = this.textures.createCanvas(texKey, W, H);
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
    this.add.image(this._ox, this._oy, texKey).setOrigin(0, 0).setDepth(0);

    // Collision rects (first non-npc objectgroup)
    this._collisionRects = [];
    const collLayer = mapData.layers.find(l => l.type === 'objectgroup' && l.name !== 'npc');
    if (collLayer) {
      for (const obj of collLayer.objects) {
        this._collisionRects.push({
          x: this._ox + obj.x     * SCALE,
          y: this._oy + obj.y     * SCALE,
          w: obj.width  * SCALE,
          h: obj.height * SCALE,
        });
      }
    }
  }

  // ── NPC placement ──────────────────────────────────────────────────

  _placeNPC () {
    const data = GQ.NPC_DATA[this._npcName];
    if (!data) return;

    const mapData = this.cache.json.get(this._mapKey);
    const npcLayer = mapData.layers.find(l => l.name === 'npc');

    let worldX, worldY;
    if (npcLayer && npcLayer.objects.length > 0) {
      const obj = npcLayer.objects[0];
      worldX = this._ox + obj.x * this._scale;
      worldY = this._oy + obj.y * this._scale;
    } else {
      worldX = this._ox + this._mapW / 2;
      worldY = this._oy + this._mapH / 3;
    }

    const completed = window.GQ.completed || new Set();
    const questKey  = data.craftRole || data.choices?.[0]?.value?.key;
    const isDone    = questKey ? completed.has(questKey === 'crafts' ? 'crafts' : questKey) : false;

    const locked   = data.isGuildMaster && !this._allDone();
    const sprite   = this.add.image(worldX, worldY, data.texture).setScale(4).setDepth(4);
    const tag      = this.add.text(worldX, worldY - 26, this._npcName, {
      fontFamily: "'Press Start 2P'", fontSize: '7px', color: '#F59E0B',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    const prompt   = this.add.text(worldX, worldY - 40, isMobile ? '▶  TO TALK' : '[SPACE] TO TALK', {
      fontFamily: "'Press Start 2P'", fontSize: '7px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(6).setAlpha(0);

    let lockIcon = null;
    if (locked) {
      lockIcon = this.add.text(worldX + 20, worldY - 22, '🔒', { fontSize: '14px' }).setDepth(7);
      sprite.setTint(0x555555);
      tag.setAlpha(0.35);
    }

    this._interactables.push({
      x: worldX, y: worldY, sprite, tag, prompt, lockIcon,
      name: this._npcName, data, isDone,
    });
  }

  // ── Interaction ────────────────────────────────────────────────────

  _triggerInteract (npc) {
    const data      = npc.data;
    const completed = window.GQ.completed || new Set();

    // Guild Master
    if (data.isGuildMaster) {
      if (!this._allDone()) {
        const REQUIRED = ['budget','structure','level','crafts','languages','technology','business_career','home_trade','music'];
        const NPC_NAMES = {
          budget: 'the Market Vendor', structure: 'the Hermit', level: 'the Librarian',
          crafts: 'the Craftsperson', languages: 'the Traveler', technology: 'the Blacksmith',
          business_career: 'the Inn Keeper', home_trade: 'the Mason', music: 'the Bard',
        };
        const missing = REQUIRED.filter(k => !completed.has(k)).map(k => NPC_NAMES[k]);
        this._dialogueOpen = true;
        this._dialogue.show('GUILD MASTER',
          ['Your journey is not yet complete.', `You still need to speak with ${missing.join(', ')}.`],
          null, () => { this._dialogueOpen = false; });
        return;
      }
      this._dialogueOpen = true;
      this._dialogue.show('GUILD MASTER', [
        'Ahh... I have watched your journey through the village.',
        'Your choices have spoken louder than words ever could.',
        'Come with me. Your path is waiting.',
      ], null, () => {
        this._dialogueOpen = false;
        document.getElementById('dpad')?.remove();
        this.scene.start('GuildMaster', { profile: window.GQ.profile });
      });
      return;
    }

    // Already completed
    const questKey = data.craftRole || data.choices?.[0]?.value?.key;
    const checkKey = data.craftRole === 'crafts' ? 'crafts' : questKey;
    if (checkKey && completed.has(checkKey)) {
      this._dialogueOpen = true;
      window.GQ.dismissed = window.GQ.dismissed || new Set();
      if (!window.GQ.dismissed.has(checkKey)) {
        window.GQ.dismissed.add(checkKey);
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
      return;
    }

    this._runNPCDialogue(npc);
  }

  _runNPCDialogue (npc) {
    const data = npc.data;
    this._dialogueOpen = true;

    // Craftsperson: two-part dialogue
    if (data.craftRole === 'crafts') {
      this._dialogue.show(npc.name, data.lines, data.choices, (v1) => {
        window.GQ.profile.interests.creative_arts = v1.val;
        this._dialogue.show(npc.name,
          ['What about lifestyle pursuits — cooking, yoga, dance, outdoor hobbies? Things that enrich everyday life?'],
          [
            { label: 'Absolutely, I love those!', value: { key: 'lifestyle_hobbies', val: true,  isInterest: true } },
            { label: 'Not really',                value: { key: 'lifestyle_hobbies', val: false, isInterest: true } },
          ],
          (v2) => {
            window.GQ.profile.interests.lifestyle_hobbies = v2.val;
            this._dialogue.show(npc.name,
              ['I always find the interests of others so fascinating!'],
              null,
              () => {
                this._dialogueOpen = false;
                this._complete('crafts', 'CREATIVE INTERESTS NOTED ✓');
              }
            );
          }
        );
      });
      return;
    }

    // Standard dialogue
    this._dialogue.show(npc.name, data.lines, data.choices || [], (value) => {
      const postLine = (value && value.postLine) || data.postLine;
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
    window.GQ.profile = window.GQ.profile || { budget: null, structure: null, level: null, interests: {} };
    if (value.isInterest) {
      window.GQ.profile.interests[value.key] = value.val;
      this._complete(value.key, 'INTEREST NOTED ✓');
    } else {
      window.GQ.profile[value.key] = value.val;
      const LABELS = { budget: 'ITEM TAKEN ✓', structure: 'STUDY STYLE CHOSEN ✓', level: 'KNOWLEDGE NOTED ✓' };
      this._complete(value.key, LABELS[value.key] || '✓');
    }
  }

  _complete (key, announcement = '✓') {
    window.GQ.completed = window.GQ.completed || new Set();
    if (!window.GQ.completed.has(key)) {
      window.GQ.completed.add(key);
    }
    this._showAnnouncement(announcement);
  }

  _allDone () {
    const completed = window.GQ.completed || new Set();
    const REQUIRED  = ['budget','structure','level','crafts','languages','technology','business_career','home_trade','music'];
    return REQUIRED.every(k => completed.has(k));
  }

  _showAnnouncement (msg) {
    this._annText.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this._annText);
    this.tweens.add({ targets: this._annText, alpha: 0, duration: 2400, delay: 1400 });
  }

  _getNearestInteractable () {
    const px = this._player.x, py = this._player.y;
    const RANGE = 70;
    let nearest = null, nearDist = Infinity;
    for (const obj of this._interactables) {
      const d = Phaser.Math.Distance.Between(px, py, obj.x, obj.y);
      if (d < RANGE && d < nearDist) { nearDist = d; nearest = obj; }
    }
    return nearest;
  }

  // ── Collision ──────────────────────────────────────────────────────

  _collidesWithWall (rect) {
    for (const wall of this._collisionRects) {
      if (this._rectsOverlap(rect, wall)) return true;
    }
    for (const npc of this._interactables) {
      const nr = { x: npc.x - 14, y: npc.y - 14, w: 28, h: 28 };
      if (this._rectsOverlap(rect, nr)) return true;
    }
    return false;
  }

  _rectsOverlap (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // ── Exit ───────────────────────────────────────────────────────────

  _exitInterior () {
    document.getElementById('dpad')?.remove();
    this.scene.start('Village', { returnX: this._returnX, returnY: this._returnY });
  }

  // ── HUD ────────────────────────────────────────────────────────────

  _buildHUD () {
    const hud = this.add.graphics().setDepth(18);
    hud.fillStyle(0x1A1612, 0.88);
    hud.fillRect(6, 6, 210, 64);
    hud.lineStyle(2, 0x5a5248);
    hud.strokeRect(6, 6, 210, 64);
    this.add.text(14, 14, 'WALK DOWN  EXIT',  { fontFamily: "'Press Start 2P'", fontSize: '6px', color: '#F59E0B' }).setDepth(19);
    this.add.text(14, 30, 'WASD / ARROWS  MOVE', { fontFamily: "'Press Start 2P'", fontSize: '6px', color: '#a89f94' }).setDepth(19);
    this.add.text(14, 46, '[ SPACE ]  TALK',      { fontFamily: "'Press Start 2P'", fontSize: '6px', color: '#F59E0B' }).setDepth(19);
  }

  // ── D-pad ──────────────────────────────────────────────────────────

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

  _placeDpad () {
    const canvas = document.querySelector('#game-container canvas');
    const dpad   = document.getElementById('dpad');
    if (!canvas || !dpad) return;
    const r = canvas.getBoundingClientRect();
    dpad.style.left   = (r.left   + 16) + 'px';
    dpad.style.bottom = (window.innerHeight - r.bottom + 24) + 'px';
  }

  shutdown () {
    document.getElementById('dpad')?.remove();
  }
};
