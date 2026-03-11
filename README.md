# Guild Quest

A pixel-art RPG that guides players toward their next learning opportunity. Players explore a village, talk to NPCs to build a profile of their interests and preferences, then receive personalized skill recommendations.

Built with [Phaser 3](https://phaser.io/) — no build tools, no bundler, just HTML/JS/CSS served as static files.

---

## How to Play

1. Enter your name and choose a hero on the opening screen
2. Explore the village and talk to every NPC
3. Each conversation reveals something about your learning style, interests, and budget
4. Once all 9 NPCs have been visited, the Guild Master unlocks
5. The Guild Master sends you to the Results screen with your top skill matches

**Controls**

| Desktop | Mobile |
|---|---|
| Arrow keys / WASD — move | Tap where you want to go |
| Space / Enter — interact | Tap an NPC when nearby to talk |
| Arrow keys — navigate choices | Tap a choice to select |

---

## Local Development

Node.js is required. Python is not installed on the dev machine.

```bash
npx serve .
```

Open `http://localhost:3000` in a browser. The game loads directly — no build step needed.

> **Tiled map editing note:** Stop the dev server before saving `.tmj` files in Tiled. The server holds a file lock that prevents Tiled from writing. Start the server again after saving.

---

## Project Structure

```
guild-quest/
├── index.html              # Entry point — HTML overlays for char creation & results
├── style.css               # All styles
├── game/
│   ├── main.js             # Phaser config — switches between RESIZE (mobile) and FIT (desktop)
│   ├── data/
│   │   ├── audio.js        # GQ.Audio — HTML5 audio manager (plays through iOS speakers)
│   │   ├── npcs.js         # NPC dialogue, choices, and map assignments
│   │   ├── recommend.js    # Scoring engine — matches profile to skills
│   │   └── skills.js       # Skill definitions and starter resources
│   ├── objects/
│   │   └── DialogueBox.js  # Reusable 8-bit dialogue box with typing animation
│   └── scenes/
│       ├── Preload.js      # Asset loading + procedural sprite generation
│       ├── CharacterCreate.js  # Name + hero selection overlay
│       ├── Village.js      # Overworld — player movement, NPC interaction, doors
│       ├── Interior.js     # Interior rooms — rendered from Tiled .tmj files
│       ├── GuildMaster.js  # Transition scene before results
│       └── Results.js      # Skill recommendations display
├── assets/
│   ├── audio/              # .ogg music tracks
│   ├── kenney_tiny-town/   # Tileset images (tilemap_packed.png, tilemap.png)
│   ├── kenney_roguelike-characters/  # Character spritesheet
│   └── kenney_roguelike-rpg-pack/    # Environment spritesheet
├── *.tmj                   # Tiled map files (village + 6 interiors)
└── char-picker.html        # Visual tool for building character sprite layer combos
```

---

## Editing NPC Dialogue

All NPC configuration lives in `game/data/npcs.js`. Each entry looks like:

```javascript
HERMIT: {
  texture:  'npc_hermit',   // sprite key defined in Preload.js CHAR_FRAMES
  mapKey:   'tent-map',     // null for outdoor NPCs
  lines:    ['Line 1', 'Line 2', 'Final line before choices'],
  choices: [
    { label: 'Option A', value: { key: 'structure', val: 'self-paced' } },
    { label: 'Option B', value: { key: 'structure', val: 'cohort'     } },
  ],
  postLine: 'Text shown after the player picks an option.',
},
```

**Profile keys set by NPCs:**

| NPC | Profile key |
|---|---|
| Market Vendor | `budget` (`'free'` or `'any'`) |
| Hermit | `structure` (`'self-paced'`, `'cohort'`, `'1-on-1'`) |
| Librarian | `level` (`'beginner'`, `'experienced'`) |
| Craftsperson | `interests.creative_arts`, `interests.lifestyle_hobbies` |
| Traveler | `interests.languages` |
| Blacksmith | `interests.technology` |
| Inn Keeper | `interests.business_career` |
| Mason | `interests.home_trade` |
| Bard | `interests.music` |

Outdoor NPCs (Bard, Mason, Blacksmith, Traveler) have `mapKey: null` — they are placed directly in the village scene via `Village.js`.

---

## Adding or Editing Skills

Skills are defined in `game/data/skills.js`. Each skill looks like:

```javascript
{
  slug:       'guitar',
  name:       'Guitar',
  icon:       '🎸',
  categories: ['music', 'creative_arts'],   // matches profile interest keys
  budget:     'any',                        // 'free' or 'any'
  commitment: 'moderate',                   // 'light' | 'moderate' | 'intensive'
  structure:  'self-paced',
  goals:      ['hobby', 'exploration'],
  resources: [
    {
      slug:       'justinguitar-online-courses',
      name:       'Justin Guitar',
      provider:   'Justin Guitar',
      costLabel:  'Free',
      costValue:  0,       // 0 = free; higher numbers deprioritized for budget:'free' users
      format:     'Online',
      structure:  'self-paced',
      commitment: 'light',
    },
  ],
},
```

The recommendation engine in `game/data/recommend.js` scores skills against the player's profile and returns the top matches.

---

## Editing Characters

Open `char-picker.html` in a browser (with the dev server running) to visually browse and layer frames from the roguelike character spritesheet. Once you've built a character you like, copy the frame ID array and paste it into `CHAR_FRAMES` in `game/scenes/Preload.js`:

```javascript
static get CHAR_FRAMES () {
  return {
    hero_1: [108, 115, 73, 139, 200],  // frame IDs, drawn bottom-to-top
    ...
  };
}
```

---

## Tiled Maps

Interior rooms are authored in [Tiled](https://www.mapeditor.org/) and saved as `.tmj` files in the project root.

**Tilesets in use:**

| Tileset | File | Spacing |
|---|---|---|
| tiny-town (packed) | `tilemap_packed.png` | No spacing |
| tiny-town (spaced) | `tilemap.png` | 1px spacing |
| roguelike-rpg-pack | `roguelikeSheet_transparent.png` | 1px spacing |

The interior renderer (`Interior.js → _drawMap`) supports H/V/diagonal tile flipping as exported by Tiled.

Each interior map should have:
- One or more **tile layers** for the visual room
- An **object layer named `collision`** with rectangles marking impassable areas
- An **object layer named `npc`** with a single point marking where the NPC stands

---

## Deployment

The repo is connected to [Vercel](https://vercel.com) via GitHub. Pushing to `master` triggers an automatic deploy.

```bash
git push origin master
```

No build command or output directory configuration needed — Vercel serves the repo root as a static site.

---

## Credits

- **Music:** [Generic 8-bit JRPG Soundtrack](https://opengameart.org/content/generic-8-bit-jrpg-soundtrack) by AVGVSTA — CC-BY 4.0
- **Tilesets:** [Kenney Tiny Town](https://kenney.nl/assets/tiny-town) and [Kenney Roguelike RPG Pack](https://kenney.nl/assets/roguelike-rpg-pack) — CC0
- **Characters:** [Kenney Roguelike Characters](https://kenney.nl/assets/roguelike-characters) — CC0
