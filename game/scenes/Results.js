/* ── Results Scene ─────────────────────────────────────────────────────
   Populates the HTML results overlay with skill cards and handles
   prev / next navigation.
──────────────────────────────────────────────────────────────────────── */

window.GQ = window.GQ || {};

const CAT_LABELS = {
  creative_arts:     'CREATIVE ARTS',
  lifestyle_hobbies: 'LIFESTYLE',
  languages:         'LANGUAGES',
  technology:        'TECHNOLOGY',
  business_career:   'BUSINESS',
  home_trade:        'HOME & TRADE',
  music:             'MUSIC',
};

GQ.Results = class Results extends Phaser.Scene {

  constructor () { super({ key: 'Results' }); }

  init (data) {
    this._results = data.results || [];
    this._idx     = 0;
  }

  create () {
    const W = this.scale.width;
    const H = this.scale.height;

    const bg = this.add.graphics();
    bg.fillStyle(0x0d0a0e);
    bg.fillRect(0, 0, W, H);

    if (!this._results.length) {
      this.scene.start('CharacterCreate');
      return;
    }

    this._render();

    document.getElementById('result-prev').onclick = () => {
      if (this._idx > 0) { this._idx--; this._render(); }
    };
    document.getElementById('result-next').onclick = () => {
      if (this._idx < this._results.length - 1) { this._idx++; this._render(); }
    };
    document.getElementById('play-again').onclick = () => {
      document.getElementById('results').classList.add('hidden');
      window.GQ.profile    = null;
      window.GQ.completed  = null;
      window.GQ.dismissed  = null;
      window.GQ.controlsDismissed = false;
      this.scene.start('CharacterCreate');
    };

    this.time.delayedCall(300, () => {
      document.getElementById('results').classList.remove('hidden');
    });
  }

  _render () {
    const { skill, resources, matchedCats, paidFallback, filters, skillUrl } = this._results[this._idx];
    const total = this._results.length;

    // Counter
    document.getElementById('result-counter').textContent = `${this._idx + 1} / ${total}`;

    // Icon + name
    document.getElementById('result-icon').textContent  = skill.icon;
    document.getElementById('result-skill').textContent = skill.name.toUpperCase();

    // Category tags
    document.getElementById('result-cats').innerHTML =
      matchedCats.map(c => `<span class="badge badge-cat">${CAT_LABELS[c] || c}</span>`).join('');

    // Paid fallback note
    const paidNote = document.getElementById('result-paid-note');
    paidNote.style.display = paidFallback ? 'block' : 'none';

    // Suggested filters note
    const filterNote = document.getElementById('result-filter-note');
    if (filters && filters.length) {
      filterNote.textContent = `💡 On the site, filter by: ${filters.join(' · ')}`;
      filterNote.style.display = 'block';
    } else {
      filterNote.style.display = 'none';
    }

    // Resources
    const container = document.getElementById('result-resources');
    container.innerHTML = '';
    resources.forEach(r => {
      const item = document.createElement('a');
      item.className = 'resource-item';
      item.href   = `https://www.skillguild.co/skills/${skill.slug}/${r.slug}`;
      item.target = '_blank';
      item.rel    = 'noopener';
      item.innerHTML = `
        <div>
          <div class="resource-name">${r.name}</div>
          <div class="resource-provider">${r.provider}</div>
        </div>
        <div class="resource-meta">
          <span class="badge badge-format">${r.format.toUpperCase()}</span>
          <span class="badge badge-cost">${r.costLabel}</span>
        </div>
      `;
      container.appendChild(item);
    });

    // Link
    const link = document.getElementById('result-link');
    link.href        = skillUrl;
    link.textContent = `EXPLORE ${skill.name.toUpperCase()} ON GUILD →`;

    // Nav button state
    document.getElementById('result-prev').disabled = this._idx === 0;
    document.getElementById('result-next').disabled = this._idx === total - 1;
  }
};
