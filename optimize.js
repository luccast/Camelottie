// optimize.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const inputDir = "input";       // Folder with original PNGs
const outputDir = "output";     // Compressed and resized output
const outputFormat = "png";    // Changed to PNG to avoid WebP dependency issues

async function processImages() {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const files = fs.readdirSync(inputDir).filter(f => f.endsWith(".png"));

  // Dynamic imports for ES modules
  const { default: imagemin } = await import("imagemin");
  const { default: imageminWebp } = await import("imagemin-webp");
  const { default: imageminPngquant } = await import("imagemin-pngquant");

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const baseName = path.parse(file).name;
    const tempPath = path.join(outputDir, baseName + ".temp.png");

    // Resize with Sharp to 33% and save temporarily
    await sharp(inputPath)
      .resize({ width: Math.round(await getImageWidth(inputPath) * 0.33) })
      .toFile(tempPath);

    // Compress using imagemin
    const plugins = outputFormat === "webp"
      ? [imageminWebp({ lossless: true })]
      : [imageminPngquant({ quality: [0.6, 0.8] })];

    const compressed = await imagemin([tempPath], {
      destination: outputDir,
      plugins,
    });

    // Rename final file if needed
    const outExt = outputFormat === "webp" ? ".webp" : ".png";
    const finalPath = path.join(outputDir, baseName + outExt);
    fs.renameSync(compressed[0].destinationPath, finalPath);

    // Clean up temp file (if it still exists)
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (error) {
      // Ignore cleanup errors, the temp file may have been consumed by imagemin
    }
    console.log(`Processed ${file} -> ${finalPath}`);
  }

  console.log("✅ All images processed.");
}

async function getImageWidth(filePath) {
  const meta = await sharp(filePath).metadata();
  return meta.width;
}

processImages().catch(console.error);
