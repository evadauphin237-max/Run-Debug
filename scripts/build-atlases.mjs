import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const SOURCE_ASSETS_DIR = path.join(ROOT_DIR, "assets-src");
const RUNTIME_ASSETS_DIR = path.join(ROOT_DIR, "assets");
const ATLAS_DIR = path.join(RUNTIME_ASSETS_DIR, "atlases");
const MANIFEST_PATH = path.join(ROOT_DIR, "src", "game", "atlas-manifest.js");
const FRAME_GAP = 2;
const AUTO_TRIM_PADDING = 6;

const bugFamilyDefinitions = {
  bug: {
    output: "bug.webp",
    targetHeight: 256,
    sources: [
      { file: "Bug/bug1.svg", trim: true },
      { file: "Bug/bug2.svg", trim: true },
      { file: "Bug/bug3.svg", trim: true },
      { file: "Bug/bug4.svg", trim: true },
      { file: "Bug/bug5.svg", trim: true },
      { file: "Bug/bug6.svg", trim: true },
      { file: "Bug/bug7.svg", trim: true },
      { file: "Bug/bug8.svg", trim: true },
      { file: "Bug/bug9.svg", trim: true },
    ],
    hitSource: { file: "Bug/bug_hit.svg", trim: true },
  },
  bugB: {
    output: "bug-b.webp",
    targetHeight: 224,
    sources: [
      { file: "bug_b/bugb1.svg", trim: true },
      { file: "bug_b/bugb2.svg", trim: true },
      { file: "bug_b/bugb3.svg", trim: true },
      { file: "bug_b/bugb4.svg", trim: true },
      { file: "bug_b/bugb5.svg", trim: true },
      { file: "bug_b/bugb6.svg", trim: true },
      { file: "bug_b/bugb7.svg", trim: true },
      { file: "bug_b/bugb8.svg", trim: true },
    ],
    hitSource: { file: "bug_b/bugb_hit.svg", trim: true },
  },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resolveCrop(clip, metadata) {
  if (!clip) {
    return {
      left: 0,
      top: 0,
      width: metadata.width,
      height: metadata.height,
    };
  }

  const left = clamp(Math.floor(clip.x), 0, Math.max(0, metadata.width - 1));
  const top = clamp(Math.floor(clip.y), 0, Math.max(0, metadata.height - 1));
  const width = clamp(Math.ceil(clip.width), 1, metadata.width - left);
  const height = clamp(Math.ceil(clip.height), 1, metadata.height - top);

  return { left, top, width, height };
}

async function loadFrame(sourcePath, { clip = null, trim = false } = {}, targetHeight) {
  const input = sharp(sourcePath, { density: 72 });
  const metadata = await input.metadata();
  let pipeline = sharp(sourcePath, { density: 72 });
  let crop = null;

  if (clip) {
    crop = resolveCrop(clip, metadata);
    pipeline = pipeline.extract(crop);
  } else if (trim) {
    pipeline = pipeline.trim({
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      threshold: 1,
    });
    pipeline = pipeline.extend({
      top: AUTO_TRIM_PADDING,
      bottom: AUTO_TRIM_PADDING,
      left: AUTO_TRIM_PADDING,
      right: AUTO_TRIM_PADDING,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  } else {
    crop = {
      left: 0,
      top: 0,
      width: metadata.width,
      height: metadata.height,
    };
  }

  const resizeReferenceHeight = crop?.height ?? metadata.height;

  if (targetHeight && resizeReferenceHeight > targetHeight) {
    pipeline = pipeline.resize({
      height: targetHeight,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
  }

  const { data, info } = await pipeline.png().toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    width: info.width,
    height: info.height,
  };
}

async function buildAtlas({ output, frames }) {
  const atlasWidth = frames.reduce((sum, frame) => sum + frame.width, 0) + FRAME_GAP * Math.max(0, frames.length - 1);
  const atlasHeight = frames.reduce((max, frame) => Math.max(max, frame.height), 0);

  let x = 0;
  const composites = [];
  const manifestFrames = [];

  frames.forEach((frame) => {
    composites.push({
      input: frame.buffer,
      left: x,
      top: 0,
    });

    manifestFrames.push({
      x,
      y: 0,
      width: frame.width,
      height: frame.height,
    });

    x += frame.width + FRAME_GAP;
  });

  const atlas = sharp({
    create: {
      width: atlasWidth,
      height: atlasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  const atlasBuffer = await atlas
    .composite(composites)
    .webp({
      quality: 84,
      alphaQuality: 100,
      effort: 6,
    })
    .toBuffer();

  await fs.writeFile(path.join(ATLAS_DIR, output), atlasBuffer);

  return {
    file: output,
    width: atlasWidth,
    height: atlasHeight,
    frames: manifestFrames,
  };
}

async function buildBugFamilies() {
  const manifest = {};

  for (const [familyName, definition] of Object.entries(bugFamilyDefinitions)) {
    const frames = [];

    for (const source of definition.sources) {
      const sourcePath = path.join(SOURCE_ASSETS_DIR, source.file);
      frames.push(await loadFrame(sourcePath, source, definition.targetHeight));
    }

    const hitFrame = await loadFrame(
      path.join(SOURCE_ASSETS_DIR, definition.hitSource.file),
      definition.hitSource,
      definition.targetHeight
    );

    const atlasManifest = await buildAtlas({
      output: definition.output,
      frames: [...frames, hitFrame],
    });

    manifest[familyName] = {
      ...atlasManifest,
      animationFrameCount: frames.length,
      hitFrameIndex: frames.length,
    };
  }

  return manifest;
}

function formatManifest(manifest) {
  const manifestWithUrls = Object.fromEntries(
    Object.entries(manifest).map(([familyName, atlas]) => {
      const { file, ...atlasData } = atlas;
      return [
        familyName,
        {
          ...atlasData,
          src: `__ATLAS_URL__${file}`,
        },
      ];
    })
  );

  let manifestSource = JSON.stringify(manifestWithUrls, null, 2);

  Object.values(manifest).forEach(({ file }) => {
    manifestSource = manifestSource.replace(
      `"__ATLAS_URL__${file}"`,
      `new URL("../../assets/atlases/${file}", import.meta.url).href`
    );
  });

  return `// This file is generated by scripts/build-atlases.mjs.\n` +
    `// Do not edit it by hand.\n\n` +
    `export const atlasManifest = ${manifestSource};\n\nexport default atlasManifest;\n`;
}

async function main() {
  await fs.mkdir(ATLAS_DIR, { recursive: true });

  const manifest = await buildBugFamilies();

  await fs.writeFile(MANIFEST_PATH, formatManifest(manifest), "utf8");

  const atlasEntries = await fs.readdir(ATLAS_DIR, { withFileTypes: true });
  const atlasCount = atlasEntries.filter(
    (entry) => entry.isFile() && path.extname(entry.name) === ".webp"
  ).length;
  console.log(`Built ${atlasCount} atlas files in ${ATLAS_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
