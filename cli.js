#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');

const program = new Command();

program
  .name('camelottie')
  .description('Convert PNG sequences or MP4 videos to optimized Lottie animations')
  .version('1.0.0');

program
  .command('optimize')
  .description('Optimize PNG sequence or MP4 video to Lottie animation')
  .argument('<input>', 'Input: folder with PNG files or MP4 video file')
  .argument('[output]', 'Output directory (default: ./output)', './output')
  .option('-f, --format <format>', 'Output format: png or webp', 'png')
  .option('-w, --width <width>', 'Lottie animation width (null = auto)', parseInt)
  .option('-h, --height <height>', 'Lottie animation height (null = auto)', parseInt)
  .option('--crop-width <width>', 'Crop width (null = no cropping)', parseInt)
  .option('--crop-height <height>', 'Crop height (null = no cropping)', parseInt)
  .option('--crop-center', 'Crop from center (default: true)', true)
  .option('--crop-topleft', 'Crop from top-left instead of center')
  .option('--fps <fps>', 'Target frame rate (default: 15)', parseInt, 15)
  .option('--original-fps <fps>', 'Original frame rate (default: 30)', parseInt, 30)
  .option('--external', 'Use external image files instead of embedded (default: embedded)', false)
  .option('--quality <quality>', 'WebP quality 0-100 (default: 75)', parseInt, 75)
  .action(async (input, output, options) => {
    try {
      // Validate input
      if (!fs.existsSync(input)) {
        console.error(`❌ Input not found: ${input}`);
        process.exit(1);
      }

      // Determine input type
      const isVideo = input.toLowerCase().endsWith('.mp4') || input.toLowerCase().endsWith('.mov') || input.toLowerCase().endsWith('.avi');

      if (isVideo && !fs.statSync(input).isFile()) {
        console.error(`❌ Video file not found: ${input}`);
        process.exit(1);
      }

      if (!isVideo && !fs.statSync(input).isDirectory()) {
        console.error(`❌ Input directory not found: ${input}`);
        process.exit(1);
      }

      // Create output directory
      if (!fs.existsSync(output)) {
        fs.mkdirSync(output, { recursive: true });
      }

      // Create temp directory for video frames
      const tempDir = path.join(output, 'temp_frames');
      if (isVideo && !fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Import and run the optimizer
      const { optimizeImages } = require('./Camelottie.js');

      console.log(`🚀 Starting Camelottie optimization...`);
      console.log(`📁 Input: ${input}`);
      console.log(`📂 Output: ${output}`);
      console.log(`🎬 Input type: ${isVideo ? 'Video file' : 'PNG sequence'}`);
      console.log(`🎞️  Format: ${options.format}`);
      console.log(`🎯 Target FPS: ${options.fps}`);
      console.log(`⚡ Original FPS: ${options.originalFps}`);
      if (options.width || options.height) {
        console.log(`📐 Dimensions: ${options.width || 'auto'}×${options.height || 'auto'}`);
      }
      if (options.cropWidth || options.cropHeight) {
        console.log(`✂️  Cropping: ${options.cropWidth || 'auto'}×${options.cropHeight || 'auto'}`);
      }
      console.log('');

      await optimizeImages({
        input: isVideo ? input : path.resolve(input),
        output: path.resolve(output),
        tempDir: isVideo ? tempDir : null,
        isVideo,
        format: options.format,
        lottieWidth: options.width || null,
        lottieHeight: options.height || null,
        cropWidth: options.cropWidth || null,
        cropHeight: options.cropHeight || null,
        cropFromCenter: options.cropTopleft ? false : true,
        lottieFrameRate: options.fps,
        originalFrameRate: options.originalFps,
        selfContainedLottie: !options.external,
        webpQuality: options.quality
      });

      // Cleanup temp directory
      if (isVideo && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }

      console.log('\n✅ Optimization complete!');

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

// Add convenience commands
program
  .command('pngs')
  .description('Optimize PNG sequence to Lottie')
  .argument('<input-dir>', 'Input directory with PNG files')
  .argument('[output-dir]', 'Output directory (default: ./output)', './output')
  .option('-f, --format <format>', 'Output format: png or webp', 'png')
  .option('-w, --width <width>', 'Lottie animation width', parseInt)
  .option('-h, --height <height>', 'Lottie animation height', parseInt)
  .option('--fps <fps>', 'Target frame rate', parseInt, 15)
  .action((inputDir, outputDir, options) => {
    program.parse(['optimize', inputDir, outputDir,
      '--format', options.format,
      '--fps', options.fps.toString(),
      ...(options.width ? ['--width', options.width.toString()] : []),
      ...(options.height ? ['--height', options.height.toString()] : [])
    ], { from: 'user' });
  });

program
  .command('video')
  .description('Convert MP4 video to Lottie animation')
  .argument('<video-file>', 'Input MP4 video file')
  .argument('[output-dir]', 'Output directory (default: ./output)', './output')
  .option('-f, --format <format>', 'Output format: png or webp', 'webp')
  .option('-w, --width <width>', 'Lottie animation width', parseInt)
  .option('-h, --height <height>', 'Lottie animation height', parseInt)
  .option('--fps <fps>', 'Target frame rate', parseInt, 15)
  .action((videoFile, outputDir, options) => {
    program.parse(['optimize', videoFile, outputDir,
      '--format', options.format,
      '--fps', options.fps.toString(),
      ...(options.width ? ['--width', options.width.toString()] : []),
      ...(options.height ? ['--height', options.height.toString()] : [])
    ], { from: 'user' });
  });

// Default action - show help
program.action(() => {
  program.help();
});

program.parse();
