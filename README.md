# Camelottie

A powerful Node.js tool for converting PNG sequences or MP4 videos into optimized Lottie animations. Features batch image optimization, intelligent frame rate management, and flexible cropping options.

## 🚀 Features

- **Dual Input Support**: Process PNG directories or MP4 video files
- **Smart Resizing**: Reduces images to 33% of original size using Sharp
- **High Compression**: Uses imagemin with pngquant for optimal PNG/WebP compression
- **Lottie Animation**: Automatically generates Lottie JSON from frame sequences
- **Frame Rate Management**: Intelligently skips frames to maintain original animation speed
- **Flexible Cropping**: Center-crop animations to focus on specific areas
- **Excellent Results**: Achieves up to 96% file size reduction
- **CLI Interface**: User-friendly command-line interface with extensive options
- **Web-Ready Output**: Creates both optimized images and Lottie animation for web use

## 📊 Performance

In testing with 121 frame images:
- **Input**: 116MB total (PNG frames)
- **Output**: 4.5MB total (optimized PNGs) + 100KB (Lottie JSON)
- **Compression**: 96% size reduction on images
- **Individual files**: ~986KB → ~36KB per image
- **Lottie specs**: 356×425px, 12fps, 10.1s duration, frame-by-frame animation

## 🛠️ Installation

### Prerequisites

- Node.js (version 18 or higher)
- FFmpeg (for MP4 video processing)
- Ubuntu/Debian systems need additional packages:

```bash
sudo apt update && sudo apt install -y libpng-dev ffmpeg
```

### Setup

1. Clone or download this project
2. Install dependencies:

```bash
npm install
```

3. (Optional) Install globally for CLI usage:

```bash
npm install -g .
# or
npm link
```

## 📁 Directory Structure

```
Camelottie/
├── input/          # Place your PNG files here
├── output/         # Optimized files will be saved here
├── Camelottie.js   # Main optimization script
├── package.json    # Project dependencies
└── README.md       # This file
```

## 🎯 Usage

### CLI Usage (Recommended)

#### Convert PNG Sequence to Lottie:
```bash
# Basic usage
camelottie optimize input/ output/

# With custom settings
camelottie optimize input/ output/ --width 300 --height 200 --fps 15 --format webp

# With cropping
camelottie optimize input/ output/ --crop-width 250 --crop-height 150

# PNG sequence shortcut
camelottie pngs input/ output/ --width 400 --fps 24
```

#### Convert MP4 Video to Lottie:
```bash
# Basic video conversion
camelottie optimize video.mp4 output/

# With custom settings
camelottie optimize video.mp4 output/ --fps 15 --width 320 --format webp

# Video conversion shortcut
camelottie video video.mp4 output/ --width 400 --fps 24
```

#### CLI Options:
- `-f, --format <format>`: Output format (`png` or `webp`, default: `png`)
- `-w, --width <width>`: Lottie animation width
- `-h, --height <height>`: Lottie animation height
- `--crop-width <width>`: Crop width
- `--crop-height <height>`: Crop height
- `--crop-center`: Crop from center (default)
- `--crop-topleft`: Crop from top-left corner
- `--fps <fps>`: Target frame rate (default: 15)
- `--original-fps <fps>`: Original frame rate (default: 30)
- `--external`: Use external image files instead of embedded
- `--quality <quality>`: WebP quality 0-100 (default: 75)

### Legacy Usage (Direct Script)

1. **Add your images**: Place PNG files in the `input/` directory

2. **Run the optimizer**:
```bash
node Camelottie.js
```

3. **Check results**: Find optimized images and Lottie animation in the `output/` directory
   - `00000000.png` to `00000120.png` - Optimized frame images
   - `animation.json` - Lottie animation file

### 🎬 Using the Lottie Animation

The generated `animation.json` can be used in web applications:

**HTML with Lottie Web Player:**
```html
<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>
<lottie-player src="output/animation.json" background="transparent" speed="1" loop autoplay></lottie-player>
```

**React with lottie-react:**
```jsx
import Lottie from 'lottie-react';
import animationData from './output/animation.json';

<Lottie animationData={animationData} loop={true} />
```

## ⚙️ Configuration

You can modify these settings in `Camelottie.js`:

```javascript
const inputDir = "input";              // Input directory path
const outputDir = "output";            // Output directory path  
const outputFormat = "png";            // Output format ("png" or "webp")
const shouldCreateLottie = true;       // Generate Lottie animation (true/false)
const lottieFrameRate = 15;            // Animation frame rate (fps)
const originalFrameRate = 30;          // Original frame rate of input animation
const lottieWidth = 200;               // Custom Lottie width (null = auto)
const lottieHeight = null;             // Custom Lottie height (null = auto)
const cropWidth = null;                // Crop width (null = no cropping)
const cropHeight = null;               // Crop height (null = no cropping)
const cropFromCenter = true;           // Crop from center (true) or top-left (false)
```

### Resize Factor
Currently set to 33% of original size. Modify this line to change:
```javascript
.resize({ width: Math.round(await getImageWidth(inputPath) * 0.33) })
```

