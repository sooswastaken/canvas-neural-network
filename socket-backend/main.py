from sanic import Sanic, response, Request, Websocket
from sanic.response import json
import uuid

import json as json_lib

app = Sanic(__name__)

BOARD_WIDTH = 1000
BOARD_HEIGHT = 1000

board = [[0 for _ in range(BOARD_WIDTH)] for _ in range(BOARD_HEIGHT)]

clients = set()

def compress(board):
    """Compress a 2D board using run-length encoding."""
    compressed_board = []
    for row in board:
        compressed_row = []
        current_value = row[0]
        count = 0
        for value in row:
            if value == current_value:
                count += 1
            else:
                compressed_row.append((current_value, count))
                current_value = value
                count = 1
        compressed_row.append((current_value, count))  # Append the last run
        compressed_board.append(compressed_row)
    return compressed_board

def decompress(compressed_board):
    """Decompress a board that was compressed using run-length encoding."""
    decompressed_board = []
    for row in compressed_board:
        decompressed_row = []
        for value, count in row:
            decompressed_row.extend([value] * count)
        decompressed_board.append(decompressed_row)

    return decompressed_board

@app.route('/')
async def index(request):
    return response.text('Backend is running')

@app.websocket('/ws')
async def ws(request: Request, ws: Websocket):
    global board
    clients.add(ws)
    # create uuid for each client
    ws.uuid = str(uuid.uuid4())
    try:
        # Send current board to client when connected
        await ws.send(json_lib.dumps(compress(board)))

        while True:
            data = await ws.recv()
            update = json_lib.loads(data)
            if update.get("type") == "cursor-position":
                update["uuid"] = ws.uuid
                for client in clients:
                    if client != ws:
                        await client.send(json_lib.dumps(update))
                continue

            if isinstance(update, list):
                for update_item in update:
                    x, y, value = update_item['x'], update_item['y'], update_item['value']
                    board[y][x] = value
                # Broadcast the entire update to all clients except the sender
                for client in clients:
                    if client != ws:
                        await client.send(json_lib.dumps(update))
            else:
                x, y, value = update['x'], update['y'], update['value']
                board[y][x] = value
                # Broadcast the update to all clients except the sender
                for client in clients:
                    if client != ws:
                        await client.send(json_lib.dumps({"x": x, "y": y, "value": value})  )
    finally:
        clients.remove(ws)

        # broadcast to all clients that a client has disconnected
        for client in clients:
            await client.send(json_lib.dumps({"type": "client-disconnected", "uuid": ws.uuid}))

@app.route("/reset")
async def reset(request):
    global board
    board = [[0 for _ in range(BOARD_WIDTH)] for _ in range(BOARD_HEIGHT)]
    for client in clients:
        await client.send(json_lib.dumps(compress(board)))
    return response.text("Board reset")

@app.route("/get-board")
async def get_board(request):
    return json(board)

@app.route("/set-board", methods=["POST"])
async def set_board(request):
    global board
    board = request.json
    for client in clients:
        await client.send(json_lib.dumps(compress(board)))
    return response.text("Board updated")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, auto_reload=True)
