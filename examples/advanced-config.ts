#!/usr/bin/env deno run --allow-read --allow-write --allow-run

/**
 * Advanced avalon Media Compression Configuration Example
 *
 * This demonstrates a comprehensive setup with multiple formats,
 * responsive sizes, and optimized settings for modern web delivery.
 */

import { compressMedia } from '../mod.ts';

// Advanced configuration for modern web projects
const config = {
	enabled: true,

	// Image settings - Modern formats with fallbacks
	imageQuality: 85,
	imageFormats: ['webp', 'avif', 'jpeg'], // Modern + fallback
	imageSizes: [
		{ width: 320, suffix: '_mobile' }, // Mobile
		{ width: 768, suffix: '_tablet' }, // Tablet
		{ width: 1024, suffix: '_desktop' }, // Desktop
		{ width: 1920, suffix: '_xl' }, // Large displays
	],

	// Video settings - Optimized for web
	videoQuality: 20, // Higher quality for videos
	videoCodec: 'h265', // Better compression
	videoBitrate: 'auto',
	videoFormats: ['mp4', 'webm'], // Multiple formats
	videoSizes: [
		{ height: 480, suffix: '_sd' }, // 480p
		{ height: 720, suffix: '_hd' }, // 720p
		{ height: 1080, suffix: '_fhd' }, // 1080p
	],

	// Directories
	srcDir: 'assets/media',
	outputDir: 'public/optimized',

	// Options
	preserveOriginal: false,
} as const;

if (import.meta.main) {
	console.log('🚀 Running advanced media compression with responsive variants...\n');

	try {
		await compressMedia(config);

		console.log('\n✨ Advanced compression completed!');
		console.log(`📂 Check your optimized files in: ${config.outputDir}`);

		// Show what was generated
		console.log('\n📋 Generated formats:');
		console.log(`   Images: ${config.imageFormats.join(', ')} @ ${config.imageQuality}% quality`);
		console.log(`   Videos: ${config.videoFormats.join(', ')} @ CRF ${config.videoQuality} (${config.videoCodec})`);

		console.log('\n📐 Generated sizes:');
		console.log(`   Images: ${config.imageSizes.map(s => `${s.width}px${s.suffix}`).join(', ')}`);
		console.log(`   Videos: ${config.videoSizes.map(s => `${s.height}p${s.suffix}`).join(', ')}`);
	} catch (error) {
		console.error('❌ Advanced compression failed:', error);
		Deno.exit(1);
	}
}
