import {
  BUG_B_OBSTACLE_FOOT_OFFSET,
  BUG_B_OBSTACLE_SCALE,
  BUG_B_OBSTACLE_SIZE,
  BUG_OBSTACLE_FOOT_OFFSET,
  BUG_OBSTACLE_SCALE,
  BUG_OBSTACLE_SIZE,
} from "./config.js";
import atlasManifest from "./atlas-manifest.js";

const CORE_ATLAS_FAMILIES = ["bug", "bugB"];

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
    },
  };
}

function createLazyVideoAsset(src) {
  let video = null;
  let loadPromise = null;

  return {
    get video() {
      return video;
    },
    isReady() {
      return Boolean(video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0);
    },
    load() {
      if (loadPromise) {
        return loadPromise;
      }

      video = document.createElement("video");
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "auto";
      video.crossOrigin = "anonymous";

      loadPromise = new Promise((resolve, reject) => {
        video.addEventListener("loadeddata", () => resolve(video), { once: true });
        video.addEventListener("error", () => reject(new Error(`Failed to load asset: ${src}`)), { once: true });
      });

      video.src = src;
      video.load();
      return loadPromise;
    },
    ensurePlaying() {
      if (!video) {
        return Promise.resolve();
      }

      return video.play().catch(() => {
        // Autoplay can be delayed until the user interacts with the page.
      });
    },
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
    },
  };
}

const atlasAssets = Object.fromEntries(
  Object.entries(atlasManifest).map(([familyName, atlas]) => [
    familyName,
    {
      ...atlas,
      imageAsset: createLazyImageAsset(atlas.src),
    },
  ])
);

const settingsIconAsset = createLazyImageAsset(new URL("../../assets/settings.svg", import.meta.url).href);
const heartLifeActiveAsset = createLazyImageAsset(new URL("../../assets/heart-life-active.svg", import.meta.url).href);
const heartFillActiveAsset = createLazyImageAsset(new URL("../../assets/heart-fill-active.svg", import.meta.url).href);
const heartLifeLostAsset = createLazyImageAsset(new URL("../../assets/heart-life-lost.svg", import.meta.url).href);
const bonusHeartAsset = createLazyImageAsset(new URL("../../assets/coeur.svg", import.meta.url).href);
const coinAsset = createLazyImageAsset(new URL("../../assets/dollar.png", import.meta.url).href);
const playerIdleIntroFrameAssets = Array.from({ length: 71 }, (_, index) => (
  createLazyImageAsset(new URL(`../../assets/personnage/idle/papillon/${index + 1}.svg`, import.meta.url).href)
));
const playerIdleFrameAssets = Array.from({ length: 26 }, (_, index) => (
  createLazyImageAsset(new URL(`../../assets/personnage/idle/${index + 1}.svg`, import.meta.url).href)
));
const playerRunFrameAssets = Array.from({ length: 15 }, (_, index) => (
  createLazyImageAsset(new URL(`../../assets/personnage/court/${index + 1}.svg`, import.meta.url).href)
));
const playerJumpFrameAssets = Array.from({ length: 8 }, (_, index) => (
  createLazyImageAsset(new URL(`../../assets/personnage/saut/${index + 1}.svg`, import.meta.url).href)
));
const playerDoubleJumpFrameAssets = Array.from({ length: 6 }, (_, index) => (
  createLazyImageAsset(new URL(`../../assets/personnage/doublesaut/${index + 1}.svg`, import.meta.url).href)
));
const playerHitFrameAssets = Array.from({ length: 4 }, (_, index) => (
  createLazyImageAsset(new URL(`../../assets/personnage/hit/${index + 1}.svg`, import.meta.url).href)
));
const playerGameOverFrameAssets = Array.from({ length: 20 }, (_, index) => (
  createLazyImageAsset(new URL(`../../assets/personnage/game over/${index + 1}.svg`, import.meta.url).href)
));
const playerWinFrameAssets = Array.from({ length: 83 }, (_, index) => (
  createLazyImageAsset(new URL(`../../assets/personnage/win/Win2/${index + 1}.svg`, import.meta.url).href)
));
const cloudAssets = [
  createLazyImageAsset(new URL("../../assets/decor/nuage1.svg", import.meta.url).href),
  createLazyImageAsset(new URL("../../assets/decor/nuage2.svg", import.meta.url).href),
  createLazyImageAsset(new URL("../../assets/decor/nuage3.svg", import.meta.url).href),
  createLazyImageAsset(new URL("../../assets/decor/nuage4.svg", import.meta.url).href),
];
const valleyBackgroundAsset = createLazyImageAsset(new URL("../../assets/decor/valee/AP.svg", import.meta.url).href);
const valleyThirdgroundAsset = createLazyImageAsset(new URL("../../assets/decor/valee/VALEE_tp.svg", import.meta.url).href);
const forestForegroundAsset = createLazyImageAsset(new URL("../../assets/decor/foret/foret_pp.svg", import.meta.url).href);
const valleyMidgroundSequenceAssets = [
  createLazyImageAsset(new URL("../../assets/decor/valee/VALEE1_dp.svg", import.meta.url).href),
  createLazyImageAsset(new URL("../../assets/decor/valee/valee2_dp.svg", import.meta.url).href),
  createLazyImageAsset(new URL("../../assets/decor/valee/valee3_dp.svg", import.meta.url).href),
  createLazyImageAsset(new URL("../../assets/decor/valee/valee4_dp.svg", import.meta.url).href),
  createLazyImageAsset(new URL("../../assets/decor/valee/valee5_dp.svg", import.meta.url).href),
  createLazyImageAsset(new URL("../../assets/decor/valee/valee6_dp.svg", import.meta.url).href),
  createLazyImageAsset(new URL("../../assets/decor/valee/valee7_dp.svg", import.meta.url).href),
  createLazyImageAsset(new URL("../../assets/decor/valee/valee8_dp.svg", import.meta.url).href),
];

