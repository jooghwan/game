// Canvas 설정
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 400;

// 게임 상수
const GRAVITY = 0.6;
const JUMP_STRENGTH = -12;
const OBSTACLE_SPEED = 5;
const OBSTACLE_WIDTH = 30;
const OBSTACLE_HEIGHT = 50;
const OBSTACLE_GAP = 400;
const ITEM_WIDTH = 20;
const ITEM_HEIGHT = 20;

const playerImage = new Image();
playerImage.src = 'player.png';

const obstacleImage = new Image();
obstacleImage.src = 'enemy2.png';

const itemImage = new Image();
itemImage.src = 'coin2.png';


const backgroundMusic = new Audio('bgm.mp3');
const itemMusic = new Audio('getitem.mp3');
const gameOverMusic = new Audio('gameover.mp3')
backgroundMusic.loop = true;

// 플레이어 설정  
let player = {
  x: 50,
  y: canvas.height - 155,
  width: 70,
  height: 70,
  dy: 0,
  grounded: false,
};

// 장애물 및 아이템 배열
let obstacles = [];
let items = [];
let lastObstacleX = canvas.width;

// 게임 상태
let isGameOver = false;
let score = 0;

// 입력 처리
let keys = { space: false };
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && player.grounded) {
    player.dy = JUMP_STRENGTH;
    player.grounded = false;
  }
});

// 장애물 생성
function generateObstacle(force = false) {
  if (force || canvas.width - lastObstacleX >= OBSTACLE_GAP) {
    // 랜덤한 장애물 높이 생성 (예: 30 ~ 100)
    const randomHeight = Math.floor(Math.random() * (70 - 30 + 1)) + 30;
    // 랜덤한 장애물 가로 길이 생성 (예: 30 ~ 100)
    const randomWidth = Math.floor(Math.random() * (70 - 30 + 1)) + 30;
    
    obstacles.push({
      x: canvas.width,
      y: canvas.height - randomHeight-52,
      width: randomWidth,
      height: randomHeight,
    });
    lastObstacleX = canvas.width;
  }
}

// 아이템 생성
function generateItem() {
  // 장애물 근처에 아이템을 생성하려면, 장애물과 겹치지 않게 위치를 설정해야 함
  if (Math.random() < 0.01) { // 1% 확률로 아이템 생성
    let itemX = canvas.width;
    let itemY = Math.floor(Math.random() * (140 - 130 + 1)) + 170; // 기본 아이템 Y 위치

    // 아이템 위치가 기존 장애물과 겹치지 않도록 검사
    for (let obstacle of obstacles) {
      // 장애물의 X 범위 + 조금 여유를 두고 아이템을 배치할 위치를 결정
      if (itemX + ITEM_WIDTH > obstacle.x && itemX < obstacle.x + obstacle.width) {
        // 아이템이 장애물의 X 범위 내에 있으면, Y 위치를 조정
        // 예를 들어, 장애물 아래로 충분한 공간을 두고 아이템을 배치
        itemY = Math.floor(Math.random() * (obstacle.y - ITEM_HEIGHT)) + 50; // 장애물 위로 아이템을 배치
      }
    }

    // 아이템이 캔버스 밖으로 생성되지 않도록 X, Y 좌표 조정
    if (itemX + ITEM_WIDTH > canvas.width) {
      itemX = canvas.width - ITEM_WIDTH; // 아이템이 캔버스를 넘어가지 않도록
    }

    if (itemY + ITEM_HEIGHT > canvas.height) {
      itemY = canvas.height - ITEM_HEIGHT; // 아이템이 캔버스를 넘어가지 않도록
    }

    // 아이템 생성
    items.push({
      x: itemX,
      y: itemY,
      width: ITEM_WIDTH,
      height: ITEM_HEIGHT,
    });
  }
}

// 장애물 이동
function moveObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= OBSTACLE_SPEED;
    if (obstacles[i].x + obstacles[i].width < 0) {
      obstacles.splice(i, 1); // 화면 밖으로 나가면 제거
      score++; // 장애물 피하면 점수 증가
    }
  }
  // 가장 오른쪽 장애물의 x 좌표를 lastObstacleX로 업데이트
  if (obstacles.length > 0) {
    lastObstacleX = obstacles[obstacles.length - 1].x;
  } else {
      lastObstacleX = canvas.width; // 장애물이 없으면 초기 상태로 설정
  }
}

// 아이템 이동
function moveItems() {
  for (let i = items.length - 1; i >= 0; i--) {
    items[i].x -= OBSTACLE_SPEED;
    if (items[i].x + items[i].width < 0) {
      items.splice(i, 1); // 화면 밖으로 나가면 제거
    }
  }
}

// 게임 오버 상태에서 소리를 끄는 함수 추가
function stopbgmMusic() {
  backgroundMusic.pause();  // 게임 오버 음악을 멈춤
  backgroundMusic.currentTime = 0;  // 게임 오버 음악을 처음부터 다시 시작하지 않도록 설정
}

// 충돌 검사
function checkCollisions() {
  // 장애물과의 충돌 검사
  for (let obstacle of obstacles) {
    if (
      player.x < obstacle.x + obstacle.width &&
      player.x + player.width > obstacle.x &&
      player.y < obstacle.y + obstacle.height &&
      player.y + player.height > obstacle.y
    ) {
      isGameOver = true;
      gameOverMusic.play();
    }
  }

  // 아이템과의 충돌 검사
  for (let i = items.length - 1; i >= 0; i--) {
    let item = items[i];
    if (
      player.x < item.x + item.width &&
      player.x + player.width > item.x &&
      player.y < item.y + item.height &&
      player.y + player.height > item.y
    ) {
      items.splice(i, 1); // 아이템을 먹으면 제거
      score += 5; // 아이템을 먹으면 점수 증가
      itemMusic.play();
    }
  }
}

// 플레이어 이동 처리
function movePlayer() {
  player.y += player.dy;

  // 중력 적용
  if (!player.grounded) {
    player.dy += GRAVITY;
  }

  // 바닥에 닿으면 착지
  if (player.y + player.height >= canvas.height-52) {
    player.y = canvas.height - player.height-52;
    player.dy = 0;
    player.grounded = true;
  }
}


window.addEventListener('keydown', () => {
  if (backgroundMusic.paused) {
    backgroundMusic.play().catch(error => {
      console.error('Audio playback failed:', error);
    });
  }
});

// 화면 그리기
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 플레이어 그리기
  ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);

  // 장애물 그리기
  for (let obstacle of obstacles) {
    ctx.drawImage(obstacleImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  }

  // 아이템 그리기
  for (let item of items) {
    ctx.drawImage(itemImage, item.x, item.y, item.width, item.height);
  }

  // 점수 표시
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
}

// 게임 업데이트
function update() {
  if (isGameOver) {
    ctx.fillStyle = "black";
    ctx.font = "40px Arial";
    ctx.fillText("Game Over!", canvas.width / 2 - 100, canvas.height / 2);
    stopbgmMusic()
    return;
  }

  movePlayer();

  // 장애물 생성: 첫 프레임에서 강제 생성
  if (obstacles.length === 0) {
    generateObstacle(true);
  } else {
    generateObstacle();
  }

  generateItem(); // 아이템 생성
  moveObstacles();
  moveItems(); // 아이템 이동
  checkCollisions();
  draw();
  requestAnimationFrame(update);
}

// 게임 시작
update();