# ECHOFRAME: LAST SIGNAL — Art Direction Specification

**Document:** `ART_DIRECTION.md`  
**Version:** 1.0-preproduction  
**Visual target:** Crisp geometric science fiction with restrained neon light, strong hierarchy, and mechanically meaningful motion  
**Primary production method:** Procedural Phaser graphics, generated vector-like shapes, reusable textures, transforms, masks, and bounded particles

---

# 1. Visual thesis

ECHOFRAME should resemble a defensive operating system transformed into a physical combat environment.

The visual identity combines:

- Dark orbital architecture.
- Precise geometric entities.
- Controlled emissive accents.
- Memory fragmentation.
- Temporal duplication.
- Minimal interface ornament.
- High combat legibility.

The game must not resemble:

- A generic neon particle demo.
- Random cyberpunk gradients.
- Inconsistent AI-generated sprites.
- A mobile game overloaded with interface chrome.
- A bullet-hell game where effects and damaging projectiles look identical.
- A glassmorphism dashboard placed over gameplay.

---

# 2. Core visual principles

## 2.1 Silhouette before detail

Every major entity must remain identifiable without color.

Required silhouettes:

- Player: symmetrical four-point diamond.
- Friendly Echo: related silhouette with segmented or missing pieces.
- Drifter: compact forward wedge.
- Sentry: anchored eye/tripod.
- Lancer: elongated spearhead.
- Shard Carrier: central hexagon with satellites.
- Bulwark: broad crescent shield.
- Suppressor: ring projector.
- Boss: architectural core with modular panels.
- Hostile copy: hooked or inverted temporal figure.

## 2.2 Color has semantic ownership

Hue families have fixed gameplay meanings. Decorative recoloring cannot violate those meanings.

## 2.3 Motion communicates state

Anticipation, tracking, lock, execution, recovery, vulnerability, and death each use distinct motion grammar.

## 2.4 Restraint creates quality

Most surfaces stay dark. Brightness is reserved for:

- Player location.
- Important telegraphs.
- Projectiles.
- Vulnerable targets.
- High-impact events.
- Keyboard focus.
- Results emphasis.

## 2.5 Readability overrides spectacle

Any effect that obscures hazards must be reduced, moved behind telegraphs, recolored, simplified, or removed.

---

# 3. Palette

## 3.1 Base palette

| Role | Hex | Usage |
|---|---|---|
| Void background | `#080B14` | Deepest backdrop |
| Secondary background | `#0D1320` | Architecture separation |
| Arena surface | `#182338` | Floor plates and panels |
| Surface highlight | `#263651` | Raised edges and borders |
| Player cyan | `#55E6FF` | Real player and stable friendly actions |
| Echo violet | `#9A82FF` | Friendly temporal projection |
| Danger red | `#FF4D67` | Hostile attacks and damage |
| Elite orange | `#FF9D45` | Elite and accelerated threat |
| Success mint | `#72F1B8` | Recovery, valid completion, victory |
| Warning yellow | `#FFD166` | Pending lock or caution |
| Primary text | `#EDF7FF` | Main labels |
| Muted text | `#8DA0B8` | Secondary labels |
| Disabled text | `#56657A` | Disabled controls |

## 3.2 Semantic rules

- Cyan is reserved for the real player, stable player actions, and primary UI focus.
- Violet is reserved for friendly Echoes and memory mechanics.
- Red means hostile and damaging.
- Orange means elite, overclocked, or advanced threat.
- Yellow means caution or pending lock, not direct damage.
- Mint means repair, completion, or victory.
- White is reserved for peak emphasis and player outline.
- Environment saturation stays below gameplay elements.

## 3.3 Colorblind safety

Hue distinctions are reinforced through:

- Border patterns.
- Shape.
- Pulse frequency.
- Arrowheads and chevrons.
- Icons.
- Audio.

No required distinction depends only on red/green or cyan/violet separation.

---

# 4. Value and contrast hierarchy

From darkest to brightest:

1. Far background.
2. Distant architecture.
3. Floor.
4. Decoration.
5. Enemy bodies.
6. Friendly bodies.
7. Projectiles.
8. Telegraph edges.
9. Impact cores.
10. Player outline and critical UI.

Rules:

- Decorative lines remain below 40% of player-core apparent brightness.
- Telegraphs may brighten at lock but remain geometrically thin.
- Full-screen white flashes are prohibited.
- Damage feedback cannot cover the screen in opaque red.
- The player outline must survive every intended effect combination.