const decorAssets = {
  arcade: {
    background: createLazyImageAsset(new URL("../../assets/3.svg", import.meta.url).href),
    midground: createLazyImageAsset(new URL("../../assets/2.svg", import.meta.url).href),
    foreground: createLazyImageAsset(new URL("../../assets/1.svg", import.meta.url).href),
  },
  forest: {
    background: valleyBackgroundAsset,
    thirdground: valleyThirdgroundAsset,
    midground: createLazyImageAsset(new URL("../../assets/decor/foret/foret_dp.svg", import.meta.url).href),
    foreground: forestForegroundAsset,
    sun: createLazyImageAsset(new URL("../../assets/decor/foret/soleil.svg", import.meta.url).href),
  },
  valley: {
    background: valleyBackgroundAsset,
    thirdground: valleyThirdgroundAsset,
    midground: valleyMidgroundSequenceAssets[0],
    midgroundSequence: valleyMidgroundSequenceAssets,
    foreground: forestForegroundAsset,
  },
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
    },
  };
}

function collectCoreAssets() {
  const levelDecorAssets = Object.values(decorAssets).flatMap((theme) => [
    theme.background,
    theme.thirdground,
    theme.midground,
    ...(theme.midgroundSequence ?? []),
    theme.foreground,
    theme.sun,
  ].filter(Boolean));

  return [...new Set([
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
    ...cloudAssets,
  ])];
}

export function preloadCoreAssets({ onProgress } = {}) {
  const assets = collectCoreAssets();
  const total = assets.length;
  let loaded = 0;

  onProgress?.({
    loaded,
    total,
    progress: total > 0 ? 0 : 1,
  });

  return Promise.all(assets.map((asset) => (
    asset.load().then((resource) => {
      loaded += 1;
      onProgress?.({
        loaded,
        total,
        progress: total > 0 ? loaded / total : 1,
      });
      return resource;
    })
  )));
}

export function warmGameplayAssets() {
  // All gameplay atlases are already part of the core preload.
}

export function isImageReady(image) {
  return Boolean(image?.complete && image.naturalWidth > 0);
}

export function isVideoReady(video) {
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
    ...extra,
  };
}

export const bugVisualSettings = {
  "animated-bug": createBugVisualSetting("bug", {
    scale: BUG_OBSTACLE_SCALE,
    footOffset: BUG_OBSTACLE_FOOT_OFFSET,
    size: BUG_OBSTACLE_SIZE,
  }),
  "animated-bug-b": createBugVisualSetting("bugB", {
    scale: BUG_B_OBSTACLE_SCALE,
    footOffset: BUG_B_OBSTACLE_FOOT_OFFSET,
    size: BUG_B_OBSTACLE_SIZE,
  }),
};

export const bonusHeartSprite = createImageSprite(bonusHeartAsset);
export const coinSprite = createImageSprite(coinAsset);

export const decorSprites = {
  arcade: {
    background: createImageSprite(decorAssets.arcade.background),
    midground: createImageSprite(decorAssets.arcade.midground),
    foreground: createImageSprite(decorAssets.arcade.foreground),
  },
  forest: {
    background: createImageSprite(decorAssets.forest.background),
    thirdground: createImageSprite(decorAssets.forest.thirdground),
    midground: createImageSprite(decorAssets.forest.midground),
    foreground: createImageSprite(decorAssets.forest.foreground),
    sun: createImageSprite(decorAssets.forest.sun),
  },
  valley: {
    background: createImageSprite(decorAssets.valley.background),
    thirdground: createImageSprite(decorAssets.valley.thirdground),
    midground: createImageSprite(decorAssets.valley.midground),
    midgroundSequence: decorAssets.valley.midgroundSequence.map((asset) => createImageSprite(asset)),
    foreground: createImageSprite(decorAssets.valley.foreground),
  },
  clouds: cloudAssets.map((asset) => createImageSprite(asset)),
};

function padClip(clip, padding = 18) {
  return {
    x: Math.max(0, clip.x - padding),
    y: Math.max(0, clip.y - padding),
    width: clip.width + (padding * 2),
    height: clip.height + (padding * 2),
  };
}

export const playerVisualAssets = {
  idleIntro: {
    frameAssets: playerIdleIntroFrameAssets,
    matte: "white",
    preserveFrameBounds: true,
  },
  idle: {
    frameAssets: playerIdleFrameAssets,
    matte: "white",
    preserveFrameBounds: true,
  },
  run: {
    frameAssets: playerRunFrameAssets,
    matte: "white",
  },
  jump: {
    frameAssets: playerJumpFrameAssets,
    matte: "white",
  },
  doubleJump: {
    frameAssets: playerDoubleJumpFrameAssets,
    matte: "white",
  },
  hit: {
    frameAssets: playerHitFrameAssets,
    matte: "white",
  },
  chute: {
    frameAssets: playerGameOverFrameAssets.slice(0, 5),
    matte: "white",
    preserveFrameBounds: true,
  },
  gameOver: {
    frameAssets: playerGameOverFrameAssets,
    matte: "white",
    preserveFrameBounds: true,
  },
  win: {
    frameAssets: playerWinFrameAssets,
    matte: "white",
    preserveFrameBounds: true,
  },
};
