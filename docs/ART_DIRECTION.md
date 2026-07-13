# ECHOFRAME: LAST SIGNAL

## Art Direction

**Document type:** Canonical art-direction specification  
**Status:** Phase 0 authoritative input  
**Target platform:** Desktop browser, 16:9 reference viewport, keyboard and mouse

---

## 1. Visual identity statement

ECHOFRAME should look like a **signal war occurring inside a damaged transmission system**.

It is not traditional cyberpunk. It is not a city. It is not neon decoration for its own sake. The visual language is built from:

- vector geometry;
- scanlines;
- waveform motion;
- phase offsets;
- interference patterns;
- signal traces;
- procedural glyphs;
- controlled chromatic separation;
- hard silhouettes;
- readable combat telegraphs.

The game world should feel abstract yet mechanically legible. Every visual effect must support one of three goals:

1. communicate gameplay state;
2. reinforce the Echo theme;
3. provide satisfying response.

If an effect reduces combat readability, it must be simplified or removed.

---

## 2. Overall style

### 2.1 Core aesthetic

The visual style is a fusion of:

- tactical holographic instrumentation;
- damaged signal-processing hardware;
- monochrome oscilloscope displays;
- geometric combat diagrams;
- restrained high-contrast neon;
- dark technical-space environments.

The game should resemble a highly designed diagnostic interface that has become a battlefield.

### 2.2 Shape language

Primary visual components:

- circles and arcs for signal zones;
- triangles and wedges for danger direction;
- line segments for vectors and replay paths;
- hexagonal and rectangular framing for system interfaces;
- rings for cooldowns and invulnerability;
- waveform ribbons for audio-signal identity;
- offset duplicate outlines for Echoes and hostile interference.

Avoid:

- organic fantasy ornamentation;
- painterly textures;
- realistic military assets;
- heavy skeuomorphism;
- overuse of particle clouds;
- excessively rounded mobile-app visual language.

---

## 3. Color system

### 3.1 Core palette

The exact implementation values may be adjusted for contrast, but the semantic color roles are fixed.

| Role | Color direction | Usage |
|---|---|---|
| Void background | Near-black blue-violet | Global background |
| World surface | Deep navy | Arena surfaces and panels |
| Player signal | Bright cyan | Player body, shots, aim line |
| Friendly Echo | Electric violet | Echo body, Echo shots, replay trace |
| Enemy default | Desaturated red-magenta | Enemy silhouettes and damage telegraphs |
| Elite accent | Orange-gold | Elite frames, modifier markers |
| Boss core | Saturated crimson with white center | Boss focal elements |
| Success state | Mint green | Unlocks, valid selections, successful gates |
| Warning state | Warm yellow | Caution, nearing cooldown, recovery prompts |
| Disabled state | Cool gray | Locked or unavailable controls |
| Text primary | Soft white-blue | Main labels and body text |
| Text secondary | Muted slate-blue | Supporting information |

### 3.2 Contrast rules

- Player and friendly Echo colors must never be reused for enemies.
- Elite markers must remain visible against both red-magenta and dark backgrounds.
- Boss telegraphs require shape differences, not color only.
- Important UI text must meet practical high-contrast readability standards.
- Reduced-flash mode may reduce intensity but must not remove state communication.
- High-contrast mode increases outline brightness and panel separation.

---

## 4. Background and arena rendering

### 4.1 Global background

The backdrop uses layered procedural elements:

1. solid near-black field;
2. large, faint gradient vignette;
3. very subtle scanlines;
4. sparse drifting signal particles;
5. low-opacity waveform bands;
6. occasional distant glitch pulses.

These layers must be extremely restrained during combat.

### 4.2 Arena surface

Each arena is a bounded geometric chamber displayed from above.

Required arena layers:

- outer boundary frame;
- inner playable floor;
- obstacle silhouettes;
- low-opacity grid or scanline system;
- chamber-specific decorative motifs;
- spawn markers;
- gate markers;
- recovery-state lighting changes.