---

# 5. Shape language

## 5.1 Friendly geometry

- Symmetrical.
- Even line weights.
- Circular cores.
- Four-way repetition.
- Smooth rotation.
- Open gaps.

## 5.2 Hostile geometry

- Angular.
- Asymmetrical or directionally biased.
- Heavier line weight.
- Sharp protrusions.
- Uneven pulse rhythms.
- Closed forms.

## 5.3 Temporal geometry

Memory effects use:

- Segmented outlines.
- Offset duplicate silhouettes.
- Horizontal scan fragments.
- Dissolving polygons.
- Delayed trails.
- Missing phase sections.

## 5.4 Environment geometry

- Large plates.
- Recessed seams.
- Sparse circuitry.
- Clear obstacle edges.
- No small bright circles that resemble projectiles.
- No decorative lines matching attack lanes.

---

# 6. Player visual specification

## 6.1 Construction

The Warden contains:

- Circular core.
- Four diamond fins.
- Thin aim nose.
- Outer white contour.
- Ground locator ring.

Approximate dimensions:

| Element | Size |
|---|---:|
| Visual diameter | 52–60 px |
| Physics diameter | 36 px |
| Ground ring | 64–72 px |

## 6.2 Idle

- Core scale breath: 1.5–2.5%.
- Fins move less than 2 px.
- Ground ring rotates slowly.
- No vertical bob that changes collision perception.

## 6.3 Movement

- Body leans 3–6° toward velocity.
- Rear trail length follows speed.
- Acceleration stretches rear geometry.
- Deceleration compresses trail.
- Aim nose follows aim independent of movement.

## 6.4 Firing

- Front fins recoil 2–4 px.
- Core brightness pulses briefly.
- Muzzle line lasts under 50 ms.
- Recoil does not affect physics.
- Repeated fire remains visually controlled.

## 6.5 Dash

- Body compresses for at most 40 ms of visual anticipation.
- Dash form becomes a cyan-white vector.
- Ground ring becomes a directional arc.
- Trail is continuous but not opaque.
- Invulnerability uses a clean contour rather than fading the player.
- Exit emits a small forward particle continuation.

## 6.6 Damage

- White core flash.
- Red edge pulse.
- Directional wedge toward source.
- Ground ring briefly breaks.
- Reduced-flash mode uses outline thickness, pattern, and vibration instead of brightness.

## 6.7 Death

- Core destabilizes.
- Fins separate.
- Ground ring collapses.
- Cyan moves toward white.
- Shape fragments.
- Duration: approximately 700–1100 ms.
- No gore or uncontrolled debris.

---

# 7. Friendly Echo

## 7.1 Identity

The Echo is related to the player but clearly distinct:

- Violet-cyan core.
- 55–70% opacity.
- Broken outline.
- Segmented ground ring.
- Two or three delayed ghost silhouettes.
- Mild scan displacement.
- Thin violet projectiles.

## 7.2 Spawn

- A faint historical path traces toward the replay start.
- Echo condenses at the replay start.
- Visual spawn lasts 80–140 ms.
- Gameplay playback begins immediately.
- No opaque flash.

## 7.3 Playback

- Exact body position follows recorded data.
- Ghost trail may lag for style.
- Dash creates a fragmented prism trail.
- Firing uses quieter recoil.
- Echo never displays damage reaction.

## 7.4 Dissolve

- Outline segments detach.
- Core becomes horizontal fragments.
- Opacity fades over 300 ms.
- Memory Burst adds a separate radial ring.

---

# 8. Hostile boss copy

The hostile recording is not a simple recolor.

Required:

- Red-black body.
- Hooked or inverted silhouette.
- Jagged trail.
- Solid hostile ground sigil.
- Distorted low audio.
- Red-shell/dark-core projectiles.
- Slightly mechanical movement interpolation.
- Warning marker before activation.

It must remain distinguishable from the friendly Echo in grayscale.

---

# 9. Enemy visual specifications

## 9.1 Shared rules

- Red hostile core.
- Orange elite accents.
- Collision body smaller than ornament.
- Attack state changes line weight, rhythm, or posture.
- Vulnerability opens geometry, not only color.
- Spawn uses floor glyph plus assembly.
- Death animation reflects role.

## 9.2 Drifter

Shape:

- Compact wedge.
- Two rear fins.
- Forward core.
- Low visual mass.

Motion:

