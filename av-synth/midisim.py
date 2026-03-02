# Use this if you do not have a way to send out midi, you will need to set up a virtual midi device first.

import mido
import sys
from pynput import keyboard

pressed_keys = {}
active_notes = set()

key_to_note = {
    'a': 60,  # C
    's': 62,  # D
    'd': 64,  # E
    'f': 65,  # F
    'g': 67,  # G
    'h': 69,  # A
    'j': 71,  # B
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

def on_press(key):
    global pressed_keys, active_notes

    try:
        char = key.char.lower() if hasattr(key, 'char') else None

        if char in key_to_note and char not in pressed_keys:
            note = key_to_note[char]

            msg = mido.Message('note_on', note=note, velocity=100)
            outport.send(msg)

            pressed_keys[char] = note
            active_notes.add(note)

            print(f"[ON]  Key: {char.upper()} → Note: {note} | Active: {len(active_notes)} notes")

    except AttributeError:
        pass

def on_release(key):
    global pressed_keys, active_notes

    if key == keyboard.Key.esc:
        print("\nExiting...")
        return False

    try:
        char = key.char.lower() if hasattr(key, 'char') else None

        if char in pressed_keys:
            note = pressed_keys[char]

            # Send note off
            msg = mido.Message('note_off', note=note, velocity=0)
            outport.send(msg)

            del pressed_keys[char]
            active_notes.discard(note)

            print(f"[OFF] Key: {char.upper()} → Note: {note} | Active: {len(active_notes)} notes")

    except AttributeError:
        pass

def main():
    global outport

    outputs = list_outputs()
    device_name = select_output(outputs)

    outport = mido.open_output(device_name)

    print(f"\nOpening MIDI output: {device_name}")
    print("\n" + "="*50)
    print("Keyboard MIDI Controller")
    print("="*50)
    print("\nKey mapping (C major scale):")
    print("  A = C (60)")
    print("  S = D (62)")
    print("  D = E (64)")
    print("  F = F (65)")
    print("  G = G (67)")
    print("  H = A (69)")
    print("  J = B (71)")
    print("\nPress ESC to quit")
    print("Hold multiple keys for chords!\n")

    with keyboard.Listener(on_press=on_press, on_release=on_release) as listener:
        listener.join()

    for note in range(128):
        outport.send(mido.Message('note_off', note=note, velocity=0))

    outport.close()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        if outport:
            for note in range(128):
                outport.send(mido.Message('note_off', note=note, velocity=0))
            outport.close()
