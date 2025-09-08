#!/usr/bin/env deno run --allow-read --allow-write --allow-run

/**
 * avalon Media Compression CLI
 *
 * Standalone command-line interface for the compress-media package
 * Usage: deno run --allow-read --allow-write --allow-run cli.ts [options]
 */

import { parseArgs } from 'jsr:@std/cli@1/parse-args';
import { compressMedia, checkAllDependencies, installAllDependencies, type MediaCompressionConfig } from './mod.ts';

const HELP_TEXT = `
avalon Media Compression CLI

USAGE:
    deno run --allow-read --allow-write --allow-run cli.ts [OPTIONS]

OPTIONS:
    IMAGE COMPRESSION:
    --quality <number>      JPEG/WebP quality (1-100, default: 80)
    --formats <formats>     Output formats (comma-separated: webp,avif,jpeg,png, default: webp)
    
    VIDEO COMPRESSION:
    --video-quality <number> Video CRF quality (0-51, default: 23, lower = better quality)
    --video-codec <codec>   Video codec (h264,h265,vp9, default: h264)
    --video-bitrate <rate>  Video bitrate (e.g., 1M, 2M, default: auto)
    --video-formats <formats> Video output formats (comma-separated: mp4,webm, default: mp4)
    
    GENERAL:
    --src <path>           Source directory (default: src/media)
    --output <path>        Output directory (default: public/media)
    --preserve-original    Keep original files in output directory
    --videos-only          Process only video files
    --images-only          Process only image files
    --install-deps         Install required system dependencies
    --check-deps           Check if system dependencies are available
    --help                 Show this help message

EXAMPLES:
    # Basic usage - convert images to WebP and videos to H.264 MP4
    deno run --allow-read --allow-write --allow-run cli.ts

    # Convert images to multiple formats with custom quality
    deno run --allow-read --allow-write --allow-run cli.ts --quality 90 --formats webp,avif

    # Compress videos with custom settings
    deno run --allow-read --allow-write --allow-run cli.ts --video-quality 20 --video-codec h265

    # Process only videos with custom bitrate
    deno run --allow-read --allow-write --allow-run cli.ts --videos-only --video-bitrate 2M

    # Use custom directories for mixed media
    deno run --allow-read --allow-write --allow-run cli.ts --src assets/media --output dist/media

    # Check dependencies
    deno run --allow-read --allow-write --allow-run cli.ts --check-deps

DEPENDENCIES:
    Images:
    - WebP: Uses Sharp from npm registry (no system installation needed)
    - Other formats: Built-in Deno support
    
    Videos:
    - FFmpeg: Required for video processing (install via brew/apt/chocolatey)
`;

