// optimize.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const inputDir = "input";       // Folder with original PNGs
const outputDir = "output";     // Compressed and resized output
const outputFormat = "png";    // Changed to PNG to avoid WebP dependency issues
const shouldCreateLottie = true;  // Set to true to generate Lottie animation

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

  // Generate Lottie animation if enabled
  if (shouldCreateLottie) {
    await createLottieAnimation(files);
  }
}

async function getImageWidth(filePath) {
  const meta = await sharp(filePath).metadata();
  return meta.width;
}

async function createLottieAnimation(files) {
  console.log("🎬 Creating Lottie animation...");
  
  // Get dimensions from first processed image
  const firstOutputPath = path.join(outputDir, path.parse(files[0]).name + ".png");
  const { width, height } = await sharp(firstOutputPath).metadata();
  
  // Calculate frame rate and duration
  const frameRate = 12; // 12 FPS for smooth animation
  const duration = (files.length / frameRate) * 1000; // Duration in milliseconds
  
  // Create Lottie JSON structure
  const lottieData = {
    v: "5.7.4", // Lottie version
    fr: frameRate, // Frame rate
    ip: 0, // In point (start frame)
    op: files.length, // Out point (end frame) 
    w: width, // Width
    h: height, // Height
    nm: "Frame Animation", // Name
    ddd: 0, // 3D layers (0 = 2D)
    assets: [], // Image assets
    layers: [] // Animation layers
  };

  // Add each PNG as an asset
  files.forEach((file, index) => {
    const baseName = path.parse(file).name;
    const assetId = `image_${index}`;
    
    // Add to assets array
    lottieData.assets.push({
      id: assetId,
      w: width,
      h: height,
      u: "", // Base path (empty since files are in same directory)
      p: `${baseName}.png`, // File path
      e: 0 // Embedded (0 = external file)
    });
  });

  // Create a layer for each frame (frame-by-frame animation)
  files.forEach((file, index) => {
    const baseName = path.parse(file).name;
    const assetId = `image_${index}`;
    
    const imageLayer = {
      ddd: 0,
      ind: index + 1, // Layer index (1-based)
      ty: 2, // Layer type (2 = image)
      nm: `Frame ${index + 1}`, // Layer name
      refId: assetId, // Reference to asset
      sr: 1, // Stretch ratio
      ks: { // Transform properties
        o: { a: 0, k: 100 }, // Opacity
        r: { a: 0, k: 0 }, // Rotation
        p: { a: 0, k: [width/2, height/2, 0] }, // Position (centered)
        a: { a: 0, k: [width/2, height/2, 0] }, // Anchor point
        s: { a: 0, k: [100, 100, 100] } // Scale
      },
      ao: 0, // Auto-orient
      ip: index, // In point (when this frame starts)
      op: index + 1, // Out point (when this frame ends)
      st: 0, // Start time
      bm: 0 // Blend mode
    };
    
    lottieData.layers.push(imageLayer);
  });
  
  // Write Lottie JSON file
  const lottieFile = path.join(outputDir, "animation.json");
  fs.writeFileSync(lottieFile, JSON.stringify(lottieData, null, 2));
  
  console.log(`🎬 Lottie animation created: ${lottieFile}`);
  console.log(`📊 Animation specs: ${width}x${height}, ${files.length} frames, ${frameRate}fps, ${(duration/1000).toFixed(1)}s duration`);
}

processImages().catch(console.error);
