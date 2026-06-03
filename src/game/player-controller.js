// Player controller owns movement physics and jump state.
// It does not render anything and does not know about the DOM.
export function createPlayer(world, difficulty) {
  return {
    x: 150,
    y: world.groundY - 64,
    previousY: world.groundY - 64,
    width: 62,
    height: 82,
    groundY: world.groundY - 64,
    velocityY: 0,
    gravity: difficulty.gravity,
    jumpStrength: difficulty.jumpStrength,
    doubleJumpMultiplier: difficulty.doubleJumpMultiplier,
    isJumping: false,
    jumpsUsed: 0,
    isDoubleJumping: false,
    jumpAnimationTime: 0,
    runCycle: 0,
  };
}

export function syncPlayerDifficulty(player, difficulty) {
  player.gravity = difficulty.gravity;
  player.jumpStrength = difficulty.jumpStrength;
  player.doubleJumpMultiplier = difficulty.doubleJumpMultiplier;
}

export function resetPlayer(player, difficulty) {
  player.y = player.groundY;
  player.previousY = player.groundY;
  player.velocityY = 0;
  syncPlayerDifficulty(player, difficulty);
  player.isJumping = false;
  player.jumpsUsed = 0;
  player.isDoubleJumping = false;
  player.jumpAnimationTime = 0;
  player.runCycle = 0;
  return player;
}

export function jumpPlayer(state, player) {
  if (!state.gameStarted || state.gameOver || state.lives <= 0) {
    return false;
  }

  // First jump starts from the ground, second jump is an aerial recovery.
  if (!player.isJumping) {
    player.velocityY = -player.jumpStrength;
    player.isJumping = true;
    player.jumpsUsed = 1;
    player.isDoubleJumping = false;
    player.jumpAnimationTime = 0;
    return true;
  }

  if (player.jumpsUsed < 2) {
    player.velocityY = -player.jumpStrength * player.doubleJumpMultiplier;
    player.jumpsUsed = 2;
    player.isDoubleJumping = true;
    player.jumpAnimationTime = 0;
    return true;
  }

  return false;
}

export function preparePlayerDeathFall(player) {
  player.previousY = player.y;
  player.isJumping = false;
  player.isDoubleJumping = false;
  player.jumpsUsed = 0;
  player.jumpAnimationTime = 0;
  player.velocityY = 0;
  player.y = player.groundY;
  return player;
}

export function bouncePlayer(player, obstacleTopY, bounceStrength = 0.72) {
  player.y = obstacleTopY - player.height - 2;
  player.previousY = player.y;
  player.velocityY = -player.jumpStrength * bounceStrength;
  player.isJumping = true;
  player.jumpsUsed = 1;
  player.isDoubleJumping = false;
  player.jumpAnimationTime = 0;
  return player;
}

export function updatePlayer(player, deltaTime) {
  player.previousY = player.y;
  player.velocityY += player.gravity * deltaTime;
  player.y += player.velocityY * deltaTime;

  if (player.isJumping) {
    player.jumpAnimationTime += deltaTime;
  }

  if (player.y >= player.groundY) {
    player.y = player.groundY;
    player.velocityY = 0;
    player.isJumping = false;
    player.jumpsUsed = 0;
    player.isDoubleJumping = false;
    player.jumpAnimationTime = 0;
  }

  return player;
}
