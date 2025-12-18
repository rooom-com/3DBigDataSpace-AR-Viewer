/**
 * WebXR Utilities
 * 
 * Provides helper functions for WebXR feature detection, session management,
 * and AR capabilities on supported browsers (primarily Android Chrome).
 * 
 * Note: WebXR is NOT supported on iOS Safari. iOS devices should use
 * AR Quick Look (USDZ) instead.
 */

import type { Scene } from '@babylonjs/core/scene'
import { WebXRSessionManager } from '@babylonjs/core/XR/webXRSessionManager'
import type { WebXRDefaultExperience } from '@babylonjs/core/XR/webXRDefaultExperience'

/**
 * WebXR session modes
 */
export type XRSessionMode = 'immersive-ar' | 'immersive-vr' | 'inline'

/**
 * WebXR feature support result
 */
export interface WebXRSupport {
	isSupported: boolean
	supportsAR: boolean
	supportsVR: boolean
	isAndroid: boolean
	isIOS: boolean
	browserName: string
}

/**
 * Detects WebXR support and capabilities for the current browser/device
 * 
 * @returns WebXRSupport object with detailed capability information
 */
export async function detectWebXRSupport(): Promise<WebXRSupport> {
	const userAgent = navigator.userAgent
	const isAndroid = /Android/i.test(userAgent)
	const isIOS = /iPad|iPhone|iPod/i.test(userAgent)
	
	let browserName = 'Unknown'
	if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) {
		browserName = 'Chrome'
	} else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
		browserName = 'Safari'
	} else if (/Firefox/i.test(userAgent)) {
		browserName = 'Firefox'
	} else if (/Edge/i.test(userAgent)) {
		browserName = 'Edge'
	}

	// Check if navigator.xr exists (basic WebXR API availability)
	if (!navigator.xr) {
		return {
			isSupported: false,
			supportsAR: false,
			supportsVR: false,
			isAndroid,
			isIOS,
			browserName
		}
	}

	// Check specific session mode support
	let supportsAR = false
	let supportsVR = false

	try {
		supportsAR = await WebXRSessionManager.IsSessionSupportedAsync('immersive-ar')
	} catch (e) {
		console.log('WebXR AR check failed:', e)
	}

	try {
		supportsVR = await WebXRSessionManager.IsSessionSupportedAsync('immersive-vr')
	} catch (e) {
		console.log('WebXR VR check failed:', e)
	}

	return {
		isSupported: supportsAR || supportsVR,
		supportsAR,
		supportsVR,
		isAndroid,
		isIOS,
		browserName
	}
}

/**
 * Checks if the current device/browser supports WebXR AR
 * This is a simplified version of detectWebXRSupport for quick checks
 * 
 * @returns true if WebXR AR is supported
 */
export async function isWebXRARSupported(): Promise<boolean> {
	if (!navigator.xr) {
		return false
	}

	try {
		return await WebXRSessionManager.IsSessionSupportedAsync('immersive-ar')
	} catch {
		return false
	}
}

/**
 * Creates a WebXR experience for AR on a Babylon.js scene
 * 
 * @param scene - The Babylon.js scene
 * @param options - Optional configuration for the WebXR experience
 * @returns WebXR experience helper or null if not supported
 */
export async function createWebXRExperience(
	scene: Scene,
	options?: {
		enableHitTest?: boolean
		enableAnchors?: boolean
		enableDomOverlay?: boolean
		domOverlayElement?: string
	}
): Promise<WebXRDefaultExperience | null> {
	const { enableHitTest = true, enableAnchors = true, enableDomOverlay = false, domOverlayElement } = options || {}

	try {
		// Check if WebXR AR is supported
		const supported = await isWebXRARSupported()
		if (!supported) {
			console.log('WebXR AR is not supported on this device/browser')
			return null
		}

		// Build optional features array
		const optionalFeatures: string[] = []
		if (enableHitTest) optionalFeatures.push('hit-test')
		if (enableAnchors) optionalFeatures.push('anchors')
		if (enableDomOverlay && domOverlayElement) optionalFeatures.push('dom-overlay')

		// Create the WebXR experience
		const xr = await scene.createDefaultXRExperienceAsync({
			uiOptions: {
				sessionMode: 'immersive-ar',
				referenceSpaceType: 'local-floor'
			},
			optionalFeatures: optionalFeatures.length > 0 ? optionalFeatures : true
		})

		console.log('WebXR AR experience created successfully')
		return xr
	} catch (error) {
		console.error('Failed to create WebXR experience:', error)
		return null
	}
}

/**
 * Gets a user-friendly message about WebXR support status
 * 
 * @param support - WebXRSupport object from detectWebXRSupport()
 * @returns Human-readable message
 */
export function getWebXRSupportMessage(support: WebXRSupport): string {
	if (support.isIOS) {
		return 'WebXR is not supported on iOS. Please use AR Quick Look instead.'
	}

	if (!support.isSupported) {
		return `WebXR is not supported in ${support.browserName}. Try Chrome on Android for AR support.`
	}

	if (support.supportsAR) {
		return 'WebXR AR is supported! You can view this model in augmented reality.'
	}

	if (support.supportsVR) {
		return 'WebXR VR is supported, but AR is not available on this device.'
	}

	return 'WebXR support is limited on this device.'
}

