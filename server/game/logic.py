from typing import Dict
from models.player import Player

class GameManager:
    def __init__(self):
        self.players: Dict[str, Player] = {}
        self.flags = {
            "red": {"x": 100, "y": 330},
            "blue": {"x": 700, "y": 330}
        }
        self.scores = {"red": 0, "blue": 0}
        self.winning_score = 3
        self.game_over = False
        self.winner = None

    def add_player(self, player_id: str) -> Player:
        team = "blue" if len(self.players) % 2 == 0 else "red"
        player = Player(id=player_id, x=400, y=330, team=team)
        self.players[player_id] = player
        return player

    def remove_player(self, player_id: str):
        if player_id in self.players:
            del self.players[player_id]

    def move_player(self, player_id: str, direction: str):
        if self.game_over:
            return
            
        player = self.players.get(player_id)
        if not player:
            return
        if direction == "left":
            player.x = max(0, player.x - 5)
        elif direction == "right":
            player.x = min(880 - 40, player.x + 5)
        elif direction == "up":
            player.y = max(0, player.y - 5)
        elif direction == "down":
            player.y = min(660 - 40, player.y + 5)
        self.check_capture(player)

    def check_capture(self, player):
        opponent_flag = self.flags["blue"] if player.team == "red" else self.flags["red"]
        if abs(player.x - opponent_flag["x"]) < 40 and abs(player.y - opponent_flag["y"]) < 40:
            self.scores[player.team] += 1
            print(f"{player.team} scored! Total: {self.scores[player.team]}")

            if self.scores[player.team] >= self.winning_score:
                self.game_over = True
                self.winner = player.team
                print(f"Team {player.team} wins!")

            self.reset_positions()


    def get_state(self):
        return {
            "players": [p.dict() for p in self.players.values()],
            "flags": self.flags,
            "scores": self.scores,
            "game_over": self.game_over,
            "winner": self.winner
        }

    def reset_positions(self):
        for p in self.players.values():
            if p.team == "red":
                p.x, p.y = 150, 330
            else:
                p.x, p.y = 650, 330

        self.flags["red"] = {"x": 100, "y": 330}
        self.flags["blue"] = {"x": 700, "y": 330}

    def reset_game(self):
        self.reset_positions()
        self.scores = {"red": 0, "blue": 0}
        self.game_over = False
        self.winner = None
