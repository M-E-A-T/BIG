s.waitForBoot {
    ~pitchDown  = Bus.control(s, 1);  // CC1
    ~pitchUp    = Bus.control(s, 1);  // CC2
    ~reverbMix  = Bus.control(s, 1);  // CC70
    ~delayFb    = Bus.control(s, 1);  // CC71
    ~tremoloRate = Bus.control(s, 1); // CC72
    ~hpfCutoff  = Bus.control(s, 1);  // CC73
    ~lpfCutoff  = Bus.control(s, 1);  // CC74
    ~resonance  = Bus.control(s, 1);  // CC75
    ~bitCrush   = Bus.control(s, 1);  // CC76
    ~chorus     = Bus.control(s, 1);  // CC77

    ~pitchDown.set(0);
    ~pitchUp.set(0);
    ~reverbMix.set(0);
    ~delayFb.set(0);
    ~tremoloRate.set(1);
    ~hpfCutoff.set(20);
    ~lpfCutoff.set(20000);
    ~resonance.set(0.5);
    ~bitCrush.set(24);
    ~chorus.set(0);

    SynthDef(\fxChain, {

        var in = SoundIn.ar(0);  // SoundIn.ar([0,1]) for stereo

        var pitchDown   = In.kr(~pitchDown);
        var pitchUp     = In.kr(~pitchUp);
        var reverbMix   = In.kr(~reverbMix);
        var delayFb     = In.kr(~delayFb);
        var tremoloRate = In.kr(~tremoloRate);
        var hpfCutoff   = In.kr(~hpfCutoff);
        var lpfCutoff   = In.kr(~lpfCutoff);
        var resonance   = In.kr(~resonance);
        var bitCrush    = In.kr(~bitCrush);
        var chorus      = In.kr(~chorus);

        var netSemitones = pitchUp - pitchDown;
        var pitched = PitchShift.ar(
            in,
            windowSize: 0.2,
            pitchRatio: netSemitones.midiratio,
            pitchDispersion: 0.0,
            timeDispersion: 0.001
        );

        var steps = (2 ** bitCrush).round;
        var crushed = (pitched * steps).round / steps;

        var hpRQ = resonance.linlin(0.1, 4.0, 1.0, 0.1);
        var hpFiltered = RHPF.ar(crushed, hpfCutoff.clip(20, 8000), hpRQ);

        var lpRQ = resonance.linlin(0.1, 4.0, 1.0, 0.1);
        var lpFiltered = RLPF.ar(hpFiltered, lpfCutoff.clip(200, 20000), lpRQ);

        var trem = SinOsc.kr(tremoloRate.clip(0.1, 20)).range(0.5, 1.0);
        var tremmed = lpFiltered * trem;

        var chorusDepth = chorus * 0.01;
        var chorusRate  = chorus * 3.0;
        var chorusLFO   = SinOsc.kr(chorusRate + 0.01);
        var chorused    = DelayC.ar(
            tremmed,
            maxdelaytime: 0.05,
            delaytime: (chorusLFO * chorusDepth) + 0.005
        );
        var chorusMix = XFade2.ar(tremmed, chorused, chorus.linlin(0, 1, -1, 1));

        var delayed = CombL.ar(
            chorusMix,
            maxdelaytime: 1.0,
            delaytime: 0.4,
            decaytime: delayFb.linlin(0, 1, 0.01, 8.0)
        );
        var delayMix = XFade2.ar(chorusMix, delayed, delayFb.linlin(0, 1, -1, 1));

        var verb = FreeVerb.ar(delayMix, mix: reverbMix, room: 0.7, damp: 0.4);

        Out.ar(0, verb ! 2);
    }).add;

    s.sync;

    ~fx = Synth(\fxChain);

    OSCdef(\ccHandler, { |msg|
        var cc  = msg[1].asInteger;
        var raw = msg[2].asFloat;
        switch(cc,
            1,  { ~pitchDown.set(raw.linlin(0, 127, 24, 0)) },
            2,  { ~pitchUp.set(raw.linlin(0, 127, 0, 24)) },
            70, { ~reverbMix.set(raw.linlin(0, 127, 0, 1)) },
            71, { ~delayFb.set(raw.linlin(0, 127, 0, 0.95)) },
            72, { ~tremoloRate.set(raw.linlin(0, 127, 0.1, 20)) },
            73, { ~hpfCutoff.set(raw.linexp(0, 127, 20, 8000)) },
            74, { ~lpfCutoff.set(raw.linexp(0, 127, 200, 20000)) },
            75, { ~resonance.set(raw.linlin(0, 127, 0.1, 4.0)) },
            76, { ~bitCrush.set(raw.linlin(0, 127, 24, 1)) },
            77, { ~chorus.set(raw.linlin(0, 127, 0, 1)) }
        );

    }, '/cc');
};