async function main() {
	const args = parseArgs(Deno.args, {
		string: ['quality', 'formats', 'video-quality', 'video-codec', 'video-bitrate', 'video-formats', 'src', 'output'],
		boolean: ['preserve-original', 'videos-only', 'images-only', 'install-deps', 'check-deps', 'help'],
		alias: {
			h: 'help',
			q: 'quality',
			f: 'formats',
			s: 'src',
			o: 'output',
		},
	});

	// Show help
	if (args.help) {
		console.log(HELP_TEXT);
		return;
	}

	// Check dependencies
	if (args['check-deps']) {
		console.log('🔍 Checking dependencies...');
		const deps = await checkAllDependencies();

		console.log(`\nImages: Sharp ${deps.images.webp ? '✅' : '❌'} | Deno Image ${deps.images.dimg ? '✅' : '❌'}`);
		console.log(`Videos: FFmpeg ${deps.videos.ffmpeg ? '✅' : '❌'}`);

		if (!deps.images.webp) {
			console.log('\n⚠️  WebP processing not available.');
			console.log('   This usually means network connectivity issues or Deno cache problems.');
			console.log('   Try running: deno cache --reload npm:sharp');
		}

		if (!deps.images.dimg) {
			console.log('\n⚠️  Image processing not available. This is unusual - check your Deno installation.');
		}

		if (!deps.videos.ffmpeg) {
			console.log('\n⚠️  FFmpeg not available for video processing.');
			console.log('   Install FFmpeg: brew install ffmpeg (macOS) or apt install ffmpeg (Ubuntu)');
		}

		return;
	}

	// Install dependencies
	if (args['install-deps']) {
		console.log('📦 Installing dependencies...');
		await installAllDependencies();
		return;
	}

	// Parse arguments
	const quality = args.quality ? parseInt(args.quality, 10) : 80;
	const formats = args.formats
		? (args.formats.split(',').map(f => f.trim()) as ('webp' | 'avif' | 'jpeg' | 'png')[])
		: (['webp'] as ('webp' | 'avif' | 'jpeg' | 'png')[]);

	// Video arguments
	const videoQuality = args['video-quality'] ? parseInt(args['video-quality'], 10) : 23;
	const videoCodec = (args['video-codec'] as 'h264' | 'h265' | 'vp9') || 'h264';
	const videoBitrate = args['video-bitrate'] || 'auto';
	const videoFormats = args['video-formats']
		? (args['video-formats'].split(',').map(f => f.trim()) as ('mp4' | 'webm')[])
		: (['mp4'] as ('mp4' | 'webm')[]);

	// General arguments
	const srcDir = args.src || 'src/media';
	const outputDir = args.output || 'public/media';
	const preserveOriginal = args['preserve-original'] || false;
	const videosOnly = args['videos-only'] || false;
	const imagesOnly = args['images-only'] || false;

	// Validate quality
	if (quality < 1 || quality > 100) {
		console.error('❌ Image quality must be between 1 and 100');
		Deno.exit(1);
	}

	// Validate video quality
	if (videoQuality < 0 || videoQuality > 51) {
		console.error('❌ Video quality (CRF) must be between 0 and 51');
		Deno.exit(1);
	}

	// Validate formats
	const validImageFormats = ['webp', 'avif', 'jpeg', 'png'];
	for (const format of formats) {
		if (!validImageFormats.includes(format)) {
			console.error(`❌ Invalid image format: ${format}. Valid formats: ${validImageFormats.join(', ')}`);
			Deno.exit(1);
		}
	}

	// Validate video formats
	const validVideoFormats = ['mp4', 'webm'];
	for (const format of videoFormats) {
		if (!validVideoFormats.includes(format)) {
			console.error(`❌ Invalid video format: ${format}. Valid formats: ${validVideoFormats.join(', ')}`);
			Deno.exit(1);
		}
	}

	// Validate video codec
	const validCodecs = ['h264', 'h265', 'vp9'];
	if (!validCodecs.includes(videoCodec)) {
		console.error(`❌ Invalid video codec: ${videoCodec}. Valid codecs: ${validCodecs.join(', ')}`);
		Deno.exit(1);
	}

	// Validate mutual exclusivity
	if (videosOnly && imagesOnly) {
		console.error('❌ Cannot specify both --videos-only and --images-only');
		Deno.exit(1);
	}

	try {
		// Check dependencies first
		console.log('🔍 Checking system dependencies...');
		const deps = await checkAllDependencies();

		// Check image dependencies if processing images
		if (!videosOnly) {
			if (formats.includes('webp') && !deps.images.webp) {
				console.error('❌ WebP processing not available.');
				console.error('   This usually means network connectivity issues or Deno cache problems.');
				console.error('   Try running: deno cache --reload npm:sharp');
				Deno.exit(1);
			}

			if (!deps.images.dimg) {
				console.error('❌ Image processing not available. Check your Deno installation.');
				Deno.exit(1);
			}
		}

		// Check video dependencies if processing videos
		if (!imagesOnly && !deps.videos.ffmpeg) {
			console.error('❌ FFmpeg not available for video processing.');
			console.error('   Install FFmpeg: brew install ffmpeg (macOS) or apt install ffmpeg (Ubuntu)');
			Deno.exit(1);
		}

		// Use the unified compressMedia function
		const config: MediaCompressionConfig = {
			enabled: true,
			imageQuality: quality,
			imageFormats: formats,
			videoQuality: videoQuality,
			videoCodec: videoCodec,
			videoBitrate: videoBitrate,
			videoFormats: videoFormats,
			srcDir,
			outputDir,
			preserveOriginal,
			imagesOnly,
			videosOnly,
		};

		await compressMedia(config);

		console.log('\n🎉 Media compression completed successfully!');

		if (!videosOnly) {
			console.log(`📸 Images - Quality: ${quality}%, Formats: ${formats.join(', ')}`);
		}

		if (!imagesOnly) {
			console.log(`🎬 Videos - CRF: ${videoQuality}, Codec: ${videoCodec}, Formats: ${videoFormats.join(', ')}`);
		}

		console.log(`📂 Source: ${srcDir} → Output: ${outputDir}`);
	} catch (error) {
		console.error('❌ Media compression failed:', error);
		Deno.exit(1);
	}
}

if (import.meta.main) {
	await main();
}
