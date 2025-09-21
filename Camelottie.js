// optimize.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const inputDir = "input";       // Folder with original PNGs
const outputDir = "output/frames";     // Compressed and resized output
const outputFormat = "webp";   // Using WebP for better compression
const shouldCreateLottie = true;  // Set to true to generate Lottie animation
const selfContainedLottie = true; // Set to true for embedded images, false for external files

// Image Quality & Compression Settings
// 
// WebP Settings Guide:
// - lossless: true = perfect quality, larger files | false = good quality, much smaller files
// - quality: 0-100 (only for lossy), 80-90 = good balance, 95+ = very high quality
// - effort: 0-6, higher = slower but smaller files (4-5 recommended)
// - nearLossless: subtle quality loss for smaller lossless files
//
// PNG Settings Guide:
// - quality: [min, max] range 0.0-1.0, [0.6, 0.8] = balanced, [0.8, 0.9] = high quality
// - speed: 1-11, higher = faster compression but larger files
// - posterize: reduce colors (null = auto, 64-256 = custom limit)

const webpSettings = {
  lossless: false,     // true = lossless WebP, false = lossy WebP  
  quality: 75,         // Quality 0-100 (only for lossy WebP)
  effort: 6,           // Compression effort 0-6 (higher = smaller files, slower)
  nearLossless: false  // Enable near-lossless compression (requires lossless: true)
};

const pngSettings = {
  quality: [0.7, 0.8], // Quality range for pngquant [min, max]
  speed: 4,            // Compression speed 1-11 (higher = faster, larger files)
  posterize: null      // Reduce colors (null = auto, number = max colors)
};

// Lottie Animation Settings
const lottieFrameRate = 15;       // Animation frame rate (fps) - 12, 15, 24, 30, 60 are common
const originalFrameRate = 30;     // Original frame rate of the input animation
const lottieWidth = 200;          // Custom width (null = use optimized image width)
const lottieHeight = null;        // Custom height (null = use optimized image height)
const maintainAspectRatio = true; // Keep aspect ratio when scaling dimensions

