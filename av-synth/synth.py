import asyncio
import json
import sys
import mido
import websockets
import socket

connected_clients = set()
async def midi_handler(websocket):
    connected_clients.add(websocket)
    print(f"Client connected. Total clients: {len(connected_clients)}")

    try:
        await websocket.wait_closed()
    finally:
        connected_clients.remove(websocket)
        print(f"Client disconnected. Total clients: {len(connected_clients)}")

def select_midi_device():
    midi_inputs = mido.get_input_names()

    if not midi_inputs:
        print("No MIDI devices found!")
        sys.exit(1)

    print("\nAvailable MIDI inputs:")
    for i, name in enumerate(midi_inputs):
        print(f"  {i}: {name}")

    while True:
        try:
            choice = input("\nSelect MIDI device number (or press Enter for device 0): ").strip()
            if choice == "":
                return midi_inputs[0]

            index = int(choice)
            if 0 <= index < len(midi_inputs):
                return midi_inputs[index]
            else:
                print(f"Please enter a number between 0 and {len(midi_inputs) - 1}")
        except ValueError:
            print("Please enter a valid number")

async def broadcast_midi(device_name):
    with mido.open_input(device_name) as inport:
        for msg in inport:
            if msg.type in ['note_on', 'note_off']:
                data = {
                    'type': msg.type,
                    'note': msg.note,
                    'velocity': msg.velocity if msg.type == 'note_on' else 0
                }

                if connected_clients:
                    message = json.dumps(data)
                    await asyncio.gather(
                        *[client.send(message) for client in connected_clients],
                        return_exceptions=True
                    )
                    print(f"Broadcast: {data}")

            await asyncio.sleep(0)

            
def get_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"

async def main():
    device_name = select_midi_device()

    async with websockets.serve(midi_handler, "0.0.0.0", 8765):
        local_ip = get_ip()
        print(f"Connect from other devices using: ws://{local_ip}:8765")
        await broadcast_midi(device_name)

if __name__ == "__main__":
    asyncio.run(main())