### 4.3 Arena silhouettes

Arenas must be identifiable at a glance by broad geometry:

- Relay Chamber: segmented corridors and relay-node circles;
- Split Channel: divided lanes and narrow connection points;
- Crossline: intersecting horizontal and vertical combat bands;
- Interference Vault: inward pressure, dense pillars, central kill zone;
- Feedback Ring: circular outer flow with inner obstruction cluster;
- Dead Signal Grid: open field with isolated anchor nodes.

### 4.4 Obstacle readability

Obstacles must have:

- clear collision silhouette;
- stable world-space position;
- non-animated core geometry;
- edge highlight distinct from floor;
- no decorative particles crossing their collision boundaries.

Players should never mistake an obstacle for a background decoration.

---

## 5. Player visual design

### 5.1 Player silhouette

The Warden is represented by a compact, directional geometric form.

Recommended structure:

- central circle or hexagonal core;
- forward-facing wedge or double-line nose;
- rear stabilizer lines;
- rotating aim axis;
- subtle circular health ring;
- cyan edge glow;
- bright white-cyan core pulse.

The silhouette must make facing direction obvious.

### 5.2 Player motion

Movement effects:

- short trailing line fragments;
- subtle core stretch based on speed;
- acceleration pulse;
- deceleration settling glow;
- wall-contact spark line.

Avoid large smoke-like trails.

### 5.3 Dash visual

Dash presentation:

- immediate forward line burst;
- compressed afterimage trail;
- brief body elongation along dash vector;
- cyan ring contraction at dash start;
- white-cyan flash at dash end;
- reduced-flash alternative using outline expansion only.

### 5.4 Player damage

On damage:

- red-white outline pulse;
- brief chromatic offset;
- health ring decrement;
- directional impact wedge;
- restrained camera shake;
- optional damage number if enabled.

The player must remain visible throughout the effect.

---

## 6. Friendly Echo visual design

### 6.1 Echo body

The Echo is a recognizable copy of the player with altered rendering:

- violet color identity;
- semi-transparent interior;
- doubled outline offset by a few pixels;
- trailing replay line;
- slightly reduced scale or brightness;
- intermittent scanline dropout;
- no health ring unless an upgrade adds one.

The Echo must never be mistaken for the live player.

### 6.2 Replay trace

The Echo replay should leave a brief trace showing its remembered path.

Trace characteristics:

- thin violet line;
- fades over approximately 0.5 seconds;
- segmented at sample boundaries;
- slightly brighter at action events;
- does not persist indefinitely;
- reduced-particle mode shortens or removes the trace.

### 6.3 Echo deployment

Deployment effect:

1. violet ring opens around player;
2. recorded path flashes faintly;
3. Echo silhouette resolves from scanlines;
4. a short waveform pulse travels outward;
5. cooldown ring resets.

### 6.4 Echo dissolution

At replay end:

- body fragments into horizontal scanline segments;
- trace contracts toward final position;
- violet pulse fades;
- no explosive particle cloud.

### 6.5 Multiple friendly Echoes

If extra Echo upgrades are active:

- secondary Echoes use hue-adjacent violet variants;
- each Echo receives a small numeric glyph or line marker;
- all remain distinct from hostile Echoes.

---

## 7. Hostile Echo visual design

### 7.1 Identity

The hostile Echo is not merely a red clone.

Required differences:

- inverted color structure: dark body with hot crimson-white edges;
- heavier horizontal distortion;
- reverse-direction trace animation;
- unstable outline jitter;
- sharp triangular error glyphs;
- attack telegraphs in red-white interference bands.

### 7.2 Recorded-run implication

The hostile Echo should visibly imply that it is replaying something remembered:

- path trace appears before movement begins;
- action points briefly mark predicted shot locations;
- dead-time phase appears as a flickering gap;
- replay loop has a visible reset pulse.

