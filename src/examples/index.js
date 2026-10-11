/**
 * Example registry. Each example lives in `./<id>.js` and default-exports its definition.
 * To add one: create the file, then add its id to ORDER below.
 */
const modules = import.meta.glob(['./*.js', '!./index.js'], { import: 'default', eager: true })
/** Raw source of every example, shown in the "Source" panel. */
const sources = import.meta.glob(['./*.js', '!./index.js'], { query: '?raw', import: 'default', eager: true })

/** Navigation order. Categories appear in the order they are first used. */
const ORDER = [
	// Basemap
	'themes',
	'compare',
	'globe',
	'localization',
	// Spatial charts
	'proportional-symbols',
	'choropleth',
	'patterns',
	'heatmap',
	'clusters',
	'connections',
	'symbols',
	'extrusions',
	'terrain',
	// Sources
	'raster',
	'canvas-source',
	'custom-protocol',
	'custom-layer',
	// Interaction
	'popups',
	'markers',
	'map-controls',
	'camera',
	'interactions',
	'filters',
	'expressions',
	'measure',
	'inspect',
	'export',
	// Animation
	'live-data',
	'animation'
]

export const EXAMPLES = ORDER.map((id) => {
	const definition = modules[`./${id}.js`]
	if (!definition) throw new Error(`Example "${id}" is listed in ORDER but src/examples/${id}.js does not exist`)
	return { ...definition, file: `src/examples/${id}.js`, source: sources[`./${id}.js`] ?? '' }
})

export const CATEGORIES = [...new Set(EXAMPLES.map((example) => example.category))]

/** Ids of example files that exist on disk but are missing from ORDER (checked by the tests). */
export const UNLISTED = Object.keys(modules)
	.map((path) => path.slice(2, -3))
	.filter((id) => !ORDER.includes(id))

export function findExample(id) {
	return EXAMPLES.find((example) => example.id === id)
}
