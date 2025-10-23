<script lang="ts">
	import { onMount } from 'svelte'
	import Icon from '@iconify/svelte'

	import '@babylonjs/core/Helpers/sceneHelpers'
	import '@babylonjs/loaders/glTF/2.0/Extensions/KHR_texture_transform'
	import '@babylonjs/loaders/glTF/2.0/Extensions/KHR_draco_mesh_compression'
	import '@babylonjs/loaders/glTF/2.0/Extensions/KHR_mesh_quantization'
	import '@babylonjs/loaders/glTF/2.0/Extensions/KHR_materials_pbrSpecularGlossiness'
	import '@babylonjs/loaders/glTF/2.0/Extensions/EXT_texture_webp'
	import '@babylonjs/loaders/glTF/2.0/glTFLoader'

	import environment from '$lib/assets/environment.env?url'

	import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
	import { Engine } from '@babylonjs/core/Engines/engine'
	import { Scene } from '@babylonjs/core/scene'
	import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader'
	import { Vector3 } from '@babylonjs/core/Maths/math.vector'
	import { BoundingBox } from '@babylonjs/core/Culling/boundingBox'
	import type { AssetContainer } from '@babylonjs/core/assetContainer'
	import { Color4 } from '@babylonjs/core/Maths/math.color'
	import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture'

	import AnnotationTooltip from './AnnotationTooltip.svelte'
	import ArButton from './ARButton.svelte'

	import { AnnotationRenderer } from '$lib/services/annotationRenderer'
	import { parseMETSXML, createSampleAnnotations, loadIIIFAnnotationsForRecord } from '../../../services/xmlParser'
	import type { Annotation3D, AnnotationEvent } from '$lib/types/annotations'
	import { iiifToAnnotation3D } from '$lib/types/annotations'

	let canvas: HTMLCanvasElement | null = null

	let engine: Engine | null = null
	let scene: Scene | null = $state(null)
	let camera: ArcRotateCamera | null = null
	let container: AssetContainer | null = null

	let isLoading = $state(true)
	let loadingProgress = $state(0)
	let error = $state('')
	let isInitialized = $state(false)

	let annotationRenderer: AnnotationRenderer | null = null
	let hoveredAnnotation = $state<Annotation3D | null>(null)
	let tooltipPosition = $state({ x: 0, y: 0 })
	let tooltipVisible = $state(false)

	let { file, usdzFile, enableAnnotations = true, annotationsUrl = undefined }: {
		file: string;
		usdzFile?: string;
		enableAnnotations?: boolean;
		annotationsUrl?: string;
	} = $props()

	function init() {
		try {
			if (!canvas) return
			engine = new Engine(canvas, true, {
				preserveDrawingBuffer: true,
				stencil: true,
				antialias: true,
				adaptToDeviceRatio: true
			})
			scene = new Scene(engine)
			camera = new ArcRotateCamera('camera', 0, 0, 0, new Vector3(0, 0, 0), scene)
			camera.attachControl(canvas, true)
			isInitialized = true
		} catch (err) {
			console.error('Failed to initialize 3D engine:', err)
			error = 'Failed to initialize 3D viewer. Please try refreshing the page.'
			isLoading = false
		}
	}

	function initializeAnnotationSystem() {
		if (!scene || !camera || !enableAnnotations) return

		try {
			annotationRenderer = new AnnotationRenderer(scene, camera, {
				enableInteraction: true,
				enableTooltips: true,
				scaleWithDistance: true
			})

			annotationRenderer.onAnnotationEvent('click', handleAnnotationClick)

			if (annotationsUrl) {
				loadAnnotationsFromJSON(annotationsUrl)
			} else {
				loadAnnotationsFromXML()
			}

			console.log('Annotation system initialized')
		} catch (err) {
			console.error('Failed to initialize annotation system:', err)
		}
	}

	function start() {
		try {
			engine?.runRenderLoop(() => {
				scene?.render()
				annotationRenderer?.update()
			})
			resizeObserver()
		} catch (err) {
			console.error('Failed to start render loop:', err)
			error = 'Failed to start 3D rendering. Please try refreshing the page.'
			isLoading = false
		}
	}

	async function loadAsset(file: string, fileType: string = 'glb') {
		try {
			if (!engine || !scene) {
				throw new Error('3D engine not initialized')
			}

			isLoading = true
			loadingProgress = 0
			error = ''

			container = await LoadAssetContainerAsync(file, scene, {
				onProgress: (evt) => {
					if (evt.lengthComputable) {
						loadingProgress = (evt.loaded * 100) / evt.total
					}
				},
				pluginExtension: `.${fileType}`
			})
			container.addAllToScene()

			isLoading = false
		} catch (err) {
			console.error('Error loading 3D model:', err)
			error = err instanceof Error ? err.message : 'Failed to load 3D model. Please try again.'
			isLoading = false
		}
	}

	function createEnvironment() {
		if (!scene) return
		const hdrTexture = CubeTexture.CreateFromPrefilteredData(environment, scene)
		scene.environmentTexture = hdrTexture

		scene.createDefaultLight(true)

		scene.createDefaultCamera(true, true, true)
		camera = scene.activeCamera as ArcRotateCamera
		camera.name = 'camera'
		camera.fov = 0.6

		scene.clearColor = Color4.FromHexString('#0000')
	}

	function cleanup() {
		if (container) {
			container.dispose()
		}
		if (annotationRenderer) {
			annotationRenderer.dispose()
			annotationRenderer = null
		}
	}

	async function loadAnnotationsFromJSON(jsonUrl: string) {
		try {
			console.log('Loading annotations from JSON:', jsonUrl)
			const response = await fetch(jsonUrl)

			if (!response.ok) {
				throw new Error(`Failed to fetch annotations: ${response.status}`)
			}

			const data = await response.json()

			let iiifAnnotations: any[] = []

			if (Array.isArray(data)) {
				iiifAnnotations = data
			} else if (data.items && Array.isArray(data.items)) {
				iiifAnnotations = data.items
			} else if (data.annotations && Array.isArray(data.annotations)) {
				iiifAnnotations = data.annotations
			} else {
				throw new Error('Invalid annotation JSON format. Expected an array of annotations or an object with "items" or "annotations" property.')
			}

			console.log(`Loaded ${iiifAnnotations.length} annotations from JSON`)

			const newAnnotations: Annotation3D[] = []
			for (const iiifAnnotation of iiifAnnotations) {
				const annotation3D = iiifToAnnotation3D(iiifAnnotation)
				if (annotation3D) {
					newAnnotations.push(annotation3D)
				}
			}

			for (const annotation of newAnnotations) {
				annotationRenderer?.addAnnotation(annotation)
			}

			console.log(`Displaying ${newAnnotations.length} annotations in 3D scene`)
		} catch (err) {
			console.error('Failed to load annotations from JSON:', err)
			error = `Failed to load annotations: ${err instanceof Error ? err.message : 'Unknown error'}`
		}
	}

	async function loadAnnotationsFromXML() {
		try {
			const xmlUrl = 'https://zenodo.org/records/17060976/files/68d977cec19c423e869fa911f5ca1a2fmetsmods.xml?download=1'
			const metsRecord = await parseMETSXML(xmlUrl)

			let iiifAnnotations: any[] = []

			if (metsRecord) {
				console.log('Loaded METS record:', metsRecord)

				const recordId = '17060976'

				const realAnnotations = await loadIIIFAnnotationsForRecord(recordId)
				if (realAnnotations.length > 0) {
					iiifAnnotations = realAnnotations
					console.log(`Found ${realAnnotations.length} IIIF annotations`)
				} else {
					iiifAnnotations = createSampleAnnotations(metsRecord.glbUrl || file)
					console.log(`Created ${iiifAnnotations.length} sample annotations for Reliquary Bust`)
				}
			} else {
				iiifAnnotations = createSampleAnnotations(file)
				console.log(`Created ${iiifAnnotations.length} fallback annotations`)
			}

			const newAnnotations: Annotation3D[] = []
			for (const iiifAnnotation of iiifAnnotations) {
				const annotation3D = iiifToAnnotation3D(iiifAnnotation)
				if (annotation3D) {
					newAnnotations.push(annotation3D)
				}
			}

			for (const annotation of newAnnotations) {
				annotationRenderer?.addAnnotation(annotation)
			}

			console.log(`Displaying ${newAnnotations.length} annotations in 3D scene`)
		} catch (err) {
			console.error('Failed to load annotations:', err)

			const sampleAnnotations = createSampleAnnotations(file)
			const fallbackAnnotations: Annotation3D[] = []
			for (const iiifAnnotation of sampleAnnotations) {
				const annotation3D = iiifToAnnotation3D(iiifAnnotation)
				if (annotation3D) {
					fallbackAnnotations.push(annotation3D)
				}
			}

			for (const annotation of fallbackAnnotations) {
				annotationRenderer?.addAnnotation(annotation)
			}
		}
	}

	function handleAnnotationClick(event: AnnotationEvent) {
		if (event.screenPosition) {
			tooltipPosition = event.screenPosition
			tooltipVisible = true
			hoveredAnnotation = event.annotation

			setTimeout(() => {
				tooltipVisible = false
				hoveredAnnotation = null
			}, 5000)
		}
	}

	export function resetModelScale() {
		if (!container || !container.meshes.length) return

		container.meshes.forEach(mesh => {
			if (mesh.scaling) {
				mesh.scaling.set(1, 1, 1)
			}
		})

		fitCamera()
	}

	export async function createScene(url: string, fileType: string) {
		cleanup()

		try {
			if (!url) {
				error = 'No 3D model URL provided'
				isLoading = false
				return
			}
			await loadAsset(url, fileType)
			fitCamera()
		} catch (err) {
			console.error('Error creating scene:', err)
			error = err instanceof Error ? err.message : 'Failed to load 3D scene'
			isLoading = false
		}
	}

	export function fitCamera() {
		if (!scene || !container || !camera) return

		const boundingInfo = container.meshes[0].getHierarchyBoundingVectors()
		const boundingBox = new BoundingBox(boundingInfo.min, boundingInfo.max)
		const center = boundingBox.centerWorld
		const extent = boundingBox.extendSizeWorld

		const maxDimension = Math.max(extent.x, extent.y, extent.z)
		const radius = maxDimension * 1.5

		camera.target = center.clone()
		camera.radius = boundingBox.maximum.subtract(boundingBox.minimum).length() * 1.5
		camera.alpha = Math.PI / 3
		camera.beta = Math.PI / 3

		camera.lowerRadiusLimit = radius * 0.2
		camera.upperRadiusLimit = radius * 5
		camera.minZ = 0.001
		camera.maxZ = radius * 10
		camera.wheelPrecision = (1 / camera.radius) * 400
		camera.panningSensibility = (1 / camera.radius) * 4000
	}

	function resizeObserver() {
		const observer = new ResizeObserver(() => {
			clearTimeout((observer as any).timeoutId)
			;(observer as any).timeoutId = setTimeout(() => engine?.resize(), 100)
		})
		canvas && observer.observe(canvas)
		engine?.resize()
	}

	function resize() {
		engine?.resize()
	}

	onMount(async () => {
		try {
			init()
			if (isInitialized) {
				createEnvironment()
				initializeAnnotationSystem()
				start()
				await createScene(file, 'glb')
			}
		} catch (err) {
			console.error('Error during component mount:', err)
			error = 'Failed to initialize 3D viewer'
			isLoading = false
		}
	})
