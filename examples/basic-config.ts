#!/usr/bin/env deno run --allow-read --allow-write --allow-run

/**
 * Basic avalon Media Compression Configuration Example
 *
 * This demonstrates a simple setup for compressing media files
 * in a typical web project.
 */

import { compressMedia } from '../mod.ts';

// Basic configuration for a web project
const config = {
	enabled: true,

	// Image settings
	imageQuality: 80,
	imageFormats: ['webp', 'jpeg'], // WebP with JPEG fallback

	// Video settings
	videoQuality: 23,
	videoCodec: 'h264', // Best compatibility
	videoFormats: ['mp4'],

	// Directories
	srcDir: 'src/media',
	outputDir: 'public/media',

	// Keep it simple
	preserveOriginal: false,
} as const;

if (import.meta.main) {
	console.log('📸 Running basic media compression...\n');

	try {
		await compressMedia(config);
		console.log('\n✅ Basic compression completed!');
	} catch (error) {
		console.error('❌ Compression failed:', error);
		Deno.exit(1);
	}
}