- Smooth pursuit.
- Fins tighten before lunge.
- Wedge lane appears during anticipation.
- Miss leaves elongated exposed form.

Death:

- Splits along forward axis.

## 9.3 Sentry

Shape:

- Central eye.
- Three stabilizing arms.
- Circular firing aperture.

Motion:

- Arms plant while aiming.
- Aim line progresses dotted → segmented → solid.
- Lock closes eye ring.

Death:

- Arms fold inward.
- Core implodes.

## 9.4 Lancer

Shape:

- Long spear body.
- Rear stabilizers.
- Lane marker aligned with body.

Motion:

- Retracts during anticipation.
- Alignment snap at lock.
- Charge trail uses red with orange front edge.
- Recovery shows bent or embedded posture.

Death:

- Longitudinal fracture.

## 9.5 Shard Carrier

Shape:

- Hexagonal body.
- Three orbit tracks.
- Triangular satellites.

Motion:

- Slow central rotation.
- Orbit speed increases before release.
- Death sends shards along visible trajectories.

Hazards:

- Triangular floor marker.
- Inward-closing activation ring.

## 9.6 Bulwark

Shape:

- Broad crescent shield.
- Smaller rear core.
- Heavy visual mass.

Motion:

- Shield rotates with lag.
- Rear core opens during stagger.
- Blocked hits flatten against shield.

Death:

- Shield collapses first.
- Rear core fragments second.

## 9.7 Suppressor

Shape:

- Central ring.
- Four emitters.
- Floating inner core.

Field:

- Circular border.
- Repeating inward arrows.
- Faint interior scan distortion.
- Multiple fields do not multiply opacity.

Death:

- Ring fractures.
- Field collapses inward.

---

# 10. Elite modifier visuals

## 10.1 Overclocked

- Orange secondary lines.
- Faster trailing accents.
- Periodic heat pulse.
- Orange chevrons added to normal telegraph.

## 10.2 Replicating

- Mirrored split line.
- Copy assembles from one side.
- Parent and copy briefly show a linked symbol.
- Copy is visibly incomplete or dimmer.

## 10.3 Resonant

- Thin orange connection lines.
- Segmented orbital shield plates.
- Plates flare and close after an allied death.
- Plate decay shows remaining duration.

---

# 11. Boss art specification

## 11.1 Base form

The Null Architect is an arena-integrated machine:

- Black-red central core.
- Four modular panels.
- Rotating outer ring.
- Exposed apertures.
- Floor-connected circuitry.

Approximate visual diameter: 300–420 px.  
Minimum vulnerable target size: 40 px.

## 11.2 Phase 1: Observe

- Stable outer ring.
- Closed panels between vulnerability windows.
- Attack origins illuminate sequentially.
- Core aperture opens in white-red.

## 11.3 Phase 2: Imitate

- Ring segments.
- Violet memory motifs corrupt into red-black fragments.
- Copy spawn channels become visible.
- Recorded waveform moves around outer ring.

## 11.4 Phase 3: Delete

- Arena circuits darken by sector.
- Panels unfold.
- Rear targets become explicit.
- Ring rotates unevenly.
- Sector deletion uses thick boundaries and floor erosion, not only tint.

## 11.5 Destruction

1. Ring stops.
2. Panels desynchronize.
3. Core cracks white.
4. Red drains to black.
5. Cyan station lines reactivate.
6. Core fractures.
7. Background settles.

---

# 12. Arena art

## 12.1 Floor

- Dark matte plates.
- Large patterns, not noisy tiles.
- Clear walkable/solid distinction.
- Floor seams cannot resemble attack lines.
- Detail density decreases near important combat space.

## 12.2 Obstacles

- Heavier border than floor.
- Raised top surface.
- Collision matches visible shape.
- Consistent bevels.
- Decoration does not extend misleadingly beyond collision.

## 12.3 Background layers

1. Void gradient.
2. Distant orbital architecture.
3. Sparse slow stars.
4. Station framework.
5. Arena supports.

Movement remains subtle and does not distort aim perception.

## 12.4 Template identity

- Open circle: radial seams.
- Split pillars: paired monoliths.
- Four corners: corner reactors.
- Side channels: conduit trenches.
- Broken ring: interrupted radial architecture.
- Offset core: asymmetrical reactor.
- Twin islands: linked platforms.
- Boss chamber: integrated central machine.

## 12.5 Hazards

Hazards use:

