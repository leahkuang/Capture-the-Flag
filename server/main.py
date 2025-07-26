import asyncio
import json
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from typing import Dict
from models.player import Player
from game.logic import GameManager
from services.redis import init_redis, publish, subscribe


app = FastAPI()

SERVER_ID = os.getenv("SERVER_ID", "default-server")
games: Dict[str, GameManager] = {}
clients: Dict[str, Dict[str, WebSocket]] = {}  # room -> {player_id: ws}

@app.on_event("startup")
async def startup_event():
    await init_redis()
    asyncio.create_task(consume_game_updates())


@app.websocket("/ws/{room}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room: str, player_id: str):
    await websocket.accept()
    if room not in games:
        games[room] = GameManager()
    if room not in clients:
        clients[room] = {}

    game = games[room]
    clients[room][player_id] = websocket

    player = games[room].add_player(player_id)
    try:
        
        await broadcast_state(room)
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except Exception:
                continue
            if msg.get("action") == "move":
                direction = msg.get("direction")
                game.move_player(player_id, direction)
                await broadcast_state(room)
            elif msg.get("action") == "reset":
                game.reset_game()
                await broadcast_state(room)

    except WebSocketDisconnect:
        #games[room].remove_player(player_id)
        del clients[room][player_id]
        await broadcast_state(room)


async def broadcast_state(room: str):
    state = games[room].get_state()
    state["_source"] = SERVER_ID
    state["room"] = room
    state["online"] = list(clients[room].keys())
   # Post to the Redis "game" channel (be careful to avoid recursive loops, you can add the server logo to the message)
    await publish("game:{room}", state)
    # Broadcast to all clients on this server
    for ws in clients[room].values():
        try:
            await ws.send_text(json.dumps(state))
        except Exception:
            pass


async def consume_game_updates():
    async for msg in subscribe():
        room = msg.get("room")
        if not room or msg.get("_source") == SERVER_ID:
            continue
        if room not in games:
            games[room] = GameManager()
            clients[room] = {}

        game = games[room]
        game.players = {p['id']: Player(**p) for p in msg['players']}
        game.flags = msg['flags']
        game.scores = msg['scores']
        game.game_over = msg['game_over']
        game.winner = msg['winner']
        await broadcast_state(room)
