s0.initCam()
s1.initVideo("https://media.giphy.com/media/AS9LIFttYzkc0/giphy.mp4")

src(s1).blend(src(s0).modulateRepeat(osc(10), 1.0, 1.0, 1.5, 1.5),.4)
.saturate( () => Math.sin(time) * 30 )
.diff(voronoi(3,0.3,0.3))
.out()


s0.initCam()
s1.initVideo("https://media.giphy.com/media/AS9LIFttYzkc0/giphy.mp4")

src(s1).blend(src(s0).modulateRepeat(osc((ccValues[1]/5)), () => ccValues[5] / 64, () => ccValues[6] / 64, () => ccValues[7] / 64, 1.5),() => ccValues[4] / 127)
.saturate( () => Math.sin(time) * () => ccValues[2])
.diff(voronoi(() => 1 + (ccValues[0]/64),() => ccValues[3],() => ccValues[8]))
.out()


s0.initCam()
s1.initVideo("https://media.giphy.com/media/AS9LIFttYzkc0/giphy.mp4")


s0.initCam()
s1.initVideo("https://media.giphy.com/media/AS9LIFttYzkc0/giphy.mp4")

// -20,-8-20
src(s1).blend(src(s0)
              .modulateScale(src(s0),-1,2)
              .color(1,2,3)
).luma(0.5,0.1)
.colorama(1)

.out()
