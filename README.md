# @avalon/compress-media

A powerful, standalone Deno-native media compression library that can be used independently in any project. Simplifies image and video optimization with an intuitive configuration-based API.

## 🚀 Features

- **🖼️ Image Compression**: WebP, AVIF, JPEG, PNG with Sharp integration
- **🎬 Video Compression**: H.264, H.265, VP9 with FFmpeg integration
- **📐 Multi-Size Generation**: Automatic responsive image/video variants
- **⚡ Batch Processing**: Process entire directories efficiently
- **🔧 Zero Config**: Sensible defaults, extensive customization
- **📦 Dependency Management**: Built-in dependency checking and installation
- **🛠️ CLI & Library**: Use as command-line tool or import as library
- **🔗 Standalone**: No dependencies on avalon framework

## 📦 Installation & Usage

Add to your project's `deno.json`:

```json
{
	"imports": {
		"@avalon/compress-media": "jsr:@avalon/compress-media@^1.0.0"
	}
}
```

## 🎯 Quick Start

### Basic Usage

```typescript
import { compressMedia } from '@avalon/compress-media';

// Compress all media in src/media to public/media
await compressMedia({
	enabled: true,
	srcDir: 'src/media',
	outputDir: 'public/media',
});
```

### Images Only

```typescript
import { compressImages } from '@avalon/compress-media';

await compressImages({
	enabled: true,
	quality: 85,
	formats: ['webp', 'avif'],
	srcDir: 'assets/images',
	outputDir: 'dist/images',
});
```

### Videos Only

```typescript
import { compressVideos } from '@avalon/compress-media';

await compressVideos({
	enabled: true,
	quality: 20, // CRF value
	codec: 'h265',
	formats: ['mp4', 'webm'],
	srcDir: 'assets/videos',
	outputDir: 'dist/videos',
});
```

## 🔄 avalon vs Sharp: Key Differences

### Sharp (Traditional Approach)

```javascript
// Sharp requires manual file handling and chaining
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Process single image
await sharp('input.jpg').resize(800, 600).webp({ quality: 80 }).toFile('output.webp');

// Batch processing requires custom directory walking
const files = fs.readdirSync('src/images');
for (const file of files) {
	if (file.endsWith('.jpg')) {
		await sharp(path.join('src/images', file))
			.webp({ quality: 80 })
			.toFile(path.join('public/images', file.replace('.jpg', '.webp')));
	}
}
```

### avalon (Configuration-Driven)

```typescript
// avalon handles everything with simple configuration
import { compressImages } from '@avalon/compress-media';

await compressImages({
	enabled: true,
	quality: 80,
	formats: ['webp'],
	sizes: [{ width: 800, height: 600, suffix: '_medium' }],
	srcDir: 'src/images',
	outputDir: 'public/images',
});
// ✅ Automatically processes all images
// ✅ Handles multiple formats
// ✅ Generates multiple sizes
// ✅ Preserves directory structure
// ✅ Skips unchanged files
```

### Key Advantages

| Feature               | Sharp                     | avalon                        |
| --------------------- | ------------------------- | ----------------------------- |
| **Batch Processing**  | Manual implementation     | Built-in directory walking    |
| **Multiple Formats**  | Chain multiple operations | Single config array           |
| **Multiple Sizes**    | Loop through dimensions   | Declarative sizes array       |
| **File Management**   | Manual path handling      | Automatic directory creation  |
| **Change Detection**  | No built-in support       | Automatic skip if unchanged   |
| **Progress Feedback** | Custom implementation     | Built-in progress bars        |
| **Error Handling**    | Try-catch per file        | Graceful batch error handling |
| **Video Support**     | Not available             | Integrated FFmpeg support     |

## 📝 Configuration Examples

### Complete Media Configuration

```typescript
import { compressMedia } from '@avalon/compress-media';

await compressMedia({
	enabled: true,

	// Image settings
	imageQuality: 85,
	imageFormats: ['webp', 'avif'],
	imageSizes: [
		{ width: 400, suffix: '_small' },
		{ width: 800, suffix: '_medium' },
		{ width: 1200, suffix: '_large' },
	],

	// Video settings
	videoQuality: 23,
	videoCodec: 'h264',
	videoBitrate: '2M',
	videoFormats: ['mp4', 'webm'],
	videoSizes: [
		{ width: 720, height: 480, suffix: '_sd' },
		{ width: 1280, height: 720, suffix: '_hd' },
		{ width: 1920, height: 1080, suffix: '_fhd' },
	],

	// Common settings
	srcDir: 'src/media',
	outputDir: 'public/media',
	preserveOriginal: false,
});
```

### Responsive Images Setup

```typescript
import { compressImages } from '@avalon/compress-media';

// Generate responsive images for modern web
await compressImages({
	enabled: true,
	quality: 80,
	formats: ['webp', 'avif', 'jpeg'], // Fallback support
	sizes: [
		{ width: 320, suffix: '_mobile' },
		{ width: 768, suffix: '_tablet' },
		{ width: 1024, suffix: '_desktop' },
		{ width: 1920, suffix: '_xl' },
	],
	srcDir: 'src/images',
	outputDir: 'public/images',
});

// Outputs for input.jpg:
// - input_mobile.webp, input_mobile.avif, input_mobile.jpeg
// - input_tablet.webp, input_tablet.avif, input_tablet.jpeg
// - input_desktop.webp, input_desktop.avif, input_desktop.jpeg
// - input_xl.webp, input_xl.avif, input_xl.jpeg
```

