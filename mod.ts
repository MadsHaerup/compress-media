/**
 * @fileoverview avalon Media Compression Package
 *
 * A powerful media compression library for Deno that provides:
 * - Image compression with WebP, AVIF, JPEG, PNG support
 * - Video compression with H.264, H.265, VP9 codecs
 * - Batch processing with multiple sizes and formats
 * - Dependency checking and installation helpers
 *
 * @author avalon Team
 * @version 1.0.0
 */

// Core compression functions
export { compressMedia, compressImages, compressVideos } from './media-compression.ts';

// Configuration types
export type { MediaCompressionConfig, ImageCompressionConfig, VideoCompressionConfig } from './media-compression.ts';

// Dependency management functions
export { checkImageDependencies, installImageDependencies } from './image-compression.ts';

export { checkVideoDependencies, installVideoDependencies } from './video-compression.ts';

/**
 * Check all media compression dependencies
 */
export async function checkAllDependencies(): Promise<{
	images: { webp: boolean; dimg: boolean };
	videos: { ffmpeg: boolean };
}> {
	const { checkImageDependencies } = await import('./image-compression.ts');
	const { checkVideoDependencies } = await import('./video-compression.ts');

	const [images, videos] = await Promise.all([checkImageDependencies(), checkVideoDependencies()]);

	return { images, videos };
}

/**
 * Install all media compression dependencies
 */
export async function installAllDependencies(): Promise<void> {
	const { installImageDependencies } = await import('./image-compression.ts');
	const { installVideoDependencies } = await import('./video-compression.ts');

	console.log('📦 Installing all media compression dependencies...\n');

	await Promise.all([installImageDependencies(), installVideoDependencies()]);

	console.log('\n✅ Dependency installation complete');
}
