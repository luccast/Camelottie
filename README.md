# Camelottie

A Node.js script for batch image optimization that resizes and compresses PNG files with impressive results.

## 🚀 Features

- **Batch Processing**: Processes all PNG files in the input directory
- **Smart Resizing**: Reduces images to 33% of original size using Sharp
- **High Compression**: Uses imagemin with pngquant for optimal PNG compression
- **Lottie Animation**: Automatically generates Lottie JSON from frame sequence
- **Excellent Results**: Achieves up to 96% file size reduction
- **Preserves Quality**: Maintains visual quality while dramatically reducing file size
- **Web-Ready Output**: Creates both optimized PNGs and Lottie animation for web use

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
- Ubuntu/Debian systems need libpng development package:

```bash
sudo apt update && sudo apt install -y libpng-dev
```

### Setup

1. Clone or download this project
2. Install dependencies:

```bash
npm install
```

## 📁 Directory Structure

```
Camelottie/
├── input/          # Place your PNG files here
├── output/         # Optimized files will be saved here
├── optimize.js     # Main optimization script
├── package.json    # Project dependencies
└── README.md       # This file
```

## 🎯 Usage

1. **Add your images**: Place PNG files in the `input/` directory

2. **Run the optimizer**:
```bash
node optimize.js
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

You can modify these settings in `optimize.js`:

```javascript
const inputDir = "input";              // Input directory path
const outputDir = "output";            // Output directory path  
const outputFormat = "png";            // Output format ("png" or "webp")
const shouldCreateLottie = true;       // Generate Lottie animation (true/false)
const frameRate = 12;                  // Animation frame rate (fps)
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

## 🔧 Dependencies

- **sharp**: High-performance image processing (resizing)
- **imagemin**: Image minification toolkit
- **imagemin-pngquant**: PNG compression plugin
- **imagemin-webp**: WebP compression plugin (optional)

## 🐛 Troubleshooting

### Common Issues

**"imageminWebp is not a function"**
- Fixed by using dynamic imports for ES modules
- Script automatically handles this

**"PNG support not compiled"**
- Install libpng development package: `sudo apt install libpng-dev`
- Or switch to PNG output format (default)

**Permission errors**
- Ensure read/write permissions for input and output directories
- Check that Node.js has file system access

## 📈 How It Works

1. **Discovery**: Scans input directory for PNG files
2. **Resize**: Uses Sharp to resize images to 33% of original dimensions
3. **Compress**: Applies imagemin with pngquant for optimal compression
4. **Save**: Outputs optimized files to the output directory
5. **Cleanup**: Removes temporary files automatically

## 🎨 Use Cases

Perfect for:
- Animation frame sequences → Lottie animations
- Sprite sheets optimization
- Batch image processing for web
- Creating web-ready animations from image sequences
- Reducing storage requirements while maintaining animation quality
- Converting video frames to lightweight web animations
- Preparing optimized assets for deployment

## 📝 Output

The script provides real-time feedback:
```
Processed 00000000.png -> output/00000000.png
Processed 00000001.png -> output/00000001.png
...
✅ All images processed.
🎬 Creating Lottie animation...
🎬 Lottie animation created: output/animation.json
📊 Animation specs: 356x425, 121 frames, 12fps, 10.1s duration
```

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

This project is open source and available under the ISC License.

---

**Note**: This tool is optimized for PNG frame sequences but can be adapted for other image processing workflows.
