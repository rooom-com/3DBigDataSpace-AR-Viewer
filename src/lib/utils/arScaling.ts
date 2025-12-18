/**
 * AR/XR Scaling Utilities
 * 
 * Provides functions to calculate display scaling factors for AR/XR viewing.
 * Large objects (especially buildings) need to be scaled down for practical
 * AR placement and viewing.
 * 
 * IMPORTANT: This scaling is for display purposes only and does NOT modify
 * the original dimensions stored in the database.
 */

/**
 * Maximum dimension (in meters) allowed for AR display.
 * Objects larger than this will be scaled down proportionally.
 */
export const AR_MAX_DIMENSION_METERS = 2.0

/**
 * Represents the dimensions of a 3D model
 */
export interface ModelDimensions {
	width: number   // X-axis dimension in meters
	height: number  // Y-axis dimension in meters
	depth: number   // Z-axis dimension in meters
}

/**
 * Result of AR scaling calculation
 */
export interface ARScalingResult {
	/** The scaling factor to apply (1.0 = no scaling, 0.5 = half size, etc.) */
	scaleFactor: number
	/** Whether scaling was applied (true if any dimension exceeded max) */
	isScaled: boolean
	/** Original dimensions of the model */
	originalDimensions: ModelDimensions
	/** Scaled dimensions for AR display */
	scaledDimensions: ModelDimensions
	/** The largest original dimension that triggered scaling */
	largestDimension: number
	/** Which axis has the largest dimension */
	largestAxis: 'width' | 'height' | 'depth'
}

/**
 * Calculates the AR display scaling factor for a 3D model.
 * 
 * If any dimension exceeds AR_MAX_DIMENSION_METERS (2m), calculates a scaling
 * factor that will cap the largest dimension to 2m while maintaining proportions.
 * 
 * @param dimensions - The original model dimensions in meters
 * @param maxDimension - Optional custom maximum dimension (defaults to AR_MAX_DIMENSION_METERS)
 * @returns ARScalingResult with scaling factor and dimension information
 * 
 * @example
 * // Building with dimensions 50m × 30m × 20m
 * const result = calculateARScaling({ width: 50, height: 30, depth: 20 })
 * // result.scaleFactor = 0.04 (2m / 50m)
 * // result.scaledDimensions = { width: 2, height: 1.2, depth: 0.8 }
 */
export function calculateARScaling(
	dimensions: ModelDimensions,
	maxDimension: number = AR_MAX_DIMENSION_METERS
): ARScalingResult {
	const { width, height, depth } = dimensions
	
	// Find the largest dimension
	const largestDimension = Math.max(width, height, depth)
	
	// Determine which axis is largest
	let largestAxis: 'width' | 'height' | 'depth' = 'width'
	if (height >= width && height >= depth) {
		largestAxis = 'height'
	} else if (depth >= width && depth >= height) {
		largestAxis = 'depth'
	}
	
	// Calculate scaling factor
	const needsScaling = largestDimension > maxDimension
	const scaleFactor = needsScaling 
		? maxDimension / largestDimension 
		: 1.0
	
	// Calculate scaled dimensions
	const scaledDimensions: ModelDimensions = {
		width: width * scaleFactor,
		height: height * scaleFactor,
		depth: depth * scaleFactor
	}
	
	return {
		scaleFactor,
		isScaled: needsScaling,
		originalDimensions: { ...dimensions },
		scaledDimensions,
		largestDimension,
		largestAxis
	}
}

/**
 * Formats the scaling factor as a percentage string for display
 * 
 * @param scaleFactor - The scaling factor (e.g., 0.04)
 * @returns Formatted string (e.g., "4%")
 */
export function formatScalePercentage(scaleFactor: number): string {
	const percentage = scaleFactor * 100
	if (percentage >= 1) {
		return `${Math.round(percentage)}%`
	}
	return `${percentage.toFixed(1)}%`
}

/**
 * Formats dimensions for display with appropriate units
 * 
 * @param dimensions - The dimensions to format
 * @returns Formatted string (e.g., "2.0m × 1.2m × 0.8m")
 */
export function formatDimensions(dimensions: ModelDimensions): string {
	const format = (val: number) => {
		if (val >= 1) {
			return `${val.toFixed(1)}m`
		}
		return `${(val * 100).toFixed(0)}cm`
	}
	
	return `${format(dimensions.width)} × ${format(dimensions.height)} × ${format(dimensions.depth)}`
}

/**
 * Checks if a model requires scaling for AR display
 * 
 * @param dimensions - The model dimensions in meters
 * @param maxDimension - Optional custom maximum dimension
 * @returns true if any dimension exceeds the maximum
 */
export function requiresARScaling(
	dimensions: ModelDimensions,
	maxDimension: number = AR_MAX_DIMENSION_METERS
): boolean {
	return Math.max(dimensions.width, dimensions.height, dimensions.depth) > maxDimension
}

