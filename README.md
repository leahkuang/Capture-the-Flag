# Capture-the-Flag

A real-time multiplayer Capture the Flag (CTF) game built using **FastAPI**, **WebSocket**, **HTML5 Canvas**, and **Docker**. Players are divided into red and blue teams, aiming to capture the opponent's flag and return it to their base to score points.

## Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, Phaser.js, WebSocket
- **Backend:** FastAPI (Python), Redis Pub/Sub
- **Deployment:** Docker, Docker Compose, Nginx

## Features Implemented

- Real-time player movement via WebSocket
- Flag capture and scoring system
- Reset positions after scoring
- Victory pop-up when a team wins
- Synchronized game state across clients
- Red and blue team separation

## Features Not Implemented

- Player collision and blocking logic (in progress)

## How to Run

### Prerequisites

Docker、Docker Compose

### Build and Start the Game
From the root directory:

docker-compose up --build

### Open the Game

Navigate to: http://localhost:3000
Open the page in two browser tabs or two devices to simulate multiplayer interaction.
