import { citiesGeoJson } from '../data/cities.js'
import { h } from '../lib/dom.js'
import { docs } from '../lib/docs.js'

const ATTRIBUTION = '© OpenFreeMap  © OpenMapTiles  © OpenStreetMap contributors'

export default {
	id: 'export',
	title: 'Export as image',
	category: 'Interaction',
	summary: 'Capture the WebGL canvas to a PNG, with the required attribution burned in.',
	description: [
		'A WebGL canvas is cleared after each frame is presented, so reading it at an arbitrary time returns a blank image. The reliable way — without paying for preserveDrawingBuffer — is to request a repaint and copy the canvas synchronously inside the "render" event, while the frame is still in the drawing buffer.',
		'HTML overlays (controls, markers, attribution) are not part of the canvas. The capture is therefore composited onto a 2D canvas where the attribution text is drawn back in before the PNG is encoded.'
	],
	apis: [
		docs.map('getCanvas'),
		docs.map('triggerRepaint'),
		docs.event('render'),
		docs.map('once'),
		docs.type('MapOptions')
	],
	view: { center: [12, 47], zoom: 3.4 },

	setup(ctx) {
		const { map, controls, onStyle, notify } = ctx

		onStyle(({ colors }) => {
			map.addSource('cities', { type: 'geojson', data: citiesGeoJson() })
			map.addLayer({
				id: 'cities',
				type: 'circle',
				source: 'cities',
				paint: {
					'circle-radius': ['interpolate', ['linear'], ['get', 'population'], 1, 4, 35, 18],
					'circle-color': colors.primary,
					'circle-opacity': 0.75,
					'circle-stroke-color': colors.symbolStroke,
					'circle-stroke-width': 1
				}
			})
		})

		/** Resolve with a 2D canvas holding the next rendered frame plus attribution. */
		const capture = () =>
			new Promise((resolve) => {
				map.once('render', () => {
					const source = map.getCanvas()
					const output = document.createElement('canvas')
					output.width = source.width
					output.height = source.height
					const context = output.getContext('2d')
					context.drawImage(source, 0, 0)

					const ratio = source.width / source.clientWidth
					const { background, text } = ctx.colors
					context.font = `${11 * ratio}px "IBM Plex Sans", sans-serif`
					const width = context.measureText(ATTRIBUTION).width + 16 * ratio
					context.globalAlpha = 0.8
					context.fillStyle = background
					context.fillRect(output.width - width, output.height - 22 * ratio, width, 22 * ratio)
					context.globalAlpha = 1
					context.fillStyle = text
					context.textBaseline = 'middle'
					context.fillText(ATTRIBUTION, output.width - width + 8 * ratio, output.height - 11 * ratio)
					resolve(output)
				})
				map.triggerRepaint()
			})

		const preview = h('img', { class: 'export-preview', alt: 'Preview of the exported map', hidden: true })
		const size = controls.readout('Last export')

		controls.buttons([
			[
				'Download PNG',
				async () => {
					const canvas = await capture()
					canvas.toBlob((blob) => {
						if (!blob) return notify.show('The image could not be encoded.')
						const url = URL.createObjectURL(blob)
						h('a', { href: url, download: `carbon-map-${ctx.theme}.png` }).click()
						// Give the browser a moment to start the download before releasing the blob.
						setTimeout(() => URL.revokeObjectURL(url), 10_000)
						size(`${canvas.width} × ${canvas.height} px · ${(blob.size / 1024).toFixed(0)} kB`)
					}, 'image/png')
				}
			],
			[
				'Preview',
				async () => {
					const canvas = await capture()
					preview.src = canvas.toDataURL('image/png')
					preview.hidden = false
					size(`${canvas.width} × ${canvas.height} px`)
				},
				'tertiary'
			]
		])
		controls.note('Output resolution follows the device pixel ratio.')
		// The preview lives in the controls panel, below the buttons.
		controls.custom(preview)
	}
}