### 7.3 Vulnerability phase

During dead time:

- body outline stabilizes;
- red interference reduces;
- center turns pale and exposed;
- vulnerability ring appears;
- path trace stops moving.

This must be visually obvious without text.

---

## 8. Enemy family art direction

### 8.1 Drifter

Shape:

- soft diamond or circular core;
- small rear fins;
- broad, gentle facing indicator.

Visual behavior:

- smooth translation;
- restrained pulsing;
- low-threat telegraphs.

### 8.2 Sentry

Shape:

- anchored square or hexagonal base;
- rotating central turret line;
- charge ring around the core.

Visual behavior:

- remains spatially stable;
- charge ring fills before firing;
- shot line flashes just before attack.

### 8.3 Skirmisher

Shape:

- narrow spearhead;
- lateral wing marks;
- short motion streaks.

Visual behavior:

- side-to-side motion;
- rapid directional shifts;
- flank angle indicated by small arc glyphs.

### 8.4 Bulwark

Shape:

- thick rectangular or shield-like front;
- smaller vulnerable rear core;
- segmented front plating.

Visual behavior:

- frontal plate glows when blocking;
- rear core pulses when exposed;
- rotation is deliberate and readable.

### 8.5 Anchor

Shape:

- central node with radiating connection lines;
- triangular support points;
- visible tether beams to allies.

Visual behavior:

- healing or buff links remain thin and clear;
- support pulses travel along links;
- support interruption produces a snapped-line effect.

### 8.6 Sniper

Shape:

- long narrow body;
- pronounced aiming line;
- compact firing core.

Visual behavior:

- long charge line;
- target marker at predicted impact point;
- immediate cooldown fade after shot.

### 8.7 Splitter

Shape:

- tri-lobed or segmented body;
- visible internal split seams.

Visual behavior:

- seams brighten near death;
- split event creates smaller, simplified silhouettes;
- spawned units are visually lighter than the original.

---

## 9. Elite visual treatment

Elite enemies retain base-family readability and receive a consistent elite frame.

Elite layers:

- orange-gold outer ring;
- small modifier glyph near health bar;
- brighter core;
- slightly thicker silhouette;
- restrained particle orbit;
- modifier-specific accent.

Modifier visuals:

### 9.1 Phase-Rush

- broken double outline;
- forward dash vector indicator;
- short teleport-like line collapse without actual teleporting.

### 9.2 Volatile

- unstable orange-red internal pulse;
- death-radius ring becomes visible shortly before death;
- explosion uses geometric shards, not smoke.

### 9.3 Bulwarked

- front-facing segmented arc;
- shield integrity indicated by arc brightness;
- rear core remains visible.

### 9.4 Regenerative

- green-gold inward particle flow;
- healing pulse circles;
- effect pauses visibly when regeneration is interrupted.

### 9.5 Duplicating

- faint offset ghost silhouette;
- duplication timer represented by orbiting split markers;
- spawned copy uses reduced elite frame intensity.

### 9.6 Frenzied

- faster internal waveform;
- motion lines increase as health decreases;
- strong but controlled hot-color shift.

---

## 10. Boss visual design

### 10.1 Boss silhouette

The boss should dominate the arena without becoming visually noisy.

Recommended structure:

- large central signal core;
- concentric broken rings;
- rotating interference arms;
- phase-dependent outer geometry;
- multiple telegraph emitters;
- bright exposed center during vulnerability.

### 10.2 Phase one

Visual theme: **signal acquisition**.

- stable core;
- clean ring rotation;
- broad sweep lines;
- moderate red-crimson glow.

### 10.3 Phase two

Visual theme: **interference escalation**.

- split outer ring;
- more aggressive chromatic offset;
- crossing telegraph bands;
- intermittent field distortion.

### 10.4 Phase three

Visual theme: **signal collapse**.