### Compression Quality
PNG compression uses pngquant with quality range 0.6-0.8:
```javascript
[imageminPngquant({ quality: [0.6, 0.8] })]
```

### Cropping
Crop the Lottie animation to focus on specific areas. **Cropping is applied to the original PNG image dimensions, not the final Lottie dimensions.**

```javascript
const cropWidth = 150;        // Crop to 150px width
const cropHeight = 200;       // Crop to 200px height  
const cropFromCenter = true;  // Crop from center (true) or top-left (false)
```

**Processing Flow:**
1. Original PNG: 600×800px
2. Crop: 300×400px (from center) 
3. Lottie base: 300×400px
4. Scale (if lottieWidth=200): 200×267px (maintaining aspect ratio)

**Cropping Examples:**
- `cropWidth: 150, cropHeight: null` - Crop to 150px width, auto height
- `cropWidth: null, cropHeight: 200` - Crop to 200px height, auto width
- `cropWidth: 150, cropHeight: 200` - Crop to exactly 150×200px
- `cropFromCenter: false` - Crop from top-left corner instead of center

**Important:** Crop dimensions are applied to the original optimized PNG files, then the Lottie animation is created from those cropped images, and finally scaled if you specify custom Lottie dimensions.

## 🔧 Dependencies

- **sharp**: High-performance image processing (resizing)
- **imagemin**: Image minification toolkit
- **imagemin-pngquant**: PNG compression plugin
- **imagemin-webp**: WebP compression plugin (optional)
- **commander**: Command-line interface framework
- **fluent-ffmpeg**: FFmpeg wrapper for Node.js (video processing)
- **ffmpeg**: System dependency for video frame extraction

## 🐛 Troubleshooting

### Common Issues

**"imageminWebp is not a function"**
- Fixed by using dynamic imports for ES modules
- Script automatically handles this

**"PNG support not compiled"**
- Install libpng development package: `sudo apt install libpng-dev`
- Or switch to PNG output format (default)

**FFmpeg not found**
- Install FFmpeg: `sudo apt install ffmpeg` (Ubuntu/Debian)
- Or download from https://ffmpeg.org/download.html
- Ensure FFmpeg is in your PATH

**Video processing errors**
- Check that your MP4 file is not corrupted
- Supported formats: MP4, MOV, AVI
- For large videos, ensure sufficient disk space for frame extraction

**Permission errors**
- Ensure read/write permissions for input and output directories
- Check that Node.js has file system access

## 📈 How It Works

### PNG Sequence Processing:
1. **Discovery**: Scans input directory for PNG files
2. **Resize**: Uses Sharp to resize images to 33% of original dimensions
3. **Compress**: Applies imagemin with pngquant for optimal compression
4. **Save**: Outputs optimized files to the output directory
5. **Cleanup**: Removes temporary files automatically

### MP4 Video Processing:
1. **Video Analysis**: Probes video file for duration and properties
2. **Frame Extraction**: Uses FFmpeg to extract frames at specified frame rate
3. **Image Processing**: Applies same optimization pipeline as PNG sequences
4. **Lottie Creation**: Generates Lottie animation from extracted frames
5. **Cleanup**: Removes temporary extracted frames automatically

## 🎨 Use Cases

Perfect for:
- **PNG Sequences**: Animation frame sequences → Lottie animations
- **Video Files**: Convert MP4 videos directly to Lottie animations
- **Web Optimization**: Batch image processing for web deployment
- **Storage Reduction**: Dramatically reduce file sizes while maintaining quality
- **Cross-Platform**: Create animations that work on any device/browser
- **Asset Preparation**: Optimize animations for web/mobile applications
- **Content Creation**: Convert existing videos into lightweight web animations

## 📝 Output

The script provides real-time feedback:

### PNG Sequence Processing:
```
🖼️  Processing PNG sequence: input/
📁 Found 121 PNG files
Processed 00000000.png -> output/frames/00000000.png
Processed 00000001.png -> output/frames/00000001.png
...
✅ All images processed.
🎯 Frame selection: 121 original frames → 60 selected frames (2.00x skip ratio)
🎬 Creating Lottie animation...
🎬 Lottie animation created: output/animation.json
📊 Animation specs: 356x425, 60 frames, 15fps, 4.0s duration
⚡ Speed maintained: Original 30fps → 15fps (2.00x frame skip)
```

### MP4 Video Processing:
```
🎬 Processing video: animation.mp4
📊 Video duration: 4.2s
🎯 Extracting 126 frames at 30fps
📹 Extracted: 126 frames
🖼️  Processing PNG sequence: output/temp_frames/
📁 Found 126 PNG files
✅ All images processed.
🎯 Frame selection: 126 original frames → 42 selected frames (2.00x skip ratio)
🎬 Creating Lottie animation...
🎬 Lottie animation created: output/animation.json
📊 Animation specs: 320x180, 42 frames, 15fps, 2.8s duration
```

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is open source and available under the ISC License.

---

**Note**: This tool supports both PNG frame sequences and MP4 video files, making it versatile for various animation workflows. The CLI interface provides extensive customization options for professional use cases.
