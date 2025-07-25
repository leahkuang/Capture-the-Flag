const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const images = {
  redFlag: new Image(),
  blueFlag: new Image(),
  redPlayer: new Image(),
  bluePlayer: new Image(),
};

images.redFlag.src = "assets/red-flag.png";
images.blueFlag.src = "assets/blue-flag.png";
images.redPlayer.src = "assets/red-player.png";
images.bluePlayer.src = "assets/blue-player.png";

let players = [];
let flags = {};
let scores = { red: 0, blue: 0 };
let gameOver = false;
let gameRestarting = false;
let winner = null;


let playerId = Math.random().toString(36).substring(2, 10);

const socket = new WebSocket(`ws://${window.location.hostname}:8000/ws/${playerId}`);

socket.onopen = () => {
  console.log("WebSocket connected");
};

socket.onmessage = (event) => {
  let data;
  try {
    data = JSON.parse(event.data);
  } catch {
    console.warn("Received non-JSON message:", event.data);
    return;
  }
  players = data.players;
  flags = data.flags;
  scores = data.scores;
  gameOver = data.gameOver;
  winner = data.winner;
  
  draw();
  if (gameOver && !gameRestarting) {
    gameRestarting = true;
    setTimeout(() => {
      socket.send(JSON.stringify({ action: "reset" }));
      gameRestarting = false;
    }, 3000); 
  }
};

socket.onclose = () => {
  console.log("WebSocket closed");
};

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = "20px Arial";
  ctx.fillStyle = "black";
  ctx.fillText(`Red: ${scores.red}   Blue: ${scores.blue}`, 20, 30);

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    const winner = scores.red >= 3 ? "Red" : "Blue";
    ctx.fillText(`${winner} Wins!`, canvas.width / 2 - 100, canvas.height / 2);
    return;
  }


  ctx.drawImage(images.redFlag, flags.red.x, flags.red.y, 40, 40);
  ctx.drawImage(images.blueFlag, flags.blue.x, flags.blue.y, 40, 40);

  players.forEach((player) => {
    const img = player.team === "red" ? images.redPlayer : images.bluePlayer;
    ctx.drawImage(img, player.x, player.y, 40, 40);
  });
}

window.addEventListener("keydown", (e) => {
  if (gameOver) return;

  let direction;
  switch (e.key) {
    case "ArrowLeft":
      direction = "left";
      break;
    case "ArrowRight":
      direction = "right";
      break;
    case "ArrowUp":
      direction = "up";
      break;
    case "ArrowDown":
      direction = "down";
      break;
  }
  if (direction) {
    socket.send(JSON.stringify({ action: "move", direction }));
  }
});

const resetBtn = document.getElementById("resetBtn");
resetBtn.addEventListener("click", () => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ action: "reset" }));
  }
});

