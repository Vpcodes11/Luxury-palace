# Film 02 dusk lighting references

These nine lighting references were edited with the built-in image-generation tool from the finalized Film 02 frames (0, 10, 20, 30, 40, 50, 60, 70, 79). Frame 0 establishes the look; subsequent edits use it as their lighting reference.

Prompt: Relight the exact source camera frame to elegant blue-hour dusk. Preserve its camera, framing, architecture, columns, doors, trees, stone, furniture, horizon, pool geometry and foreground occlusions. Use dark cool slate-blue ambient light, readable limestone, golden-amber existing interior lamps, gentle spill onto nearby steps and stone, and restrained pool reflections. Add no objects, fixtures, stars, moon, text, people, excessive bloom or haze.

The generated references are **lighting inputs**, not replacement animation frames. The build transfers only their low-frequency illumination onto the original 1920 × 1080 source frames. Motion matching against the original source tracks lighting through camera movement; original texture and geometry remain intact. The complete 41-frame treatment is baked before WebP export, including the initial poster and mobile crops. No live filters or lighting layers run during scrolling.

Original daylight sources remain in `public/hero-film-02-architecture`. The current experiment interpolates exposure from daylight to the approved dusk treatment in log space, with quintic easing from 8% to 86% of the camera sequence. The same 41 frames and responsive crops carry both lighting states; reversing scroll returns to daylight. Runtime outputs use the separate `hero-film-02-architecture-day-night-v1` namespace to avoid reusing cached frames. Film 02 remains the sole homepage animation.

The approved all-evening release remains in Git at commit `194228d`, using `hero-film-02-architecture-dusk-v1`. Reverting the experiment commit and rebuilding restores that appearance and its original preloads/checks. The lighting reference files are shared unchanged between both treatments.
