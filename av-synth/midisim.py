# MPK Mini simulator — use if you don't have a physical MIDI device.
# Requires a virtual MIDI device to be set up first.
#
# Layout:
#   Notes (channel 0 / ch1):
#     A=48, S=49, D=50, F=51, G=52, H=53, J=54, K=55, L=56
#     (chromatic scale, no special effect switching)
#
#   Pads (channel 9 / ch10):
#     Z=45, X=47, C=48, V=50, B=52, N=53, M=55, ,=57
#     (triggers scene changes in visual.js)
#
#   Knobs (CC70-77):
#     Keys 1-8 select knob, UP/DOWN arrows adjust by 5
#
#   Mod wheel (CC1):
#     Key 9 selects it, UP/DOWN arrows adjust by 5

import mido
import sys
from pynput import keyboard

pressed_keys = {}
active_notes = set()
active_pads = set()

selected_cc = 70
cc_values = {}
for cc in [1] + list(range(70, 78)):
    cc_values[cc] = 0

def index_to_cc(index):
    if index == 9:
        return 1
    return 69 + index  # 1→70, 2→71 ... 8→77

key_to_note = {
    'a': 48,
    's': 49,
    'd': 50,
    'f': 51,
    'g': 52,
    'h': 53,
    'j': 54,
    'k': 55,
    'l': 56,
}

key_to_pad = {
    'z': 45,
    'x': 47,
    'c': 48,
    'v': 50,
    'b': 52,
    'n': 53,
    'm': 55,
    ',': 57,
}

outport = None

def list_outputs():
    outputs = mido.get_output_names()
    if not outputs:
        print("No MIDI output devices found")
        sys.exit(1)

    print("\nAvailable MIDI outputs:")
    for i, name in enumerate(outputs):
        print(f"  {i}: {name}")
    return outputs

def select_output(outputs):
    while True:
        try:
            choice = input("\nSelect MIDI output number (or press Enter for device 0): ").strip()
            if choice == "":
                return outputs[0]
            index = int(choice)
            if 0 <= index < len(outputs):
                return outputs[index]
            else:
                print(f"Please enter a number between 0 and {len(outputs) - 1}")
        except ValueError:
            print("Please enter a valid number")

def send_cc(cc_num, value):
    msg = mido.Message('control_change', control=cc_num, value=value)
    outport.send(msg)
    label = "mod wheel" if cc_num == 1 else f"knob {cc_num - 69}"
    print(f"[CC]  {label} (CC{cc_num}): {value}")

def on_press(key):
    global pressed_keys, active_notes, active_pads, selected_cc

    try:
        char = key.char.lower() if hasattr(key, 'char') else None

        # Number keys 1-9 select CC
        if char and char.isdigit():
            index = int(char)
            if 1 <= index <= 9:
                selected_cc = index_to_cc(index)
                label = "mod wheel" if selected_cc == 1 else f"knob {index}"
                print(f"[SEL] {label} selected (CC{selected_cc}) — current value: {cc_values[selected_cc]}")
            return

        # Note keys (channel 0 = ch1)
        if char in key_to_note and char not in pressed_keys:
            note = key_to_note[char]
            msg = mido.Message('note_on', note=note, velocity=100, channel=0)
            outport.send(msg)
            pressed_keys[char] = ('note', note)
            active_notes.add(note)
            print(f"[ON]  Key: {char.upper()} → Note: {note} (ch1) | Active notes: {len(active_notes)}")

        # Pad keys (channel 9 = ch10)
        elif char in key_to_pad and char not in pressed_keys:
            note = key_to_pad[char]
            msg = mido.Message('note_on', note=note, velocity=100, channel=9)
            outport.send(msg)
            pressed_keys[char] = ('pad', note)
            active_pads.add(note)
            print(f"[PAD] Key: {char.upper()} → Note: {note} (ch10) | Active pads: {len(active_pads)}")

    except AttributeError:
        pass

    # Arrow keys adjust selected CC
    if key == keyboard.Key.up:
        cc_values[selected_cc] = min(127, cc_values[selected_cc] + 5)
        send_cc(selected_cc, cc_values[selected_cc])
    elif key == keyboard.Key.down:
        cc_values[selected_cc] = max(0, cc_values[selected_cc] - 5)
        send_cc(selected_cc, cc_values[selected_cc])

def on_release(key):
    global pressed_keys, active_notes, active_pads

    try:
        char = key.char.lower() if hasattr(key, 'char') else None

        if char in pressed_keys:
            kind, note = pressed_keys[char]
            if kind == 'note':
                msg = mido.Message('note_off', note=note, velocity=0, channel=0)
                outport.send(msg)
                active_notes.discard(note)
                print(f"[OFF] Key: {char.upper()} → Note: {note} (ch1) | Active notes: {len(active_notes)}")
            elif kind == 'pad':
                msg = mido.Message('note_off', note=note, velocity=0, channel=9)
                outport.send(msg)
                active_pads.discard(note)
                print(f"[PAD] Key: {char.upper()} → Note: {note} (ch10) | Active pads: {len(active_pads)}")
            del pressed_keys[char]

    except AttributeError:
        pass

def main():
    global outport

    outputs = list_outputs()
    device_name = select_output(outputs)
    outport = mido.open_output(device_name)

    print(f"\nOpening MIDI output: {device_name}")
    print("\n" + "="*50)
    print("MPK Mini Simulator")
    print("="*50)
    print("\nNote keys (ch1):")
    print("  A=48  S=49  D=50  F=51  G=52")
    print("  H=53  J=54  K=55  L=56")
    print("\nPad keys (ch10):")
    print("  Z=45  X=47  C=48  V=50")
    print("  B=52  N=53  M=55  ,=57")
    print("\nKnob control:")
    print("  1-8        = select knob (CC70-77)")
    print("  9          = select mod wheel (CC1)")
    print("  UP arrow   = +5")
    print("  DOWN arrow = -5")

    with keyboard.Listener(on_press=on_press, on_release=on_release) as listener:
        listener.join()

    for note in range(128):
        outport.send(mido.Message('note_off', note=note, velocity=0, channel=0))
        outport.send(mido.Message('note_off', note=note, velocity=0, channel=9))

    outport.close()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        if outport:
            for note in range(128):
                outport.send(mido.Message('note_off', note=note, velocity=0, channel=0))
                outport.send(mido.Message('note_off', note=note, velocity=0, channel=9))
            outport.close()