- Defined border.
- Repeating motion.
- Countdown progression.
- Unique shape.
- Low-opacity interior.
- Clear active-state edge.

Decoration never shares the same pulse and border pattern.

---

# 13. Projectiles and telegraphs

## 13.1 Player projectile

- Cyan core.
- Small white front.
- Soft short tail.
- Minimal glow.

## 13.2 Echo projectile

- Violet center.
- Broken/doubled tail.
- Lower opacity.
- Same readable collision size.

## 13.3 Enemy projectile

- Red shell.
- Dark or orange center.
- Readable body larger than its exact collision radius.
- Glow cannot merge neighboring projectiles into a solid mass.

## 13.4 Boss projectile

Different behavior requires different geometry. Boss projectiles cannot be visually identical to normal projectiles when their collision or movement differs.

## 13.5 Telegraph phases

Anticipation:

- Dotted/segmented.
- Lower brightness.
- Assembling motion.

Tracking:

- Smoothly follows.
- Yellow caution accent.

Lock:

- Sharp pulse.
- Solid geometry.
- Audio tick.

Execution:

- Red/red-orange.
- Brief brightness peak.
- Geometry matches actual hit area.

Recovery:

- Attack geometry disappears.
- Enemy opens or dims.
- Vulnerable posture becomes visible.

---

# 14. Effects system

## 14.1 Effect tiers

### Tier 1: routine

- Standard shot.
- Minor hit.
- Movement trail.
- Normal enemy death.

### Tier 2: meaningful

- Critical.
- Dash.
- Echo deployment.
- Elite attack.
- Upgrade selection.

### Tier 3: major

- Elite destruction.
- Boss phase.
- Player death.
- Victory.
- Final boss destruction.

## 14.2 Particles

- Simple polygons, lines, and circles.
- Semantic color.
- Short lifetime.
- Directional motion.
- Global cap.
- Reduced mode lowers count but preserves core feedback.
- Particle sizes never resemble hostile projectiles.
- Emitters have explicit owners and cleanup.

## 14.3 Screen shake

- Directional where possible.
- Small for routine impacts.
- Strongest for player damage, elite death, and boss events.
- Global cap prevents stacking.
- User scale can reach zero.

## 14.4 Hitstop

- Normal enemy: usually none.
- Critical/heavy event: 15–30 ms.
- Elite death: 25–45 ms.
- Boss transitions: scripted.
- Repeated hitstop cannot create stutter.

## 14.5 Full-screen overlays

Allowed:

- Brief damage vignette.
- Scene fade.
- Boss phase pulse.
- Victory wash.

Forbidden:

- Continuous heavy bloom.
- Strong motion blur.
- Persistent chromatic aberration.
- Opaque red damage overlay.
- Constant full-screen scanlines.
- Random glitch spam.

---

# 15. UI visual system

## 15.1 Typography

Use a readable geometric sans-serif.

Requirements:

- Clear numerals.
- Distinct `1/I` and `0/O`.
- No stylized body text.
- Maximum one display family and one body family.
- Robust fallback stack.
- Legible at minimum viewport.

## 15.2 Type hierarchy

| Use | Size range |
|---|---:|
| Main title | 56–84 px |
| Major result | 44–60 px |
| Scene heading | 32–40 px |
| Upgrade title | 24–30 px |
| Body | 18–22 px |
| Secondary | 15–18 px |
| Debug | 12–14 px |

## 15.3 Panels

- Dark opaque surface.
- Thin cyan or muted border.
- Consistent 6–10 px radius or clipped corners.
- Minimal transparency over gameplay.
- No blur dependency.
- Focus adds bright border and directional markers.

## 15.4 Buttons

States:

- Default.
- Hover.
- Keyboard focus.
- Pressed.
- Disabled.
- Destructive.

Keyboard focus must be more obvious than mouse hover.

## 15.5 Upgrade cards

Each card includes:

- Category strip.
- Icon.
- Name.
- Current level.
- Exact values.
- Tactical sentence.
- Tags.
- Focus state.

Focus animation:

- Border emphasis.
- Less than 2% scale.
- Slight background lift.
- No large bounce.

## 15.6 HUD

- Low visual mass.
- No center-screen opaque panel.
- Cooldown arcs combine shape and fill.
- Health damage uses delayed trailing segment.
- Combo stays near score.
- Boss health appears only during boss.

---

# 16. Menu presentation

## 16.1 Main menu