</script>

<svelte:window on:resize={resize} />
<div
	class="_dark:from-slate-700 _dark:to-slate-950 relative flex h-full w-full flex-col justify-between bg-gradient-to-b from-slate-50 to-slate-300 text-white"
>
	<canvas class="absolute block h-full w-full border-none outline-none" bind:this={canvas}
	></canvas>

	{#if isLoading}
		<div class="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-300">
			<div class="text-center">
				<Icon icon="tabler:loader-2" class="mx-auto mb-4 size-12 animate-spin text-slate-600" />
				<p class="mb-2 text-lg font-medium text-slate-700">Loading 3D Model</p>
				{#if loadingProgress > 0}
					<div class="mx-auto w-64 rounded-full bg-slate-200">
						<div
							class="h-2 rounded-full bg-sky-500 transition-all duration-300"
							style="width: {loadingProgress}%"
						></div>
					</div>
					<p class="mt-2 text-sm text-slate-600">{Math.round(loadingProgress)}%</p>
				{/if}
			</div>
		</div>
	{/if}

	{#if error}
		<div class="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-300">
			<div class="max-w-md text-center">
				<Icon icon="tabler:alert-circle" class="mx-auto mb-4 size-12 text-red-500" />
				<h3 class="mb-2 text-lg font-semibold text-slate-800">Unable to Load 3D Model</h3>
				<p class="mb-4 text-slate-600">{error}</p>
				<button
					class="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 transition-colors"
					onclick={() => {
						error = ''
						isLoading = true
						createScene(file, 'glb')
					}}
				>
					Try Again
				</button>
			</div>
		</div>
	{/if}

	{#if enableAnnotations}
		<AnnotationTooltip
			annotation={hoveredAnnotation}
			position={tooltipPosition}
			visible={tooltipVisible && hoveredAnnotation !== null}
		/>
	{/if}

	<ArButton glbUrl={file} usdzUrl={usdzFile} />
</div>