- fragmented ring geometry;
- bright white-crimson core;
- unstable waveform shell;
- rapid warning glyphs;
- stronger arena reaction.

### 10.5 Boss health display

Boss health uses:

- large top-center bar;
- segmented phase markers;
- phase-name caption;
- vulnerability status;
- no unnecessary numeric clutter unless accessibility mode requests it.

---

## 11. Projectile visual language

### 11.1 Player projectiles

- small cyan line or diamond;
- bright head, short tail;
- no heavy glow.

### 11.2 Echo projectiles

- violet twin-line form;
- slightly transparent;
- action-event pulse at spawn.

### 11.3 Enemy projectiles

- red-magenta with shape variation by family;
- Sentry: compact round pulse;
- Sniper: thin high-speed line;
- Splitter: branching shard;
- boss: phase-specific geometry.

### 11.4 Projectile contrast

Projectiles must remain readable at all arena backgrounds and quality settings.

---

## 12. HUD art direction

### 12.1 HUD philosophy

The HUD is a tactical signal monitor, not a decorative overlay.

It should be:

- minimal;
- high contrast;
- fixed in screen space;
- compact;
- readable during motion;
- consistent across viewport sizes.

### 12.2 HUD zones

Recommended layout:

Top-left:

- player health;
- dash status;
- Echo cooldown;
- active Echo count.

Top-center:

- chamber;
- encounter progress;
- boss health when relevant.

Top-right:

- score;
- combo;
- multiplier;
- challenge indicator.

Bottom-left:

- contextual hints;
- accessibility prompts;
- warning messages.

Bottom-right:

- upgrade summary;
- active temporary effects;
- seed indicator in debug mode only.

### 12.3 Health display

- segmented cyan bar;
- damage shown as brief delayed trailing segment;
- critical state uses shape pulse and sound, not color alone.

### 12.4 Echo status

Echo cooldown should be one of the strongest HUD elements.

Display:

- circular or horizontal cooldown meter;
- `READY` state;
- active Echo duration;
- extra Echo charges if upgraded;
- failure warning if replay data is unavailable.

### 12.5 Combo display

Combo presentation:

- multiplier is large and readable;
- meter decay is visible;
- threshold crossings create short waveform pulses;
- does not cover enemy telegraphs.

---

## 13. Menus and panels

### 13.1 Panel structure

Panels use:

- dark navy fill;
- thin cyan or slate border;
- angular corners;
- small decorative signal ticks;
- clear title hierarchy;
- consistent padding.

### 13.2 Focus state

Keyboard focus must be visually obvious.

Focused buttons receive:

- brighter border;
- left-side signal marker;
- slight horizontal offset;
- subtle audio cue.

Hover state may be lighter than keyboard focus but should remain consistent.

### 13.3 Disabled and locked states

- reduced contrast;
- lock glyph;
- explanatory subtext;
- no reliance on opacity alone.

---

## 14. Upgrade card art direction

Upgrade cards use:

- category color stripe;
- simple procedural glyph;
- readable name;
- concise description;
- stack count;
- rarity or unlock state if used;
- clear selected/focused frame.

Card categories:

- offense: cyan-white;
- Echo offense: violet;
- defense: mint;
- utility: yellow;
- high-risk or special: orange-red.

No external art is required. Glyphs are procedural combinations of:

- lines;
- arcs;
- triangles;
- circles;
- waveforms.

---

## 15. Results and archive presentation

### 15.1 Results screen

The results screen should feel like a recovered transmission report.

Elements:

- final score;
- survival result;
- boss result;
- longest combo;
- Echo performance;
- unlocks;
- recent records;
- restart and return actions.

Presentation uses:

- large central score;
- waveform summary line;
- signal-quality rating;
- compact statistics columns.

### 15.2 Run archive

The archive resembles a technical record database.

Each run entry includes:

