// Pads (channel 9) → scene switch:
//   Pad 45 = effectPixelation
//   Pad 47 = effectCombo
//   Pad 48 = squareVoronoi
//   Pad 50 = scalation
//   Pad 52, 53, 55, 57 = global video switch
//
// Keys (channel 0) → image overlay:
//   Notes 0–24 (normalized via % 25) → images/image0.png … images/image24.png
//   Image appears bottom-right, ~10% screen size, baked into the Hydra pipeline

const padToEffect = {
  45: effectPixelation,
  47: effectCombo,
  48: squareVoronoi,
  50: scalation,
};

const padToVideo = {
  52: 'videos/dolphin.webm',
  53: 'videos/manatee.webm',
  55: 'videos/spoonbill.webm',
  57: 'videos/iguana.mp4',
};


const keyToImage = Object.fromEntries(
  Array.from({ length: 25 }, (_, i) => [i, `images/image${i}.png`])
);

window.currentVideo = 'videos/dolphin.webm';
window.currentImage = null;

// Always load a transparent 1x1 PNG into s2 on startup so the pipeline
// shape is constant — swapped out for real images on key press,
// restored on key release.
const TRANSPARENT_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
s2.initImage(TRANSPARENT_PNG);

// Blends s2 into the bottom-right corner (~10% size) and outputs.
// s2 is always present in the pipeline — transparent when no key is held.
function blendImageAndOut(chain) {
  const img = src(s2)
    .scale(0.1)
    .scroll(0.45, 0.45); // shift to bottom-right corner

  chain
    .layer(img)
    .out();
}

function effectPixelation() {
  s1.initVideo(window.currentVideo);

  const pattern = osc(
    () => 10 + (ccValues[0] / 127) * 50,
    0.01,
    1
  )
    .mult(
      osc(
        () => 10 + (ccValues[1] / 127) * 30,
        -0.1,
        1
      )
        .modulate(
          noise(
            () => 1 + (ccValues[2] / 127) * 5,
            1
          )
        )
        .rotate(0.7)
    )
    .posterize(
      () => Math.max(2, 2 + Math.round(ccValues[3] / 127) * 8),
      1
    )
    .modulateRotate(
      src(o0),
      () => (ccValues[4] / 127) * 0.03
    );

  const camera = src(s0)
    .mult(pattern);

  const alligator = src(s1)
    .blend(camera, 0.5);

  blendImageAndOut(
    alligator
      .saturate(() => ccValues[5] / 63)
      .colorama(() => ccValues[6] / 254)
      .color(
        () => 1 + (0.5 - ccValues[7] / 127),
        1,
        () => 1 + (ccValues[7] / 127 - 0.5)
      )
      .brightness(() => -0.3 + (ccValues[4] / 127) * 0.6)
  );
}

function effectCombo() {
  s1.initVideo(window.currentVideo);

  const camera = src(s0)
    .posterize(
      () => Math.max(2, 2 + Math.round(ccValues[0] / 20) - noteCount),
      () => Math.max(0.5, avgVelocity / 127)
    )
    .modulateRotate(osc(10), () => (ccValues[1] / 127) + (noteCount * 0.05))
    .colorama(() => (ccValues[2] / 254) + (noteCount * 0.02))
    .contrast(() => 1 + (ccValues[3] / 127) + (noteCount * 0.1));

  const gif = src(s1)
    .posterize(
      () => Math.max(2, 2 + Math.round(ccValues[5] / 20) - noteCount),
      () => Math.max(0.5, avgVelocity / 127)
    )
    .modulateRotate(osc(10), () => (ccValues[6] / 127) + (noteCount * 0.05))
    .colorama(() => (ccValues[7] / 254) + (noteCount * 0.02));

  blendImageAndOut(
    camera
      .blend(gif, 0.5)
      .brightness(() => -0.3 + (ccValues[4] / 127) * 0.6)
  );
}

function squareVoronoi() {
  s1.initVideo(window.currentVideo);

  blendImageAndOut(
    src(s1).blend(
      src(s0).modulateRepeat(
        osc(() => ccValues[0] / 6),
        () => ccValues[1] / 64,
        () => ccValues[2] / 64,
        () => ccValues[3] / 64,
        () => ccValues[5] / 64
      ),
      0.6
    )
    .saturate(() => Math.sin(time) * (ccValues[6] / 4))
    .diff(voronoi(
      () => ccValues[7] / 42,
      () => ccValues[8] / 127,
      0.3
    ))
    .brightness(() => -0.3 + (ccValues[4] / 127) * 0.6)
  );
}

function scalation() {
  s0.initCam();
  s1.initVideo(window.currentVideo);

  blendImageAndOut(
    src(s1).blend(src(s0)
      .modulateScale(src(s0),
        () => -20 + (ccValues[0] / 127) * 22,
        () => -8 + (ccValues[1] / 127) * 28)
      .color(
        () => (ccValues[2] / 127) * 1.5,
        () => (ccValues[3] / 127) * 1.5,
        () => (ccValues[4] / 127) * 1.5)
    )
      .hue(() => 1 + (0.5 - ccValues[5] / 127))
      .saturate(() => 1 + (0.5 - ccValues[6] / 127))
      .colorama(() => 1 + (0.5 - ccValues[7] / 127))
  );
}

function runVisual() {
  effectPixelation();

  const ws = new WebSocket(`ws://localhost:${window.wsPort}`);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // Pads (channel 9): video switching and effect switching
    if (data.channel === 9 && data.type === 'note_on' && data.velocity > 0) {
      const videoPath = padToVideo[data.note];
      if (videoPath) {
        window.currentVideo = videoPath;
        s1.initVideo(videoPath);
      }

      const fn = padToEffect[data.note];
      if (fn) fn();
    }

    // Keys (channel 0): image overlay, normalized across octaves via % 25
    if (data.channel === 0) {
      const normalizedNote = data.note % 25;
      const imagePath = keyToImage[normalizedNote];

      if (data.type === 'note_on' && data.velocity > 0) {
        window.currentImage = imagePath;
        s2.initImage(imagePath);
      } else if (data.type === 'note_off' || (data.type === 'note_on' && data.velocity === 0)) {
        window.currentImage = null;
        s2.initImage(TRANSPARENT_PNG);
      }
    }
  };
}
