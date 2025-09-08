import { join, extname, basename } from '@std/path';
import { ensureDir, exists, walk } from '@std/fs';

/**
 * Video compression configuration type
 */
export interface VideoCompressionConfig {
	enabled: boolean;
	quality?: number; // CRF value (0-51, lower = better quality)
	codec?: 'h264' | 'h265' | 'vp9';
	bitrate?: string; // e.g., '1M', '2M', 'auto'
	srcDir?: string;
	outputDir?: string;
	formats?: ('mp4' | 'webm')[];
	sizes?: Array<{
		width?: number;
		height?: number;
		suffix?: string;
	}>;
	preserveOriginal?: boolean;
}

/**
 * Supported video formats for input
 */
const SUPPORTED_INPUT_FORMATS = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.m4v'];

/**
 * Video processing options for a single video
 */
interface VideoProcessingOptions {
	input: string;
	output: string;
	quality?: number;
	codec?: 'h264' | 'h265' | 'vp9';
	bitrate?: string;
	width?: number;
	height?: number;
	format?: 'mp4' | 'webm';
}

/**
 * Check if FFmpeg is available
 */
async function checkFFmpeg(): Promise<boolean> {
	try {
		const process = new Deno.Command('ffmpeg', {
			args: ['-version'],
			stdout: 'piped',
			stderr: 'piped',
		});
		const { success } = await process.output();
		return success;
	} catch {
		return false;
	}
}

/**
 * Get video codec for FFmpeg based on format and codec preference
 */
function getFFmpegCodec(format: 'mp4' | 'webm', codec: 'h264' | 'h265' | 'vp9'): string {
	if (format === 'webm') {
		return codec === 'vp9' ? 'libvpx-vp9' : 'libvpx';
	}

	// MP4 format
	switch (codec) {
		case 'h265':
			return 'libx265';
		case 'vp9':
			return 'libvpx-vp9'; // VP9 in MP4 container
		default:
			return 'libx264';
	}
}

/**
 * Convert video using FFmpeg
 */
async function convertVideo(options: VideoProcessingOptions): Promise<void> {
	const ffmpegCodec = getFFmpegCodec(options.format || 'mp4', options.codec || 'h264');
	const args: string[] = ['-i', options.input, '-c:v', ffmpegCodec];

	// Add quality settings
	if (options.codec === 'h264' || options.codec === 'h265') {
		args.push('-crf', String(options.quality || 23));
		args.push('-preset', 'medium');
	} else if (options.codec === 'vp9') {
		args.push('-crf', String(options.quality || 30));
		args.push('-b:v', '0'); // Use CRF mode
	}

	// Add bitrate if specified
	if (options.bitrate && options.bitrate !== 'auto') {
		args.push('-b:v', options.bitrate);
	}

	// Add resolution if specified
	if (options.width || options.height) {
		// Ensure dimensions are divisible by 2 for H.264 compatibility
		let scaleFilter;
		if (options.width && options.height) {
			// Both width and height specified - force exact dimensions but make even
			scaleFilter = `scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease,pad=${options.width}:${options.height}:(ow-iw)/2:(oh-ih)/2`;
		} else if (options.width) {
			// Only width specified - maintain aspect ratio and ensure even dimensions
			scaleFilter = `scale=${options.width}:-2`;
		} else {
			// Only height specified - maintain aspect ratio and ensure even dimensions
			scaleFilter = `scale=-2:${options.height}`;
		}
		args.push('-vf', scaleFilter);
	}

	// Handle audio - copy if exists, ignore if no audio stream
	args.push('-c:a', 'copy', '-map', '0:v:0', '-map', '0:a?');

	// Output file
	args.push('-y', options.output); // -y to overwrite existing files

	try {
		// Compact processing indicator
		Deno.stdout.write(
			new TextEncoder().encode(`${basename(options.input)} -> ${basename(options.output).split('.')[0]}...`)
		);

		const ffmpegProcess = new Deno.Command('ffmpeg', {
			args,
			stdout: 'piped',
			stderr: 'piped',
		});

		const { success, stderr } = await ffmpegProcess.output();

		if (!success) {
			const errorText = new TextDecoder().decode(stderr);
			console.error(`❌ FFmpeg stderr output:\n${errorText}`);
			throw new Error(`FFmpeg failed with exit code. Check the error output above.`);
		}

		// Log file size reduction
		const inputStat = await Deno.stat(options.input);
		const outputStat = await Deno.stat(options.output);
		const reduction = Math.round((1 - outputStat.size / inputStat.size) * 100);

		const inputMB = Math.round(inputStat.size / (1024 * 1024));
		const outputMB = Math.round(outputStat.size / (1024 * 1024));
		const fileName = options.input.split('/').pop();

		// Bracket style compression bar
		const barLength = 15;
		const filled = Math.round((Math.max(0, reduction) / 100) * barLength);
		const empty = barLength - filled;
		const bar = '▰'.repeat(filled) + '▱'.repeat(empty);

		// Clear line and show compact result
		Deno.stdout.write(new TextEncoder().encode('\r\x1b[K'));
		const reductionText = reduction > 0 ? `${reduction}%` : 'no reduction';
		console.log(`▪ ${fileName} [${bar}] ${reductionText} ${inputMB}MB→${outputMB}MB`);
	} catch (error) {
		console.error(`❌ Failed to convert ${options.input}:`, error);
		throw error;
	}
}

