import { compressImages, type ImageCompressionConfig } from './image-compression.ts';
import { compressVideos, type VideoCompressionConfig } from './video-compression.ts';

/**
 * Combined media compression configuration
 */
export interface MediaCompressionConfig {
	enabled: boolean;

	// Image settings
	imageQuality?: number;
	imageFormats?: readonly ('webp' | 'avif' | 'jpeg' | 'png')[];
	imageSizes?: readonly {
		readonly width?: number;
		readonly height?: number;
		readonly suffix?: string;
	}[];

	// Video settings
	videoQuality?: number; // CRF value
	videoCodec?: 'h264' | 'h265' | 'vp9';
	videoBitrate?: string;
	videoFormats?: readonly ('mp4' | 'webm')[];
	videoSizes?: readonly {
		readonly width?: number;
		readonly height?: number;
		readonly suffix?: string;
	}[];

	// Common settings
	srcDir?: string;
	outputDir?: string;
	sizes?: readonly {
		readonly width?: number;
		readonly height?: number;
		readonly suffix?: string;
	}[]; // Fallback for both if imageSizes/videoSizes not specified
	preserveOriginal?: boolean;

	// Processing options
	imagesOnly?: boolean;
	videosOnly?: boolean;
}

/**
 * Compress both images and videos with a single function call
 */
export async function compressMedia(config: MediaCompressionConfig): Promise<void> {
	if (!config.enabled) {
		console.log('📱 Media compression is disabled');
		return;
	}

	const {
		imageQuality = 80,
		imageFormats = ['webp'],
		imageSizes,
		videoQuality = 23,
		videoCodec = 'h264',
		videoBitrate = 'auto',
		videoFormats = ['mp4'],
		videoSizes,
		srcDir = 'src/media',
		outputDir = 'public/media',
		sizes = [], // Fallback for both
		preserveOriginal = false,
		imagesOnly = false,
		videosOnly = false,
	} = config;

	console.log(`\nmedia ${srcDir}→${outputDir}`);

	// Process images unless videos-only is specified
	if (!videosOnly) {
		const imageConfig: ImageCompressionConfig = {
			enabled: true,
			quality: imageQuality,
			srcDir,
			outputDir,
			formats: imageFormats as ('webp' | 'avif' | 'jpeg' | 'png')[],
			sizes: (imageSizes || sizes) as Array<{ width?: number; height?: number; suffix?: string }>,
			preserveOriginal,
		};

		await compressImages(imageConfig);
	}

	// Process videos unless images-only is specified
	if (!imagesOnly) {
		const videoConfig: VideoCompressionConfig = {
			enabled: true,
			quality: videoQuality,
			codec: videoCodec,
			bitrate: videoBitrate,
			srcDir,
			outputDir,
			formats: videoFormats as ('mp4' | 'webm')[],
			sizes: (videoSizes || sizes) as Array<{ width?: number; height?: number; suffix?: string }>,
			preserveOriginal,
		};

		await compressVideos(videoConfig);
	}

	console.log('\nmedia done');
}

// Re-export individual functions for convenience
export { compressImages, compressVideos };
export type { ImageCompressionConfig, VideoCompressionConfig };
