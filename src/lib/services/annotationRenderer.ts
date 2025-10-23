import { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Camera } from '@babylonjs/core/Cameras/camera'

import type {
	Annotation3D,
	RenderedAnnotation,
	AnnotationConfig,
	AnnotationEvent,
	AnnotationFilter
} from '../types/annotations'
import { DEFAULT_ANNOTATION_STYLE } from '../types/annotations'

export class AnnotationRenderer {
	private scene: Scene
	private camera: Camera
	private config: AnnotationConfig
	private renderedAnnotations: Map<string, RenderedAnnotation> = new Map()
	private annotationParent: TransformNode
	private eventCallbacks: Map<string, (event: AnnotationEvent) => void> = new Map()

	constructor(scene: Scene, camera: Camera, config?: Partial<AnnotationConfig>) {
		this.scene = scene
		this.camera = camera
		this.config = {
			defaultStyle: DEFAULT_ANNOTATION_STYLE,
			enableInteraction: true,
			enableTooltips: true,
			enableFiltering: true,
			maxVisibleAnnotations: 50,
			fadeDistance: 10.0,
			scaleWithDistance: true,
			...config
		}

		this.annotationParent = new TransformNode('annotations', this.scene)

		this.setupEventHandlers()
	}

	public addAnnotation(annotation: Annotation3D): void {
		if (this.renderedAnnotations.has(annotation.id)) {
			this.removeAnnotation(annotation.id)
		}

		const rendered = this.createRenderedAnnotation(annotation)
		this.renderedAnnotations.set(annotation.id, rendered)
	}

	public removeAnnotation(id: string): void {
		const rendered = this.renderedAnnotations.get(id)
		if (rendered) {
			this.disposeRenderedAnnotation(rendered)
			this.renderedAnnotations.delete(id)
		}
	}

	public updateAnnotation(annotation: Annotation3D): void {
		const rendered = this.renderedAnnotations.get(annotation.id)
		if (rendered) {
			rendered.annotation = annotation
			this.updateRenderedAnnotation(rendered)
		}
	}

	public getAnnotations(): Annotation3D[] {
		return Array.from(this.renderedAnnotations.values()).map((r) => r.annotation)
	}

	public setAnnotationVisibility(id: string, visible: boolean): void {
		const rendered = this.renderedAnnotations.get(id)
		if (rendered) {
			rendered.isVisible = visible
			rendered.marker.setEnabled(visible)
			if (rendered.label) {
				rendered.label.setEnabled(visible)
			}
		}
	}

	public highlightAnnotation(id: string, highlight: boolean): void {
		const rendered = this.renderedAnnotations.get(id)
		if (rendered) {
			rendered.isHighlighted = highlight
			this.updateAnnotationAppearance(rendered)
		}
	}

	public applyFilter(filter: AnnotationFilter): void {
		for (const rendered of this.renderedAnnotations.values()) {
			const visible = this.matchesFilter(rendered.annotation, filter)
			this.setAnnotationVisibility(rendered.id, visible)
		}
	}

	public clearAnnotations(): void {
		for (const rendered of this.renderedAnnotations.values()) {
			this.disposeRenderedAnnotation(rendered)
		}
		this.renderedAnnotations.clear()
	}

	public onAnnotationEvent(eventType: string, callback: (event: AnnotationEvent) => void): void {
		this.eventCallbacks.set(eventType, callback)
	}

	public update(): void {
		if (this.config.scaleWithDistance) {
			this.updateDistanceScaling()
		}
	}

	private createRenderedAnnotation(annotation: Annotation3D): RenderedAnnotation {
		const marker = this.createMarker(annotation)
		const label = this.createLabel(annotation)

		const rendered: RenderedAnnotation = {
			id: annotation.id,
			annotation,
			marker,
			label,
			isVisible: annotation.visibility,
			isHighlighted: false
		}

		if (this.config.enableInteraction && annotation.interactive) {
			this.setupMarkerInteraction(rendered)
		}

		return rendered
	}

	private createMarker(annotation: Annotation3D): Mesh {
		let marker: Mesh

		switch (annotation.style.markerStyle.type) {
			case 'sphere':
				marker = MeshBuilder.CreateSphere(
					`marker_${annotation.id}`,
					{ diameter: annotation.style.size },
					this.scene
				)
				break
			case 'cube':
				marker = MeshBuilder.CreateBox(
					`marker_${annotation.id}`,
					{ size: annotation.style.size },
					this.scene
				)
				break
			case 'pin':
				marker = MeshBuilder.CreateCylinder(
					`marker_${annotation.id}`,
					{ height: annotation.style.size * 2, diameter: annotation.style.size * 0.3 },
					this.scene
				)
				const pinTop = MeshBuilder.CreateSphere(
					`pin_top_${annotation.id}`,
					{ diameter: annotation.style.size * 0.8 },
					this.scene
				)
				pinTop.position.y = annotation.style.size
				pinTop.parent = marker
				break
			default:
				marker = MeshBuilder.CreateSphere(
					`marker_${annotation.id}`,
					{ diameter: annotation.style.size },
					this.scene
				)
		}

		marker.position = annotation.position.clone()
		marker.parent = this.annotationParent

		const material = new StandardMaterial(`marker_mat_${annotation.id}`, this.scene)
		material.diffuseColor = Color3.FromHexString(annotation.style.color)
		material.alpha = annotation.style.opacity

		if (annotation.style.markerStyle.material === 'emissive') {
			material.emissiveColor = Color3.FromHexString(annotation.style.color)
		}

		marker.material = material

		return marker
	}

