import { isImageReady, isVideoReady, playerVisualAssets } from "./assets.js";
import {
  createPlayerAnimationFromVisualState,
  resolvePlayerVisualState,
} from "./player-visual-state.js";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getOpaqueBounds(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = pixels[((y * width) + x) * 4 + 3];

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
      height,
    };
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function cropCanvasToBounds(canvas, bounds) {
  const trimmedWidth = Math.max(1, bounds.width);
  const trimmedHeight = Math.max(1, bounds.height);
  const trimmedCanvas = createCanvas(trimmedWidth, trimmedHeight);
  const trimmedCtx = trimmedCanvas.getContext("2d");
  trimmedCtx.drawImage(
    canvas,
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

function trimTransparentBounds(canvas) {
  return cropCanvasToBounds(canvas, getOpaqueBounds(canvas));
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
    height: maxY - minY,
  };
}

function normalizeClip(source, clip) {
  if (clip.width <= 1 && clip.height <= 1) {
    return {
      x: Math.round(source.videoWidth * clip.x),
      y: Math.round(source.videoHeight * clip.y),
      width: Math.round(source.videoWidth * clip.width),
      height: Math.round(source.videoHeight * clip.height),
    };
  }

  return clip;
}

function applyMatteKey(canvas, mode) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const minChannel = mode === "video-white" ? 244 : 250;
  const maxSpread = mode === "video-white" ? 18 : 8;

  for (let index = 0; index < pixels.length; index += 4) {
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    if (min >= minChannel && (max - min) <= maxSpread) {
      const softness = mode === "video-white"
        ? 1 - clamp((min - minChannel) / (255 - minChannel || 1), 0, 1)
        : 0;
      pixels[index + 3] = mode === "video-white"
        ? Math.round(pixels[index + 3] * softness)
        : 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function createPlayerRenderer(ctx) {
  const staticClipCache = new Map();
  const staticSourceCanvasCache = new Map();
  const sequenceBoundsCache = new Map();
  const videoFrameCanvas = createCanvas(1, 1);
  const videoFrameCtx = videoFrameCanvas.getContext("2d", { willReadFrequently: true });

  function getStaticSourceCanvas(assetKey, sourceImage, clip, matte) {
    const clipKey = clip
      ? `${clip.x}:${clip.y}:${clip.width}:${clip.height}`
      : "full";
    const cacheKey = `${assetKey}:${clipKey}:${matte}:source`;
    const cached = staticClipCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const resolvedClip = clip ?? {
      x: 0,
      y: 0,
      width: sourceImage.naturalWidth,
      height: sourceImage.naturalHeight,
    };
    const canvas = createCanvas(resolvedClip.width, resolvedClip.height);
    const clipCtx = canvas.getContext("2d", { willReadFrequently: true });
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

    const processed = applyMatteKey(canvas, matte);
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
    const clipKey = clip
      ? `${clip.x}:${clip.y}:${clip.width}:${clip.height}`
      : "full";
    const boundsKey = preserveFrameBounds && sequenceBounds
      ? `${sequenceBounds.x}:${sequenceBounds.y}:${sequenceBounds.width}:${sequenceBounds.height}`
      : "trimmed";
    const cacheKey = `${assetKey}:${clipKey}:${matte}:${boundsKey}`;
    const cached = staticSourceCanvasCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const sourceCanvas = getStaticSourceCanvas(assetKey, sourceImage, clip, matte);
    let processed = sourceCanvas;

    if (!clip) {
      processed = preserveFrameBounds && sequenceBounds
        ? cropCanvasToBounds(sourceCanvas, sequenceBounds)
        : trimTransparentBounds(sourceCanvas);
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
      case "run":
        return {
          asset: playerVisualAssets.run.frameAssets[frameIndex % playerVisualAssets.run.frameAssets.length],
          frameAssets: playerVisualAssets.run.frameAssets,
          matte: playerVisualAssets.run.matte,
          preserveFrameBounds: playerVisualAssets.run.preserveFrameBounds ?? false,
          sequenceKey: "run",
        };
      case "jump":
        return {
          asset: playerVisualAssets.jump.frameAssets[frameIndex % playerVisualAssets.jump.frameAssets.length],
          frameAssets: playerVisualAssets.jump.frameAssets,
          matte: playerVisualAssets.jump.matte,
          preserveFrameBounds: playerVisualAssets.jump.preserveFrameBounds ?? false,
          sequenceKey: "jump",
        };
      case "doubleJump":
        return {
          asset: playerVisualAssets.doubleJump.frameAssets[frameIndex % playerVisualAssets.doubleJump.frameAssets.length],
          frameAssets: playerVisualAssets.doubleJump.frameAssets,
          matte: playerVisualAssets.doubleJump.matte,
          preserveFrameBounds: playerVisualAssets.doubleJump.preserveFrameBounds ?? false,
          sequenceKey: "doubleJump",
        };
      case "hit":
        return {
          asset: playerVisualAssets.hit.frameAssets[frameIndex % playerVisualAssets.hit.frameAssets.length],
          frameAssets: playerVisualAssets.hit.frameAssets,
          matte: playerVisualAssets.hit.matte,
          preserveFrameBounds: playerVisualAssets.hit.preserveFrameBounds ?? false,
          sequenceKey: "hit",
        };
      case "chute":
        return {
          asset: playerVisualAssets.chute.frameAssets[frameIndex % playerVisualAssets.chute.frameAssets.length],
          frameAssets: playerVisualAssets.chute.frameAssets,
          matte: playerVisualAssets.chute.matte,
          preserveFrameBounds: playerVisualAssets.chute.preserveFrameBounds ?? false,
          sequenceKey: "chute",
        };
      case "gameOver":
        return {
          asset: playerVisualAssets.gameOver.frameAssets[frameIndex % playerVisualAssets.gameOver.frameAssets.length],
          frameAssets: playerVisualAssets.gameOver.frameAssets,
          matte: playerVisualAssets.gameOver.matte,
          preserveFrameBounds: playerVisualAssets.gameOver.preserveFrameBounds ?? false,
          sequenceKey: "gameOver",
        };
      case "win":
        return {
          asset: playerVisualAssets.win.frameAssets[frameIndex % playerVisualAssets.win.frameAssets.length],
          frameAssets: playerVisualAssets.win.frameAssets,
          matte: playerVisualAssets.win.matte,
          preserveFrameBounds: playerVisualAssets.win.preserveFrameBounds ?? false,
          sequenceKey: "win",
        };
      case "idle":
      default:
        return {
          asset: playerVisualAssets.idle.frameAssets[frameIndex % playerVisualAssets.idle.frameAssets.length],
          frameAssets: playerVisualAssets.idle.frameAssets,
          matte: playerVisualAssets.idle.matte,
          preserveFrameBounds: playerVisualAssets.idle.preserveFrameBounds ?? false,
          sequenceKey: "idle",
        };
    }
  }

  function draw(state, player, runtime) {
    const visualState = resolvePlayerVisualState(state, player, runtime);
    const animation = createPlayerAnimationFromVisualState(visualState, state, player, runtime);
    const visual = getVisualDescriptor(animation.sheet, animation.frameIndex);
    const bodyTilt = (animation.baseTilt ?? 0) + Math.sin(animation.motionPhase ?? 0) * (animation.tiltAmplitude ?? 0);
    const bodyLift = -Math.abs(Math.sin(animation.motionPhase ?? 0)) * (animation.bobAmplitude ?? 0);
    const strideShift = Math.sin(animation.motionPhase ?? 0) * (animation.strideAmplitude ?? 0);
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
      const sequenceBounds = visual.preserveFrameBounds
        ? getSequenceBounds(visual.sequenceKey, visual.frameAssets, visual.matte)
        : null;
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
    const drawWidth = sourceWidth * baseScale;
    const drawHeight = sourceHeight * baseScale;
    const drawX = footX - (drawWidth * 0.5) + strideShift;
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
  };
}
