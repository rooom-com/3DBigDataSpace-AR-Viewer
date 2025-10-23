export function formatDate(date?: string | number | Date) {
	if (!date) return ''
	const options = {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	} as Intl.DateTimeFormatOptions
	return new Date(date).toLocaleString(undefined, options)
}

export function formatFileSize(bytes?: number): string {
	if (!bytes || bytes === 0) return '0 B'

	const units = ['B', 'KB', 'MB', 'GB', 'TB']
	const k = 1024
	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

function findBestThumbnail(files: any[]): string | null {
	if (!files || !Array.isArray(files)) return null

	const perspectiveOrder = ['perspective_2', 'perspective_1', 'perspective_3', 'perspective_4', 'perspective_top']

	for (const perspective of perspectiveOrder) {
		const thumbnail256 = files.find((file: { key: string }) =>
			file.key.includes(perspective) && file.key.includes('256x256.png')
		)

		if (thumbnail256?.links?.self) {
			return thumbnail256.links.self
		}

		const thumbnailOriginal = files.find((file: { key: string }) =>
			file.key.includes(perspective + '.png') &&
			!file.key.includes('_256x256') &&
			!file.key.includes('_512x512') &&
			!file.key.includes('_128x128')
		)

		if (thumbnailOriginal?.links?.self) {
			return thumbnailOriginal.links.self
		}
	}

	return null
}

export function filterZenodoRecord(record: Record<string, any> | null) {
	const {
		id,
		created,
		updated,
		metadata,
		links,
		title,
		doi_url: doi,
		files,
		status,
		stats
	} = record || {}

	const glbFile = files?.find((file: { key: string }) => file.key.includes('.glb'))
	const glb = glbFile?.links?.self
	const glbSize = glbFile?.size

	const usdzFile = files?.find((file: { key: string }) => file.key.includes('.usdz'))
	const usdz = usdzFile?.links?.self
	const usdzSize = usdzFile?.size

	const bestThumbnail = findBestThumbnail(files)

	const { keywords, version } = metadata || {}
	const { downloads, views } = stats || {}
	const { thumbnails } = links || {}

	return {
		id,
		created,
		updated,
		title,
		keywords,
		version,
		doi,
		glb,
		glbSize,
		usdz,
		usdzSize,
		status,
		thumbnails,
		bestThumbnail,
		stats: {
			downloads,
			views
		}
	}
}
