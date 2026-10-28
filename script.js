// Simple Pong game
// Left paddle controlled by mouse and arrow keys. Right paddle is the computer.

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scorePlayerEl = document.getElementById('playerScore');
const scoreComputerEl = document.getElementById('computerScore');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Game objects
const paddleWidth = 12;
const paddleHeight = 100;
const paddleMargin = 12;

const player = {
  x: paddleMargin,
  y: (HEIGHT - paddleHeight) / 2,
  width: paddleWidth,
  height: paddleHeight,
  speed: 6,
  moveUp: false,
  moveDown: false
};

const computer = {
  x: WIDTH - paddleWidth - paddleMargin,
  y: (HEIGHT - paddleHeight) / 2,
  width: paddleWidth,
  height: paddleHeight,
  speed: 4 // AI max speed
};

const ballRadius = 8;
let ball = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  vx: 0,
  vy: 0,
  speed: 5
};

let score = { player: 0, computer: 0 };

const maxBounceAngle = Math.PI / 3; // how steep the ball can bounce on paddle hit
const speedIncrease = 1.05; // ball speed multiplier on each paddle hit
const maxBallSpeed = 18;

let lastTime = 0;

// Initialize ball with random direction
function resetBall(directionRight = null) {
  ball.x = WIDTH / 2;
  ball.y = HEIGHT / 2;
  ball.speed = 5;
  const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8); // small random angle
  const dir = directionRight === null ? (Math.random() > 0.5 ? 1 : -1) : (directionRight ? 1 : -1);
  ball.vx = dir * ball.speed * Math.cos(angle);
  ball.vy = ball.speed * Math.sin(angle);
}

// Draw functions
function drawRect(x, y, w, h, color = '#ffffff') {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color = '#ffffff') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawNet() {
  const segment = 12;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let y = 10; y < HEIGHT; y += segment * 1.7) {
    ctx.fillRect(WIDTH / 2 - 1, y, 2, segment);
  }
}

function draw() {
  // Clear
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Background panel
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Net
  drawNet();

  // Paddles
  drawRect(player.x, player.y, player.width, player.height, '#00d4ff');
  drawRect(computer.x, computer.y, computer.width, computer.height, '#ff6b6b');

  // Ball
  drawCircle(ball.x, ball.y, ballRadius, '#ffffff');
}

// Collision detection with paddle
function paddleCollision(p, isLeftPaddle) {
  // Check if ball intersects paddle rectangle
  const insideY = ball.y >= p.y - ballRadius && ball.y <= p.y + p.height + ballRadius;
  if (isLeftPaddle) {
    if (ball.x - ballRadius <= p.x + p.width && ball.x - ballRadius >= p.x && insideY) {
      // Calculate hit position relative to center of the paddle
      const relativeIntersectY = (p.y + p.height / 2) - ball.y;
      const normalized = relativeIntersectY / (p.height / 2);
      const bounceAngle = normalized * maxBounceAngle;
      const direction = 1; // ball goes right
      ball.speed = Math.min(maxBallSpeed, ball.speed * speedIncrease);
      ball.vx = direction * ball.speed * Math.cos(bounceAngle);
      ball.vy = -ball.speed * Math.sin(bounceAngle);
      // ensure ball moves out of paddle to avoid multiple collisions
      ball.x = p.x + p.width + ballRadius + 0.1;
    }
  } else {
    // right paddle
    if (ball.x + ballRadius >= p.x && ball.x + ballRadius <= p.x + p.width && insideY) {
      const relativeIntersectY = (p.y + p.height / 2) - ball.y;
      const normalized = relativeIntersectY / (p.height / 2);
      const bounceAngle = normalized * maxBounceAngle;
      const direction = -1; // ball goes left
      ball.speed = Math.min(maxBallSpeed, ball.speed * speedIncrease);
      ball.vx = direction * ball.speed * Math.cos(bounceAngle);
      ball.vy = -ball.speed * Math.sin(bounceAngle);
      ball.x = p.x - ballRadius - 0.1;
    }
  }
}

// Update positions and game logic
function update(dt) {
  // Player movement via keys
  if (player.moveUp) {
    player.y -= player.speed;
  } else if (player.moveDown) {
    player.y += player.speed;
  }

  // Clamp player paddle
  player.y = Math.max(0, Math.min(HEIGHT - player.height, player.y));

  // Simple AI for computer: follow the ball Y with limited speed and a small reaction lag
  const targetY = ball.y - (computer.height / 2);
  const diff = targetY - computer.y;
  const aiSpeed = Math.min(computer.speed, Math.abs(diff));
  computer.y += (diff > 0 ? aiSpeed : -aiSpeed) * 0.98;

  // Clamp computer
  computer.y = Math.max(0, Math.min(HEIGHT - computer.height, computer.y));

  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Top and bottom wall collisions
  if (ball.y - ballRadius <= 0) {
    ball.y = ballRadius;
    ball.vy *= -1;
  } else if (ball.y + ballRadius >= HEIGHT) {
    ball.y = HEIGHT - ballRadius;
    ball.vy *= -1;
  }

  // Paddle collisions
  paddleCollision(player, true);
  paddleCollision(computer, false);

  // Scoring
  if (ball.x + ballRadius < 0) {
    // Computer scores
    score.computer += 1;
    scoreComputerEl.textContent = score.computer;
    resetBall(true); // send ball towards player next
  } else if (ball.x - ballRadius > WIDTH) {
    // Player scores
    score.player += 1;
    scorePlayerEl.textContent = score.player;
    resetBall(false);
  }
}

// Main loop
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

// Input handling
// Mouse movement on canvas controls paddle Y
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseY = e.clientY - rect.top;
  player.y = mouseY - player.height / 2;
  // clamp
  player.y = Math.max(0, Math.min(HEIGHT - player.height, player.y));
});

// Keyboard controls
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') {
    player.moveUp = true;
    e.preventDefault();
  } else if (e.key === 'ArrowDown') {
    player.moveDown = true;
    e.preventDefault();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp') {
    player.moveUp = false;
    e.preventDefault();
  } else if (e.key === 'ArrowDown') {
    player.moveDown = false;
    e.preventDefault();
  }
});

// Prevent arrow keys from scrolling the page when the canvas is focused
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
    e.preventDefault();
  }
}, { passive: false });

// Start game
resetBall();
requestAnimationFrame(loop);