	private createLabel(annotation: Annotation3D): Mesh | undefined {
		if (!annotation.content.description) return undefined

		const labelStyle = annotation.style.labelStyle

		const texture = new DynamicTexture(
			`label_texture_${annotation.id}`,
			{ width: 512, height: 256 },
			this.scene
		)

		const font = `${labelStyle.fontSize}px Arial`
		texture.drawText(
			annotation.content.description,
			null,
			null,
			font,
			labelStyle.textColor,
			labelStyle.backgroundColor,
			true
		)

		const label = MeshBuilder.CreatePlane(
			`label_${annotation.id}`,
			{ width: labelStyle.maxWidth / 1000, height: labelStyle.maxWidth / 2 / 1000 },
			this.scene
		)

		const material = new StandardMaterial(`label_mat_${annotation.id}`, this.scene)
		material.diffuseTexture = texture
		material.useAlphaFromDiffuseTexture = true

		label.material = material
		label.billboardMode = Mesh.BILLBOARDMODE_ALL

		const offset = labelStyle.offset || new Vector3(0, annotation.style.size * 2, 0)
		label.position = annotation.position.add(offset)
		label.parent = this.annotationParent

		return label
	}

	private setupMarkerInteraction(rendered: RenderedAnnotation): void {
		const marker = rendered.marker

		// @ts-ignore
		marker.actionManager = new (this.scene.actionManager?.constructor || class {})(this.scene)

		marker.isPickable = true
		marker.metadata = { annotationId: rendered.id }
	}

	private updateAnnotationAppearance(rendered: RenderedAnnotation): void {
		const material = rendered.marker.material as StandardMaterial
		if (material) {
			if (rendered.isHighlighted && rendered.annotation.style.highlightColor) {
				material.diffuseColor = Color3.FromHexString(
					rendered.annotation.style.highlightColor
				)
				material.emissiveColor = Color3.FromHexString(
					rendered.annotation.style.highlightColor
				).scale(0.3)
			} else {
				material.diffuseColor = Color3.FromHexString(rendered.annotation.style.color)
				material.emissiveColor = Color3.Black()
			}
		}
	}

	private updateRenderedAnnotation(rendered: RenderedAnnotation): void {
		rendered.marker.position = rendered.annotation.position.clone()
		if (rendered.label) {
			const offset =
				rendered.annotation.style.labelStyle.offset ||
				new Vector3(0, rendered.annotation.style.size * 2, 0)
			rendered.label.position = rendered.annotation.position.add(offset)
		}

		this.updateAnnotationAppearance(rendered)
	}

	private disposeRenderedAnnotation(rendered: RenderedAnnotation): void {
		rendered.marker.dispose()
		if (rendered.label) {
			rendered.label.dispose()
		}
		if (rendered.labelTexture) {
			rendered.labelTexture.dispose()
		}
	}

	private matchesFilter(annotation: Annotation3D, filter: AnnotationFilter): boolean {
		if (filter.categories && annotation.metadata?.category) {
			if (!filter.categories.includes(annotation.metadata.category)) {
				return false
			}
		}

		if (filter.searchText && annotation.content.description) {
			const searchLower = filter.searchText.toLowerCase()
			if (!annotation.content.description.toLowerCase().includes(searchLower)) {
				return false
			}
		}

		return true
	}

	private updateDistanceScaling(): void {
		const cameraPosition = this.camera.position

		for (const rendered of this.renderedAnnotations.values()) {
			const distance = Vector3.Distance(cameraPosition, rendered.annotation.position)
			const scale = Math.max(0.5, Math.min(2.0, distance / 5.0))

			rendered.marker.scaling.setAll(scale)
			if (rendered.label) {
				rendered.label.scaling.setAll(scale)
			}
		}
	}

	private setupEventHandlers(): void {
		this.scene.onPointerObservable.add((pointerInfo) => {
			if (pointerInfo.pickInfo?.hit && pointerInfo.pickInfo.pickedMesh) {
				const mesh = pointerInfo.pickInfo.pickedMesh
				const annotationId = mesh.metadata?.annotationId

				if (annotationId) {
					const rendered = this.renderedAnnotations.get(annotationId)
					if (rendered) {
						const event: AnnotationEvent = {
							type: 'click',
							annotation: rendered.annotation,
							position:
								pointerInfo.pickInfo.pickedPoint || rendered.annotation.position,
							screenPosition: {
								x: pointerInfo.event.offsetX,
								y: pointerInfo.event.offsetY
							}
						}

						const callback = this.eventCallbacks.get('click')
						if (callback) {
							callback(event)
						}
					}
				}
			}
		})
	}

	public dispose(): void {
		this.clearAnnotations()
		this.annotationParent.dispose()
		this.eventCallbacks.clear()
	}
}
