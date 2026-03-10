/* ── DialogueBox ───────────────────────────────────────────────────────
   8-bit style dialogue box — larger text, taller box, FF1/DQ1 feel.
──────────────────────────────────────────────────────────────────────── */

window.GQ = window.GQ || {};

GQ.DialogueBox = class DialogueBox extends Phaser.GameObjects.Container {

  constructor (scene) {
    super(scene, 0, 0);

    const W      = scene.scale.width;
    const H      = scene.scale.height;
    const BOX_H  = 195;
    const BOX_Y  = H - BOX_H - 6;
    const PAD    = 14;
    const TEXT_Y = BOX_Y + 36;

    this._BOX_Y   = BOX_Y;
    this._BOX_H   = BOX_H;
    this._TEXT_Y  = TEXT_Y;
    this._PAD     = PAD;

    // ── Background ────────────────────────────────────────────────────
    this._bg = scene.add.graphics();
    this._drawBg(W, BOX_Y, BOX_H);

    // ── NPC name tag ──────────────────────────────────────────────────
    this._nameTag = scene.add.text(PAD + 4, BOX_Y - 18, '', {
      fontFamily: "'Press Start 2P'",
      fontSize:   '10px',
      color:      '#F59E0B',
      backgroundColor: '#1A1612',
      padding:    { x: 8, y: 4 },
    }).setDepth(12);

    // ── Main dialogue text ────────────────────────────────────────────
    this._text = scene.add.text(PAD + 10, TEXT_Y, '', {
      fontFamily: "'Press Start 2P'",
      fontSize:   '10px',
      color:      '#FFF8F0',
      wordWrap:   { width: W - PAD * 2 - 24 },
      lineSpacing: 8,
    }).setDepth(12);

    // ── Continue indicator ▼ ──────────────────────────────────────────
    this._arrow = scene.add.text(W - PAD - 8, BOX_Y + BOX_H - 16, '▼', {
      fontFamily: "'Press Start 2P'",
      fontSize:   '10px',
      color:      '#F59E0B',
    }).setOrigin(1, 0).setDepth(12).setAlpha(0);

    // ── Choice buttons ────────────────────────────────────────────────
    this._choices = [];

    this.add([this._bg, this._nameTag, this._text, this._arrow]);
    scene.add.existing(this);
    this._bg.setScrollFactor(0);
    this._nameTag.setScrollFactor(0);
    this._text.setScrollFactor(0);
    this._arrow.setScrollFactor(0);
    this.setScrollFactor(0);

    this._typingTimer    = null;
    this._onClose        = null;
    this._numKeyHandler  = null;
    this._keyHandler     = null;

    this.setDepth(11);
    this.setVisible(false);
  }

  // ── Public ─────────────────────────────────────────────────────────

  show (npcName, lines, choices, onClose) {
    if (typeof lines === 'string') lines = [lines];

    this._npcName        = npcName ? npcName.toUpperCase() : '';
    this._lines          = lines;
    this._pendingChoices = choices || [];
    this._onClose        = onClose || null;
    this._lineIdx        = 0;

    this.setVisible(true);
    this._nameTag.setText(this._npcName);
    this._showLine(0);

    this._keyHandler = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        this._advance();
      }
    };
    window.addEventListener('keydown', this._keyHandler);
  }

  close () {
    this._stopTyping();
    this._clearChoiceButtons();
    this.setVisible(false);
    this._arrow.setAlpha(0);
    this._text.setText('');
    this._nameTag.setText('');
    if (this._keyHandler) {
      window.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
  }

  get isOpen () { return this.visible; }

  // ── Private ─────────────────────────────────────────────────────────

  _drawBg (W, y, h) {
    this._bg.clear();
    // Drop shadow
    this._bg.fillStyle(0x000000, 0.6);
    this._bg.fillRect(4, y + 4, W - 8, h);
    // Main fill
    this._bg.fillStyle(0x1A1612, 0.97);
    this._bg.fillRect(2, y, W - 4, h);
    // Outer gold border
    this._bg.lineStyle(3, 0xF59E0B, 1);
    this._bg.strokeRect(2, y, W - 4, h);
    // Inner dark border
    this._bg.lineStyle(1, 0x8B6914, 0.5);
    this._bg.strokeRect(7, y + 5, W - 14, h - 10);
  }

  _showLine (idx) {
    this._stopTyping();
    this._clearChoiceButtons();
    this._arrow.setAlpha(0);
    this._text.setText('');

    const fullText = this._lines[idx] || '';
    let i = 0;

    this._typingTimer = this.scene.time.addEvent({
      delay:    22,
      repeat:   fullText.length,
      callback: () => {
        if (i < fullText.length) {
          this._text.setText(this._text.text + fullText[i]);
          i++;
        } else {
          this._onLineComplete(idx);
        }
      },
    });
  }

  _onLineComplete (idx) {
    const isLast = idx >= this._lines.length - 1;

    if (isLast && this._pendingChoices.length > 0) {
      this._showChoices(this._pendingChoices);
    } else {
      this._pulseArrow();
      this._bg.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, this.scene.scale.width, this.scene.scale.height),
        Phaser.Geom.Rectangle.Contains
      );
      this._bg.once('pointerdown', () => this._advance());
    }
  }

  _pulseArrow () {
    this._arrow.setAlpha(1);
    this.scene.tweens.killTweensOf(this._arrow);
    this.scene.tweens.add({
      targets:  this._arrow,
      alpha:    0,
      duration: 450,
      yoyo:     true,
      repeat:   -1,
    });
  }

  _advance () {
    this._stopTyping();
    this._arrow.setAlpha(0);
    this.scene.tweens.killTweensOf(this._arrow);
    this._bg.removeInteractive();

    if (this._lineIdx < this._lines.length - 1) {
      this._lineIdx++;
      this._showLine(this._lineIdx);
    } else if (this._pendingChoices.length > 0) {
      // Skip typing on last line → show full text then choices
      this._text.setText(this._lines[this._lineIdx]);
      const pending = this._pendingChoices;
      this._pendingChoices = [];
      this._showChoices(pending);
    } else {
      const cb = this._onClose;
      this.close();
      // Drain Phaser's JustDown state so Space/Enter don't immediately
      // re-trigger NPC interaction in the scene's update loop.
      const kb = this.scene && this.scene.input && this.scene.input.keyboard;
      if (kb) {
        Phaser.Input.Keyboard.JustDown(kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE));
        Phaser.Input.Keyboard.JustDown(kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER));
      }
      if (cb) cb(null);
    }
  }

  _showChoices (choices) {
    const scene  = this.scene;
    const startY = this._BOX_Y + 112;
    const PAD    = this._PAD + 10;

    // Remove the line-advance key handler so it doesn't interfere with choice input
    if (this._keyHandler) {
      window.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }

    let selected = 0;
    const highlight = (i) => {
      this._choices.forEach((b, j) => b.setColor(j === i ? '#F59E0B' : '#FFF8F0'));
      selected = i;
    };

    choices.forEach((choice, i) => {
      const btn = scene.add.text(PAD, startY + i * 28, `▸  ${choice.label}`, {
        fontFamily: "'Press Start 2P'",
        fontSize:   '10px',
        color:      '#FFF8F0',
        padding:    { x: 2, y: 2 },
      }).setInteractive({ useHandCursor: true }).setDepth(13).setScrollFactor(0);

      btn.on('pointerover', () => highlight(i));
      btn.on('pointerout',  () => btn.setColor(i === selected ? '#F59E0B' : '#FFF8F0'));
      btn.on('pointerdown', () => {
        highlight(i);
        // Disable all buttons immediately to prevent a second tap during the delay
        this._choices.forEach(b => b.disableInteractive());
        const value = choice.value;
        const cb    = this._onClose;
        // Brief pause so the gold highlight is visible before the box closes
        this.scene.time.delayedCall(330, () => {
          this.close();
          if (cb) cb(value);
        });
      });

      this._choices.push(btn);
    });

    highlight(0);  // pre-select first option

    // Arrow keys navigate, Enter/Space/E confirm, 1-N for direct pick
    this._numKeyHandler = (e) => {
      if (e.code === 'ArrowUp') {
        highlight((selected - 1 + choices.length) % choices.length);
        e.preventDefault();
      } else if (e.code === 'ArrowDown') {
        highlight((selected + 1) % choices.length);
        e.preventDefault();
      } else if (e.code === 'Enter' || e.code === 'Space') {
        const value = choices[selected].value;
        const cb    = this._onClose;
        this.close();
        const kb = this.scene && this.scene.input && this.scene.input.keyboard;
        if (kb) {
          Phaser.Input.Keyboard.JustDown(kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE));
          Phaser.Input.Keyboard.JustDown(kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER));
        }
        if (cb) cb(value);
      } else {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= choices.length) {
          const value = choices[n - 1].value;
          const cb    = this._onClose;
          this.close();
          if (cb) cb(value);
        }
      }
    };
    window.addEventListener('keydown', this._numKeyHandler);
  }

  _stopTyping () {
    if (this._typingTimer) {
      this._typingTimer.remove(false);
      this._typingTimer = null;
    }
  }

  _clearChoiceButtons () {
    this._choices.forEach(b => b.destroy());
    this._choices = [];
    if (this._numKeyHandler) {
      window.removeEventListener('keydown', this._numKeyHandler);
      this._numKeyHandler = null;
    }
  }
};