// Crop Settings
const cropWidth = 237;           // Crop width (null = no cropping, number = crop to this width)
const cropHeight = null;          // Crop height (null = no cropping, number = crop to this height)
const cropFromCenter = true;      // Crop from center (true) or from top-left (false)

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
    const tempExt = outputFormat === "webp" ? ".temp.webp" : ".temp.png";
    const tempPath = path.join(outputDir, baseName + tempExt);

    // Resize with Sharp to 33% and convert to desired format
    if (outputFormat === "webp") {
      const webpOptions = {
        lossless: webpSettings.lossless,
        effort: webpSettings.effort,
        nearLossless: webpSettings.nearLossless
      };
      
      // Only add quality for lossy WebP
      if (!webpSettings.lossless) {
        webpOptions.quality = webpSettings.quality;
      }
      
      await sharp(inputPath)
        .resize({ width: Math.round(await getImageWidth(inputPath) * 0.33) })
        .webp(webpOptions)
        .toFile(tempPath);
    } else {
      await sharp(inputPath)
        .resize({ width: Math.round(await getImageWidth(inputPath) * 0.33) })
        .toFile(tempPath);
    }

    let finalPath;
    
    if (outputFormat === "webp") {
      // For WebP, Sharp already optimized it, so just rename
      finalPath = path.join(outputDir, baseName + ".webp");
      fs.renameSync(tempPath, finalPath);
    } else {
      // For PNG, use imagemin compression with custom settings
      const pngquantOptions = {
        quality: pngSettings.quality,
        speed: pngSettings.speed
      };
      
      // Add posterize option if specified
      if (pngSettings.posterize) {
        pngquantOptions.posterize = pngSettings.posterize;
      }
      
      const plugins = [imageminPngquant(pngquantOptions)];
      const compressed = await imagemin([tempPath], {
        destination: outputDir,
        plugins,
      });
      
      finalPath = path.join(outputDir, baseName + ".png");
      fs.renameSync(compressed[0].destinationPath, finalPath);
    }

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
  
  // Display compression settings used
  if (outputFormat === "webp") {
    const compressionType = webpSettings.lossless ? "lossless" : `lossy (quality: ${webpSettings.quality})`;
    console.log(`🔧 WebP settings: ${compressionType}, effort: ${webpSettings.effort}`);
  } else {
    console.log(`🔧 PNG settings: quality: [${pngSettings.quality.join(', ')}], speed: ${pngSettings.speed}`);
  }

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
  
  // Calculate frame skipping ratio to maintain original animation speed
  const frameSkipRatio = originalFrameRate / lottieFrameRate;
  const selectedFrames = [];
  
  // Select frames to include based on frame skip ratio
  for (let i = 0; i < files.length; i += frameSkipRatio) {
    const frameIndex = Math.floor(i);
    if (frameIndex < files.length) {
      selectedFrames.push({
        originalIndex: frameIndex,
        file: files[frameIndex],
        lottieIndex: selectedFrames.length
      });
    }
  }
  
  console.log(`🎯 Frame selection: ${files.length} original frames → ${selectedFrames.length} selected frames (${frameSkipRatio.toFixed(2)}x skip ratio)`);
  
  // Get original dimensions from first processed image
  const firstOutputExt = outputFormat === "webp" ? ".webp" : ".png";
  const firstOutputPath = path.join(outputDir, path.parse(files[0]).name + firstOutputExt);  
  const originalMetadata = await sharp(firstOutputPath).metadata();
  
  // Apply cropping if specified
  let croppedWidth = originalMetadata.width;
  let croppedHeight = originalMetadata.height;
  let cropOffsetX = 0;
  let cropOffsetY = 0;
  
  if (cropWidth || cropHeight) {
    // Calculate crop dimensions
    croppedWidth = cropWidth || originalMetadata.width;
    croppedHeight = cropHeight || originalMetadata.height;
    
    // Ensure crop dimensions don't exceed original dimensions
    croppedWidth = Math.min(croppedWidth, originalMetadata.width);
    croppedHeight = Math.min(croppedHeight, originalMetadata.height);
    
    // Calculate crop offset (center or top-left)
    if (cropFromCenter) {
      cropOffsetX = Math.floor((originalMetadata.width - croppedWidth) / 2);
      cropOffsetY = Math.floor((originalMetadata.height - croppedHeight) / 2);
    } else {
      cropOffsetX = 0;
      cropOffsetY = 0;
    }
    
    console.log(`✂️  Cropping: ${originalMetadata.width}×${originalMetadata.height} → ${croppedWidth}×${croppedHeight} (offset: ${cropOffsetX},${cropOffsetY})`);
  }
  
  // Calculate final Lottie dimensions
  let width, height;
  
  if (lottieWidth && lottieHeight) {
    // Both dimensions specified
    width = lottieWidth;
    height = lottieHeight;
  } else if (lottieWidth && !lottieHeight) {
    // Only width specified, calculate height maintaining aspect ratio
    width = lottieWidth;
    height = maintainAspectRatio ? 
      Math.round((lottieWidth / croppedWidth) * croppedHeight) : 
      croppedHeight;
  } else if (!lottieWidth && lottieHeight) {
    // Only height specified, calculate width maintaining aspect ratio
    height = lottieHeight;
    width = maintainAspectRatio ? 
      Math.round((lottieHeight / croppedHeight) * croppedWidth) : 
      croppedWidth;
  } else {
    // Use cropped image dimensions
    width = croppedWidth;
    height = croppedHeight;
  }
  
  // Calculate duration based on ORIGINAL frame count and frame rate to maintain speed
  const duration = (files.length / originalFrameRate) * 1000; // Duration in milliseconds
  
  // Create Lottie JSON structure
  const lottieData = {
    v: "5.7.4", // Lottie version
    fr: lottieFrameRate, // Frame rate
    ip: 0, // In point (start frame)
    op: selectedFrames.length, // Out point (end frame) 
    w: width, // Width
    h: height, // Height
    nm: "Frame Animation", // Name
    ddd: 0, // 3D layers (0 = 2D)
    assets: [], // Image assets
    layers: [] // Animation layers
  };

  // Add each selected image as an asset
  for (const frameData of selectedFrames) {
    const baseName = path.parse(frameData.file).name;
    const assetId = `image_${frameData.lottieIndex}`;
    const imageExt = outputFormat === "webp" ? ".webp" : ".png";
    const imagePath = path.join(outputDir, `${baseName}${imageExt}`);
    
    if (selfContainedLottie) {
      // Read and process image with cropping if needed
      let imageBuffer;
      if (cropWidth || cropHeight) {
        // Apply crop using Sharp
        imageBuffer = await sharp(imagePath)
          .extract({ 
            left: cropOffsetX, 
            top: cropOffsetY, 
            width: croppedWidth, 
            height: croppedHeight 
          })
          .toBuffer();
      } else {
        // No cropping, read original
        imageBuffer = fs.readFileSync(imagePath);
      }
      
      const base64Data = imageBuffer.toString('base64');
      const mimeType = outputFormat === "webp" ? "image/webp" : "image/png";
      const dataUri = `data:${mimeType};base64,${base64Data}`;
      
      // Add embedded asset to array
      lottieData.assets.push({
        id: assetId,
        w: width,
        h: height,
        u: "", // Base path (empty for embedded)
        p: dataUri, // Base64 data URI
        e: 1 // Embedded (1 = embedded data)
      });
    } else {
      // For external files, we need to create cropped versions
      if (cropWidth || cropHeight) {
        // Create cropped version for external files
        const croppedImagePath = path.join(outputDir, `${baseName}_cropped${imageExt}`);
        await sharp(imagePath)
          .extract({ 
            left: cropOffsetX, 
            top: cropOffsetY, 
            width: croppedWidth, 
            height: croppedHeight 
          })
          .toFile(croppedImagePath);
        
        // Add external file reference to cropped version
        lottieData.assets.push({
          id: assetId,
          w: width,
          h: height,
          u: "", // Base path (empty since files are in same directory)
          p: `${baseName}_cropped${imageExt}`, // File path
          e: 0 // Embedded (0 = external file)
        });
      } else {
        // No cropping needed, use original
        lottieData.assets.push({
          id: assetId,
          w: width,
          h: height,
          u: "", // Base path (empty since files are in same directory)
          p: `${baseName}${imageExt}`, // File path
          e: 0 // Embedded (0 = external file)
        });
      }
    }
  }

  // Create a layer for each selected frame (frame-by-frame animation)
  selectedFrames.forEach((frameData, lottieIndex) => {
    const baseName = path.parse(frameData.file).name;
    const assetId = `image_${lottieIndex}`;
    
    const imageLayer = {
      ddd: 0,
      ind: lottieIndex + 1, // Layer index (1-based)
      ty: 2, // Layer type (2 = image)
      nm: `Frame ${frameData.originalIndex + 1}`, // Layer name (original frame number)
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
      ip: lottieIndex, // In point (when this frame starts)
      op: lottieIndex + 1, // Out point (when this frame ends)
      st: 0, // Start time
      bm: 0 // Blend mode
    };
    
    lottieData.layers.push(imageLayer);
  });
  
  // Write Lottie JSON file (in parent output directory)
  const lottieFile = path.join(path.dirname(outputDir), "animation.json");
  const jsonString = JSON.stringify(lottieData, null, 2);
  fs.writeFileSync(lottieFile, jsonString);
  
  const fileSizeKB = Math.round(jsonString.length / 1024);
  const containedType = selfContainedLottie ? "self-contained" : "external files";
  
  console.log(`🎬 Lottie animation created: ${lottieFile}`);
  console.log(`📊 Animation specs: ${width}x${height}, ${selectedFrames.length} frames, ${lottieFrameRate}fps, ${(duration/1000).toFixed(1)}s duration`);
  console.log(`⚡ Speed maintained: Original ${originalFrameRate}fps → ${lottieFrameRate}fps (${frameSkipRatio.toFixed(2)}x frame skip)`);
  
  // Show dimension source
  if (lottieWidth || lottieHeight) {
    const customDims = lottieWidth && lottieHeight ? "custom w×h" : 
                      lottieWidth ? "custom width" : "custom height";
    const cropInfo = (cropWidth || cropHeight) ? ` (cropped from ${originalMetadata.width}×${originalMetadata.height})` : "";
    console.log(`📐 Dimensions: ${customDims}${cropInfo}`);
  } else if (cropWidth || cropHeight) {
    console.log(`📐 Dimensions: using cropped size (${originalMetadata.width}×${originalMetadata.height} → ${croppedWidth}×${croppedHeight})`);
  } else {
    console.log(`📐 Dimensions: using optimized image size`);
  }
  
  console.log(`📦 File type: ${containedType}, Size: ${fileSizeKB}KB`);
  
  if (selfContainedLottie) {
    console.log(`✨ Self-contained: All images embedded as base64 - single file deployment!`);
  } else {
    console.log(`🔗 External: Requires ${selectedFrames.length} PNG files in same directory`);
  }
}

processImages().catch(console.error);