/**
 * Process a single video file
 */
async function processVideo(
	inputPath: string,
	config: Required<Exclude<VideoCompressionConfig, undefined>>,
	outputDir: string
): Promise<void> {
	const inputExt = extname(inputPath).toLowerCase();
	const baseName = basename(inputPath, inputExt);

	// Ensure output directory exists
	await ensureDir(outputDir);

	// Process each requested format
	for (const format of config.formats) {
		const outputPath = join(outputDir, `${baseName}.${format}`);

		// Skip if output already exists and is newer than input
		if (await exists(outputPath)) {
			const inputStat = await Deno.stat(inputPath);
			const outputStat = await Deno.stat(outputPath);
			if (outputStat.mtime && inputStat.mtime && outputStat.mtime > inputStat.mtime) {
				console.log(`▫ skip: ${basename(outputPath)}`);
				continue;
			}
		}

		const processingOptions: VideoProcessingOptions = {
			input: inputPath,
			output: outputPath,
			quality: config.quality,
			codec: config.codec,
			bitrate: config.bitrate,
			format,
		};

		// Process different sizes if specified
		if (config.sizes && config.sizes.length > 0) {
			for (const sizeConfig of config.sizes) {
				const sizeSuffix = sizeConfig.suffix || `_${sizeConfig.width || 'auto'}x${sizeConfig.height || 'auto'}`;
				const sizedOutputPath = join(outputDir, `${baseName}${sizeSuffix}.${format}`);

				const sizedOptions: VideoProcessingOptions = {
					...processingOptions,
					output: sizedOutputPath,
					width: sizeConfig.width,
					height: sizeConfig.height,
				};

				await convertVideo(sizedOptions);
			}
		} else {
			// Process original size
			await convertVideo(processingOptions);
		}
	}

	// Preserve original if requested
	if (config.preserveOriginal) {
		const originalOutputPath = join(outputDir, basename(inputPath));
		if (inputPath !== originalOutputPath) {
			await Deno.copyFile(inputPath, originalOutputPath);
			console.log(`▫ preserved: ${basename(originalOutputPath)}`);
		}
	}
}

/**
 * Compress and convert videos according to configuration
 */
export async function compressVideos(config?: VideoCompressionConfig): Promise<void> {
	if (!config?.enabled) {
		console.log('🎬 Video compression is disabled');
		return;
	}

	const fullConfig: Required<VideoCompressionConfig> = {
		enabled: config.enabled,
		quality: config.quality ?? 23,
		codec: config.codec ?? 'h264',
		bitrate: config.bitrate ?? 'auto',
		srcDir: config.srcDir ?? 'src/videos',
		outputDir: config.outputDir ?? 'public/videos',
		formats: config.formats ?? ['mp4'],
		sizes: config.sizes ?? [],
		preserveOriginal: config.preserveOriginal ?? false,
	};

	console.log(`\nvid ${fullConfig.codec}@${fullConfig.quality} ${fullConfig.srcDir}→${fullConfig.outputDir}`);

	// Check if source directory exists
	if (!(await exists(fullConfig.srcDir))) {
		console.log(`▫ no videos found - creating ${fullConfig.srcDir}`);
		await ensureDir(fullConfig.srcDir);
		return;
	}

	// Ensure output directory exists
	await ensureDir(fullConfig.outputDir);

	let processedCount = 0;
	let errorCount = 0;

	// Process all videos in source directory
	try {
		for await (const entry of walk(fullConfig.srcDir, {
			exts: SUPPORTED_INPUT_FORMATS,
			includeDirs: false,
		})) {
			try {
				await processVideo(entry.path, fullConfig, fullConfig.outputDir);
				processedCount++;
			} catch (error) {
				console.error(`❌ Error processing ${entry.path}:`, error);
				errorCount++;
			}
		}
	} catch (error) {
		console.error('❌ Error walking source directory:', error);
		throw error;
	}

	console.log(
		`\nvid done: ${processedCount}/${processedCount + errorCount} ${errorCount > 0 ? `${errorCount} errors` : 'ok'}`
	);
}

/**
 * Check if required dependencies are available for video processing
 */
export async function checkVideoDependencies(): Promise<{ ffmpeg: boolean }> {
	const result = { ffmpeg: false };

	// Check for FFmpeg
	result.ffmpeg = await checkFFmpeg();

	return result;
}

/**
 * Install video processing dependencies
 */
export async function installVideoDependencies(): Promise<void> {
	console.log('📦 Checking video processing dependencies...');

	const deps = await checkVideoDependencies();

	if (deps.ffmpeg) {
		console.log('✅ All video processing dependencies are available');
		console.log('   FFmpeg is installed and ready');
	} else {
		console.log('❌ FFmpeg is not installed or not in PATH');
		console.log('\n📋 Installation instructions:');
		console.log('   macOS: brew install ffmpeg');
		console.log('   Ubuntu/Debian: sudo apt install ffmpeg');
		console.log('   Windows: Download from https://ffmpeg.org/download.html');
		console.log('   Or use package managers like chocolatey: choco install ffmpeg');
	}
}
