import { REGIONS, citiesGeoJson } from '../data/cities.js'
import { docs } from '../lib/docs.js'

const SIZE = 22
const SHAPES = ['circle', 'square', 'diamond', 'triangle', 'pentagon']

/** Draw a marker icon: a distinct shape per region, so the encoding does not rely on color alone. */
function drawIcon(shape, fill, stroke) {
	const ratio = 2
	const canvas = document.createElement('canvas')
	canvas.width = canvas.height = SIZE * ratio
	const context = canvas.getContext('2d')
	context.scale(ratio, ratio)
	const c = SIZE / 2
	const r = SIZE / 2 - 2.5

	context.beginPath()
	if (shape === 'circle') context.arc(c, c, r, 0, Math.PI * 2)
	else if (shape === 'square') context.rect(c - r * 0.85, c - r * 0.85, r * 1.7, r * 1.7)
	else {
		const sides = { diamond: 4, triangle: 3, pentagon: 5 }[shape]
		for (let i = 0; i < sides; i++) {
			const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides
			context.lineTo(c + Math.cos(angle) * r * 1.1, c + Math.sin(angle) * r * 1.1)
		}
		context.closePath()
	}
	context.fillStyle = fill
	context.fill()
	context.lineWidth = 1.5
	context.strokeStyle = stroke
	context.stroke()
	return context.getImageData(0, 0, canvas.width, canvas.height)
}

export default {
	id: 'symbols',
	title: 'Icons and labels',
	category: 'Spatial charts',
	summary: 'Place icons with formatted labels using a symbol layer and on-demand images.',
	description: [
		'Symbol layers draw icons and text with automatic collision detection. Icons here are not in a sprite sheet: the layer asks for "icon-<region>", MapLibre fires "styleimagemissing", and the handler draws the icon on a canvas and registers it with addImage(). Each region gets its own shape as well as its own categorical color.',
		'Labels use the "format" expression for two text sizes in one label. symbol-sort-key gives larger cities priority when labels collide; toggle "Allow overlap" to turn collision detection off.'
	],
	apis: [
		docs.layer('symbol'),
		docs.event('styleimagemissing'),
		docs.map('addImage'),
		docs.expression('format'),
		docs.spec('symbol-sort-key', 'layers/#symbol-sort-key'),
		docs.map('setLayoutProperty')
	],
	view: { center: [60, 25], zoom: 2.2 },

	setup(ctx) {
		const { map, controls, onStyle } = ctx
		const iconFor = (region) => `icon-${region}`

		map.on('styleimagemissing', (event) => {
			const index = REGIONS.findIndex((region) => iconFor(region) === event.id)
			if (index === -1 || map.hasImage(event.id)) return
			const { categorical, symbolStroke } = ctx.colors
			map.addImage(event.id, drawIcon(SHAPES[index], categorical[index], symbolStroke), { pixelRatio: 2 })
		})

		const legend = controls.legend('Region')
		onStyle(({ colors }) => {
			map.addSource('cities', { type: 'geojson', data: citiesGeoJson() })
			map.addLayer({
				id: 'city-icons',
				type: 'symbol',
				source: 'cities',
				layout: {
					'icon-image': ['concat', 'icon-', ['get', 'region']],
					'icon-size': 1,
					'icon-allow-overlap': true,
					'text-field': [
						'format',
						['get', 'name'],
						{},
						'\n',
						{},
						['concat', ['to-string', ['get', 'population']], ' M'],
						{ 'font-scale': 0.8 }
					],
					'text-font': ['Noto Sans Bold'],
					'text-size': 12,
					'text-anchor': 'top',
					'text-offset': [0, 0.9],
					// The icon stays even when its label loses a collision.
					'text-optional': true,
					'symbol-sort-key': ['-', ['get', 'population']]
				},
				paint: {
					'text-color': colors.text,
					'text-halo-color': colors.halo,
					'text-halo-width': 1.5
				}
			})
			// Basemap city labels would duplicate ours.
			map.setLayoutProperty('place-city', 'visibility', 'none')

			legend.update(REGIONS.map((region, index) => ({ color: colors.categorical[index], label: `${region} — ${SHAPES[index]}`, shape: 'circle' })))
		})

		const setLayout = (property, value) => {
			if (map.getLayer('city-icons')) map.setLayoutProperty('city-icons', property, value)
		}
		controls.toggle('Allow label overlap', false, (value) => setLayout('text-allow-overlap', value))
		controls.toggle('Show labels', true, (value) =>
			setLayout('text-field', value ? ['format', ['get', 'name'], {}, '\n', {}, ['concat', ['to-string', ['get', 'population']], ' M'], { 'font-scale': 0.8 }] : '')
		)
		controls.slider('Icon size', { min: 0.6, max: 2, step: 0.1, value: 1, format: (v) => `${v.toFixed(1)}×` }, (value) => {
			setLayout('icon-size', value)
			setLayout('text-offset', [0, 0.9 * value])
		})
	}
}
