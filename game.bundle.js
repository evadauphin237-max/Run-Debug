(() => {
  // src/game/browser-runtime.js
  function createBrowserRuntime({ windowRef = window, documentRef = document } = {}) {
    return {
      bodyRef: documentRef.body,
      documentRef,
      bindResize(onResize) {
        windowRef.addEventListener("resize", onResize);
        return () => {
          windowRef.removeEventListener("resize", onResize);
        };
      },
      clearTimeout(timerId) {
        windowRef.clearTimeout(timerId);
      },
      getInputMode() {
        return windowRef.matchMedia("(pointer: coarse)").matches ? "touch" : "keyboard";
      },
      requestAnimationFrame(callback) {
        return windowRef.requestAnimationFrame(callback);
      },
      setTimeout(callback, delay) {
        return windowRef.setTimeout(callback, delay);
      }
    };
  }

  // src/game/config.js
  var MAX_LIVES = 3;
  var BEST_SCORE_STORAGE_KEY = "run-and-debug-best-score-v8";
  var DIFFICULTY_STORAGE_KEY = "run-and-debug-difficulty-v1";
  var LEVEL_STORAGE_KEY = "run-and-debug-level-v1";
  var WORLD_WIDTH = 960;
  var WORLD_HEIGHT = 540;
  var GROUND_Y = 430;
  var obstaclePalette = [
    { kind: "solid", value: "#3d8bff" },
    { kind: "solid", value: "#ff8a00" },
    { kind: "solid", value: "#111111" },
    { kind: "solid", value: "#8a4dff" },
    { kind: "solid", value: "#b0176b" },
    { kind: "gradient", start: "#3d8bff", end: "#8a4dff" },
    { kind: "gradient", start: "#ff4fd8", end: "#8fdcff" }
  ];
  var obstacleTypes = [
    { kind: "animated-bug" },
    { kind: "animated-bug" },
    { kind: "animated-bug-b" },
    { kind: "animated-bug-b" },
    { kind: "animated-bug" }
  ];
  var BUG_OBSTACLE_SCALE = 1.87;
  var BUG_OBSTACLE_FOOT_OFFSET = 8;
  var BUG_OBSTACLE_SIZE = 82;
  var BUG_B_OBSTACLE_SCALE = 1.34;
  var BUG_B_OBSTACLE_FOOT_OFFSET = -5;
  var BUG_B_OBSTACLE_SIZE = 82;
  var DIFFICULTY_OPTIONS = [
    {
      id: "zen",
      label: "Zen",
      description: "Sauts plus g\xE9n\xE9reux et rythme plus doux.",
      startSpeed: 240,
      speedRamp: 4.5,
      speedRampGrowth: 0.85,
      obstacleDelayMin: 1.35,
      obstacleDelayMax: 2.05,
      maxSpeedFactor: 1.08,
      scoreRate: 7,
      bonusHeartEvery: 7,
      coinDelayMin: 2.8,
      coinDelayMax: 4.2,
      jumpStrength: 900,
      gravity: 1725,
      doubleJumpMultiplier: 0.99
    },
    {
      id: "normal",
      label: "Normal",
      description: "L'\xE9quilibre d'origine, parfait pour encha\xEEner.",
      startSpeed: 240,
      speedRamp: 8,
      speedRampGrowth: 1.2,
      maxSpeed: 1400,
      obstacleDelayMin: 0.9,
      obstacleDelayMax: 1.55,
      maxSpeedFactor: 1.35,
      scoreRate: 10,
      bonusHeartEvery: 10,
      coinDelayMin: 2.1,
      coinDelayMax: 3.2,
      jumpStrength: 760,
      gravity: 2100,
      doubleJumpMultiplier: 0.94
    },
    {
      id: "rush",
      label: "Rush",
      description: "Plus rapide, plus serr\xE9, plus nerveux.",
      startSpeed: 430,
      speedRamp: 15,
      speedRampGrowth: 1.8,
      obstacleDelayMin: 0.5,
      obstacleDelayMax: 0.95,
      maxSpeedFactor: 1.9,
      scoreRate: 13,
      bonusHeartEvery: 13,
      coinDelayMin: 1.6,
      coinDelayMax: 2.7,
      jumpStrength: 690,
      gravity: 2525,
      doubleJumpMultiplier: 0.88
    }
  ];
  var LEVEL_OPTIONS = [
    {
      id: "arcade",
      label: "1. Piste Arcade",
      description: "Le decor d'origine pour lancer la partie."
    },
    {
      id: "forest",
      label: "2. Foret du Code",
      description: "La foret animee avec un premier plan dense."
    },
    {
      id: "valley",
      label: "3. Vallee des Variables",
      description: "La vallee panoramique sur plusieurs plans."
    }
  ];
  function getDifficultyById(id) {
    return DIFFICULTY_OPTIONS.find((difficulty) => difficulty.id === id) ?? DIFFICULTY_OPTIONS[1];
  }
  function getLevelById(id) {
    return LEVEL_OPTIONS.find((level) => level.id === id) ?? LEVEL_OPTIONS[0];
  }
  function createWorld() {
    return {
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
      groundY: GROUND_Y
    };
  }

  // src/game/atlas-manifest.js
  var import_meta = {};
  var atlasManifest = {
    "bug": {
      "width": 2167,
      "height": 268,
      "frames": [
        {
          "x": 0,
          "y": 0,
          "width": 253,
          "height": 268
        },
        {
          "x": 255,
          "y": 0,
          "width": 209,
          "height": 268
        },
        {
          "x": 466,
          "y": 0,
          "width": 220,
          "height": 268
        },
        {
          "x": 688,
          "y": 0,
          "width": 242,
          "height": 268
        },
        {
          "x": 932,
          "y": 0,
          "width": 206,
          "height": 268
        },
        {
          "x": 1140,
          "y": 0,
          "width": 197,
          "height": 268
        },
        {
          "x": 1339,
          "y": 0,
          "width": 199,
          "height": 268
        },
        {
          "x": 1540,
          "y": 0,
          "width": 200,
          "height": 268
        },
        {
          "x": 1742,
          "y": 0,
          "width": 197,
          "height": 268
        },
        {
          "x": 1941,
          "y": 0,
          "width": 226,
          "height": 268
        }
      ],
      "animationFrameCount": 9,
      "hitFrameIndex": 9,
      "src": new URL("./assets/atlases/bug.webp", document.baseURI).href
    },
    "bugB": {
      "width": 1968,
      "height": 171,
      "frames": [
        {
          "x": 0,
          "y": 0,
          "width": 216,
          "height": 167
        },
        {
          "x": 218,
          "y": 0,
          "width": 211,
          "height": 168
        },
        {
          "x": 431,
          "y": 0,
          "width": 216,
          "height": 170
        },
        {
          "x": 649,
          "y": 0,
          "width": 212,
          "height": 170
        },
        {
          "x": 863,
          "y": 0,
          "width": 210,
          "height": 169
        },
        {
          "x": 1075,
          "y": 0,
          "width": 207,
          "height": 169
        },
        {
          "x": 1284,
          "y": 0,
          "width": 207,
          "height": 170
        },
        {
          "x": 1493,
          "y": 0,
          "width": 225,
          "height": 171
        },
        {
          "x": 1720,
          "y": 0,
          "width": 248,
          "height": 160
        }
      ],
      "animationFrameCount": 8,
      "hitFrameIndex": 8,
      "src": new URL("./assets/atlases/bug-b.webp", document.baseURI).href
    }
  };
  var atlas_manifest_default = atlasManifest;

  // src/game/assets.js
  var import_meta2 = {};
  var CORE_ATLAS_FAMILIES = ["bug", "bugB"];
  function createLazyImageAsset(src) {
    let image = null;
    let loadPromise = null;
    return {
      get image() {
        return image;
      },
      isReady() {
        return Boolean(image?.complete && image.naturalWidth > 0);
      },
      load() {
        if (loadPromise) {
          return loadPromise;
        }
        image = new Image();
        loadPromise = new Promise((resolve, reject) => {
          image.addEventListener("load", () => resolve(image), { once: true });
          image.addEventListener("error", () => reject(new Error(`Failed to load asset: ${src}`)), { once: true });
        });
        image.src = src;
        return loadPromise;
      }
    };
  }
  function createImageSprite(asset) {
    return {
      get complete() {
        return asset.image?.complete ?? false;
      },
      get naturalWidth() {
        return asset.image?.naturalWidth ?? 0;
      },
      get naturalHeight() {
        return asset.image?.naturalHeight ?? 0;
      },
      get image() {
        return asset.image;
      }
    };
  }
  var atlasAssets = Object.fromEntries(
    Object.entries(atlas_manifest_default).map(([familyName, atlas]) => [
      familyName,
      {
        ...atlas,
        imageAsset: createLazyImageAsset(atlas.src)
      }
    ])
  );
  var settingsIconAsset = createLazyImageAsset(new URL("./assets/settings.svg", document.baseURI).href);
  var heartLifeActiveAsset = createLazyImageAsset(new URL("./assets/heart-life-active.svg", document.baseURI).href);
  var heartFillActiveAsset = createLazyImageAsset(new URL("./assets/heart-fill-active.svg", document.baseURI).href);
  var heartLifeLostAsset = createLazyImageAsset(new URL("./assets/heart-life-lost.svg", document.baseURI).href);
  var bonusHeartAsset = createLazyImageAsset(new URL("./assets/coeur.svg", document.baseURI).href);
  var coinAsset = createLazyImageAsset(new URL("./assets/dollar.png", document.baseURI).href);
  var playerIdleIntroFrameAssets = Array.from({ length: 57 }, (_, index) => createLazyImageAsset(new URL(`./assets/personnage/idle/idle/${index + 1}.svg`, document.baseURI).href));
  var playerIdleFrameAssets = Array.from({ length: 26 }, (_, index) => createLazyImageAsset(new URL(`./assets/personnage/idle/idel 2/${index + 1}.svg`, document.baseURI).href));
  var playerRunFrameAssets = Array.from({ length: 15 }, (_, index) => createLazyImageAsset(new URL(`./assets/personnage/court/${index + 1}.svg`, document.baseURI).href));
  var playerJumpFrameAssets = Array.from({ length: 8 }, (_, index) => createLazyImageAsset(new URL(`./assets/personnage/saut/${index + 1}.svg`, document.baseURI).href));
  var playerDoubleJumpFrameAssets = Array.from({ length: 6 }, (_, index) => createLazyImageAsset(new URL(`./assets/personnage/doublesaut/${index + 1}.svg`, document.baseURI).href));
  var playerHitFrameAssets = Array.from({ length: 4 }, (_, index) => createLazyImageAsset(new URL(`./assets/personnage/hit/${index + 1}.svg`, document.baseURI).href));
  var playerGameOverFrameAssets = Array.from({ length: 47 }, (_, index) => createLazyImageAsset(new URL(`./assets/personnage/game over/${index + 1}.svg`, document.baseURI).href));
  var playerWinFrameAssets = Array.from({ length: 83 }, (_, index) => createLazyImageAsset(new URL(`./assets/personnage/win/Win2/${index + 1}.svg`, document.baseURI).href));
  var cloudAssets = [
    createLazyImageAsset(new URL("./assets/decor/nuage1.svg", document.baseURI).href),
    createLazyImageAsset(new URL("./assets/decor/nuage2.svg", document.baseURI).href),
    createLazyImageAsset(new URL("./assets/decor/nuage3.svg", document.baseURI).href),
    createLazyImageAsset(new URL("./assets/decor/nuage4.svg", document.baseURI).href)
  ];
  var valleyBackgroundAsset = createLazyImageAsset(new URL("./assets/decor/valee/AP.svg", document.baseURI).href);
  var valleyThirdgroundAsset = createLazyImageAsset(new URL("./assets/decor/valee/VALEE_tp.svg", document.baseURI).href);
  var forestForegroundAsset = createLazyImageAsset(new URL("./assets/decor/foret/foret_pp.svg", document.baseURI).href);
  var valleyMidgroundSequenceAssets = [
    createLazyImageAsset(new URL("./assets/decor/valee/VALEE1_dp.svg", document.baseURI).href),
    createLazyImageAsset(new URL("./assets/decor/valee/valee2_dp.svg", document.baseURI).href),
    createLazyImageAsset(new URL("./assets/decor/valee/valee3_dp.svg", document.baseURI).href),
    createLazyImageAsset(new URL("./assets/decor/valee/valee4_dp.svg", document.baseURI).href),
    createLazyImageAsset(new URL("./assets/decor/valee/valee5_dp.svg", document.baseURI).href),
    createLazyImageAsset(new URL("./assets/decor/valee/valee6_dp.svg", document.baseURI).href),
    createLazyImageAsset(new URL("./assets/decor/valee/valee7_dp.svg", document.baseURI).href),
    createLazyImageAsset(new URL("./assets/decor/valee/valee8_dp.svg", document.baseURI).href)
  ];
  var decorAssets = {
    arcade: {
      background: createLazyImageAsset(new URL("./assets/3.svg", document.baseURI).href),
      midground: createLazyImageAsset(new URL("./assets/2.svg", document.baseURI).href),
      foreground: createLazyImageAsset(new URL("./assets/1.svg", document.baseURI).href)
    },
    forest: {
      background: valleyBackgroundAsset,
      thirdground: valleyThirdgroundAsset,
      midground: createLazyImageAsset(new URL("./assets/decor/foret/foret_dp.svg", document.baseURI).href),
      foreground: forestForegroundAsset,
      sun: createLazyImageAsset(new URL("./assets/decor/foret/soleil.svg", document.baseURI).href)
    },
    valley: {
      background: valleyBackgroundAsset,
      thirdground: valleyThirdgroundAsset,
      midground: valleyMidgroundSequenceAssets[0],
      midgroundSequence: valleyMidgroundSequenceAssets,
      foreground: forestForegroundAsset
    }
  };
  function createBugAtlasView(familyName) {
    const atlas = atlasAssets[familyName];
    const animationFrames = atlas.frames.slice(0, atlas.animationFrameCount);
    return {
      frames: animationFrames,
      hitFrame: atlas.frames[atlas.hitFrameIndex],
      get image() {
        return atlas.imageAsset.image;
      },
      load() {
        return atlas.imageAsset.load();
      },
      isReady() {
        return atlas.imageAsset.isReady();
      }
    };
  }
  function collectCoreAssets() {
    const levelDecorAssets = Object.values(decorAssets).flatMap((theme) => [
      theme.background,
      theme.thirdground,
      theme.midground,
      ...theme.midgroundSequence ?? [],
      theme.foreground,
      theme.sun
    ].filter(Boolean));
    return [.../* @__PURE__ */ new Set([
      ...CORE_ATLAS_FAMILIES.map((familyName) => atlasAssets[familyName].imageAsset),
      settingsIconAsset,
      heartLifeActiveAsset,
      heartFillActiveAsset,
      heartLifeLostAsset,
      bonusHeartAsset,
      coinAsset,
      ...playerIdleIntroFrameAssets,
      ...playerIdleFrameAssets,
      ...playerRunFrameAssets,
      ...playerJumpFrameAssets,
      ...playerDoubleJumpFrameAssets,
      ...playerHitFrameAssets,
      ...playerGameOverFrameAssets,
      ...playerWinFrameAssets,
      ...levelDecorAssets,
      ...cloudAssets
    ])];
  }
  function preloadCoreAssets({ onProgress } = {}) {
    const assets = collectCoreAssets();
    const total = assets.length;
    let loaded = 0;
    onProgress?.({
      loaded,
      total,
      progress: total > 0 ? 0 : 1
    });
    return Promise.all(assets.map((asset) => asset.load().then((resource) => {
      loaded += 1;
      onProgress?.({
        loaded,
        total,
        progress: total > 0 ? loaded / total : 1
      });
      return resource;
    })));
  }
  function warmGameplayAssets() {
  }
  function isImageReady(image) {
    return Boolean(image?.complete && image.naturalWidth > 0);
  }
  function isVideoReady(video) {
    return Boolean(video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0);
  }
  function createBugVisualSetting(familyName, extra) {
    const atlasView = createBugAtlasView(familyName);
    return {
      frames: atlasView.frames,
      hitFrame: atlasView.hitFrame,
      load: atlasView.load,
      isReady: atlasView.isReady,
      get image() {
        return atlasView.image;
      },
      ...extra
    };
  }
  var bugVisualSettings = {
    "animated-bug": createBugVisualSetting("bug", {
      scale: BUG_OBSTACLE_SCALE,
      footOffset: BUG_OBSTACLE_FOOT_OFFSET,
      size: BUG_OBSTACLE_SIZE
    }),
    "animated-bug-b": createBugVisualSetting("bugB", {
      scale: BUG_B_OBSTACLE_SCALE,
      footOffset: BUG_B_OBSTACLE_FOOT_OFFSET,
      size: BUG_B_OBSTACLE_SIZE
    })
  };
  var bonusHeartSprite = createImageSprite(bonusHeartAsset);
  var coinSprite = createImageSprite(coinAsset);
  var decorSprites = {
    arcade: {
      background: createImageSprite(decorAssets.arcade.background),
      midground: createImageSprite(decorAssets.arcade.midground),
      foreground: createImageSprite(decorAssets.arcade.foreground)
    },
    forest: {
      background: createImageSprite(decorAssets.forest.background),
      thirdground: createImageSprite(decorAssets.forest.thirdground),
      midground: createImageSprite(decorAssets.forest.midground),
      foreground: createImageSprite(decorAssets.forest.foreground),
      sun: createImageSprite(decorAssets.forest.sun)
    },
    valley: {
      background: createImageSprite(decorAssets.valley.background),
      thirdground: createImageSprite(decorAssets.valley.thirdground),
      midground: createImageSprite(decorAssets.valley.midground),
      midgroundSequence: decorAssets.valley.midgroundSequence.map((asset) => createImageSprite(asset)),
      foreground: createImageSprite(decorAssets.valley.foreground)
    },
    clouds: cloudAssets.map((asset) => createImageSprite(asset))
  };
  var playerVisualAssets = {
    idleIntro: {
      frameAssets: playerIdleIntroFrameAssets,
      matte: "white",
      preserveFrameBounds: true
    },
    idle: {
      frameAssets: playerIdleFrameAssets,
      matte: "white",
      preserveFrameBounds: true
    },
    run: {
      frameAssets: playerRunFrameAssets,
      matte: "white"
    },
    jump: {
      frameAssets: playerJumpFrameAssets,
      matte: "white"
    },
    doubleJump: {
      frameAssets: playerDoubleJumpFrameAssets,
      matte: "white"
    },
    hit: {
      frameAssets: playerHitFrameAssets,
      matte: "white"
    },
    chute: {
      frameAssets: playerGameOverFrameAssets.slice(0, 5),
      matte: "white",
      preserveFrameBounds: true
    },
    gameOver: {
      frameAssets: playerGameOverFrameAssets,
      matte: "white",
      preserveFrameBounds: true
    },
    win: {
      frameAssets: playerWinFrameAssets,
      matte: "white",
      preserveFrameBounds: true
    }
  };

  // src/game/collision-system.js
  function findObstacleCollisionDetails(player, obstacles) {
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
      if (hitboxX >= obstacleHitboxX + obstacleHitboxWidth || hitboxX + hitboxWidth <= obstacleHitboxX || hitboxY >= obstacleHitboxY + obstacleHitboxHeight || currentBottom <= obstacleHitboxY) {
        continue;
      }
      const obstacleTop = obstacleHitboxY;
      const stompTolerance = Math.max(10, player.height * 0.2);
      const stomped = player.velocityY > 0 && previousBottom <= obstacleTop + stompTolerance && currentBottom >= obstacleTop;
      return {
        obstacle,
        stomped,
        obstacleTop,
        obstacleHitbox: {
          x: obstacleHitboxX,
          y: obstacleHitboxY,
          width: obstacleHitboxWidth,
          height: obstacleHitboxHeight
        }
      };
    }
    return null;
  }
  function removeEntity(list, entity) {
    const index = list.indexOf(entity);
    if (index === -1) {
      return list;
    }
    const nextList = list.slice();
    nextList.splice(index, 1);
    return nextList;
  }
  function findBonusHeartCollision(player, bonusHearts) {
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
      if (hitboxX < heartHitboxRight && hitboxRight > heartHitboxX && hitboxY < heartHitboxBottom && hitboxBottom > heartHitboxY) {
        return heart;
      }
    }
    return null;
  }
  function findCoinCollision(player, coins) {
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
      if (hitboxX < coinHitboxRight && hitboxRight > coinHitboxX && hitboxY < coinHitboxBottom && hitboxBottom > coinHitboxY) {
        return coin;
      }
    }
    return null;
  }

  // src/game/logic.js
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  function randomRange(min, max, random = Math.random) {
    return random() * (max - min) + min;
  }
  function randomChoice(list, random = Math.random) {
    return list[Math.floor(random() * list.length)];
  }
  function shuffleList(list, random = Math.random) {
    const clone = [...list];
    for (let index = clone.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
    }
    return clone;
  }
  function isAnimatedBugKind(kind) {
    return kind === "animated-bug" || kind === "animated-bug-b";
  }
  function getObstacleSpeedMultiplier(kind) {
    if (kind === "animated-bug") {
      return 1.18;
    }
    if (kind === "animated-bug-b") {
      return 0.88;
    }
    return 1;
  }
  function computeNextObstacleDelay(speed, difficulty, random = Math.random) {
    const speedFactor = Math.min(speed / difficulty.startSpeed, difficulty.maxSpeedFactor);
    return randomRange(difficulty.obstacleDelayMin, difficulty.obstacleDelayMax, random) / speedFactor;
  }
  function computeNextCoinDelay(difficulty, random = Math.random) {
    const minDelay = difficulty.coinDelayMin ?? 2.2;
    const maxDelay = difficulty.coinDelayMax ?? 3.4;
    return randomRange(minDelay, maxDelay, random);
  }
  function shouldSpawnBonusHeart(spawnedObstacleCount, difficulty) {
    return spawnedObstacleCount % difficulty.bonusHeartEvery === 0;
  }
  function shouldSpawnCoin(coinTimer, nextCoinIn) {
    return coinTimer >= nextCoinIn;
  }
  function getJumpFrameIndex(jumpAnimationTime, jumpStrength, gravity) {
    const totalJumpDuration = jumpStrength * 2 / gravity;
    const progress = Math.min(1, jumpAnimationTime / totalJumpDuration);
    const thresholds = [0.1, 0.22, 0.34, 0.46, 0.6, 0.74, 0.88];
    for (let index = 0; index < thresholds.length; index += 1) {
      if (progress < thresholds[index]) {
        return index;
      }
    }
    return 7;
  }
  function getDoubleJumpFrameIndex(jumpAnimationTime, jumpStrength, gravity) {
    const totalJumpDuration = jumpStrength * 2 / gravity;
    const progress = Math.min(1, jumpAnimationTime / totalJumpDuration);
    const thresholds = [0.16, 0.32, 0.48, 0.66, 0.84];
    for (let index = 0; index < thresholds.length; index += 1) {
      if (progress < thresholds[index]) {
        return index;
      }
    }
    return 5;
  }
  function getChuteFrameIndex(deathFallTime, deathFallDuration, frameCount) {
    const progress = Math.min(0.999, deathFallTime / deathFallDuration);
    return Math.min(frameCount - 1, Math.floor(progress * frameCount));
  }
  function getIntroThenLoopTailFrameIndex(animationTime, frameCount, introFramesPerSecond = 3.2, loopTailCount = 4, loopFramesPerSecond = introFramesPerSecond) {
    if (frameCount <= 0 || introFramesPerSecond <= 0 || loopFramesPerSecond <= 0) {
      return 0;
    }
    const loopLength = Math.max(1, Math.min(loopTailCount, frameCount));
    const introLength = Math.max(0, frameCount - loopLength);
    if (introLength === 0) {
      return Math.floor(animationTime * loopFramesPerSecond) % frameCount;
    }
    const introDuration = introLength / introFramesPerSecond;
    if (animationTime < introDuration) {
      return Math.min(introLength - 1, Math.floor(animationTime * introFramesPerSecond));
    }
    const loopStart = frameCount - loopLength;
    const loopTime = animationTime - introDuration;
    const loopStep = Math.floor(loopTime * loopFramesPerSecond);
    if (loopStep < loopLength) {
      return loopStart + loopStep;
    }
    return loopStart + (loopStep - loopLength) % loopLength;
  }
  function getWinFrameIndex(animationTime, frameCount, introFramesPerSecond = 3.2, loopTailCount = 4, loopFramesPerSecond = introFramesPerSecond) {
    return getIntroThenLoopTailFrameIndex(
      animationTime,
      frameCount,
      introFramesPerSecond,
      loopTailCount,
      loopFramesPerSecond
    );
  }
  function createClouds() {
    return [
      { x: 70, y: 100, scale: 1, speedFactor: 1 },
      { x: 300, y: 150, scale: 0.8, speedFactor: 0.85 },
      { x: 570, y: 88, scale: 1.15, speedFactor: 1.1 },
      { x: 780, y: 142, scale: 0.92, speedFactor: 0.95 }
    ];
  }

  // src/game/game-state.js
  function createGameState(difficulty, bestScore) {
    return {
      gameStarted: false,
      gameOver: false,
      pendingGameOver: false,
      pendingVictory: false,
      deathFallTime: 0,
      gameOverAnimationTime: 0,
      score: 0,
      coinsCollected: 0,
      bestScore,
      lives: MAX_LIVES,
      speed: difficulty.startSpeed,
      runTime: 0,
      obstacleTimer: 0,
      nextObstacleIn: computeNextObstacleDelay(difficulty.startSpeed, difficulty),
      coinTimer: 0,
      nextCoinIn: computeNextCoinDelay(difficulty),
      lastTime: 0,
      groundOffset: 0,
      hillFarOffset: 0,
      hillNearOffset: 0,
      thirdgroundOffset: 0,
      cloudOffset: 0,
      sparkleOffset: 0,
      hitCooldown: 0,
      headSwingTime: 0
    };
  }
  function createRuntimeState() {
    return {
      // Rotating queue avoids spawning the exact same obstacle pattern too often.
      obstacleTypeQueue: [],
      spawnedObstacleCount: 0,
      headImpactTimer: null,
      isPlayerHeadInImpactState: false,
      hitAnimationTime: null,
      didBeatRecordOnDeath: false,
      deathFallDuration: 0.96,
      inputMode: "keyboard",
      assetsReady: false,
      deferredAssetsWarmed: false,
      forestLoopCount: 0,
      isForestValleyTransitionPending: false,
      forestValleyTransitionLoopCount: 0,
      isForestValleyTransitionActive: false,
      forestValleyBridgeStartHillNearOffset: 0,
      valleyMidgroundSequenceIndex: 0
    };
  }
  function resetGameState(state, difficulty, bestScore) {
    Object.assign(state, createGameState(difficulty, bestScore));
    return state;
  }
  function resetRuntimeState(runtime) {
    runtime.obstacleTypeQueue = [];
    runtime.spawnedObstacleCount = 0;
    runtime.headImpactTimer = null;
    runtime.isPlayerHeadInImpactState = false;
    runtime.hitAnimationTime = null;
    runtime.didBeatRecordOnDeath = false;
    runtime.forestLoopCount = 0;
    runtime.isForestValleyTransitionPending = false;
    runtime.forestValleyTransitionLoopCount = 0;
    runtime.isForestValleyTransitionActive = false;
    runtime.forestValleyBridgeStartHillNearOffset = 0;
    runtime.valleyMidgroundSequenceIndex = 0;
    return runtime;
  }
  function markGameStarted(state) {
    state.gameStarted = true;
  }
  function beginDeathFall(state) {
    state.pendingGameOver = true;
    state.pendingVictory = false;
    state.deathFallTime = 0;
  }
  function beginVictoryTransition(state) {
    state.pendingVictory = true;
    state.pendingGameOver = false;
  }
  function markGameOver(state, runtime, didBeatRecordOnDeath) {
    state.pendingGameOver = false;
    state.pendingVictory = false;
    state.gameOverAnimationTime = 0;
    state.gameOver = true;
    runtime.didBeatRecordOnDeath = didBeatRecordOnDeath;
  }

  // src/game/gameplay-loop.js
  var IMPACT_SLOWDOWN_DURATION = 1.5;
  var IMPACT_MIN_TRAVEL_MULTIPLIER = 0.42;
  var IMPACT_OBSTACLE_SPAWN_PAUSE_DURATION = 1.5;
  function computeFrameDelta(timestamp, lastTime, maxDelta = 0.033) {
    if (!lastTime) {
      return {
        deltaTime: 0,
        lastTime: timestamp
      };
    }
    return {
      deltaTime: Math.min((timestamp - lastTime) / 1e3, maxDelta),
      lastTime: timestamp
    };
  }
  function createFrameAnimationUpdate(state, deltaTime) {
    return {
      headSwingTime: state.headSwingTime + deltaTime * 4.6,
      gameOverAnimationTime: state.gameOver ? state.gameOverAnimationTime + deltaTime : state.gameOverAnimationTime
    };
  }
  function createActiveGameUpdate(state, difficulty, worldWidth, deltaTime) {
    const isEndingAfterAnimation = state.pendingGameOver || state.pendingVictory;
    const runTime = isEndingAfterAnimation ? state.runTime : state.runTime + deltaTime;
    const score = isEndingAfterAnimation ? state.score : state.score + deltaTime * difficulty.scoreRate;
    const nextSpeed = isEndingAfterAnimation ? state.speed : state.speed + deltaTime * (difficulty.speedRamp + runTime * difficulty.speedRampGrowth);
    const speed = Number.isFinite(difficulty.maxSpeed) ? clamp(nextSpeed, 0, difficulty.maxSpeed) : nextSpeed;
    const hitCooldown = isEndingAfterAnimation ? state.hitCooldown : Math.max(0, state.hitCooldown - deltaTime);
    const travelSpeed = getEffectiveTravelSpeed({ speed, hitCooldown });
    return {
      runTime,
      score,
      speed,
      obstacleTimer: isEndingAfterAnimation ? state.obstacleTimer : state.obstacleTimer + deltaTime,
      coinTimer: isEndingAfterAnimation ? state.coinTimer : state.coinTimer + deltaTime,
      hitCooldown,
      groundOffset: (state.groundOffset + travelSpeed * deltaTime) % worldWidth,
      hillFarOffset: (state.hillFarOffset + travelSpeed * 0.11 * deltaTime) % worldWidth,
      hillNearOffset: (state.hillNearOffset + travelSpeed * 0.22 * deltaTime) % worldWidth,
      thirdgroundOffset: (state.thirdgroundOffset + travelSpeed * 0.165 * deltaTime) % worldWidth,
      cloudOffset: state.cloudOffset + travelSpeed * 0.14 * deltaTime,
      deathFallTime: state.pendingGameOver ? state.deathFallTime + deltaTime : state.deathFallTime
    };
  }
  function getImpactTravelMultiplier(hitCooldown, cooldownDuration = IMPACT_SLOWDOWN_DURATION) {
    if (hitCooldown <= 0 || cooldownDuration <= 0) {
      return 1;
    }
    const clampedRatio = Math.max(0, Math.min(1, hitCooldown / cooldownDuration));
    const recoveryProgress = 1 - clampedRatio;
    return IMPACT_MIN_TRAVEL_MULTIPLIER + (1 - IMPACT_MIN_TRAVEL_MULTIPLIER) * recoveryProgress;
  }
  function getEffectiveTravelSpeed(state, cooldownDuration = IMPACT_SLOWDOWN_DURATION) {
    return state.speed * getImpactTravelMultiplier(state.hitCooldown, cooldownDuration);
  }
  function isObstacleSpawnPausedAfterHit(hitCooldown, cooldownDuration = IMPACT_SLOWDOWN_DURATION, pauseDuration = IMPACT_OBSTACLE_SPAWN_PAUSE_DURATION) {
    if (hitCooldown <= 0 || cooldownDuration <= 0 || pauseDuration <= 0) {
      return false;
    }
    return hitCooldown > Math.max(0, cooldownDuration - pauseDuration);
  }
  function computeNextRunCycle(runCycle, speed, deltaTime) {
    return runCycle + deltaTime * Math.max(13.5, speed * 0.044);
  }
  function shouldSpawnObstacleNow(state, runtime) {
    return !state.pendingGameOver && !state.pendingVictory && !runtime.isPlayerHeadInImpactState && !isObstacleSpawnPausedAfterHit(state.hitCooldown ?? 0) && state.obstacleTimer >= state.nextObstacleIn;
  }
  function createPostSpawnStateUpdate(state, difficulty) {
    return {
      obstacleTimer: 0,
      nextObstacleIn: computeNextObstacleDelay(state.speed, difficulty)
    };
  }
  function shouldSpawnCoinNow(state) {
    return !state.pendingGameOver && !state.pendingVictory && shouldSpawnCoin(state.coinTimer, state.nextCoinIn);
  }
  function createPostCoinSpawnStateUpdate(difficulty) {
    return {
      coinTimer: 0,
      nextCoinIn: computeNextCoinDelay(difficulty)
    };
  }
  function shouldResolveGameplayCollisions(state) {
    return !state.pendingGameOver && !state.pendingVictory;
  }
  function shouldEndPendingGameOver(state, runtime) {
    return state.pendingGameOver && state.deathFallTime >= runtime.deathFallDuration;
  }
  function createEndGameSnapshot(score, bestScore, difficultyLabel) {
    const finalScore = Math.floor(score);
    const isNewRecord = finalScore > bestScore;
    const nextBestScore = Math.max(bestScore, finalScore);
    return {
      finalScore,
      isNewRecord,
      nextBestScore,
      title: isNewRecord ? "Super debugger !" : "Trop de bugs !",
      text: `Score final : ${finalScore}
Record : ${nextBestScore}
Mode : ${difficultyLabel}`
    };
  }

  // src/game/player-controller.js
  function createPlayer(world, difficulty) {
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
      runCycle: 0
    };
  }
  function syncPlayerDifficulty(player, difficulty) {
    player.gravity = difficulty.gravity;
    player.jumpStrength = difficulty.jumpStrength;
    player.doubleJumpMultiplier = difficulty.doubleJumpMultiplier;
  }
  function resetPlayer(player, difficulty) {
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
  function jumpPlayer(state, player) {
    if (!state.gameStarted || state.gameOver || state.lives <= 0) {
      return false;
    }
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
  function preparePlayerDeathFall(player) {
    player.previousY = player.y;
    player.isJumping = false;
    player.isDoubleJumping = false;
    player.jumpsUsed = 0;
    player.jumpAnimationTime = 0;
    player.velocityY = 0;
    player.y = player.groundY;
    return player;
  }
  function bouncePlayer(player, obstacleTopY, bounceStrength = 0.72) {
    player.y = obstacleTopY - player.height - 2;
    player.previousY = player.y;
    player.velocityY = -player.jumpStrength * bounceStrength;
    player.isJumping = true;
    player.jumpsUsed = 1;
    player.isDoubleJumping = false;
    player.jumpAnimationTime = 0;
    return player;
  }
  function updatePlayer(player, deltaTime) {
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

  // src/game/render-background.js
  var LAYER_SEAM_PATCH_WIDTH = {
    background: 10,
    thirdground: 10,
    midground: 10,
    foreground: 10
  };
  var LAYER_SEAM_OVERDRAW = 2;
  var LAYER_EDGE_TRIM = 2;
  var BRIDGE_BLEND_WIDTH = 10;
  function getLayerMetrics(world, image) {
    const sourceWidth = Math.max(1, image.naturalWidth || image.width || 1);
    const sourceHeight = Math.max(1, image.naturalHeight || image.height || 1);
    const targetWidth = world.width;
    const targetHeight = Math.max(1, Math.round(sourceHeight / sourceWidth * targetWidth));
    return {
      sourceWidth,
      sourceHeight,
      targetWidth,
      targetHeight,
      y: world.height - targetHeight
    };
  }
  function createBackgroundRenderer(ctx, world) {
    const layerBitmapCache = /* @__PURE__ */ new WeakMap();
    let skyGradient = null;
    const FOREST_CLOUD_SOURCES = [
      { x: 370, y: 42, width: 417, height: 153 },
      { x: 806, y: 177, width: 151, height: 62 },
      { x: 1150, y: 122, width: 269, height: 133 },
      { x: 1474, y: 40, width: 282, height: 102 }
    ];
    const FOREST_CLOUD_LAYOUTS = [
      { x: 0.06, y: 42, widthRatio: 0.22, speedFactor: 0.2 },
      { x: 0.29, y: 104, widthRatio: 0.1, speedFactor: 0.12 },
      { x: 0.52, y: 58, widthRatio: 0.15, speedFactor: 0.16 },
      { x: 0.79, y: 32, widthRatio: 0.16, speedFactor: 0.08 }
    ];
    const FOREST_SUN_SOURCE = {
      x: 449,
      y: 27,
      width: 141,
      height: 138
    };
    function createScratchCanvas(width, height) {
      if (typeof OffscreenCanvas !== "undefined") {
        return new OffscreenCanvas(width, height);
      }
      const canvas2 = ctx.canvas.ownerDocument.createElement("canvas");
      canvas2.width = width;
      canvas2.height = height;
      return canvas2;
    }
    function getPreparedLayer(sprite, seamPatchWidth = 0) {
      if (!sprite || !isImageReady(sprite.image)) {
        return null;
      }
      const metrics = getLayerMetrics(world, sprite.image);
      const seamWidth = seamPatchWidth > 0 ? Math.min(metrics.targetWidth, seamPatchWidth + LAYER_SEAM_OVERDRAW * 2) : 0;
      const sourceTrim = seamWidth > 0 ? Math.min(LAYER_EDGE_TRIM, Math.max(0, Math.floor((metrics.sourceWidth - 1) / 2))) : 0;
      const trimmedSourceWidth = Math.max(1, metrics.sourceWidth - sourceTrim * 2);
      const cacheKey = `${metrics.targetWidth}x${metrics.targetHeight}:${seamWidth}`;
      const cachedLayer = layerBitmapCache.get(sprite.image);
      if (cachedLayer?.key === cacheKey) {
        return {
          ...metrics,
          canvas: cachedLayer.canvas,
          seamWidth
        };
      }
      const canvas2 = createScratchCanvas(metrics.targetWidth + seamWidth * 2, metrics.targetHeight);
      const scratchCtx = canvas2.getContext("2d");
      scratchCtx.imageSmoothingEnabled = true;
      scratchCtx.clearRect(0, 0, canvas2.width, canvas2.height);
      scratchCtx.drawImage(
        sprite.image,
        sourceTrim,
        0,
        trimmedSourceWidth,
        metrics.sourceHeight,
        seamWidth,
        0,
        metrics.targetWidth,
        metrics.targetHeight
      );
      if (seamWidth > 0) {
        const sourcePatchWidth = Math.min(trimmedSourceWidth, seamWidth);
        scratchCtx.drawImage(
          sprite.image,
          metrics.sourceWidth - sourceTrim - sourcePatchWidth,
          0,
          sourcePatchWidth,
          metrics.sourceHeight,
          0,
          0,
          seamWidth,
          metrics.targetHeight
        );
        scratchCtx.drawImage(
          sprite.image,
          sourceTrim,
          0,
          sourcePatchWidth,
          metrics.sourceHeight,
          seamWidth + metrics.targetWidth,
          0,
          seamWidth,
          metrics.targetHeight
        );
      }
      layerBitmapCache.set(sprite.image, {
        key: cacheKey,
        canvas: canvas2
      });
      return {
        ...metrics,
        canvas: canvas2,
        seamWidth
      };
    }
    function drawSky() {
      if (!skyGradient) {
        skyGradient = ctx.createLinearGradient(0, 0, 0, world.height);
        skyGradient.addColorStop(0, "#ffb3e6");
        skyGradient.addColorStop(0.52, "#c9c2ff");
        skyGradient.addColorStop(1, "#8fdcff");
      }
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, world.width, world.height);
    }
    function drawScrollingLayer(sprite, offset, seamPatchWidth = 0) {
      const preparedLayer = getPreparedLayer(sprite, seamPatchWidth);
      if (!preparedLayer) {
        return false;
      }
      return drawPreparedLayer(preparedLayer, offset);
    }
    function drawPreparedLayer(preparedLayer, offset) {
      const wrappedOffset = (offset % preparedLayer.targetWidth + preparedLayer.targetWidth) % preparedLayer.targetWidth;
      const snappedOffset = Math.round(wrappedOffset);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      for (let copy = -1; copy <= 2; copy += 1) {
        const x = copy * preparedLayer.targetWidth - snappedOffset - preparedLayer.seamWidth;
        ctx.drawImage(
          preparedLayer.canvas,
          x,
          preparedLayer.y,
          preparedLayer.targetWidth + preparedLayer.seamWidth * 2,
          preparedLayer.targetHeight
        );
      }
      ctx.restore();
      return true;
    }
    function drawPreparedLayerSequence(currentLayer, nextLayer, offset, blendWidth = 0) {
      if (!currentLayer || !nextLayer) {
        return false;
      }
      const wrappedOffset = (offset % currentLayer.targetWidth + currentLayer.targetWidth) % currentLayer.targetWidth;
      const snappedOffset = Math.round(wrappedOffset);
      const normalizedBlendWidth = Math.max(
        0,
        Math.min(
          Math.round(blendWidth),
          Math.floor(currentLayer.targetWidth / 4),
          Math.floor(nextLayer.targetWidth / 4)
        )
      );
      const currentX = -snappedOffset;
      const nextVisibleX = currentLayer.targetWidth - snappedOffset;
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(
        currentLayer.canvas,
        currentLayer.seamWidth,
        0,
        currentLayer.targetWidth,
        currentLayer.targetHeight,
        currentX,
        currentLayer.y,
        currentLayer.targetWidth,
        currentLayer.targetHeight
      );
      if (normalizedBlendWidth > 0) {
        const overlapStartX = nextVisibleX - normalizedBlendWidth;
        const chunkCount = 12;
        const baseChunkWidth = normalizedBlendWidth / chunkCount;
        for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
          const chunkStart = Math.round(chunkIndex * baseChunkWidth);
          const chunkEnd = Math.round((chunkIndex + 1) * baseChunkWidth);
          const chunkWidth = Math.max(1, chunkEnd - chunkStart);
          ctx.globalAlpha = (chunkIndex + 1) / chunkCount;
          ctx.drawImage(
            nextLayer.canvas,
            nextLayer.seamWidth + chunkStart,
            0,
            chunkWidth,
            nextLayer.targetHeight,
            overlapStartX + chunkStart,
            nextLayer.y,
            chunkWidth,
            nextLayer.targetHeight
          );
        }
        ctx.globalAlpha = 1;
        ctx.drawImage(
          nextLayer.canvas,
          nextLayer.seamWidth + normalizedBlendWidth,
          0,
          nextLayer.targetWidth - normalizedBlendWidth + nextLayer.seamWidth,
          nextLayer.targetHeight,
          nextVisibleX,
          nextLayer.y,
          nextLayer.targetWidth - normalizedBlendWidth + nextLayer.seamWidth,
          nextLayer.targetHeight
        );
      } else {
        ctx.drawImage(
          nextLayer.canvas,
          nextLayer.seamWidth,
          0,
          nextLayer.targetWidth,
          nextLayer.targetHeight,
          nextVisibleX,
          nextLayer.y,
          nextLayer.targetWidth,
          nextLayer.targetHeight
        );
      }
      ctx.restore();
      return true;
    }
    function drawPreparedNextLayer(currentLayer, nextLayer, offset) {
      if (!currentLayer || !nextLayer) {
        return false;
      }
      const wrappedOffset = (offset % currentLayer.targetWidth + currentLayer.targetWidth) % currentLayer.targetWidth;
      const snappedOffset = Math.round(wrappedOffset);
      const nextX = currentLayer.targetWidth - snappedOffset - nextLayer.seamWidth;
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(
        nextLayer.canvas,
        nextX,
        nextLayer.y,
        nextLayer.targetWidth + nextLayer.seamWidth * 2,
        nextLayer.targetHeight
      );
      ctx.restore();
      return true;
    }
    function drawRightEnteringLayer(sprite, offset, revealProgress, seamPatchWidth = 0) {
      const preparedLayer = getPreparedLayer(sprite, seamPatchWidth);
      if (!preparedLayer) {
        return false;
      }
      const clampedProgress = Math.max(0, Math.min(1, revealProgress));
      const revealWidth = Math.round(world.width * clampedProgress);
      if (revealWidth <= 0) {
        return false;
      }
      const revealStartX = world.width - revealWidth;
      const wrappedOffset = (offset % preparedLayer.targetWidth + preparedLayer.targetWidth) % preparedLayer.targetWidth;
      const snappedOffset = Math.round(wrappedOffset);
      ctx.save();
      ctx.beginPath();
      ctx.rect(revealStartX, 0, revealWidth, world.height);
      ctx.clip();
      ctx.imageSmoothingEnabled = true;
      for (let copy = -1; copy <= 2; copy += 1) {
        const x = revealStartX + copy * preparedLayer.targetWidth - snappedOffset - preparedLayer.seamWidth;
        ctx.drawImage(
          preparedLayer.canvas,
          x,
          preparedLayer.y,
          preparedLayer.targetWidth + preparedLayer.seamWidth * 2,
          preparedLayer.targetHeight
        );
      }
      ctx.restore();
      return true;
    }
    function drawCloudFallbacks(clouds, state) {
      for (let index = 0; index < clouds.length; index += 1) {
        const cloud = clouds[index];
        const cloudRadius = 62 * cloud.scale;
        const wrapWidth = world.width + 320;
        const travelDistance = state.cloudOffset * cloud.speedFactor % wrapWidth;
        const baseX = cloud.x - travelDistance;
        for (let copy = -1; copy <= 1; copy += 1) {
          const x = baseX + copy * wrapWidth;
          if (x < -cloudRadius - 40 || x > world.width + cloudRadius + 40) {
            continue;
          }
          ctx.save();
          ctx.translate(x, cloud.y);
          ctx.scale(cloud.scale, cloud.scale);
          ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
          ctx.beginPath();
          ctx.arc(-36, 4, 26, 0, Math.PI * 2);
          ctx.arc(0, -8, 34, 0, Math.PI * 2);
          ctx.arc(34, 6, 24, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          if (index % 2 === 0) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
            ctx.fillRect(-12, 28, 20, 6);
          }
          ctx.restore();
        }
      }
    }
    function drawClouds(clouds, state) {
      const referenceCloudSprite = decorSprites.clouds[0];
      if (!isImageReady(referenceCloudSprite?.image)) {
        drawCloudFallbacks(clouds, state);
        return;
      }
      for (let index = 0; index < clouds.length; index += 1) {
        const cloud = clouds[index];
        const cloudSprite = decorSprites.clouds[index % decorSprites.clouds.length];
        drawScrollingLayer(cloudSprite, state.cloudOffset * cloud.speedFactor);
      }
    }
    function drawWrappedSkySprite(sprite, source, baseX, y, drawWidth, motionOffset, alpha = 1) {
      if (!sprite || !isImageReady(sprite.image)) {
        return;
      }
      const drawHeight = Math.round(source.height / source.width * drawWidth);
      const wrapWidth = world.width + drawWidth + 240;
      const travelDistance = (motionOffset % wrapWidth + wrapWidth) % wrapWidth;
      ctx.save();
      ctx.globalAlpha = alpha;
      for (let copy = -1; copy <= 1; copy += 1) {
        const x = Math.round(baseX - travelDistance + copy * wrapWidth);
        if (x > world.width + drawWidth + 40 || x + drawWidth < -40) {
          continue;
        }
        ctx.drawImage(
          sprite.image,
          source.x,
          source.y,
          source.width,
          source.height,
          x,
          y,
          drawWidth,
          drawHeight
        );
      }
      ctx.restore();
    }
    function drawForestClouds(state) {
      for (let index = 0; index < FOREST_CLOUD_LAYOUTS.length; index += 1) {
        const layout = FOREST_CLOUD_LAYOUTS[index];
        const cloudSprite = decorSprites.clouds[index];
        const source = FOREST_CLOUD_SOURCES[index];
        if (!source || !cloudSprite || !isImageReady(cloudSprite.image)) {
          return;
        }
        const drawWidth = Math.round(world.width * layout.widthRatio);
        drawWrappedSkySprite(
          cloudSprite,
          source,
          Math.round(world.width * layout.x),
          layout.y,
          drawWidth,
          state.cloudOffset * layout.speedFactor,
          0.98
        );
      }
    }
    function drawForestSun(levelDecor, state) {
      const sunSprite = levelDecor.sun;
      if (!sunSprite || !isImageReady(sunSprite.image)) {
        return;
      }
      const drawWidth = Math.round(Math.max(110, Math.min(world.width * 0.11, 164)));
      drawWrappedSkySprite(
        sunSprite,
        FOREST_SUN_SOURCE,
        Math.round(world.width * 0.72),
        36,
        drawWidth,
        state.cloudOffset * 0.045,
        0.98
      );
    }
    function drawSharedSkyDecor(state) {
      drawForestSun(decorSprites.forest, state);
      drawForestClouds(state);
    }
    function drawForestValleyBridge(state, runtime) {
      const forestBackgroundLayer = getPreparedLayer(
        decorSprites.forest.background,
        LAYER_SEAM_PATCH_WIDTH.background
      );
      const forestMidgroundLayer = getPreparedLayer(decorSprites.forest.midground);
      const valleyMidgroundLayer = getPreparedLayer(
        decorSprites.valley.midground
      );
      drawPreparedLayer(forestBackgroundLayer, state.hillFarOffset);
      drawSharedSkyDecor(state);
      drawScrollingLayer(
        decorSprites.forest.thirdground,
        state.thirdgroundOffset,
        LAYER_SEAM_PATCH_WIDTH.thirdground
      );
      drawPreparedLayerSequence(
        forestMidgroundLayer,
        valleyMidgroundLayer,
        state.hillNearOffset,
        BRIDGE_BLEND_WIDTH
      );
      drawScrollingLayer(
        decorSprites.forest.foreground,
        state.groundOffset,
        LAYER_SEAM_PATCH_WIDTH.foreground
      );
    }
    function drawMidgroundSequence(sequence, index, offset) {
      const currentSprite = sequence[index] ?? sequence[sequence.length - 1];
      const nextSprite = sequence[index + 1] ?? null;
      if (!currentSprite) {
        return;
      }
      if (!nextSprite) {
        drawScrollingLayer(
          currentSprite,
          offset,
          LAYER_SEAM_PATCH_WIDTH.midground
        );
        return;
      }
      const currentLayer = getPreparedLayer(
        currentSprite,
        LAYER_SEAM_PATCH_WIDTH.midground
      );
      const nextLayer = getPreparedLayer(
        nextSprite,
        LAYER_SEAM_PATCH_WIDTH.midground
      );
      drawPreparedLayerSequence(currentLayer, nextLayer, offset, 0);
    }
    function drawValleySequence(state, runtime) {
      const levelDecor = decorSprites.valley;
      drawScrollingLayer(
        levelDecor.background,
        state.hillFarOffset,
        LAYER_SEAM_PATCH_WIDTH.background
      );
      drawSharedSkyDecor(state);
      drawScrollingLayer(
        levelDecor.thirdground,
        state.thirdgroundOffset,
        LAYER_SEAM_PATCH_WIDTH.thirdground
      );
      drawMidgroundSequence(
        levelDecor.midgroundSequence,
        runtime.valleyMidgroundSequenceIndex,
        state.hillNearOffset
      );
      drawScrollingLayer(
        levelDecor.foreground,
        state.groundOffset,
        LAYER_SEAM_PATCH_WIDTH.foreground
      );
    }
    function draw({ state, runtime, clouds, levelId }) {
      if (levelId === "forest-valley-bridge") {
        drawForestValleyBridge(state, runtime);
        return;
      }
      const levelDecor = decorSprites[levelId] ?? decorSprites.arcade;
      if (levelId === "forest") {
        drawScrollingLayer(
          levelDecor.background,
          state.hillFarOffset,
          LAYER_SEAM_PATCH_WIDTH.background
        );
        drawSharedSkyDecor(state);
        drawScrollingLayer(
          levelDecor.thirdground,
          state.thirdgroundOffset,
          LAYER_SEAM_PATCH_WIDTH.thirdground
        );
        drawScrollingLayer(
          levelDecor.midground,
          state.hillNearOffset,
          LAYER_SEAM_PATCH_WIDTH.midground
        );
        drawScrollingLayer(
          levelDecor.foreground,
          state.groundOffset,
          LAYER_SEAM_PATCH_WIDTH.foreground
        );
        return;
      }
      if (levelId === "valley") {
        drawValleySequence(state, runtime);
        return;
      }
      drawSky();
      drawSharedSkyDecor(state);
      drawScrollingLayer(
        levelDecor.background,
        state.hillFarOffset,
        LAYER_SEAM_PATCH_WIDTH.background
      );
      drawScrollingLayer(
        levelDecor.midground,
        state.hillNearOffset,
        LAYER_SEAM_PATCH_WIDTH.midground
      );
      drawScrollingLayer(
        levelDecor.foreground,
        state.groundOffset,
        LAYER_SEAM_PATCH_WIDTH.foreground
      );
    }
    return {
      draw
    };
  }

  // src/game/render-effects.js
  function createEffectsRenderer(ctx) {
    const canvasWidth = ctx.canvas.width;
    function drawObstacleFallback(width, height) {
      ctx.fillStyle = "rgba(22, 50, 79, 0.9)";
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, width * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
      ctx.beginPath();
      ctx.arc(width * 0.38, height * 0.34, width * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
    function drawBonusHeartFallback(width, height) {
      ctx.fillStyle = "#e63572";
      ctx.beginPath();
      ctx.moveTo(width * 0.5, height * 0.9);
      ctx.bezierCurveTo(width * 0.1, height * 0.64, width * 0.08, height * 0.24, width * 0.3, height * 0.18);
      ctx.bezierCurveTo(width * 0.44, height * 0.12, width * 0.5, height * 0.24, width * 0.5, height * 0.28);
      ctx.bezierCurveTo(width * 0.5, height * 0.24, width * 0.56, height * 0.12, width * 0.7, height * 0.18);
      ctx.bezierCurveTo(width * 0.92, height * 0.24, width * 0.9, height * 0.64, width * 0.5, height * 0.9);
      ctx.closePath();
      ctx.fill();
    }
    function drawCoinFallback(width, height) {
      const radius = Math.min(width, height) * 0.48;
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      ctx.fillStyle = "#ffcf4d";
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 244, 204, 0.92)";
      ctx.lineWidth = Math.max(2, width * 0.08);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.72, 0, Math.PI * 2);
      ctx.stroke();
    }
    function drawBugHitEffects(bugHitEffects) {
      for (let index = 0; index < bugHitEffects.length; index += 1) {
        const effect = bugHitEffects[index];
        const alpha = clamp(effect.timeLeft / 0.42, 0, 1);
        if (alpha <= 0 || effect.x + effect.width <= 0 || effect.x >= canvasWidth) {
          continue;
        }
        const settings = bugVisualSettings[effect.kind];
        const hitFrame = settings.hitFrame;
        const sourceImage = settings.image;
        const drawHeight = effect.height * settings.scale;
        const drawWidth = drawHeight * (hitFrame.width / hitFrame.height);
        const drawX = (effect.width - drawWidth) * 0.5;
        const drawY = effect.height - drawHeight + settings.footOffset;
        ctx.save();
        ctx.translate(effect.x, effect.y);
        ctx.globalAlpha = alpha;
        ctx.shadowColor = "rgba(22, 50, 79, 0.18)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;
        if (isImageReady(sourceImage)) {
          ctx.drawImage(
            sourceImage,
            hitFrame.x,
            hitFrame.y,
            hitFrame.width,
            hitFrame.height,
            drawX,
            drawY,
            drawWidth,
            drawHeight
          );
        } else {
          drawObstacleFallback(effect.width, effect.height);
        }
        ctx.restore();
      }
    }
    function drawBonusHearts(bonusHearts) {
      for (let index = 0; index < bonusHearts.length; index += 1) {
        const heart = bonusHearts[index];
        if (heart.x + heart.width <= 0 || heart.x >= canvasWidth) {
          continue;
        }
        const floatOffset = Math.sin(heart.floatTime) * 8;
        const pulseScale = 1 + Math.sin(heart.floatTime * 2.4) * 0.1;
        const pulseWidth = heart.width * pulseScale;
        const pulseHeight = heart.height * pulseScale;
        const pulseX = -(pulseWidth - heart.width) * 0.5;
        const pulseY = -(pulseHeight - heart.height) * 0.5;
        ctx.save();
        ctx.translate(heart.x, heart.y + floatOffset);
        ctx.shadowColor = "rgba(230, 53, 114, 0.28)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;
        if (isImageReady(bonusHeartSprite.image)) {
          ctx.drawImage(bonusHeartSprite.image, pulseX, pulseY, pulseWidth, pulseHeight);
        } else {
          ctx.save();
          ctx.translate(heart.width * 0.5, heart.height * 0.5);
          ctx.scale(pulseScale, pulseScale);
          ctx.translate(-heart.width * 0.5, -heart.height * 0.5);
          drawBonusHeartFallback(heart.width, heart.height);
          ctx.restore();
        }
        ctx.restore();
      }
    }
    function drawCoins(coins) {
      for (let index = 0; index < coins.length; index += 1) {
        const coin = coins[index];
        if (coin.x + coin.width <= 0 || coin.x >= canvasWidth) {
          continue;
        }
        const floatOffset = Math.sin(coin.floatTime) * 8;
        const pulseScale = 1 + Math.sin(coin.floatTime * 2) * 0.06;
        const rotation = Math.sin(coin.spinTime) * 0.16;
        const drawWidth = coin.width * pulseScale;
        const drawHeight = coin.height * pulseScale;
        ctx.save();
        ctx.translate(coin.x + coin.width * 0.5, coin.y + floatOffset + coin.height * 0.5);
        ctx.rotate(rotation);
        ctx.shadowColor = "rgba(255, 205, 79, 0.34)";
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 6;
        if (isImageReady(coinSprite.image)) {
          ctx.drawImage(
            coinSprite.image,
            -drawWidth * 0.5,
            -drawHeight * 0.5,
            drawWidth,
            drawHeight
          );
        } else {
          ctx.translate(-coin.width * 0.5, -coin.height * 0.5);
          drawCoinFallback(coin.width, coin.height);
        }
        ctx.restore();
      }
    }
    function draw({ coins, bonusHearts, bugHitEffects }) {
      drawBugHitEffects(bugHitEffects);
      drawCoins(coins);
      drawBonusHearts(bonusHearts);
    }
    return {
      draw
    };
  }

  // src/game/render-obstacles.js
  function createObstacleRenderer(ctx) {
    const gradientCache = /* @__PURE__ */ new Map();
    function createObstacleFill(obstacle) {
      const palette = obstacle.palette ?? obstaclePalette[0];
      if (palette.kind === "gradient") {
        const gradientKey = `${palette.start}:${palette.end}:${obstacle.width}:${obstacle.height}`;
        const cachedGradient = gradientCache.get(gradientKey);
        if (cachedGradient) {
          return cachedGradient;
        }
        const gradient = ctx.createLinearGradient(0, 0, obstacle.width, obstacle.height);
        gradient.addColorStop(0, palette.start);
        gradient.addColorStop(1, palette.end);
        gradientCache.set(gradientKey, gradient);
        return gradient;
      }
      return palette.value;
    }
    function drawObstacleFallback(width, height, obstacle) {
      ctx.fillStyle = obstacle.kind === "animated-ball" ? createObstacleFill(obstacle) : "rgba(22, 50, 79, 0.9)";
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, width * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
      ctx.beginPath();
      ctx.arc(width * 0.38, height * 0.34, width * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
    function drawAnimatedBallObstacle(obstacle, state) {
      const cycle = (state.headSwingTime * 1.85 + obstacle.animationOffset) % (Math.PI * 2);
      const bounceProgress = (Math.sin(cycle) + 1) / 2;
      const shadowScale = 0.7 + bounceProgress * 0.4;
      const ballHeight = obstacle.height * (0.68 + bounceProgress * 0.28);
      const ballWidth = obstacle.width * (0.52 + (1 - bounceProgress) * 0.12);
      const groundY = obstacle.height;
      const ballY = groundY - ballHeight - bounceProgress * obstacle.height * 0.58;
      ctx.save();
      ctx.translate(obstacle.x, obstacle.y);
      ctx.fillStyle = "rgba(22, 50, 79, 0.16)";
      ctx.beginPath();
      ctx.ellipse(
        obstacle.width * 0.5,
        obstacle.height * 0.98,
        obstacle.width * 0.24 * shadowScale,
        obstacle.height * 0.07 * shadowScale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.fillStyle = createObstacleFill(obstacle);
      ctx.beginPath();
      ctx.ellipse(
        obstacle.width * 0.5,
        ballY + ballHeight * 0.5,
        ballWidth * 0.5,
        ballHeight * 0.5,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.ellipse(
        obstacle.width * 0.42,
        ballY + ballHeight * 0.32,
        ballWidth * 0.16,
        ballHeight * 0.12,
        -0.3,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
    function drawAnimatedBugObstacle(obstacle) {
      const settings = bugVisualSettings[obstacle.kind];
      const frameIndex = Math.floor(obstacle.animationTime * 12) % settings.frames.length;
      const frame = settings.frames[frameIndex];
      const drawHeight = obstacle.height * settings.scale;
      const drawWidth = drawHeight * (frame.width / frame.height);
      const drawX = (obstacle.width - drawWidth) * 0.5;
      const drawY = obstacle.height - drawHeight + settings.footOffset;
      const sourceImage = settings.image;
      ctx.save();
      ctx.translate(obstacle.x, obstacle.y);
      ctx.shadowColor = "rgba(22, 50, 79, 0.18)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
      if (isImageReady(sourceImage)) {
        ctx.drawImage(
          sourceImage,
          frame.x,
          frame.y,
          frame.width,
          frame.height,
          drawX,
          drawY,
          drawWidth,
          drawHeight
        );
      } else {
        drawObstacleFallback(obstacle.width, obstacle.height, obstacle);
      }
      ctx.restore();
    }
    function draw(obstacles, state) {
      const canvasWidth = ctx.canvas.width;
      for (let index = 0; index < obstacles.length; index += 1) {
        const obstacle = obstacles[index];
        if (obstacle.x + obstacle.width <= 0 || obstacle.x >= canvasWidth) {
          continue;
        }
        if (obstacle.kind === "animated-ball") {
          drawAnimatedBallObstacle(obstacle, state);
          continue;
        }
        if (isAnimatedBugKind(obstacle.kind)) {
          drawAnimatedBugObstacle(obstacle);
          continue;
        }
        ctx.save();
        ctx.translate(obstacle.x, obstacle.y);
        ctx.shadowColor = "rgba(22, 50, 79, 0.18)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;
        drawObstacleFallback(obstacle.width, obstacle.height, obstacle);
        ctx.restore();
      }
    }
    return {
      draw
    };
  }

  // src/game/player-visual-state.js
  var PLAYER_VISUAL_HEIGHT = 206;
  var PLAYER_LAYOUTS = {
    homeIdle: {
      width: 186,
      height: 220,
      offsetY: -14,
      groundOffsetY: 10
    },
    idle: {
      width: 186,
      height: 220,
      offsetY: -14,
      groundOffsetY: 10
    },
    run: {
      width: 178,
      height: PLAYER_VISUAL_HEIGHT,
      offsetY: -2,
      groundOffsetY: 10
    },
    jump: {
      width: 150,
      height: PLAYER_VISUAL_HEIGHT,
      offsetY: -2,
      groundOffsetY: 10
    },
    doubleJump: {
      width: 176,
      height: 190,
      offsetY: 6,
      groundOffsetY: 10
    },
    hit: {
      width: 172,
      height: PLAYER_VISUAL_HEIGHT,
      offsetY: -2,
      groundOffsetY: 10
    },
    falling: {
      width: 184,
      height: 202,
      offsetY: 0,
      groundOffsetY: 12
    },
    gameOver: {
      width: 212,
      height: 226,
      offsetY: -14,
      groundOffsetY: 10
    },
    win: {
      width: 186,
      height: 238,
      offsetY: -6,
      groundOffsetY: 10
    }
  };
  var HIT_ANIMATION_FRAMES_PER_SECOND = 8;
  var GAME_OVER_ANIMATION_INTRO_FRAMES_PER_SECOND = 12;
  var GAME_OVER_ANIMATION_LOOP_FRAMES_PER_SECOND = 12;
  var GAME_OVER_ANIMATION_LOOP_TAIL_COUNT = 7;
  var GAME_OVER_FRAME_SCALE_OVERRIDES = {
    14: 1.13,
    15: 1.13,
    16: 1.18,
    17: 1.22,
    18: 1.18
  };
  var WIN_ANIMATION_INTRO_FRAMES_PER_SECOND = 6.2;
  var WIN_ANIMATION_LOOP_FRAMES_PER_SECOND = 5.4;
  var WIN_ANIMATION_LOOP_TAIL_COUNT = 4;
  var HOME_IDLE_ANIMATION_FRAMES_PER_SECOND = 5;
  var IDLE_ANIMATION_FRAMES_PER_SECOND = 4;
  var PLAYER_FRAME_COUNTS = {
    idleIntro: 57,
    run: 15,
    jump: 8,
    doubleJump: 6,
    chute: 5,
    idle: 26,
    hit: 4,
    gameOver: 47,
    win: 83
  };
  function getLoopingFrameIndex(animationTime, frameCount, framesPerSecond) {
    if (frameCount <= 0 || framesPerSecond <= 0) {
      return 0;
    }
    return Math.floor(animationTime * framesPerSecond) % frameCount;
  }
  var PLAYER_VISUAL_STATES = {
    IDLE: "idle",
    RUNNING: "running",
    JUMPING: "jumping",
    DOUBLE_JUMPING: "double-jumping",
    HIT: "hit",
    FALLING: "falling",
    GAME_OVER: "game-over",
    VICTORY: "victory"
  };
  function resolvePlayerVisualState(state, player, runtime) {
    if (state.gameOver) {
      return runtime.didBeatRecordOnDeath ? PLAYER_VISUAL_STATES.VICTORY : PLAYER_VISUAL_STATES.GAME_OVER;
    }
    if (!state.gameStarted) {
      return PLAYER_VISUAL_STATES.IDLE;
    }
    if (state.pendingGameOver) {
      return PLAYER_VISUAL_STATES.FALLING;
    }
    if (runtime.hitAnimationTime !== null) {
      return PLAYER_VISUAL_STATES.HIT;
    }
    if (player.isJumping) {
      return player.isDoubleJumping ? PLAYER_VISUAL_STATES.DOUBLE_JUMPING : PLAYER_VISUAL_STATES.JUMPING;
    }
    return PLAYER_VISUAL_STATES.RUNNING;
  }
  function createPlayerAnimationFromVisualState(visualState, state, player, runtime) {
    switch (visualState) {
      case PLAYER_VISUAL_STATES.VICTORY:
        return {
          visualState,
          sheet: "win",
          frameIndex: getWinFrameIndex(
            state.gameOverAnimationTime,
            PLAYER_FRAME_COUNTS.win,
            WIN_ANIMATION_INTRO_FRAMES_PER_SECOND,
            WIN_ANIMATION_LOOP_TAIL_COUNT,
            WIN_ANIMATION_LOOP_FRAMES_PER_SECOND
          ),
          ...PLAYER_LAYOUTS.win,
          allowSwing: false,
          swingAmplitude: 0,
          baseTilt: 0,
          tiltAmplitude: 0.01,
          bobAmplitude: 2,
          strideAmplitude: 0,
          motionPhase: state.headSwingTime * 1.2
        };
      case PLAYER_VISUAL_STATES.GAME_OVER: {
        const frameIndex = getIntroThenLoopTailFrameIndex(
          state.gameOverAnimationTime,
          PLAYER_FRAME_COUNTS.gameOver,
          GAME_OVER_ANIMATION_INTRO_FRAMES_PER_SECOND,
          GAME_OVER_ANIMATION_LOOP_TAIL_COUNT,
          GAME_OVER_ANIMATION_LOOP_FRAMES_PER_SECOND
        );
        return {
          visualState,
          sheet: "gameOver",
          frameIndex,
          ...PLAYER_LAYOUTS.gameOver,
          allowSwing: false,
          swingAmplitude: 0,
          baseTilt: 0.03,
          tiltAmplitude: 0.015,
          bobAmplitude: 0,
          strideAmplitude: 0,
          motionPhase: state.headSwingTime * 1.4,
          visualScale: GAME_OVER_FRAME_SCALE_OVERRIDES[frameIndex] ?? 1
        };
      }
      case PLAYER_VISUAL_STATES.FALLING:
        return {
          visualState,
          sheet: "chute",
          frameIndex: getChuteFrameIndex(
            state.deathFallTime,
            runtime.deathFallDuration,
            PLAYER_FRAME_COUNTS.chute
          ),
          ...PLAYER_LAYOUTS.falling,
          allowSwing: false,
          swingAmplitude: 0,
          baseTilt: 0,
          tiltAmplitude: 0,
          bobAmplitude: 0,
          strideAmplitude: 0,
          motionPhase: 0
        };
      case PLAYER_VISUAL_STATES.HIT:
        return {
          visualState,
          sheet: "hit",
          frameIndex: Math.min(
            PLAYER_FRAME_COUNTS.hit - 1,
            Math.floor((runtime.hitAnimationTime ?? 0) * HIT_ANIMATION_FRAMES_PER_SECOND)
          ),
          ...PLAYER_LAYOUTS.hit,
          allowSwing: false,
          swingAmplitude: 0,
          baseTilt: 0,
          tiltAmplitude: 0,
          bobAmplitude: 0,
          strideAmplitude: 0,
          motionPhase: 0
        };
      case PLAYER_VISUAL_STATES.DOUBLE_JUMPING:
        return {
          visualState,
          sheet: "doubleJump",
          frameIndex: getDoubleJumpFrameIndex(player.jumpAnimationTime, player.jumpStrength, player.gravity),
          ...PLAYER_LAYOUTS.doubleJump,
          allowSwing: false,
          swingAmplitude: 0,
          baseTilt: 0.04,
          tiltAmplitude: 0.025,
          bobAmplitude: 0,
          strideAmplitude: 0,
          motionPhase: 0
        };
      case PLAYER_VISUAL_STATES.JUMPING:
        return {
          visualState,
          sheet: "jump",
          frameIndex: getJumpFrameIndex(player.jumpAnimationTime, player.jumpStrength, player.gravity),
          ...PLAYER_LAYOUTS.jump,
          allowSwing: false,
          swingAmplitude: 0,
          baseTilt: 0.015,
          tiltAmplitude: 0.015,
          bobAmplitude: 0,
          strideAmplitude: 0,
          motionPhase: 0
        };
      case PLAYER_VISUAL_STATES.RUNNING: {
        const runFrameProgress = player.runCycle % PLAYER_FRAME_COUNTS.run;
        const runPhase = runFrameProgress / PLAYER_FRAME_COUNTS.run * Math.PI * 2;
        return {
          visualState,
          sheet: "run",
          frameIndex: Math.floor(runFrameProgress) % PLAYER_FRAME_COUNTS.run,
          ...PLAYER_LAYOUTS.run,
          allowSwing: false,
          swingAmplitude: 0,
          baseTilt: 0.04,
          tiltAmplitude: 0.035,
          bobAmplitude: 7,
          strideAmplitude: 8,
          motionPhase: runPhase
        };
      }
      case PLAYER_VISUAL_STATES.IDLE:
      default: {
        if (visualState === PLAYER_VISUAL_STATES.IDLE) {
          return {
            visualState,
            sheet: "idleIntro",
            frameIndex: getLoopingFrameIndex(
              state.headSwingTime,
              PLAYER_FRAME_COUNTS.idleIntro,
              HOME_IDLE_ANIMATION_FRAMES_PER_SECOND
            ),
            ...PLAYER_LAYOUTS.homeIdle,
            allowSwing: false,
            swingAmplitude: 0,
            baseTilt: 0,
            tiltAmplitude: 0,
            bobAmplitude: 0,
            strideAmplitude: 0,
            motionPhase: 0
          };
        }
        return {
          visualState,
          sheet: "idle",
          frameIndex: getLoopingFrameIndex(
            state.headSwingTime,
            PLAYER_FRAME_COUNTS.idle,
            IDLE_ANIMATION_FRAMES_PER_SECOND
          ),
          ...PLAYER_LAYOUTS.idle,
          allowSwing: false,
          swingAmplitude: 0,
          baseTilt: 0,
          tiltAmplitude: 0,
          bobAmplitude: 0,
          strideAmplitude: 0,
          motionPhase: 0
        };
      }
    }
  }

  // src/game/render-player.js
  function clamp2(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  function createCanvas(width, height) {
    const canvas2 = document.createElement("canvas");
    canvas2.width = width;
    canvas2.height = height;
    return canvas2;
  }
  function getOpaqueBounds(canvas2) {
    const ctx = canvas2.getContext("2d", { willReadFrequently: true });
    const { width, height } = canvas2;
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha === 0) {
          continue;
        }
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < minX || maxY < minY) {
      return {
        x: 0,
        y: 0,
        width,
        height
      };
    }
    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }
  function cropCanvasToBounds(canvas2, bounds) {
    const trimmedWidth = Math.max(1, bounds.width);
    const trimmedHeight = Math.max(1, bounds.height);
    const trimmedCanvas = createCanvas(trimmedWidth, trimmedHeight);
    const trimmedCtx = trimmedCanvas.getContext("2d");
    trimmedCtx.drawImage(
      canvas2,
      bounds.x,
      bounds.y,
      trimmedWidth,
      trimmedHeight,
      0,
      0,
      trimmedWidth,
      trimmedHeight
    );
    return trimmedCanvas;
  }
  function trimTransparentBounds(canvas2) {
    return cropCanvasToBounds(canvas2, getOpaqueBounds(canvas2));
  }
  function expandBounds(currentBounds, nextBounds) {
    if (!currentBounds) {
      return { ...nextBounds };
    }
    const minX = Math.min(currentBounds.x, nextBounds.x);
    const minY = Math.min(currentBounds.y, nextBounds.y);
    const maxX = Math.max(currentBounds.x + currentBounds.width, nextBounds.x + nextBounds.width);
    const maxY = Math.max(currentBounds.y + currentBounds.height, nextBounds.y + nextBounds.height);
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  function normalizeClip(source, clip) {
    if (clip.width <= 1 && clip.height <= 1) {
      return {
        x: Math.round(source.videoWidth * clip.x),
        y: Math.round(source.videoHeight * clip.y),
        width: Math.round(source.videoWidth * clip.width),
        height: Math.round(source.videoHeight * clip.height)
      };
    }
    return clip;
  }
  function applyMatteKey(canvas2, mode) {
    const ctx = canvas2.getContext("2d", { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas2.width, canvas2.height);
    const pixels = imageData.data;
    const minChannel = mode === "video-white" ? 244 : 250;
    const maxSpread = mode === "video-white" ? 18 : 8;
    for (let index = 0; index < pixels.length; index += 4) {
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (min >= minChannel && max - min <= maxSpread) {
        const softness = mode === "video-white" ? 1 - clamp2((min - minChannel) / (255 - minChannel || 1), 0, 1) : 0;
        pixels[index + 3] = mode === "video-white" ? Math.round(pixels[index + 3] * softness) : 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas2;
  }
  function createPlayerRenderer(ctx) {
    const staticClipCache = /* @__PURE__ */ new Map();
    const staticSourceCanvasCache = /* @__PURE__ */ new Map();
    const sequenceBoundsCache = /* @__PURE__ */ new Map();
    const videoFrameCanvas = createCanvas(1, 1);
    const videoFrameCtx = videoFrameCanvas.getContext("2d", { willReadFrequently: true });
    let warmAssetsPromise = null;
    let areAssetsWarmed = false;
    function getStaticSourceCanvas(assetKey, sourceImage, clip, matte) {
      const clipKey = clip ? `${clip.x}:${clip.y}:${clip.width}:${clip.height}` : "full";
      const cacheKey = `${assetKey}:${clipKey}:${matte}:source`;
      const cached = staticClipCache.get(cacheKey);
      if (cached) {
        return cached;
      }
      const resolvedClip = clip ?? {
        x: 0,
        y: 0,
        width: sourceImage.naturalWidth,
        height: sourceImage.naturalHeight
      };
      const canvas2 = createCanvas(resolvedClip.width, resolvedClip.height);
      const clipCtx = canvas2.getContext("2d", { willReadFrequently: true });
      clipCtx.drawImage(
        sourceImage,
        resolvedClip.x,
        resolvedClip.y,
        resolvedClip.width,
        resolvedClip.height,
        0,
        0,
        resolvedClip.width,
        resolvedClip.height
      );
      const processed = applyMatteKey(canvas2, matte);
      staticClipCache.set(cacheKey, processed);
      return processed;
    }
    function getSequenceBounds(sequenceKey, frameAssets, matte) {
      if (!sequenceKey || !frameAssets?.length) {
        return null;
      }
      const cacheKey = `${sequenceKey}:${matte}`;
      const cached = sequenceBoundsCache.get(cacheKey);
      if (cached) {
        return cached;
      }
      let mergedBounds = null;
      for (const frameAsset of frameAssets) {
        if (!frameAsset.image || !isImageReady(frameAsset.image)) {
          return null;
        }
        const assetKey = frameAsset.image.currentSrc || frameAsset.image.src || cacheKey;
        const sourceCanvas = getStaticSourceCanvas(assetKey, frameAsset.image, null, matte);
        const opaqueBounds = getOpaqueBounds(sourceCanvas);
        mergedBounds = expandBounds(mergedBounds, opaqueBounds);
      }
      const normalizedBounds = mergedBounds ?? { x: 0, y: 0, width: 1, height: 1 };
      sequenceBoundsCache.set(cacheKey, normalizedBounds);
      return normalizedBounds;
    }
    function getStaticProcessedClip(assetKey, sourceImage, clip, matte, preserveFrameBounds = false, sequenceBounds = null) {
      const clipKey = clip ? `${clip.x}:${clip.y}:${clip.width}:${clip.height}` : "full";
      const boundsKey = preserveFrameBounds && sequenceBounds ? `${sequenceBounds.x}:${sequenceBounds.y}:${sequenceBounds.width}:${sequenceBounds.height}` : "trimmed";
      const cacheKey = `${assetKey}:${clipKey}:${matte}:${boundsKey}`;
      const cached = staticSourceCanvasCache.get(cacheKey);
      if (cached) {
        return cached;
      }
      const sourceCanvas = getStaticSourceCanvas(assetKey, sourceImage, clip, matte);
      let processed = sourceCanvas;
      if (!clip) {
        processed = preserveFrameBounds && sequenceBounds ? cropCanvasToBounds(sourceCanvas, sequenceBounds) : trimTransparentBounds(sourceCanvas);
      }
      staticSourceCanvasCache.set(cacheKey, processed);
      return processed;
    }
    function getProcessedVideoFrame(sourceVideo, clip, matte) {
      const normalizedClip = normalizeClip(sourceVideo, clip);
      if (videoFrameCanvas.width !== normalizedClip.width || videoFrameCanvas.height !== normalizedClip.height) {
        videoFrameCanvas.width = normalizedClip.width;
        videoFrameCanvas.height = normalizedClip.height;
      }
      videoFrameCtx.clearRect(0, 0, videoFrameCanvas.width, videoFrameCanvas.height);
      videoFrameCtx.drawImage(
        sourceVideo,
        normalizedClip.x,
        normalizedClip.y,
        normalizedClip.width,
        normalizedClip.height,
        0,
        0,
        normalizedClip.width,
        normalizedClip.height
      );
      return applyMatteKey(videoFrameCanvas, matte);
    }
    function getVisualDescriptor(sheetName, frameIndex) {
      switch (sheetName) {
        case "idleIntro":
          return {
            asset: playerVisualAssets.idleIntro.frameAssets[frameIndex % playerVisualAssets.idleIntro.frameAssets.length],
            frameAssets: playerVisualAssets.idleIntro.frameAssets,
            matte: playerVisualAssets.idleIntro.matte,
            preserveFrameBounds: playerVisualAssets.idleIntro.preserveFrameBounds ?? false,
            sequenceKey: "idleIntro"
          };
        case "run":
          return {
            asset: playerVisualAssets.run.frameAssets[frameIndex % playerVisualAssets.run.frameAssets.length],
            frameAssets: playerVisualAssets.run.frameAssets,
            matte: playerVisualAssets.run.matte,
            preserveFrameBounds: playerVisualAssets.run.preserveFrameBounds ?? false,
            sequenceKey: "run"
          };
        case "jump":
          return {
            asset: playerVisualAssets.jump.frameAssets[frameIndex % playerVisualAssets.jump.frameAssets.length],
            frameAssets: playerVisualAssets.jump.frameAssets,
            matte: playerVisualAssets.jump.matte,
            preserveFrameBounds: playerVisualAssets.jump.preserveFrameBounds ?? false,
            sequenceKey: "jump"
          };
        case "doubleJump":
          return {
            asset: playerVisualAssets.doubleJump.frameAssets[frameIndex % playerVisualAssets.doubleJump.frameAssets.length],
            frameAssets: playerVisualAssets.doubleJump.frameAssets,
            matte: playerVisualAssets.doubleJump.matte,
            preserveFrameBounds: playerVisualAssets.doubleJump.preserveFrameBounds ?? false,
            sequenceKey: "doubleJump"
          };
        case "hit":
          return {
            asset: playerVisualAssets.hit.frameAssets[frameIndex % playerVisualAssets.hit.frameAssets.length],
            frameAssets: playerVisualAssets.hit.frameAssets,
            matte: playerVisualAssets.hit.matte,
            preserveFrameBounds: playerVisualAssets.hit.preserveFrameBounds ?? false,
            sequenceKey: "hit"
          };
        case "chute":
          return {
            asset: playerVisualAssets.chute.frameAssets[frameIndex % playerVisualAssets.chute.frameAssets.length],
            frameAssets: playerVisualAssets.chute.frameAssets,
            matte: playerVisualAssets.chute.matte,
            preserveFrameBounds: playerVisualAssets.chute.preserveFrameBounds ?? false,
            sequenceKey: "chute"
          };
        case "gameOver":
          return {
            asset: playerVisualAssets.gameOver.frameAssets[frameIndex % playerVisualAssets.gameOver.frameAssets.length],
            frameAssets: playerVisualAssets.gameOver.frameAssets,
            matte: playerVisualAssets.gameOver.matte,
            preserveFrameBounds: playerVisualAssets.gameOver.preserveFrameBounds ?? false,
            sequenceKey: "gameOver"
          };
        case "win":
          return {
            asset: playerVisualAssets.win.frameAssets[frameIndex % playerVisualAssets.win.frameAssets.length],
            frameAssets: playerVisualAssets.win.frameAssets,
            matte: playerVisualAssets.win.matte,
            preserveFrameBounds: playerVisualAssets.win.preserveFrameBounds ?? false,
            sequenceKey: "win"
          };
        case "idle":
        default:
          return {
            asset: playerVisualAssets.idle.frameAssets[frameIndex % playerVisualAssets.idle.frameAssets.length],
            frameAssets: playerVisualAssets.idle.frameAssets,
            matte: playerVisualAssets.idle.matte,
            preserveFrameBounds: playerVisualAssets.idle.preserveFrameBounds ?? false,
            sequenceKey: "idle"
          };
      }
    }
    function getPlayerVisualDescriptors() {
      return Object.entries(playerVisualAssets).map(([sequenceKey, settings]) => ({
        sequenceKey,
        frameAssets: settings.frameAssets,
        matte: settings.matte,
        preserveFrameBounds: settings.preserveFrameBounds ?? false
      }));
    }
    function scheduleNextBatch(callback) {
      globalThis.setTimeout(callback, 0);
    }
    function warmAssets({ onProgress, batchSize = 6 } = {}) {
      if (areAssetsWarmed) {
        onProgress?.({
          loaded: 1,
          total: 1,
          progress: 1,
          label: "Preparation des animations terminee"
        });
        return Promise.resolve();
      }
      if (warmAssetsPromise) {
        return warmAssetsPromise;
      }
      const tasks = [];
      for (const descriptor of getPlayerVisualDescriptors()) {
        if (descriptor.preserveFrameBounds) {
          tasks.push({
            type: "sequence-bounds",
            ...descriptor
          });
        }
        for (const frameAsset of descriptor.frameAssets) {
          tasks.push({
            type: "frame",
            ...descriptor,
            frameAsset
          });
        }
      }
      const total = tasks.length;
      let completed = 0;
      onProgress?.({
        loaded: completed,
        total,
        progress: total > 0 ? 0 : 1,
        label: "Preparation des animations 0/" + total
      });
      warmAssetsPromise = new Promise((resolve, reject) => {
        const runBatch = () => {
          try {
            for (let index = 0; index < batchSize && completed < total; index += 1) {
              const task = tasks[completed];
              if (task.type === "sequence-bounds") {
                getSequenceBounds(task.sequenceKey, task.frameAssets, task.matte);
              } else {
                if (!task.frameAsset.image || !isImageReady(task.frameAsset.image)) {
                  throw new Error(`Player frame not ready during warm-up: ${task.sequenceKey}`);
                }
                const sequenceBounds = task.preserveFrameBounds ? getSequenceBounds(task.sequenceKey, task.frameAssets, task.matte) : null;
                const assetKey = task.frameAsset.image.currentSrc || task.frameAsset.image.src || task.sequenceKey;
                getStaticProcessedClip(
                  assetKey,
                  task.frameAsset.image,
                  null,
                  task.matte,
                  task.preserveFrameBounds,
                  sequenceBounds
                );
              }
              completed += 1;
            }
            onProgress?.({
              loaded: completed,
              total,
              progress: total > 0 ? completed / total : 1,
              label: `Preparation des animations ${completed}/${total}`
            });
            if (completed < total) {
              scheduleNextBatch(runBatch);
              return;
            }
            areAssetsWarmed = true;
            resolve();
          } catch (error) {
            warmAssetsPromise = null;
            reject(error);
          }
        };
        if (total === 0) {
          areAssetsWarmed = true;
          resolve();
          return;
        }
        runBatch();
      });
      return warmAssetsPromise;
    }
    function draw(state, player, runtime) {
      const visualState = resolvePlayerVisualState(state, player, runtime);
      const animation = createPlayerAnimationFromVisualState(visualState, state, player, runtime);
      const visual = getVisualDescriptor(animation.sheet, animation.frameIndex);
      const motionPhase = animation.motionPhase ?? 0;
      const motionSine = Math.sin(motionPhase);
      const bodyTilt = (animation.baseTilt ?? 0) + motionSine * (animation.tiltAmplitude ?? 0);
      const bodyLift = -Math.abs(motionSine) * (animation.bobAmplitude ?? 0);
      const strideShift = motionSine * (animation.strideAmplitude ?? 0);
      const footX = player.x + player.width * 0.52;
      const footY = player.y + player.height + animation.groundOffsetY;
      const pivotX = footX;
      const pivotY = footY - 10;
      let processedSource = null;
      let sourceWidth = 1;
      let sourceHeight = 1;
      if (visual.asset.video) {
        if (!isVideoReady(visual.asset.video)) {
          return;
        }
        visual.asset.ensurePlaying();
        processedSource = getProcessedVideoFrame(visual.asset.video, visual.clip, visual.matte);
        sourceWidth = processedSource.width;
        sourceHeight = processedSource.height;
      } else if (visual.asset.image) {
        if (!isImageReady(visual.asset.image)) {
          return;
        }
        const staticAssetKey = visual.asset.image.currentSrc || visual.asset.image.src || animation.sheet;
        const sequenceBounds = visual.preserveFrameBounds ? getSequenceBounds(visual.sequenceKey, visual.frameAssets, visual.matte) : null;
        processedSource = getStaticProcessedClip(
          staticAssetKey,
          visual.asset.image,
          visual.clip,
          visual.matte,
          visual.preserveFrameBounds,
          sequenceBounds
        );
        sourceWidth = processedSource.width;
        sourceHeight = processedSource.height;
      }
      if (!processedSource) {
        return;
      }
      const maxWidth = animation.width ?? sourceWidth;
      const maxHeight = animation.height ?? sourceHeight;
      const baseScale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
      const visualScale = animation.visualScale ?? 1;
      const finalScale = baseScale * visualScale;
      const drawWidth = sourceWidth * finalScale;
      const drawHeight = sourceHeight * finalScale;
      const drawX = footX - drawWidth * 0.5 + strideShift;
      const drawY = footY - drawHeight + animation.offsetY + bodyLift;
      ctx.save();
      ctx.translate(pivotX, pivotY);
      ctx.rotate(bodyTilt);
      ctx.translate(-pivotX, -pivotY);
      ctx.drawImage(processedSource, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();
    }
    return {
      draw,
      warmAssets
    };
  }

  // src/game/renderer.js
  function createRenderer(ctx, world) {
    const backgroundRenderer = createBackgroundRenderer(ctx, world);
    const obstacleRenderer = createObstacleRenderer(ctx);
    const effectsRenderer = createEffectsRenderer(ctx);
    const playerRenderer = createPlayerRenderer(ctx);
    function drawPrompt() {
    }
    function draw({ state, player, runtime, clouds, obstacles, coins, bonusHearts, bugHitEffects, levelId }) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, world.width, world.height);
      backgroundRenderer.draw({ state, runtime, clouds, levelId });
      obstacleRenderer.draw(obstacles, state);
      effectsRenderer.draw({ coins, bonusHearts, bugHitEffects });
      playerRenderer.draw(state, player, runtime);
      if (!state.gameStarted) {
        drawPrompt();
      }
    }
    return {
      draw,
      warmAssets(options) {
        return playerRenderer.warmAssets(options);
      }
    };
  }

  // src/game/spawner.js
  function nextObstacleType(runtime) {
    if (runtime.obstacleTypeQueue.length === 0) {
      runtime.obstacleTypeQueue = shuffleList(obstacleTypes);
    }
    return runtime.obstacleTypeQueue.pop();
  }
  function createBugHitEffect(obstacle) {
    return {
      kind: obstacle.kind,
      x: obstacle.x,
      y: obstacle.y,
      width: obstacle.width,
      height: obstacle.height,
      timeLeft: 0.42
    };
  }
  function createBonusHeart(world) {
    return {
      x: world.width + 56,
      y: randomRange(150, 280),
      width: 38,
      height: 38,
      floatTime: Math.random() * Math.PI * 2
    };
  }
  function createCoin(world) {
    return {
      x: world.width + 64,
      y: randomRange(120, 298),
      width: 44,
      height: 44,
      floatTime: Math.random() * Math.PI * 2,
      spinTime: Math.random() * Math.PI * 2
    };
  }
  function spawnObstacle(runtime, difficulty, world) {
    const type = nextObstacleType(runtime);
    const size = isAnimatedBugKind(type.kind) ? bugVisualSettings[type.kind].size : randomRange(64, 102);
    runtime.spawnedObstacleCount += 1;
    const obstacle = {
      kind: type.kind,
      x: world.width + size,
      y: world.groundY + 24 - size,
      width: size,
      height: size,
      palette: type.kind === "animated-ball" ? randomChoice(obstaclePalette) : null
    };
    if (type.kind === "animated-ball") {
      obstacle.animationOffset = Math.random() * Math.PI * 2;
    }
    if (isAnimatedBugKind(type.kind)) {
      obstacle.animationTime = Math.random() * bugVisualSettings[type.kind].frames.length * 0.09;
    }
    return {
      obstacle,
      bonusHeart: shouldSpawnBonusHeart(runtime.spawnedObstacleCount, difficulty) ? createBonusHeart(world) : null
    };
  }
  function advanceSpawnedEntities({
    obstacles,
    coins,
    bonusHearts,
    bugHitEffects,
    speed,
    worldWidth,
    deltaTime,
    bugsOnly = false
  }) {
    let writeIndex = 0;
    for (let index = 0; index < obstacles.length; index += 1) {
      const obstacle = obstacles[index];
      if (!bugsOnly || isAnimatedBugKind(obstacle.kind)) {
        const direction = bugsOnly && obstacle.kind === "animated-bug-b" ? 1 : -1;
        obstacle.x += direction * speed * getObstacleSpeedMultiplier(obstacle.kind) * deltaTime;
      }
      if (isAnimatedBugKind(obstacle.kind)) {
        obstacle.animationTime += deltaTime;
      }
      if (obstacle.x + obstacle.width > -40 && obstacle.x < worldWidth + obstacle.width + 40) {
        obstacles[writeIndex] = obstacle;
        writeIndex += 1;
      }
    }
    obstacles.length = writeIndex;
    if (!bugsOnly) {
      writeIndex = 0;
      for (let index = 0; index < coins.length; index += 1) {
        const coin = coins[index];
        coin.x -= speed * deltaTime;
        coin.floatTime += deltaTime * 5.2;
        coin.spinTime += deltaTime * 4.4;
        if (coin.x + coin.width > -40) {
          coins[writeIndex] = coin;
          writeIndex += 1;
        }
      }
      coins.length = writeIndex;
      writeIndex = 0;
      for (let index = 0; index < bonusHearts.length; index += 1) {
        const heart = bonusHearts[index];
        heart.x -= speed * deltaTime;
        heart.floatTime += deltaTime * 5.2;
        if (heart.x + heart.width > -40) {
          bonusHearts[writeIndex] = heart;
          writeIndex += 1;
        }
      }
      bonusHearts.length = writeIndex;
    }
    writeIndex = 0;
    for (let index = 0; index < bugHitEffects.length; index += 1) {
      const effect = bugHitEffects[index];
      const direction = bugsOnly && effect.kind === "animated-bug-b" ? 1 : -1;
      effect.x += direction * speed * getObstacleSpeedMultiplier(effect.kind) * deltaTime;
      effect.timeLeft -= deltaTime;
      if (effect.x + effect.width > -40 && effect.x < worldWidth + effect.width + 40 && effect.timeLeft > 0) {
        bugHitEffects[writeIndex] = effect;
        writeIndex += 1;
      }
    }
    bugHitEffects.length = writeIndex;
    return {
      obstacles,
      coins,
      bonusHearts,
      bugHitEffects
    };
  }

  // src/game/storage.js
  function safeRead(key, fallback) {
    try {
      return window.localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }
  function parseScore(value) {
    const score = Number.parseInt(value, 10);
    return Number.isFinite(score) && score > 0 ? score : 0;
  }
  function loadBestScoreMap() {
    const legacyScore = parseScore(safeRead(BEST_SCORE_STORAGE_KEY, "0"));
    try {
      const rawValue = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY);
      if (!rawValue) {
        return legacyScore > 0 ? { normal: legacyScore } : {};
      }
      const parsed = JSON.parse(rawValue);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed).map(([difficultyId, score]) => [difficultyId, parseScore(String(score))])
        );
      }
    } catch {
      return legacyScore > 0 ? { normal: legacyScore } : {};
    }
    return legacyScore > 0 ? { normal: legacyScore } : {};
  }
  function loadBestScore(difficultyId) {
    const scoreMap = loadBestScoreMap();
    return scoreMap[difficultyId] ?? 0;
  }
  function saveBestScore(difficultyId, score) {
    try {
      const scoreMap = loadBestScoreMap();
      scoreMap[difficultyId] = Math.max(scoreMap[difficultyId] ?? 0, score);
      window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, JSON.stringify(scoreMap));
    } catch {
    }
  }
  function loadPreferredDifficulty() {
    return safeRead(DIFFICULTY_STORAGE_KEY, "normal");
  }
  function savePreferredDifficulty(difficultyId) {
    try {
      window.localStorage.setItem(DIFFICULTY_STORAGE_KEY, difficultyId);
    } catch {
    }
  }
  function loadPreferredLevel() {
    return safeRead(LEVEL_STORAGE_KEY, "arcade");
  }
  function savePreferredLevel(levelId) {
    try {
      window.localStorage.setItem(LEVEL_STORAGE_KEY, levelId);
    } catch {
    }
  }

  // src/game/engine.js
  function createGame(elements) {
    const { browser: browser2, canvas: canvas2, view: view2 } = elements;
    const FOREST_LEVEL_LOOP_TARGET = 10;
    const FOREST_TO_VALLEY_BRIDGE_LOOPS = 1;
    const VALLEY_MIDGROUND_SEQUENCE_LAST_INDEX = 7;
    const HIT_ANIMATION_DURATION = 0.5;
    const HIT_INVULNERABILITY_DURATION = 1.5;
    const ctx = canvas2.getContext("2d");
    const world = createWorld();
    const renderer = createRenderer(ctx, world);
    canvas2.width = world.width;
    canvas2.height = world.height;
    let difficulty = getDifficultyById(loadPreferredDifficulty());
    let level = getLevelById(loadPreferredLevel());
    const state = createGameState(difficulty, loadBestScore(difficulty.id));
    const player = createPlayer(world, difficulty);
    const runtime = createRuntimeState();
    let obstacles = [];
    let coins = [];
    let bonusHearts = [];
    let bugHitEffects = [];
    let clouds = [];
    let cleanupInput = null;
    let cleanupSettingsButton = null;
    let cleanupViewportResize = null;
    let isSettingsOverlayOpen = false;
    function getJumpInstructions() {
      return "Choisis ton niveau, ajuste le rythme, puis lance la partie.";
    }
    function syncTouchMode() {
      runtime.inputMode = view2.getInputMode();
      view2.setTouchMode(runtime.inputMode === "touch");
      view2.setSettingsButtonActive(isSettingsOverlayOpen);
      view2.setTouchJumpVisible(
        runtime.inputMode === "touch" && state.gameStarted && !state.gameOver && !isSettingsOverlayOpen && !state.pendingGameOver && !state.pendingVictory && state.lives > 0
      );
    }
    function clearHeadImpactTimer() {
      if (runtime.headImpactTimer !== null) {
        browser2.clearTimeout(runtime.headImpactTimer);
        runtime.headImpactTimer = null;
      }
    }
    function ensureDeferredAssetsWarmed() {
      if (runtime.deferredAssetsWarmed) {
        return;
      }
      runtime.deferredAssetsWarmed = true;
      warmGameplayAssets();
    }
    function updateHudDisplay() {
      view2.updateScoreDisplay(state.score, state.bestScore);
      view2.updateCoinDisplay(state.coinsCollected);
    }
    function triggerHeadImpact() {
      runtime.isPlayerHeadInImpactState = true;
      runtime.hitAnimationTime = 0;
      clearHeadImpactTimer();
      runtime.headImpactTimer = browser2.setTimeout(() => {
        runtime.isPlayerHeadInImpactState = false;
        runtime.headImpactTimer = null;
        if (state.pendingVictory) {
          endGame();
        }
      }, 1e3);
    }
    function beginDeathFall2() {
      clearHeadImpactTimer();
      runtime.isPlayerHeadInImpactState = false;
      runtime.hitAnimationTime = null;
      preparePlayerDeathFall(player);
      beginDeathFall(state);
      syncTouchMode();
    }
    function beginVictoryTransition2() {
      beginVictoryTransition(state);
      syncTouchMode();
    }
    function loseLife(obstacle) {
      if (isAnimatedBugKind(obstacle.kind)) {
        bugHitEffects.push(createBugHitEffect(obstacle));
      }
      obstacles = removeEntity(obstacles, obstacle);
      state.lives = Math.max(0, state.lives - 1);
      state.hitCooldown = HIT_INVULNERABILITY_DURATION;
      view2.breakHeart(state.lives, state.lives);
      if (state.lives === 0) {
        clearHeadImpactTimer();
        runtime.isPlayerHeadInImpactState = false;
        runtime.hitAnimationTime = null;
        view2.updateLivesAriaLabel(state.lives);
        endGame();
        return;
      }
      triggerHeadImpact();
      view2.updateLivesAriaLabel(state.lives);
    }
    function squashBug(collision) {
      const { obstacle, obstacleTop } = collision;
      bugHitEffects.push(createBugHitEffect(obstacle));
      obstacles = removeEntity(obstacles, obstacle);
      bouncePlayer(player, obstacleTop);
    }
    function collectBonusHeart(heart) {
      bonusHearts = removeEntity(bonusHearts, heart);
      if (state.lives >= MAX_LIVES) {
        return;
      }
      view2.restoreHeart(state.lives, state.lives + 1);
      state.lives += 1;
      view2.updateLivesAriaLabel(state.lives);
    }
    function collectCoin(coin) {
      coins = removeEntity(coins, coin);
      state.coinsCollected += 1;
      view2.updateCoinDisplay(state.coinsCollected);
    }
    function checkCollision() {
      const collision = findObstacleCollisionDetails(player, obstacles);
      if (!collision) {
        return;
      }
      if (collision.stomped && isAnimatedBugKind(collision.obstacle.kind)) {
        squashBug(collision);
        return;
      }
      if (state.hitCooldown > 0) {
        return;
      }
      loseLife(collision.obstacle);
    }
    function checkBonusHeartCollision() {
      const heart = findBonusHeartCollision(player, bonusHearts);
      if (heart) {
        collectBonusHeart(heart);
      }
    }
    function checkCoinCollision() {
      const coin = findCoinCollision(player, coins);
      if (coin) {
        collectCoin(coin);
      }
    }
    function spawnObstacle2() {
      const { obstacle, bonusHeart } = spawnObstacle(runtime, difficulty, world);
      obstacles.push(obstacle);
      if (bonusHeart) {
        bonusHearts.push(bonusHeart);
      }
    }
    function spawnCoin() {
      coins.push(createCoin(world));
    }
    function advanceObstacleVisuals(deltaTime, bugsOnly = false, speedOverride = state.speed) {
      const advancedEntities = advanceSpawnedEntities({
        obstacles,
        coins,
        bonusHearts,
        bugHitEffects,
        speed: speedOverride,
        worldWidth: world.width,
        deltaTime,
        bugsOnly
      });
      obstacles = advancedEntities.obstacles;
      coins = advancedEntities.coins;
      bonusHearts = advancedEntities.bonusHearts;
      bugHitEffects = advancedEntities.bugHitEffects;
    }
    function jump() {
      jumpPlayer(state, player);
    }
    function initGame() {
      isSettingsOverlayOpen = false;
      view2.clearHeartBreakTimers();
      clearHeadImpactTimer();
      obstacles = [];
      coins = [];
      bonusHearts = [];
      bugHitEffects = [];
      clouds = createClouds();
      resetRuntimeState(runtime);
      resetGameState(state, difficulty, loadBestScore(difficulty.id));
      resetPlayer(player, difficulty);
      view2.resetLivesDisplay(state.lives);
      updateHudDisplay();
      view2.showOverlay("Run & Debug", getJumpInstructions(), "Commencer le jeu", {
        screen: "home",
        tag: "S\xE9lection du niveau"
      });
      syncTouchMode();
      renderer.draw({ state, player, runtime, clouds, obstacles, coins, bonusHearts, bugHitEffects, levelId: getRenderedLevelId() });
    }
    function startGame() {
      if (!runtime.assetsReady) {
        return;
      }
      ensureDeferredAssetsWarmed();
      isSettingsOverlayOpen = false;
      markGameStarted(state);
      view2.hideOverlay();
      syncTouchMode();
    }
    function openSettings() {
      if (!runtime.assetsReady || !state.gameStarted || state.gameOver) {
        return;
      }
      isSettingsOverlayOpen = true;
      view2.showOverlay(
        "Param\xE8tres",
        "Choisis ton rythme et ton niveau.\nToute modification relance la partie.",
        "Reprendre",
        {
          screen: "settings",
          tag: "Param\xE8tres"
        }
      );
      syncTouchMode();
    }
    function closeSettings() {
      isSettingsOverlayOpen = false;
      view2.hideOverlay();
      syncTouchMode();
    }
    function restartGame(autoStart = false) {
      initGame();
      if (autoStart) {
        startGame();
      }
    }
    function endGame() {
      isSettingsOverlayOpen = false;
      clearHeadImpactTimer();
      runtime.isPlayerHeadInImpactState = false;
      const gameOverSnapshot = createEndGameSnapshot(state.score, state.bestScore, difficulty.label);
      markGameOver(state, runtime, gameOverSnapshot.isNewRecord);
      state.bestScore = gameOverSnapshot.nextBestScore;
      saveBestScore(difficulty.id, state.bestScore);
      view2.showOverlay(
        gameOverSnapshot.isNewRecord ? "NOUVEAU RECORD" : "GAME OVER",
        gameOverSnapshot.text,
        "Essaye encore",
        {
          celebrateRecord: gameOverSnapshot.isNewRecord,
          highlightScore: gameOverSnapshot.isNewRecord ? gameOverSnapshot.finalScore : null,
          screen: "end",
          tag: gameOverSnapshot.isNewRecord ? "Victoire" : "Game Over"
        }
      );
      syncTouchMode();
    }
    function setDifficulty(difficultyId) {
      difficulty = getDifficultyById(difficultyId);
      savePreferredDifficulty(difficulty.id);
      view2.setDifficultySelection(difficulty.id);
      initGame();
    }
    function setLevel(levelId) {
      level = getLevelById(levelId);
      savePreferredLevel(level.id);
      view2.setLevelSelection(level.id);
      runtime.forestLoopCount = 0;
      runtime.isForestValleyTransitionPending = false;
      runtime.forestValleyTransitionLoopCount = 0;
      runtime.isForestValleyTransitionActive = false;
      runtime.valleyMidgroundSequenceIndex = 0;
      initGame();
    }
    function beginForestValleyTransition() {
      runtime.isForestValleyTransitionPending = false;
      runtime.isForestValleyTransitionActive = true;
      runtime.forestValleyTransitionLoopCount = 0;
      runtime.forestValleyBridgeStartHillNearOffset = state.hillNearOffset;
    }
    function advanceLevelFromForest() {
      level = getLevelById("valley");
      savePreferredLevel(level.id);
      view2.setLevelSelection(level.id);
      runtime.forestLoopCount = 0;
      runtime.isForestValleyTransitionPending = false;
      runtime.forestValleyTransitionLoopCount = 0;
      runtime.isForestValleyTransitionActive = false;
      runtime.forestValleyBridgeStartHillNearOffset = 0;
      runtime.valleyMidgroundSequenceIndex = 0;
    }
    function getRenderedLevelId() {
      if (runtime.isForestValleyTransitionActive) {
        return "forest-valley-bridge";
      }
      return level.id;
    }
    function canSpawnObstacles() {
      return true;
    }
    function update(timestamp) {
      const frameDelta = computeFrameDelta(timestamp, state.lastTime);
      const deltaTime = frameDelta.deltaTime;
      state.lastTime = frameDelta.lastTime;
      Object.assign(state, createFrameAnimationUpdate(state, deltaTime));
      if (state.gameOver) {
        advanceObstacleVisuals(deltaTime, true);
      }
      if (state.gameStarted && !state.gameOver && !isSettingsOverlayOpen) {
        const previousGroundOffset = state.groundOffset;
        const previousHillNearOffset = state.hillNearOffset;
        const wasForestValleyTransitionActive = runtime.isForestValleyTransitionActive;
        Object.assign(state, createActiveGameUpdate(state, difficulty, world.width, deltaTime));
        const effectiveTravelSpeed = getEffectiveTravelSpeed(state);
        const didGroundLoop = state.groundOffset < previousGroundOffset;
        const didHillNearLoop = state.hillNearOffset < previousHillNearOffset;
        if (didGroundLoop) {
          if (!runtime.isForestValleyTransitionActive && level.id === "forest") {
            runtime.forestLoopCount += 1;
            if (runtime.forestLoopCount >= FOREST_LEVEL_LOOP_TARGET) {
              runtime.isForestValleyTransitionPending = true;
            }
          }
        }
        if (level.id === "forest" && runtime.isForestValleyTransitionPending && !runtime.isForestValleyTransitionActive && didHillNearLoop) {
          beginForestValleyTransition();
        }
        if (wasForestValleyTransitionActive && didHillNearLoop) {
          runtime.forestValleyTransitionLoopCount += 1;
          if (runtime.forestValleyTransitionLoopCount >= FOREST_TO_VALLEY_BRIDGE_LOOPS) {
            advanceLevelFromForest();
          }
        } else if (level.id === "valley" && didHillNearLoop && runtime.valleyMidgroundSequenceIndex < VALLEY_MIDGROUND_SEQUENCE_LAST_INDEX) {
          runtime.valleyMidgroundSequenceIndex += 1;
        }
        player.runCycle = computeNextRunCycle(player.runCycle, effectiveTravelSpeed, deltaTime);
        updatePlayer(player, deltaTime);
        if (runtime.hitAnimationTime !== null) {
          runtime.hitAnimationTime = Math.min(runtime.hitAnimationTime + deltaTime, HIT_ANIMATION_DURATION);
          if (runtime.hitAnimationTime >= HIT_ANIMATION_DURATION) {
            runtime.hitAnimationTime = null;
          }
        }
        if (shouldSpawnObstacleNow(state, runtime)) {
          if (canSpawnObstacles()) {
            spawnObstacle2();
          }
          Object.assign(state, createPostSpawnStateUpdate(state, difficulty));
        }
        if (shouldSpawnCoinNow(state)) {
          spawnCoin();
          Object.assign(state, createPostCoinSpawnStateUpdate(difficulty));
        }
        advanceObstacleVisuals(deltaTime, false, effectiveTravelSpeed);
        if (shouldResolveGameplayCollisions(state)) {
          checkCollision();
          checkBonusHeartCollision();
          checkCoinCollision();
        }
        if (shouldEndPendingGameOver(state, runtime)) {
          endGame();
        }
        updateHudDisplay();
      }
      renderer.draw({ state, player, runtime, clouds, obstacles, coins, bonusHearts, bugHitEffects, levelId: getRenderedLevelId() });
      browser2.requestAnimationFrame(update);
    }
    function start() {
      const assetLoadProgressWeight = 0.78;
      const playerWarmupProgressWeight = 1 - assetLoadProgressWeight;
      view2.setupLivesDisplay(MAX_LIVES, state.lives);
      view2.renderDifficultyOptions(DIFFICULTY_OPTIONS, difficulty.id, setDifficulty);
      view2.renderLevelOptions(LEVEL_OPTIONS, level.id, setLevel);
      view2.setDifficultySelection(difficulty.id);
      view2.setLevelSelection(level.id);
      view2.setActionButtonDisabled(true);
      view2.setSettingsButtonDisabled(true);
      syncTouchMode();
      clouds = createClouds();
      updateHudDisplay();
      view2.resetLivesDisplay(state.lives);
      view2.showLoadingOverlay({
        loaded: 0,
        total: 0,
        progress: 0
      });
      renderer.draw({ state, player, runtime, clouds, obstacles, coins, bonusHearts, bugHitEffects, levelId: getRenderedLevelId() });
      browser2.requestAnimationFrame(update);
      cleanupInput = view2.bindControls({
        canvas: canvas2,
        onPrimaryAction: jump,
        canTriggerPrimaryAction: () => state.gameStarted && !state.gameOver && !isSettingsOverlayOpen && state.lives > 0,
        onActionButtonClick: () => {
          if (!runtime.assetsReady) {
            return;
          }
          if (isSettingsOverlayOpen) {
            closeSettings();
            return;
          }
          if (state.gameOver) {
            restartGame(true);
            return;
          }
          if (!state.gameStarted) {
            startGame();
          }
        }
      });
      cleanupViewportResize = view2.bindViewportResize(syncTouchMode);
      cleanupSettingsButton = view2.bindSettingsButton(() => {
        if (isSettingsOverlayOpen) {
          closeSettings();
          return;
        }
        openSettings();
      });
      preloadCoreAssets({
        onProgress: (progressState) => {
          view2.updateLoadingProgress({
            ...progressState,
            progress: progressState.progress * assetLoadProgressWeight
          });
        }
      }).then(() => {
        runtime.assetsReady = true;
        view2.setActionButtonDisabled(false);
        view2.setSettingsButtonDisabled(false);
        initGame();
        renderer.warmAssets({
          onProgress: (progressState) => {
            view2.updateLoadingProgress({
              ...progressState,
              progress: assetLoadProgressWeight + progressState.progress * playerWarmupProgressWeight
            });
          }
        }).catch((error) => {
          console.error(error);
        });
      }).catch((error) => {
        console.error(error);
        view2.showOverlay("Run & Debug", "Impossible de charger les sprites du jeu.", "Recharge la page", {
          screen: "error",
          tag: "Erreur de chargement"
        });
      });
    }
    function destroy() {
      cleanupInput?.();
      cleanupSettingsButton?.();
      cleanupViewportResize?.();
      clearHeadImpactTimer();
      view2.clearHeartBreakTimers();
    }
    return {
      destroy,
      start
    };
  }

  // src/game/input.js
  function bindInput({
    documentRef,
    canvas: canvas2,
    actionButton,
    touchJumpButton,
    onPrimaryAction,
    onActionButtonClick,
    canTriggerPrimaryAction
  }) {
    let suppressNextActionButtonClick = false;
    function handlePrimaryAction(event) {
      if (event.type === "keydown" && event.code !== "Space") {
        return;
      }
      if (!canTriggerPrimaryAction()) {
        return;
      }
      if (event.cancelable) {
        event.preventDefault();
      }
      onPrimaryAction(event);
    }
    function handleActionButtonPointerDown(event) {
      if (event.cancelable) {
        event.preventDefault();
      }
      suppressNextActionButtonClick = true;
      onActionButtonClick(event);
    }
    function handleActionButtonClick(event) {
      if (suppressNextActionButtonClick) {
        suppressNextActionButtonClick = false;
        return;
      }
      onActionButtonClick(event);
    }
    actionButton.addEventListener("pointerdown", handleActionButtonPointerDown);
    actionButton.addEventListener("click", handleActionButtonClick);
    documentRef.addEventListener("keydown", handlePrimaryAction);
    canvas2.addEventListener("pointerdown", handlePrimaryAction);
    touchJumpButton.addEventListener("pointerdown", handlePrimaryAction);
    return () => {
      actionButton.removeEventListener("pointerdown", handleActionButtonPointerDown);
      actionButton.removeEventListener("click", handleActionButtonClick);
      documentRef.removeEventListener("keydown", handlePrimaryAction);
      canvas2.removeEventListener("pointerdown", handlePrimaryAction);
      touchJumpButton.removeEventListener("pointerdown", handlePrimaryAction);
    };
  }

  // src/game/ui.js
  function createUI({
    overlay,
    overlayTag,
    overlayTitle,
    overlayText,
    loadingProgress,
    loadingProgressText,
    actionButton,
    recordValue,
    scoreValue,
    coinValue,
    livesDisplay,
    settingsButton,
    difficultyOptions,
    levelOptions,
    touchJumpButton
  }, browser2) {
    const heartBreakTimers = /* @__PURE__ */ new Map();
    const overlayScoreFlash = browser2.documentRef.createElement("div");
    const overlayScoreFlashValue = browser2.documentRef.createElement("span");
    const renderCache = {
      bestScoreText: null,
      coinText: null,
      loadingLabel: null,
      loadingPercent: null,
      overlayScoreText: null,
      scoreText: null
    };
    const HOME_LOGO_MARKUP = `
    <span class="overlay-logo-image-shell" aria-hidden="true">
      <img
        class="overlay-logo-image"
        src="./assets/titre%20run%20debug.svg"
        alt=""
      />
    </span>
  `;
    const GAME_OVER_LOGO_MARKUP = `
    <span class="overlay-logo-badge overlay-logo-badge--game-over" aria-hidden="true">
      <img
        class="overlay-logo-image overlay-logo-image--game-over"
        src="./assets/GAMEOVER.svg"
        alt=""
      />
    </span>
  `;
    const NEW_RECORD_LOGO_MARKUP = `
    <span class="overlay-logo-badge overlay-logo-badge--new-record" aria-hidden="true">
      <img
        class="overlay-logo-image overlay-logo-image--new-record"
        src="./assets/NOUVEAURECORD.svg"
        alt=""
      />
    </span>
  `;
    overlayScoreFlash.className = "overlay-record-score";
    overlayScoreFlash.setAttribute("aria-hidden", "true");
    overlayScoreFlashValue.className = "overlay-record-score__value";
    overlayScoreFlashValue.textContent = "0";
    overlayScoreFlash.append(overlayScoreFlashValue);
    overlayText.before(overlayScoreFlash);
    function clearOverlayHomeFeedback() {
      overlay.classList.remove("overlay--home-feedback");
    }
    function applyOverlayScreen(screen) {
      const activeScreen = screen ?? "default";
      overlay.dataset.screen = activeScreen;
      overlay.classList.toggle("overlay--home", activeScreen === "home");
      overlay.classList.toggle("overlay--loading-screen", activeScreen === "loading");
      overlay.classList.toggle("overlay--settings-screen", activeScreen === "settings");
      overlay.classList.toggle("overlay--end-screen", activeScreen === "end");
      overlay.classList.toggle("overlay--error-screen", activeScreen === "error");
      browser2.bodyRef.classList.toggle("is-home-screen", activeScreen === "home");
    }
    function updateLivesAriaLabel(lives) {
      const label = lives > 1 ? `${lives} vies restantes` : `${lives} vie restante`;
      livesDisplay.setAttribute("aria-label", label);
    }
    function renderOverlayTitle(title, screen) {
      overlayTitle.classList.remove("overlay-title--logo");
      overlayTitle.classList.remove("overlay-title--image");
      overlayTitle.classList.remove("overlay-title--record-badge");
      overlayTitle.removeAttribute("aria-label");
      if (screen === "home" && title === "Run & Debug") {
        overlayTitle.classList.add("overlay-title--logo");
        overlayTitle.classList.add("overlay-title--image");
        overlayTitle.setAttribute("aria-label", title);
        overlayTitle.innerHTML = HOME_LOGO_MARKUP;
        return;
      }
      if (screen === "end" && title === "GAME OVER") {
        overlayTitle.classList.add("overlay-title--logo");
        overlayTitle.classList.add("overlay-title--image");
        overlayTitle.setAttribute("aria-label", title);
        overlayTitle.innerHTML = GAME_OVER_LOGO_MARKUP;
        return;
      }
      if (screen === "end" && title === "NOUVEAU RECORD") {
        overlayTitle.classList.add("overlay-title--logo");
        overlayTitle.classList.add("overlay-title--record-badge");
        overlayTitle.setAttribute("aria-label", title);
        overlayTitle.innerHTML = NEW_RECORD_LOGO_MARKUP;
        return;
      }
      overlayTitle.textContent = title;
    }
    function updateLoadingProgress({ loaded = 0, total = 0, progress = 0, label = null } = {}) {
      if (!loadingProgress || !loadingProgressText) {
        return;
      }
      const safeProgress = Number.isFinite(progress) ? Math.max(0, Math.min(progress, 1)) : 0;
      const roundedPercent = Math.round(safeProgress * 100);
      const loadingLabel = label ?? (total > 0 ? `Chargement des assets ${loaded}/${total} (${roundedPercent}%)` : `Chargement des assets (${roundedPercent}%)`);
      if (renderCache.loadingPercent !== roundedPercent) {
        loadingProgress.style.width = `${roundedPercent}%`;
        loadingProgress.setAttribute("aria-valuenow", String(roundedPercent));
        renderCache.loadingPercent = roundedPercent;
      }
      if (renderCache.loadingLabel !== loadingLabel) {
        loadingProgressText.textContent = loadingLabel;
        renderCache.loadingLabel = loadingLabel;
      }
    }
    function setOverlayRecordScore(score) {
      const shouldHighlightScore = Number.isFinite(score);
      overlay.classList.toggle("overlay--score-flash", shouldHighlightScore);
      overlayScoreFlash.setAttribute("aria-hidden", String(!shouldHighlightScore));
      if (!shouldHighlightScore) {
        renderCache.overlayScoreText = null;
        return;
      }
      const nextOverlayScoreText = String(Math.floor(score));
      if (renderCache.overlayScoreText !== nextOverlayScoreText) {
        overlayScoreFlashValue.textContent = nextOverlayScoreText;
        renderCache.overlayScoreText = nextOverlayScoreText;
      }
    }
    function showLoadingOverlay(progressState) {
      clearOverlayHomeFeedback();
      applyOverlayScreen("loading");
      if (overlayTag) {
        overlayTag.textContent = "Initialisation";
      }
      renderOverlayTitle("Chargement du jeu", "loading");
      overlayText.textContent = "Preparation des sprites et de l'interface pour un demarrage fluide.";
      actionButton.textContent = "";
      overlay.classList.remove("overlay--record");
      setOverlayRecordScore(null);
      overlay.setAttribute("aria-busy", "true");
      overlay.classList.add("visible");
      updateLoadingProgress(progressState);
    }
    function showOverlay(title, text, buttonLabel, options = {}) {
      const {
        celebrateRecord = false,
        highlightScore = null,
        screen = "default",
        tag = ""
      } = options;
      clearOverlayHomeFeedback();
      applyOverlayScreen(screen);
      if (overlayTag) {
        overlayTag.textContent = tag;
      }
      renderOverlayTitle(title, screen);
      overlayText.textContent = text;
      actionButton.textContent = buttonLabel;
      overlay.classList.toggle("overlay--record", celebrateRecord);
      setOverlayRecordScore(highlightScore);
      overlay.setAttribute("aria-busy", "false");
      overlay.classList.add("visible");
    }
    function hideOverlay() {
      clearOverlayHomeFeedback();
      applyOverlayScreen("default");
      overlay.classList.remove("overlay--record");
      setOverlayRecordScore(null);
      overlay.setAttribute("aria-busy", "false");
      overlay.classList.remove("visible");
    }
    function updateScoreDisplay(score, bestScore) {
      const nextScoreText = String(Math.floor(score));
      const nextBestScoreText = String(bestScore);
      if (renderCache.scoreText !== nextScoreText) {
        scoreValue.textContent = nextScoreText;
        renderCache.scoreText = nextScoreText;
      }
      if (renderCache.bestScoreText !== nextBestScoreText) {
        recordValue.textContent = nextBestScoreText;
        renderCache.bestScoreText = nextBestScoreText;
      }
    }
    function updateCoinDisplay(coinsCollected) {
      if (coinValue) {
        const nextCoinText = String(coinsCollected);
        if (renderCache.coinText !== nextCoinText) {
          coinValue.textContent = nextCoinText;
          renderCache.coinText = nextCoinText;
        }
      }
    }
    function setupLivesDisplay(maxLives, lives) {
      livesDisplay.innerHTML = "";
      for (let index = 0; index < maxLives; index += 1) {
        const heart = browser2.documentRef.createElement("span");
        heart.className = "heart";
        heart.dataset.index = String(index);
        heart.setAttribute("aria-hidden", "true");
        livesDisplay.appendChild(heart);
      }
      updateLivesAriaLabel(lives);
    }
    function resetLivesDisplay(lives) {
      const hearts = livesDisplay.querySelectorAll(".heart");
      hearts.forEach((heart) => {
        heart.className = "heart";
      });
      updateLivesAriaLabel(lives);
    }
    function clearHeartBreakTimers() {
      heartBreakTimers.forEach((timer) => browser2.clearTimeout(timer));
      heartBreakTimers.clear();
    }
    function breakHeart(index, lives) {
      const heart = livesDisplay.querySelector(`.heart[data-index="${index}"]`);
      if (!heart || heart.classList.contains("heart--breaking") || heart.classList.contains("heart--gone")) {
        updateLivesAriaLabel(lives);
        return;
      }
      heart.classList.add("heart--breaking");
      const timer = browser2.setTimeout(() => {
        heart.classList.remove("heart--breaking");
        heart.classList.add("heart--gone");
        heartBreakTimers.delete(index);
        updateLivesAriaLabel(lives);
      }, 450);
      heartBreakTimers.set(index, timer);
      updateLivesAriaLabel(lives);
    }
    function restoreHeart(index, lives) {
      const heart = livesDisplay.querySelector(`.heart[data-index="${index}"]`);
      if (!heart) {
        updateLivesAriaLabel(lives);
        return;
      }
      const pendingTimer = heartBreakTimers.get(index);
      if (pendingTimer) {
        browser2.clearTimeout(pendingTimer);
        heartBreakTimers.delete(index);
      }
      heart.className = "heart";
      updateLivesAriaLabel(lives);
    }
    function renderSelectableOptions(container, options, currentId, selectedDatasetKey, onChange) {
      container.innerHTML = "";
      options.forEach((option) => {
        const button = browser2.documentRef.createElement("button");
        button.type = "button";
        button.className = "difficulty-option";
        button.dataset[selectedDatasetKey] = option.id;
        button.setAttribute("role", "radio");
        button.setAttribute("aria-checked", String(option.id === currentId));
        let handledByPointer = false;
        button.innerHTML = `
        <span class="difficulty-option__label">${option.label}</span>
        <span class="difficulty-option__description">${option.description}</span>
      `;
        button.addEventListener("pointerdown", (event) => {
          if (event.cancelable) {
            event.preventDefault();
          }
          handledByPointer = true;
          onChange(option.id);
        });
        button.addEventListener("click", () => {
          if (handledByPointer) {
            handledByPointer = false;
            return;
          }
          onChange(option.id);
        });
        container.appendChild(button);
      });
    }
    function renderDifficultyOptions(options, currentId, onChange) {
      renderSelectableOptions(difficultyOptions, options, currentId, "difficultyId", onChange);
    }
    function setDifficultySelection(currentId) {
      difficultyOptions.querySelectorAll(".difficulty-option").forEach((button) => {
        const isSelected = button.dataset.difficultyId === currentId;
        button.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-checked", String(isSelected));
      });
    }
    function renderLevelOptions(options, currentId, onChange) {
      renderSelectableOptions(levelOptions, options, currentId, "levelId", onChange);
    }
    function setLevelSelection(currentId) {
      levelOptions.querySelectorAll(".difficulty-option").forEach((button) => {
        const isSelected = button.dataset.levelId === currentId;
        button.classList.toggle("is-selected", isSelected);
        button.setAttribute("aria-checked", String(isSelected));
      });
    }
    function setTouchMode(enabled) {
      browser2.bodyRef.classList.toggle("is-touch", enabled);
    }
    function setTouchJumpVisible(visible) {
      touchJumpButton.classList.toggle("is-visible", visible);
      touchJumpButton.disabled = !visible;
    }
    function setSettingsButtonActive(active) {
      settingsButton.classList.toggle("is-active", active);
    }
    return {
      breakHeart,
      clearHeartBreakTimers,
      hideOverlay,
      renderDifficultyOptions,
      renderLevelOptions,
      resetLivesDisplay,
      restoreHeart,
      setDifficultySelection,
      showLoadingOverlay,
      setLevelSelection,
      setSettingsButtonActive,
      setTouchJumpVisible,
      setTouchMode,
      setupLivesDisplay,
      showOverlay,
      updateLoadingProgress,
      updateCoinDisplay,
      updateLivesAriaLabel,
      updateScoreDisplay
    };
  }

  // src/game/game-dom-view.js
  function createGameDOMView(elements, browser2) {
    const {
      overlay,
      overlayTag,
      overlayTitle,
      overlayText,
      loadingProgress,
      loadingProgressText,
      actionButton,
      recordValue,
      scoreValue,
      coinValue,
      livesDisplay,
      settingsButton,
      difficultyOptions,
      levelOptions,
      touchJumpButton
    } = elements;
    const ui = createUI({
      overlay,
      overlayTag,
      overlayTitle,
      overlayText,
      loadingProgress,
      loadingProgressText,
      actionButton,
      recordValue,
      scoreValue,
      coinValue,
      livesDisplay,
      settingsButton,
      difficultyOptions,
      levelOptions,
      touchJumpButton
    }, browser2);
    function setActionButtonDisabled(disabled) {
      actionButton.disabled = disabled;
    }
    function setSettingsButtonDisabled(disabled) {
      settingsButton.disabled = disabled;
    }
    function bindSettingsButton(onSettingsClick) {
      settingsButton.addEventListener("click", onSettingsClick);
      return () => {
        settingsButton.removeEventListener("click", onSettingsClick);
      };
    }
    function bindControls({ canvas: canvas2, onPrimaryAction, canTriggerPrimaryAction, onActionButtonClick }) {
      return bindInput({
        documentRef: browser2.documentRef,
        canvas: canvas2,
        actionButton,
        touchJumpButton,
        onPrimaryAction,
        canTriggerPrimaryAction,
        onActionButtonClick
      });
    }
    return {
      ...ui,
      bindControls,
      bindSettingsButton,
      bindViewportResize: browser2.bindResize,
      getInputMode: browser2.getInputMode,
      setActionButtonDisabled,
      setSettingsButtonDisabled
    };
  }

  // src/main.js
  var browser = createBrowserRuntime();
  var canvas = browser.documentRef.getElementById("gameCanvas");
  var view = createGameDOMView({
    overlay: browser.documentRef.getElementById("overlay"),
    overlayTag: browser.documentRef.getElementById("overlayTag"),
    overlayTitle: browser.documentRef.getElementById("overlayTitle"),
    overlayText: browser.documentRef.getElementById("overlayText"),
    loadingProgress: browser.documentRef.getElementById("loadingProgress"),
    loadingProgressText: browser.documentRef.getElementById("loadingProgressText"),
    actionButton: browser.documentRef.getElementById("actionButton"),
    recordValue: browser.documentRef.getElementById("recordValue"),
    scoreValue: browser.documentRef.getElementById("scoreValue"),
    coinValue: browser.documentRef.getElementById("coinValue"),
    livesDisplay: browser.documentRef.getElementById("livesDisplay"),
    settingsButton: browser.documentRef.getElementById("settingsButton"),
    difficultyOptions: browser.documentRef.getElementById("difficultyOptions"),
    levelOptions: browser.documentRef.getElementById("levelOptions"),
    touchJumpButton: browser.documentRef.getElementById("touchJumpButton")
  }, browser);
  var game = createGame({
    browser,
    canvas,
    view
  });
  game.start();
})();
