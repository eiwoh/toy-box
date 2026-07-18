# Oscar's Toy Box 🧸

A click-to-reveal game site for toddlers. No dependencies, no build step.

## Run it

```sh
node server.js
```

Then open **http://localhost:4321** — on an iPad/phone on the same wifi, use
`http://<your-mac-ip>:4321` and add it to the home screen for a fullscreen feel.

## Play modes

- **🙈 Peekaboo!** — flip cards to reveal an animal; it cheers, says the
  animal's name out loud, and flips back with a new animal so it never ends.
- **🎈 Balloon Pop** — balloons (and the odd fish, bee, or octopus) drift up;
  tap to pop them in a shower of confetti.
- **🚪 Little Doors** — open a door, find a friend behind it. Doors close on
  their own and hide someone new.
- **✨ Magic Taps** — a night sky; every tap bursts into stars anywhere on
  screen. Zero rules, maximum delight.
- **🌈 Colors** — a grid of big colored blobs. Tap one and it says the color's
  name out loud with matching confetti, then quietly becomes a new color so it
  never runs out.
- **🌧️ Rain Catcher** — raindrops (and the odd apple, star, or ladybug) tumble
  down from the sky toward a friendly basket; tap them to catch them with a
  watery splash before they land.

The small 🏠 button (top-left) goes back to the menu — kept small on purpose
so little fingers don't hit it by accident.

All sounds are synthesized in the browser (Web Audio), and animal names are
spoken with the built-in speech synthesizer — there are no audio files.
