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
let socket;
let room = localStorage.getItem("room") || "default";
let onlinePlayers = [];

let playerId = localStorage.getItem("playerId");
if (!playerId) {
  playerId = Math.random().toString(36).substring(2, 10);
  localStorage.setItem("playerId", playerId);
}


function connectWebSocket() {
  const endpoints = [`ws://${window.location.hostname}:8000/ws/${room}/${playerId}`,
                     `ws://${window.location.hostname}:8001/ws/${room}/${playerId}`];
  let attempt = 0;

   function tryConnect() {
     socket = new WebSocket(endpoints[attempt]);
     socket.onopen = () => {
       console.log('WebSocket connected to', endpoints[attempt]);
       setupSocketHandlers();  
     };
     socket.addEventListener('close', () => {
       attempt++;
       if (attempt < endpoints.length) {
         tryConnect(); 
       } else {
         console.error('Unable to connect to any server');
       }
     });

     socket.addEventListener('error', (err) => {
       console.error('WebSocket error', err);
     });
   }
  tryConnect();
}

connectWebSocket();



function setupSocketHandlers() {
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
    onlinePlayers = data.online || [];
    draw();
  };
}

  
  
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
    if (!onlinePlayers.includes(player.id)) return;
    const img = player.team === "red" ? images.redPlayer : images.bluePlayer;
    ctx.drawImage(img, player.x, player.y, 40, 40);
  });
}

window.addEventListener("keydown", (e) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return; 
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

