export function findObstacleCollision(player, obstacles, hitCooldown = 0) {
  const collision = findObstacleCollisionDetails(player, obstacles);

  if (!collision) {
    return null;
  }

  if (hitCooldown > 0 && !collision.stomped) {
    return null;
  }

  return collision.obstacle;
}

export function findObstacleCollisionDetails(player, obstacles) {
  const hitboxX = player.x + 8;
  const hitboxY = player.y + 6;
  const hitboxWidth = player.width - 18;
  const hitboxHeight = player.height - 4;
  const previousBottom = player.previousY + 6 + hitboxHeight;
  const currentBottom = hitboxY + hitboxHeight;

  for (const obstacle of obstacles) {
    let obstacleHitboxX = obstacle.x + 4;
    let obstacleHitboxY = obstacle.y + 4;
    let obstacleHitboxWidth = obstacle.width - 8;
    let obstacleHitboxHeight = obstacle.height - 8;

    if (obstacle.kind === "animated-bug") {
      obstacleHitboxX = obstacle.x - 12;
      obstacleHitboxY = obstacle.y + 4;
      obstacleHitboxWidth = obstacle.width - 22;
      obstacleHitboxHeight = obstacle.height - 8;
    } else if (obstacle.kind === "animated-bug-b") {
      obstacleHitboxX = obstacle.x + 6;
      obstacleHitboxY = obstacle.y + 18;
      obstacleHitboxWidth = obstacle.width - 12;
      obstacleHitboxHeight = obstacle.height - 22;
    }

    if (
      hitboxX >= obstacleHitboxX + obstacleHitboxWidth ||
      hitboxX + hitboxWidth <= obstacleHitboxX ||
      hitboxY >= obstacleHitboxY + obstacleHitboxHeight ||
      currentBottom <= obstacleHitboxY
    ) {
      continue;
    }

    const obstacleTop = obstacleHitboxY;
    const stompTolerance = Math.max(10, player.height * 0.2);
    const stomped =
      player.velocityY > 0 &&
      previousBottom <= obstacleTop + stompTolerance &&
      currentBottom >= obstacleTop;

    return {
      obstacle,
      stomped,
      obstacleTop,
      obstacleHitbox: {
        x: obstacleHitboxX,
        y: obstacleHitboxY,
        width: obstacleHitboxWidth,
        height: obstacleHitboxHeight,
      },
    };
  }

  return null;
}

export function removeEntity(list, entity) {
  const index = list.indexOf(entity);

  if (index === -1) {
    return list;
  }

  const nextList = list.slice();
  nextList.splice(index, 1);
  return nextList;
}

export function findBonusHeartCollision(player, bonusHearts) {
  const hitboxX = player.x + 8;
  const hitboxY = player.y + 6;
  const hitboxRight = hitboxX + player.width - 18;
  const hitboxBottom = hitboxY + player.height - 4;

  for (const heart of bonusHearts) {
    const floatOffset = Math.sin(heart.floatTime) * 8;
    const heartHitboxX = heart.x + 4;
    const heartHitboxY = heart.y + floatOffset + 4;
    const heartHitboxRight = heartHitboxX + heart.width - 8;
    const heartHitboxBottom = heartHitboxY + heart.height - 8;

    if (
      hitboxX < heartHitboxRight &&
      hitboxRight > heartHitboxX &&
      hitboxY < heartHitboxBottom &&
      hitboxBottom > heartHitboxY
    ) {
      return heart;
    }
  }

  return null;
}

export function findCoinCollision(player, coins) {
  const hitboxX = player.x + 8;
  const hitboxY = player.y + 6;
  const hitboxRight = hitboxX + player.width - 18;
  const hitboxBottom = hitboxY + player.height - 4;

  for (const coin of coins) {
    const floatOffset = Math.sin(coin.floatTime) * 8;
    const coinHitboxX = coin.x + 6;
    const coinHitboxY = coin.y + floatOffset + 6;
    const coinHitboxRight = coinHitboxX + coin.width - 12;
    const coinHitboxBottom = coinHitboxY + coin.height - 12;

    if (
      hitboxX < coinHitboxRight &&
      hitboxRight > coinHitboxX &&
      hitboxY < coinHitboxBottom &&
      hitboxBottom > coinHitboxY
    ) {
      return coin;
    }
  }

  return null;
}
