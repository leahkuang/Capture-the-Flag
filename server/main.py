import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from typing import Dict
from models.player import Player
from game.logic import GameManager

app = FastAPI()


game = GameManager()
clients: Dict[str, WebSocket] = {}

@app.websocket("/ws/{player_id}")
async def websocket_endpoint(websocket: WebSocket, player_id: str):
    await websocket.accept()
    clients[player_id] = websocket
    player = game.add_player(player_id)
    try:
        
        await broadcast_state()
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except Exception:
                continue
            if msg.get("action") == "move":
                if game.game_over:
                    continue
                direction = msg.get("direction")
                game.move_player(player_id, direction)
                await broadcast_state()

                if game.game_over:
                    await broadcast_state()
                    await asyncio.sleep(1) 
                    game.reset_game()
                    await broadcast_state()

    except WebSocketDisconnect:
        game.remove_player(player_id)
        del clients[player_id]
        await broadcast_state()

async def broadcast_state():
    state = game.get_state()
    for ws in clients.values():
        try:
            await ws.send_text(json.dumps(state))
        except Exception:
            pass
