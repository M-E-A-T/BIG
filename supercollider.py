#!/usr/bin/env python3
"""
midi_osc_bridge.py
------------------
Listens to ALL connected MIDI devices at launch and forwards
CC messages to SuperCollider via OSC.

OSC message format sent to SC:
    /cc [cc_number, value]   (both integers, value 0–127)

Requirements:
    pip install mido python-osc

Usage:
    python midi_osc_bridge.py
    python midi_osc_bridge.py --sc-host 127.0.0.1 --sc-port 57120
"""

import argparse
import sys
import threading
import mido
from pythonosc import udp_client


def parse_args():
    parser = argparse.ArgumentParser(description="MIDI → OSC bridge for SuperCollider")
    parser.add_argument("--sc-host", default="127.0.0.1", help="SuperCollider OSC host (default: 127.0.0.1)")
    parser.add_argument("--sc-port", type=int, default=57120, help="SuperCollider OSC port (default: 57120)")
    return parser.parse_args()


# CCs we care about — all others are silently ignored
WATCHED_CCS = {1, 2, 70, 71, 72, 73, 74, 75, 76, 77}


def listen_to_device(device_name: str, osc_client: udp_client.SimpleUDPClient):
    """Open a MIDI device and forward matching CC messages as OSC to SC."""
    try:
        with mido.open_input(device_name) as port:
            print(f"  ✓ Listening: {device_name}")
            for msg in port:
                if msg.type == "control_change" and msg.control in WATCHED_CCS:
                    osc_client.send_message("/cc", [msg.control, msg.value])
                    print(f"[{device_name}] CC{msg.control} = {msg.value}")
    except Exception as e:
        print(f"  ✗ Device '{device_name}' error: {e}")


def main():
    args = parse_args()

    # Set up OSC client pointing at SuperCollider
    osc_client = udp_client.SimpleUDPClient(args.sc_host, args.sc_port)
    print(f"OSC → {args.sc_host}:{args.sc_port}")

    # Discover all MIDI inputs available at launch
    devices = mido.get_input_names()
    if not devices:
        print("No MIDI devices found. Plug in your keyboards and relaunch.")
        sys.exit(1)

    print(f"\nFound {len(devices)} MIDI device(s):")
    for d in devices:
        print(f"  • {d}")
    print()

    # Spin up one thread per device so they all run in parallel
    threads = []
    for device_name in devices:
        t = threading.Thread(
            target=listen_to_device,
            args=(device_name, osc_client),
            daemon=True,
            name=f"midi-{device_name}"
        )
        t.start()
        threads.append(t)

    print("Bridge running. Press Ctrl+C to stop.\n")

    try:
        # Keep the main thread alive while daemon threads do the work
        for t in threads:
            t.join()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
