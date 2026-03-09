/* ── NPC Data ───────────────────────────────────────────────────────────
   Shared NPC configurations used by Village and Interior scenes.
   mapKey: interior map JSON key (null = outdoor NPC in village world).
──────────────────────────────────────────────────────────────────────── */

window.GQ = window.GQ || {};

GQ.NPC_DATA = {

  // ── Indoor NPCs (entered via building doors) ──────────────────────

  LIBRARIAN: {
    texture:  'npc_librarian',
    mapKey:   'library-map',
    lines:    [
      "Welcome to the Scholar's Library!",
      'We have resources for all kinds of learners here.',
      'Are you looking to start something completely new, or build on what you already know?',
    ],
    choices: [
      { label: 'Start something new',  value: { key: 'level', val: 'beginner'    } },
      { label: 'Build on what I know', value: { key: 'level', val: 'experienced' } },
    ],
    postLine: 'Good! We have books and other resources here whenever you need them.',
  },

  CRAFTSPERSON: {
    texture:   'npc_artisan',
    mapKey:    'studio-map',
    craftRole: 'crafts',
    lines:     [
      'Welcome to the artisan quarter!',
      "I'm always looking to find kindred spirits.",
      'Tell me — do you fancy yourself someone who creates things? Drawing, writing, photography, that sort of craft?',
    ],
    choices: [
      { label: 'Yes, I love creating!', value: { key: 'creative_arts', val: true,  isInterest: true } },
      { label: 'Not really my thing',   value: { key: 'creative_arts', val: false, isInterest: true } },
    ],
  },

  HERMIT: {
    texture:  'npc_hermit',
    mapKey:   'tent-map',
    lines:    [
      'I live alone in the hills. No schedule, no obligations.',
      'I have as much time as I need to study my books.',
      'How do you prefer to learn?',
    ],
    choices: [
      { label: 'On my own, at my pace',     value: { key: 'structure', val: 'self-paced' } },
      { label: 'With a group',              value: { key: 'structure', val: 'cohort'     } },
      { label: 'One-on-one with a teacher', value: { key: 'structure', val: '1-on-1'     } },
    ],
    postLine: 'To each their own is my motto.',
  },

  'MARKET VENDOR': {
    texture:  'npc_vendor',
    mapKey:   'market-map',
    lines:    [
      "Ahh, a traveler! Come, come — I'd like your advice.",
      'I have two items that I just put out. Which do you think is a better value?',
      "THE RARE TOME — ancient knowledge. Powerful. Costs 45 gold (a tidy sum). Or THE OLD SCROLL — worn but imparts some useful wisdom. Won't cost you a coin. Which do you think is the better deal?",
    ],
    choices: [
      { label: 'The Rare Tome (45g) is worth it', value: { key: 'budget', val: 'any'  } },
      { label: 'The Old Scroll (Free) is enough', value: { key: 'budget', val: 'free' } },
    ],
    postLine: 'Interesting. Very interesting.',
  },

  'INN KEEPER': {
    texture:  'npc_inn_keeper',
    mapKey:   'inn-map',
    lines:    [
      'Running this inn taught me everything about business.',
      'Managing staff, keeping guests happy, turning a profit — it never stops.',
      'But alas, I am old with no heir.',
      'Tell me, do you have ambitions in business or career advancement?',
    ],
    choices: [
      { label: "Yes, that's my ambition", value: { key: 'business_career', val: true,  isInterest: true, postLine: 'If you ever decide that you want to run an inn, come back in a few years.' } },
      { label: "Not what I'm after",      value: { key: 'business_career', val: false, isInterest: true, postLine: 'No matter. I will eventually find someone to take on this very profitable inn.' } },
    ],
  },

  'GUILD MASTER': {
    texture:      'npc_guildmaster',
    mapKey:       'castle-map',
    isGuildMaster: true,
    lines:        ['...', '...'],
    choices:      null,
  },

  // ── Outdoor NPCs (placed directly in the village world) ──────────

  BARD: {
    texture:  'npc_bard',
    mapKey:   null,
    lines:    [
      'Ah, music! The language of the soul!',
      'I play the lute, the drums, the pipes — whatever calls to me.',
      'Does music speak to your heart? Playing, producing, any of it?',
    ],
    choices: [
      { label: 'Yes! Music is my passion', value: { key: 'music', val: true,  isInterest: true } },
      { label: 'Not really for me',        value: { key: 'music', val: false, isInterest: true } },
    ],
    postLine: 'For me, nothing can ever stop me from playing music. La-di-la-da!',
  },

  MASON: {
    texture:  'npc_mason',
    mapKey:   null,
    lines:    [
      "I've laid stone for thirty years with these hands.",
      'Woodworking, masonry, gardening, home crafts — real, tangible skills.',
      'You seem to understand me. Does hands-on trade work appeal to you?',
    ],
    choices: [
      { label: 'Yes, I love making things', value: { key: 'home_trade', val: true,  isInterest: true } },
      { label: 'Not my style',              value: { key: 'home_trade', val: false, isInterest: true } },
    ],
    postLine: 'It was nice speaking with you, but I must get back to work.',
  },

  BLACKSMITH: {
    texture:  'npc_blacksmith',
    mapKey:   null,
    lines:    [
      'I make the most advanced tools in the land by utilizing the latest technology — like this new anvil.',
      'Does the world of technology interest you, too?',
    ],
    choices: [
      { label: 'Yes, tech excites me!', value: { key: 'technology', val: true,  isInterest: true } },
      { label: 'Not really',            value: { key: 'technology', val: false, isInterest: true } },
    ],
    postLine: 'I refuse to be left behind. I was an early adopter of iron.',
  },

  TRAVELER: {
    texture:  'npc_blacksmith',
    mapKey:   null,
    lines:    [
      "I've wandered many lands, picked up languages along the way.",
      "There's nothing quite like speaking to someone in their own tongue.",
      'Have you ever thought about learning a new language?',
    ],
    choices: [
      { label: "Yes, I'd love to!",      value: { key: 'languages', val: true,  isInterest: true } },
      { label: 'Not really my interest', value: { key: 'languages', val: false, isInterest: true } },
    ],
    postLine: 'Ça c\'est bon.',
  },

};