### Video Optimization Pipeline

```typescript
import { compressVideos } from '@avalon/compress-media';

// Create optimized videos for web delivery
await compressVideos({
	enabled: true,
	quality: 20, // Lower CRF = better quality
	codec: 'h265', // Better compression than h264
	formats: ['mp4', 'webm'], // Browser compatibility
	sizes: [
		{ height: 480, suffix: '_sd' }, // 480p
		{ height: 720, suffix: '_hd' }, // 720p
		{ height: 1080, suffix: '_fhd' }, // 1080p
	],
	srcDir: 'src/videos',
	outputDir: 'public/videos',
});
```

## 🛠️ CLI Usage

The package includes a built-in CLI for direct usage:

### Built-in CLI Commands

```bash
# Basic compression with defaults
deno task compress

# Check system dependencies
deno task check-deps

# Install dependencies (guidance)
deno task install-deps

# Custom quality and formats
deno run --allow-all cli.ts --quality 90 --formats webp,avif

# Video-only processing
deno run --allow-all cli.ts --videos-only --video-codec h265

# Custom directories
deno run --allow-all cli.ts --src assets/media --output dist/media
```

### Integration in Your Project

Create a custom compression script in your project:

```typescript
#!/usr/bin/env deno run --allow-read --allow-write --allow-run

import { compressMedia } from '@avalon/compress-media';

// Your custom configuration
const config = {
	enabled: true,
	imageQuality: 85,
	imageFormats: ['webp', 'avif'],
	videoQuality: 23,
	videoCodec: 'h264',
	srcDir: 'assets',
	outputDir: 'public',
};

await compressMedia(config);
```

Add to your project's `deno.json`:

```json
{
	"tasks": {
		"compress-media": "deno run --allow-all scripts/compress-media.ts"
	}
}
```

## 📋 Dependencies

### Image Processing

- **Sharp**: Automatically installed from npm registry
- **No system dependencies required**

### Video Processing

- **FFmpeg**: System installation required

Install FFmpeg:

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows (Chocolatey)
choco install ffmpeg
```

Check dependencies:

```typescript
import { checkAllDependencies } from '@avalon/compress-media';

const deps = await checkAllDependencies();
console.log(deps);
// { images: { webp: true, dimg: true }, videos: { ffmpeg: true } }
```

## 🎨 Output Examples

### Console Output

```
media src/media→public/media

img webp/avif@85% src/media→public/media
▪▫ hero.jpg [▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱] 73% 245KB→67KB
▪▫ logo.png [▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱] 52% 89KB→43KB

vid h264@23 src/media→public/media
▪ demo.mp4 [▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱] 81% 12MB→2MB
▪ intro.mov [▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱] 67% 8MB→3MB

media done
```

### File Structure

```
public/media/
├── hero.webp
├── hero.avif
├── hero_small.webp
├── hero_small.avif
├── logo.webp
├── logo.avif
├── demo.mp4
├── demo.webm
├── demo_hd.mp4
└── demo_hd.webm
```

## 🔧 API Reference

### Types

```typescript
interface MediaCompressionConfig {
	enabled: boolean;

	// Image options
	imageQuality?: number; // 1-100
	imageFormats?: ('webp' | 'avif' | 'jpeg' | 'png')[];
	imageSizes?: Array<{ width?: number; height?: number; suffix?: string }>;

	// Video options
	videoQuality?: number; // CRF 0-51
	videoCodec?: 'h264' | 'h265' | 'vp9';
	videoBitrate?: string; // '1M', '2M', 'auto'
	videoFormats?: ('mp4' | 'webm')[];
	videoSizes?: Array<{ width?: number; height?: number; suffix?: string }>;

	// Common options
	srcDir?: string;
	outputDir?: string;
	sizes?: Array<{ width?: number; height?: number; suffix?: string }>; // Fallback
	preserveOriginal?: boolean;
	imagesOnly?: boolean;
	videosOnly?: boolean;
}
```

### Functions

```typescript
// Main compression function
compressMedia(config: MediaCompressionConfig): Promise<void>

// Individual processors
compressImages(config: ImageCompressionConfig): Promise<void>
compressVideos(config: VideoCompressionConfig): Promise<void>

// Dependency management
checkAllDependencies(): Promise<{ images: {...}, videos: {...} }>
checkImageDependencies(): Promise<{ webp: boolean, dimg: boolean }>
checkVideoDependencies(): Promise<{ ffmpeg: boolean }>
installAllDependencies(): Promise<void>
```

## 🙏 Acknowledgments

- [Sharp](https://sharp.pixelplumbing.com/) - High-performance image processing
- [FFmpeg](https://ffmpeg.org/) - Complete multimedia framework
- [Deno](https://deno.land/) - Modern JavaScript runtime
