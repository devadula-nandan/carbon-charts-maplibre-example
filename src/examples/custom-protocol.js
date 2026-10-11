import maplibregl from 'maplibre-gl'
import { docs } from '../lib/docs.js'
import { PALETTES } from '../theme/palettes.js'
import { FIRST_LABEL_LAYER } from '../theme/style.js'

const PROTOCOL = 'carbon-grid'
const TILE = 256

/** Render one debug tile to PNG bytes: a border plus its z/x/y address. */
async function renderTile(theme, z, x, y) {
	const colors = PALETTES[theme] ?? PALETTES.g100
	const canvas = document.createElement('canvas')
	canvas.width = canvas.height = TILE
	const context = canvas.getContext('2d')

	// Checkerboard tint so neighbouring tiles are distinguishable.
	context.fillStyle = colors.primary
	context.globalAlpha = (x + y) % 2 === 0 ? 0.1 : 0.03
	context.fillRect(0, 0, TILE, TILE)
	context.globalAlpha = 1
	context.strokeStyle = colors.primary
	context.lineWidth = 2
	context.strokeRect(0, 0, TILE, TILE)

	context.fillStyle = colors.text
	context.font = '600 16px "IBM Plex Mono", ui-monospace, monospace'
	context.textAlign = 'center'
	context.textBaseline = 'middle'
	context.fillText(`${z} / ${x} / ${y}`, TILE / 2, TILE / 2)

	const blob = await new Promise((resolve, reject) =>
		canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Tile could not be encoded'))), 'image/png')
	)
	return blob.arrayBuffer()
}

export default {
	id: 'custom-protocol',
	title: 'Custom protocol',
	category: 'Sources',
	summary: 'Serve tiles from JavaScript with addProtocol — no server and no network.',
	description: [
		'addProtocol() registers a handler for a URL scheme. Whenever a source requests carbon-grid://…, MapLibre calls the handler instead of the network and uses the bytes it resolves with. The same hook powers PMTiles archives, offline caches and on-the-fly tile generation.',
		'Here each tile is painted on a canvas in the active theme’s colors and returned as a PNG. The tile address in the middle makes the XYZ tiling scheme visible as you zoom.'
	],
	apis: [docs.fn('addProtocol'), docs.fn('removeProtocol'), docs.source('raster'), docs.layer('raster'), docs.type('AddProtocolAction')],
	view: { center: [10, 30], zoom: 2.4 },

	setup({ map, controls, onStyle, onCleanup }) {
		let requests = 0
		const served = controls.readout('Tiles generated', '0')

		maplibregl.addProtocol(PROTOCOL, async (params) => {
			// params.url looks like "carbon-grid://g100/3/4/2"
			const [theme, z, x, y] = params.url.slice(`${PROTOCOL}://`.length).split('/')
			const data = await renderTile(theme, Number(z), Number(x), Number(y))
			served(String(++requests))
			return { data }
		})
		onCleanup(() => maplibregl.removeProtocol(PROTOCOL))

		onStyle(({ theme }) => {
			map.addSource('grid', {
				type: 'raster',
				// The theme is part of the URL, so a theme change requests freshly colored tiles.
				tiles: [`${PROTOCOL}://${theme}/{z}/{x}/{y}`],
				tileSize: TILE,
				maxzoom: 22
			})
			map.addLayer({ id: 'grid', type: 'raster', source: 'grid', paint: { 'raster-fade-duration': 0 } }, FIRST_LABEL_LAYER)
		})

		controls.slider('Grid opacity', { min: 0, max: 1, step: 0.05, value: 1, format: (v) => `${Math.round(v * 100)}%` }, (value) => {
			if (map.getLayer('grid')) map.setPaintProperty('grid', 'raster-opacity', value)
		})
		controls.toggle('Show MapLibre tile boundaries', false, (value) => (map.showTileBoundaries = value))
		controls.note('MapLibre’s own debug overlay shows the 512 px vector tiles; the generated raster grid uses 256 px tiles, one zoom level deeper.')
	}
}