- date;
- seed;
- difficulty;
- score;
- result;
- longest combo;
- prominent upgrades;
- hostile Echo availability marker.

---

## 16. Particle and effect guidelines

### 16.1 Particle budget

Particles must be pooled and bounded.

Use particles for:

- impacts;
- dash residue;
- Echo deploy/dissolve;
- elite death;
- boss phase changes;
- unlock celebration.

Do not use particles for:

- persistent ambient clutter;
- every movement frame;
- large opaque clouds;
- effects that hide projectiles.

### 16.2 Screen shake

Shake hierarchy:

- player hit: low;
- elite death: low to medium;
- boss heavy attack: medium;
- boss death: medium to high;
- no constant micro-shake.

Shake must respect accessibility settings.

### 16.3 Flashing

- avoid rapid full-screen flashes;
- reduced-flash mode replaces flashes with outline expansions and color holds;
- critical telegraphs use duration and shape, not flicker rate.

---

## 17. Accessibility visual rules

Required visual options:

- reduced screen shake;
- reduced flashes;
- reduced particles;
- high-contrast mode;
- damage numbers toggle;
- aim-line toggle;
- HUD opacity setting.

Accessibility settings must not alter simulation state.

High-contrast mode:

- brightens outline edges;
- increases obstacle separation;
- thickens projectile shapes;
- strengthens text panels;
- adds extra elite and boss markers.

Reduced-particle mode:

- shortens trails;
- reduces ambient particles;
- preserves hit confirmation;
- preserves Echo distinction.

---

## 18. Responsive layout rules

Reference design resolution:

- 1600×900.

Supported viewport strategy:

- scale the game canvas while preserving 16:9 content;
- letterbox when necessary;
- keep HUD within safe margins;
- reflow settings and archive panels at smaller desktop sizes;
- do not support mobile touch controls in Version 1.0.

Minimum target desktop viewport:

- 1024×576.

---

## 19. Procedural texture generation

All visual assets should be generated in code where practical.

Procedural assets include:

- player and Echo textures;
- enemy silhouettes;
- elite rings;
- boss rings and arms;
- projectiles;
- panel corners;
- upgrade glyphs;
- arena grid textures;
- signal particles;
- scanlines;
- waveform effects.

Generated textures must:

- have deterministic dimensions;
- be cached;
- avoid recreation every frame;
- be disposed only at application shutdown.

---

## 20. Animation timing guidelines

Recommended durations:

| Animation | Duration |
|---|---:|
| Button focus shift | 80–120 ms |
| Player hit flash | 100–160 ms |
| Dash body stretch | 80–120 ms |
| Echo deploy | 180–260 ms |
| Echo dissolve | 180–300 ms |
| Enemy spawn | 250–450 ms |
| Elite modifier pulse | 600–1000 ms cycle |
| Boss phase transition | 800–1400 ms |
| Upgrade card reveal | 120–180 ms stagger |
| Unlock reveal | 500–900 ms |

Animations should be brief, readable, and cancel safely on scene teardown.

---

## 21. Visual failure conditions

The art implementation fails if:

- player and Echo are difficult to distinguish;
- hostile Echo resembles friendly Echo too closely;
- projectiles disappear against the arena;
- elite modifiers are not readable;
- boss telegraphs are obscured by effects;
- HUD overlaps combat-critical space;
- reduced-flash mode removes necessary cues;
- viewport scaling hides controls;
- background decoration resembles collision geometry;
- procedural textures are regenerated repeatedly;
- particles are unbounded.

---

## 22. Target visual outcome

The final game should look like a polished, coherent, high-contrast signal-combat system.

The player should be able to identify, at a glance:

- themselves;
- friendly Echoes;
- hostile Echoes;
- enemy roles;
- elite modifiers;
- boss phase;
- Echo readiness;
- combo state;
- danger direction;
- recovery opportunity.

The art direction succeeds when the game feels distinctive without compromising mechanical readability.
