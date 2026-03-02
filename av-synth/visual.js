// These are just samples that you can use to craft your own reactive visuals
// You can do so much more with hydra, these barely touch the surface
// Only change runVisual()

// 1. Kaleidoscope with rotation
function runVisual() {
  src(s0)
    .kaleid(() => Math.max(1, noteCount))
    .rotate(() => avgVelocity / 500)
    .color(() => avgVelocity / 127, 0.5, 1)
    .out();
}

// 2. Pixelation
function runVisual() {
  src(s0)
    .pixelate(() => 32 - (noteCount * 4), () => 32 - (noteCount * 4))
    .color(() => lastNote / 127, 0.8, 1)
    .out();
}

// 3. Color shift
function runVisual() {
  src(s0)
    .colorama(() => avgVelocity / 100)
    .saturate(() => 1 + (noteCount / 3))
    .out();
}

// 4. Feedback loop
function runVisual() {
  src(s0)
    .scale(() => 1 + (avgVelocity / 500))
    .rotate(() => noteCount / 100)
    .blend(o0, 0.9)
    .out();
}

// 5. Edge detection
function runVisual() {
  src(s0)
    .thresh(() => 0.5 - (avgVelocity / 255), 0.04)
    .invert(() => noteCount / 10)
    .color(() => lastNote / 127, 0.8, 1)
    .out();
}

// 6. Posterize
function runVisual() {
  src(s0)
    .posterize(() => 3 + noteCount, () => avgVelocity / 127)
    .saturate(2)
    .out();
}

// 7. Modulate with oscillators
function runVisual() {
  src(s0)
    .modulateScale(osc(8), () => avgVelocity / 127)
    .modulateRotate(osc(4), () => noteCount / 10)
    .out();
}

// 8. Blend with generative patterns
function runVisual() {
  src(s0)
    .blend(
      osc(() => lastNote / 10, 0.1, () => avgVelocity / 127)
        .kaleid(4),
      () => noteCount / 10
    )
    .out();
}

// 9. Scrolling/displacement
function runVisual() {
  src(s0)
    .scroll(() => Math.sin(time * noteCount) / 20, () => Math.cos(time * noteCount) / 20)
    .modulateHue(osc(10), () => avgVelocity / 127)
    .out();
}

// 10. Invert colors
function runVisual() {
  src(s0)
    .invert(() => noteCount / 5)
    .contrast(() => 1 + (avgVelocity / 127))
    .kaleid(() => noteCount + 1)
    .out();
}

// 11. Contrast boost
function runVisual() {
  src(s0)
    .contrast(() => 1.5 + (avgVelocity / 100))
    .brightness(() => -0.1 + (noteCount / 50))
    .saturate(() => 1 + (noteCount / 5))
    .out();
}

// 12. Glitch/shift
function runVisual() {
  src(s0)
    .shift(0.1, () => avgVelocity / 500, 0.1, () => -avgVelocity / 500)
    .pixelate(() => 16 + (noteCount * 8), () => 16 + (noteCount * 8))
    .out();
}

// 13. Mirror/repeat
function runVisual() {
  src(s0)
    .repeat(() => noteCount + 1, () => noteCount + 1)
    .modulateRotate(osc(10), () => avgVelocity / 200)
    .out();
}

// 14. Voronoi modulation
function runVisual() {
  src(s0)
    .modulateKaleid(voronoi(() => noteCount * 2 + 1, 0.3), () => avgVelocity / 127)
    .color(() => lastNote / 127, 0.6, 0.9)
    .out();
}

// 15. Hue shift
function runVisual() {
  src(s0)
    .hue(() => lastNote / 127)
    .saturate(() => 1 + (avgVelocity / 100))
    .kaleid(() => noteCount + 1)
    .out();
}

// 16. Extreme kaleidoscope
function runVisual() {
  src(s0)
    .kaleid(() => noteCount * 2 + 2)
    .scale(() => 0.8 + (avgVelocity / 500))
    .rotate(() => time * avgVelocity / 100)
    .out();
}

// 17. Luma key (threshold)
function runVisual() {
  src(s0)
    .luma(() => avgVelocity / 227, 0.1)
    .invert()
    .color(() => lastNote / 147, 1, 1.5)
    .out();
}

// 18. Blend with noise
function runVisual() {
 src(s0)
   .blend(noise(() => noteCount + 2), () => avgVelocity / 200)
   .contrast(1.5)
   .out();
}

// 19. Modulate scale (zoom)
function runVisual() {
  src(s0)
    .modulateScale(osc(8), () => avgVelocity / 100)
    .kaleid(() => noteCount + 1)
    .color(() => lastNote / 127, 0.7, 1)
    .out();
}

// 20. combo
function runVisual() {
  src(s0)
    .posterize(() => 4 + noteCount, () => Math.max(0.5, avgVelocity / 127))
    .modulateRotate(osc(10), () => avgVelocity / 200)
    .colorama(() => lastNote / 127)
    .contrast(1.3)
    .out();
}