- Slow orbital architecture.
- One looping Echo path.
- Sparse particles.
- No active enemies.
- Low contrast.
- Title remains dominant.

## 16.2 Transitions

Preferred:

- Horizontal memory wipe.
- Fragmented dissolve.
- Controlled fade.

Avoid:

- Random glitch noise.
- Excessive scan jumps.
- Frequent white flashes.

## 16.3 Results

Victory:

- Red recedes.
- Cyan and mint return.
- Calm background.

Defeat:

- Stable dark frame.
- No chaotic red flashing.

Score counting:

- Restrained pulse.
- Skippable.
- New unlock uses clear dedicated reveal.

---

# 17. Animation grammar

## 17.1 Anticipation

- Compress.
- Gather lines inward.
- Slow briefly.
- Increase pattern density.

## 17.2 Execution

- Expand sharply.
- Move in locked direction.
- Brighten edge.
- Emit short trail.

## 17.3 Recovery

- Open silhouette.
- Reduce brightness.
- Slow movement.
- Expose core.

## 17.4 Damage

- Brief deformation.
- Directional flash.
- Small recoil.
- No random spin unless death requires it.

## 17.5 Death by role

- Drifter: forward split.
- Sentry: inward fold.
- Lancer: axial fracture.
- Carrier: orbit collapse.
- Bulwark: shield collapse.
- Suppressor: field implosion.

---

# 18. Asset-production rules

## 18.1 Procedural-first assets

Create through code/vector descriptions:

- Player.
- Echo.
- Enemies.
- Projectiles.
- Upgrade icons.
- Arena walls.
- Floor motifs.
- Telegraphs.
- Particles.
- Portals.
- HUD symbols.

## 18.2 Raster use

Permitted for:

- Main-menu backdrop.
- Social preview.
- Repository banner.
- Optional loading art.
- Concept reference.

Raster sprites are not required for gameplay.

## 18.3 Texture quality

- Generate at correct size.
- Avoid unintended resampling blur.
- Select filtering intentionally.
- Tight transparent bounds.
- No visible seams.
- Use atlases only where beneficial.

## 18.4 Text policy

All readable text is rendered by the UI. Never embed generated text inside art assets.

---

# 19. Accessibility modes

## 19.1 Reduced flashes

- Replace brightness with outline, scale, and pattern.
- Cap full-screen luminance shifts.
- Preserve timing cues.

## 19.2 Reduced particles

- Reduce count by approximately 60%.
- Keep core hit confirmation.
- Keep all telegraphs.
- Keep player locator.

## 19.3 High contrast

- Stronger player outline.
- Darker environment.
- Projectile borders.
- Attack icons.
- Increased HUD separation.

## 19.4 Colorblind telegraphs

- Sentry: dotted-to-solid line with arrowhead.
- Lancer: rectangle with moving chevrons.
- Hazard: patterned border.
- Friendly Echo: segmented ring.
- Hostile copy: hooked sigil.

---

# 20. Visual performance constraints

- Maximum particles: 180.
- No more than two large translucent overlays.
- Pre-generate reusable textures.
- Reuse emitters.
- Limit blend modes.
- Keep telegraph geometry simple.
- Avoid complex Graphics paths per frame.
- Update ambient decoration at reduced frequency.
- Disable inactive visual systems.
- Preserve strict layer order.

---

# 21. Art acceptance criteria

The visual system passes when:

- Player is identifiable in grayscale.
- Friendly Echo and hostile copy are distinct in grayscale.
- Every enemy is recognizable by silhouette.
- Every attack has anticipation and lock cues.
- Decoration cannot be mistaken for danger.
- Solid collision matches visuals.
- Maximum intensity remains readable.
- Reduced-effects mode preserves all gameplay information.
- UI is legible at minimum viewport.
- Effects share one visual language.
- No generated image contains unreadable text.
- Every scene appears complete and related.

---

# 22. Art risk register

| Risk | Mitigation |
|---|---|
| Excessive neon glow | Reserve brightness, cap glow, test grayscale |
| Echo clutter | Lower opacity, fragmented trail, strict cap |
| Similar enemy silhouettes | Unique proportions and motion grammar |
| Procedural art looks primitive | Layered components, materials, animation discipline |
| Background competes | Low contrast and saturation |
| Particles hide attacks | Telegraphs above effects |
| UI looks generic | Custom geometry and strict type hierarchy |
| Hostile copy resembles friendly Echo | Separate silhouette, sigil, trail, sound, and projectile language |
