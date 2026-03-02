// These are just samples that you can use to craft your own reactive visuals
// You can do so much more with hydra, these barely touch the surface
// Only change runVisual()

function runVisual() {
  /* ========== Kaleidoscope count based on number of notes held and frequency based on last note played ========== */

  shape(4, () => avgVelocity / 500)
    .repeat(() => noteCount + 1, () => noteCount + 1)  // Grid size grows
    .modulateRotate(osc(10), () => avgVelocity / 127)
    .color(() => lastNote / 127, 0.8, 1)
    .out();
}

    /* ========== Shapes multiply with note count ========== */

//  shape(4, () => avgVelocity / 500)
//    .repeat(() => noteCount + 1, () => noteCount + 1)  // Grid size grows
//    .modulateRotate(osc(10), () => avgVelocity / 127)
//    .color(() => lastNote / 127, 0.8, 1)
//    .out();
//

    /* ========== Noise complexity increases with more notes ========== */

//  noise(() => noteCount + 1, 0.1)
//    .thresh(() => avgVelocity / 127, 0.04)
//    .modulateScale(osc(8), () => lastNote / 100)
//    .color(() => noteCount / 10, 0.3, 0.8)
//    .out();
//

    /* ========== Layered oscillators - intensity and count based on active notes ========== */

//  osc(() => lastNote / 10, 0.1, () => noteCount / 5)
//    .blend(osc(20, 0.05), () => avgVelocity / 127)
//    .modulateKaleid(osc(1), () => noteCount)
//    .out();
//

    /* ========== Voronoi-like effect that fragments with more notes ========== */

//  voronoi(() => noteCount * 2 + 1, 0.3)
//    .modulateScale(osc(8), () => avgVelocity / 127)
//    .color(() => lastNote / 127, 0.6, 0.9)
//    .out();
