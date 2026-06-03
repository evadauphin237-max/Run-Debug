import { createCoinHitbox, createHeartHitbox, createPlayerHitbox, getObstacleHitbox, rectsIntersect } from "./logic.js";

export function findObstacleCollision(player, obstacles, hitCooldown = 0) {
  return findObstacleCollisionDetails(player, obstacles, hitCooldown)?.obstacle ?? null;
}

export function findObstacleCollisionDetails(player, obstacles, hitCooldown = 0) {
  if (hitCooldown > 0) {
    return null;
  }

  const hitbox = createPlayerHitbox(player);
  const previousHitbox = {
    ...hitbox,
    y: player.previousY + 6,
  };

  for (const obstacle of obstacles) {
    const obstacleHitbox = getObstacleHitbox(obstacle);

    if (!rectsIntersect(hitbox, obstacleHitbox)) {
      continue;
    }

    const previousBottom = previousHitbox.y + previousHitbox.height;
    const currentBottom = hitbox.y + hitbox.height;
    const obstacleTop = obstacleHitbox.y;
    const stompTolerance = Math.max(10, player.height * 0.2);
    const stomped =
      player.velocityY > 0 &&
      previousBottom <= obstacleTop + stompTolerance &&
      currentBottom >= obstacleTop;

    return {
      obstacle,
      stomped,
      obstacleTop,
      obstacleHitbox,
    };
  }

  return null;
}

export function removeEntity(list, entity) {
  return list.filter((item) => item !== entity);
}

export function findBonusHeartCollision(player, bonusHearts) {
  const hitbox = createPlayerHitbox(player);

  for (const heart of bonusHearts) {
    if (rectsIntersect(hitbox, createHeartHitbox(heart))) {
      return heart;
    }
  }

  return null;
}

export function findCoinCollision(player, coins) {
  const hitbox = createPlayerHitbox(player);

  for (const coin of coins) {
    if (rectsIntersect(hitbox, createCoinHitbox(coin))) {
      return coin;
    }
  }

  return null;
}
