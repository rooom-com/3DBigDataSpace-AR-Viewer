export const load = async ({ url }: { url: URL }) => {
	const modelUrl = url.searchParams.get('model')
	const usdzUrl = url.searchParams.get('usdz')
	const annotationsUrl = url.searchParams.get('annotations')

	if (!modelUrl) {
		return {
			error: 'No model URL provided. Please include a "model" query parameter.'
		}
	}

	if (!modelUrl.toLowerCase().endsWith('.glb')) {
		return {
			error: 'Invalid model format. Only GLB files are supported.'
		}
	}

	if (annotationsUrl) {
		try {
			new URL(annotationsUrl)
		} catch (e) {
			return {
				error: 'Invalid annotations URL. Please provide a valid URL to a JSON file.'
			}
		}

		if (!annotationsUrl.toLowerCase().endsWith('.json')) {
			return {
				error: 'Invalid annotations format. Only JSON files are supported.'
			}
		}
	}

	return {
		modelUrl,
		usdzUrl,
		annotationsUrl
	}
}

