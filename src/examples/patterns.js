import { countriesGeoJson } from '../data/countries.js'
import { docs } from '../lib/docs.js'

const SIZE = 16
const CLASSES = [
	{ id: 'pattern-dots', label: '0 – 25', max: 25 },
	{ id: 'pattern-lines', label: '25 – 50', max: 50 },
	{ id: 'pattern-cross', label: '50 – 75', max: 75 },
	{ id: 'pattern-solid', label: '75 – 100', max: 100 }
]

/** Draw one repeating pattern tile and return it as ImageData for `map.addImage`. */
function drawPattern(id, color) {
	const ratio = 2
	const canvas = document.createElement('canvas')
	canvas.width = canvas.height = SIZE * ratio
	const context = canvas.getContext('2d')
	context.scale(ratio, ratio)
	context.strokeStyle = context.fillStyle = color
	context.lineWidth = 1.5
	context.lineCap = 'square'

	if (id === 'pattern-dots') {
		for (const [x, y] of [[4, 4], [12, 12]]) {
			context.beginPath()
			context.arc(x, y, 1.4, 0, Math.PI * 2)
			context.fill()
		}
	} else if (id === 'pattern-solid') {
		context.globalAlpha = 0.85
		context.fillRect(0, 0, SIZE, SIZE)
	} else {
		// Diagonals drawn three times so the tile repeats seamlessly.
		const diagonals = id === 'pattern-cross' ? [1, -1] : [1]
		for (const direction of diagonals) {
			for (const offset of [-SIZE, 0, SIZE]) {
				context.beginPath()
				context.moveTo(offset, direction === 1 ? SIZE : 0)
				context.lineTo(offset + SIZE, direction === 1 ? 0 : SIZE)
				context.stroke()
			}
		}
	}
	return context.getImageData(0, 0, canvas.width, canvas.height)
}

export default {
	id: 'patterns',
	title: 'Fill patterns',
	category: 'Spatial charts',
	summary: 'Texture regions with fill-pattern images generated at runtime.',
	description: [
		'Color alone is not accessible to everyone. Textures give each class a second, non-color cue. Each pattern is a small tile drawn on a canvas, registered with addImage() and referenced from fill-pattern through a "step" expression.',
		'Images belong to the style, so they are registered again after a theme change, drawn in the new theme’s text color.'
	],
	apis: [
		docs.map('addImage'),
		docs.spec('fill-pattern', 'layers/#fill-pattern'),
		docs.expression('step'),
		docs.layer('fill'),
		docs.spec('Sprite and images', 'sprite/')
	],
	view: { center: [15, 25], zoom: 1.5, maxZoom: 6 },

	setup({ map, controls, onStyle }) {
		const legend = controls.legend('Sample index class')

		onStyle(({ colors }) => {
			for (const { id } of CLASSES) {
				map.addImage(id, drawPattern(id, id === 'pattern-solid' ? colors.primary : colors.textMuted), { pixelRatio: 2 })
			}

			map.addSource('countries', { type: 'geojson', data: countriesGeoJson() })
			map.addLayer(
				{
					id: 'countries-pattern',
					type: 'fill',
					source: 'countries',
					paint: {
						'fill-pattern': [
							'step',
							['get', 'value'],
							CLASSES[0].id,
							...CLASSES.slice(1).flatMap((entry, index) => [CLASSES[index].max, entry.id])
						]
					}
				},
				'water'
			)
			map.addLayer(
				{
					id: 'countries-outline',
					type: 'line',
					source: 'countries',
					paint: { 'line-color': colors.boundary, 'line-width': 0.6 }
				},
				'boundary'
			)
			map.setLayoutProperty('boundary', 'visibility', 'none')

			legend.update(
				CLASSES.map(({ id, label }) => ({
					label,
					color:
						id === 'pattern-solid'
							? colors.primary
							: `repeating-linear-gradient(45deg, ${colors.textMuted} 0 1.5px, transparent 1.5px 5px)`
				}))
			)
		})
		controls.note('Textures: dots, diagonal lines, cross-hatch and solid, in increasing order.')
	}
}
