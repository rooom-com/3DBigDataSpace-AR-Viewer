import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'

export type {
	IIIFAnnotation,
	IIIFAnnotationBody,
	IIIFAnnotationTarget,
	IIIFSelector,
	IIIFManifest,
	IIIFScene,
	IIIFAnnotationPage,
	METSRecord
} from '../../services/xmlParser'

export interface Annotation3D {
	id: string
	type: 'point' | 'polygon' | 'region'
	position: Vector3
	content: AnnotationContent
	visibility: boolean
	interactive: boolean
	style: AnnotationStyle
	metadata?: AnnotationMetadata
}

export interface AnnotationContent {
	title?: string
	description: string
	format: 'text' | 'html' | 'markdown'
	language?: string
	author?: string
	created?: Date
	updated?: Date
}

export interface AnnotationStyle {
	color: string
	size: number
	opacity: number
	highlightColor?: string
	labelStyle: LabelStyle
	markerStyle: MarkerStyle
}

export interface LabelStyle {
	backgroundColor: string
	textColor: string
	fontSize: number
	padding: number
	borderRadius: number
	maxWidth: number
	position: 'above' | 'below' | 'left' | 'right' | 'auto'
	offset: Vector3
}

export interface MarkerStyle {
	type: 'sphere' | 'cube' | 'pin' | 'dot'
	scale: number
	material: 'standard' | 'emissive' | 'transparent'
}

export interface AnnotationMetadata {
	source?: string
	confidence?: number
	tags?: string[]
	category?: string
	priority?: 'low' | 'medium' | 'high'
}

export interface PolygonAnnotation3D extends Annotation3D {
	type: 'polygon'
	vertices: Vector3[]
	closed: boolean
}

export interface RegionAnnotation3D extends Annotation3D {
	type: 'region'
	boundingBox: {
		min: Vector3
		max: Vector3
	}
}

export interface RenderedAnnotation {
	id: string
	annotation: Annotation3D
	marker: Mesh
	label?: Mesh
	labelTexture?: any
	isVisible: boolean
	isHighlighted: boolean
}

export interface AnnotationConfig {
	defaultStyle: AnnotationStyle
	enableInteraction: boolean
	enableTooltips: boolean
	enableFiltering: boolean
	maxVisibleAnnotations: number
	fadeDistance: number
	scaleWithDistance: boolean
}

export interface AnnotationEvent {
	type: 'click' | 'hover' | 'focus' | 'blur'
	annotation: Annotation3D
	position: Vector3
	screenPosition?: { x: number; y: number }
}

export interface AnnotationFilter {
	categories?: string[]
	tags?: string[]
	authors?: string[]
	dateRange?: {
		start: Date
		end: Date
	}
	priority?: ('low' | 'medium' | 'high')[]
	searchText?: string
}

export const DEFAULT_ANNOTATION_STYLE: AnnotationStyle = {
	color: '#3b82f6',
	size: 0.02,
	opacity: 0.9,
	highlightColor: '#f59e0b',
	labelStyle: {
		backgroundColor: 'rgba(255, 255, 255, 0.95)',
		textColor: '#1f2937',
		fontSize: 14,
		padding: 8,
		borderRadius: 4,
		maxWidth: 200,
		position: 'auto',
		offset: new Vector3(0, 0.05, 0)
	},
	markerStyle: {
		type: 'sphere',
		scale: 1.0,
		material: 'standard'
	}
}

export const ANNOTATION_CATEGORIES = [
	'general',
	'historical',
	'technical',
	'artistic',
	'conservation',
	'damage',
	'restoration',
	'material',
	'construction',
	'decoration'
] as const

export type AnnotationCategory = typeof ANNOTATION_CATEGORIES[number]

// Utility functions for type guards
export function isPointAnnotation(annotation: Annotation3D): annotation is Annotation3D {
	return annotation.type === 'point'
}

export function isPolygonAnnotation(annotation: Annotation3D): annotation is PolygonAnnotation3D {
	return annotation.type === 'polygon'
}

export function isRegionAnnotation(annotation: Annotation3D): annotation is RegionAnnotation3D {
	return annotation.type === 'region'
}

// Conversion utilities
export function iiifToAnnotation3D(iiifAnnotation: any): Annotation3D | null {
	try {
		if (!iiifAnnotation.target?.selector?.[0]) {
			return null
		}

		const selector = iiifAnnotation.target.selector[0]
		
		if (selector.type === 'PointSelector') {
			const position = new Vector3(
				selector.x || 0,
				selector.y || 0,
				selector.z || 0
			)

			let content: AnnotationContent
			if (typeof iiifAnnotation.body === 'string' || iiifAnnotation.bodyValue) {
				content = {
					description: iiifAnnotation.bodyValue || iiifAnnotation.body,
					format: 'text'
				}
			} else if (iiifAnnotation.body?.value) {
				content = {
					description: iiifAnnotation.body.value,
					format: iiifAnnotation.body.format === 'text/html' ? 'html' : 'text',
					language: iiifAnnotation.body.language
				}
			} else {
				content = {
					description: 'Annotation',
					format: 'text'
				}
			}

			return {
				id: iiifAnnotation.id,
				type: 'point',
				position,
				content,
				visibility: true,
				interactive: true,
				style: { ...DEFAULT_ANNOTATION_STYLE },
				metadata: {
					source: 'iiif',
					category: 'general'
				}
			}
		}

		// TODO: Handle polygon annotations with WKTSelector
		return null
	} catch (error) {
		console.error('Failed to convert IIIF annotation:', error instanceof Error ? error.message : error)
		return null
	}
}
