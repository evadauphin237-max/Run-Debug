import { decorSprites, isImageReady } from "./assets.js";

const LAYER_SEAM_PATCH_WIDTH = {
  background: 10,
  thirdground: 10,
  midground: 10,
  foreground: 10,
};

const LAYER_SEAM_OVERDRAW = 2;
const LAYER_EDGE_TRIM = 2;
const SEQUENCE_BLEND_WIDTH_RATIO = 0.06;
const BRIDGE_BLEND_WIDTH = 10;

function getLayerMetrics(world, image) {
  const sourceWidth = Math.max(1, image.naturalWidth || image.width || 1);
  const sourceHeight = Math.max(1, image.naturalHeight || image.height || 1);
  const targetWidth = world.width;
  const targetHeight = Math.max(1, Math.round((sourceHeight / sourceWidth) * targetWidth));

  return {
    sourceWidth,
    sourceHeight,
    targetWidth,
    targetHeight,
    y: world.height - targetHeight,
  };
}

export function createBackgroundRenderer(ctx, world) {
  const layerBitmapCache = new WeakMap();
  let skyGradient = null;
  const FOREST_CLOUD_SOURCES = [
    { x: 370, y: 42, width: 417, height: 153 },
    { x: 806, y: 177, width: 151, height: 62 },
    { x: 1150, y: 122, width: 269, height: 133 },
    { x: 1474, y: 40, width: 282, height: 102 },
  ];
  const FOREST_CLOUD_LAYOUTS = [
    { x: 0.06, y: 42, widthRatio: 0.22, speedFactor: 0.2 },
    { x: 0.29, y: 104, widthRatio: 0.1, speedFactor: 0.12 },
    { x: 0.52, y: 58, widthRatio: 0.15, speedFactor: 0.16 },
    { x: 0.79, y: 32, widthRatio: 0.16, speedFactor: 0.08 },
  ];
  const FOREST_SUN_SOURCE = {
    x: 449,
    y: 27,
    width: 141,
    height: 138,
  };
  function createScratchCanvas(width, height) {
    if (typeof OffscreenCanvas !== "undefined") {
      return new OffscreenCanvas(width, height);
    }

    const canvas = ctx.canvas.ownerDocument.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  function getPreparedLayer(sprite, seamPatchWidth = 0) {
    if (!sprite || !isImageReady(sprite.image)) {
      return null;
    }

    const metrics = getLayerMetrics(world, sprite.image);
    const seamWidth = seamPatchWidth > 0
      ? Math.min(metrics.targetWidth, seamPatchWidth + LAYER_SEAM_OVERDRAW * 2)
      : 0;
    const sourceTrim = seamWidth > 0
      ? Math.min(LAYER_EDGE_TRIM, Math.max(0, Math.floor((metrics.sourceWidth - 1) / 2)))
      : 0;
    const trimmedSourceWidth = Math.max(1, metrics.sourceWidth - sourceTrim * 2);
    const cacheKey = `${metrics.targetWidth}x${metrics.targetHeight}:${seamWidth}`;
    const cachedLayer = layerBitmapCache.get(sprite.image);

    if (cachedLayer?.key === cacheKey) {
      return {
        ...metrics,
        canvas: cachedLayer.canvas,
        seamWidth,
      };
    }

    const canvas = createScratchCanvas(metrics.targetWidth + seamWidth * 2, metrics.targetHeight);
    const scratchCtx = canvas.getContext("2d");

    scratchCtx.imageSmoothingEnabled = true;
    scratchCtx.clearRect(0, 0, canvas.width, canvas.height);
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
      canvas,
    });

    return {
      ...metrics,
      canvas,
      seamWidth,
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
    const wrappedOffset = ((offset % preparedLayer.targetWidth) + preparedLayer.targetWidth) % preparedLayer.targetWidth;
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

    const wrappedOffset = ((offset % currentLayer.targetWidth) + currentLayer.targetWidth) % currentLayer.targetWidth;
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

    const wrappedOffset = ((offset % currentLayer.targetWidth) + currentLayer.targetWidth) % currentLayer.targetWidth;
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
    const wrappedOffset = ((offset % preparedLayer.targetWidth) + preparedLayer.targetWidth) % preparedLayer.targetWidth;
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
      const travelDistance = (state.cloudOffset * cloud.speedFactor) % wrapWidth;
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

    const drawHeight = Math.round((source.height / source.width) * drawWidth);
    const wrapWidth = world.width + drawWidth + 240;
    const travelDistance = ((motionOffset % wrapWidth) + wrapWidth) % wrapWidth;

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
      decorSprites.valley.midground,
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
    draw,
  };
}
