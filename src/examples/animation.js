import { cityByName } from '../data/cities.js'
import { formatDistance, greatCircle, lineLength, sliceAlong } from '../data/geo.js'
import { docs } from '../lib/docs.js'

const STOPS = ['London', 'Istanbul', 'Dubai', 'Mumbai', 'Singapore', 'Sydney']
const DURATION = 16 // seconds for the whole journey

// One continuous line through every stop: each leg starts where the previous one ended.
const ROUTE = STOPS.slice(1).reduce(
	(line, name) => line.concat(greatCircle(line[line.length - 1], cityByName(name).coordinates, 48).slice(1)),
	[cityByName(STOPS[0]).coordinates]
)
const TOTAL_KM = lineLength(ROUTE)

/** Arrowhead icon pointing north; `icon-rotate` turns it to the direction of travel. */
function arrowIcon(fill, stroke) {
	const size = 48
	const canvas = document.createElement('canvas')
	canvas.width = canvas.height = size
	const context = canvas.getContext('2d')
	context.beginPath()
	context.moveTo(size / 2, 5)
	context.lineTo(size - 9, size - 8)
	context.lineTo(size / 2, size - 17)
	context.lineTo(9, size - 8)
	context.closePath()
	context.fillStyle = fill
	context.fill()
	context.lineWidth = 3
	context.strokeStyle = stroke
	context.stroke()
	return context.getImageData(0, 0, size, size)
}

export default {
	id: 'animation',
	title: 'Animated route',
	category: 'Animation',
	summary: 'Reveal a route over time, move an icon along it and optionally follow with the camera.',
	description: [
		'Animation in MapLibre is “change the data or the style inside requestAnimationFrame”. Each frame slices the route at the current progress, calls setData() with the travelled part and moves a symbol to the head of the line. icon-rotate reads the bearing from the feature so the arrow points along the path.',
		'Follow mode calls jumpTo() every frame — an instant move per frame is smoother than stacking eased animations. Scrubbing the progress slider shows that the animation is a pure function of time. It does not auto-play if you prefer reduced motion.'
	],
	apis: [
		docs.cls('GeoJSONSource', 'setData'),
		docs.spec('icon-rotate', 'layers/#icon-rotate'),
		docs.spec('icon-rotation-alignment', 'layers/#icon-rotation-alignment'),
		docs.map('jumpTo'),
		docs.map('addImage'),
		docs.layer('line')
	],
	view: { center: [70, 22], zoom: 2.1 },

	setup({ map, controls, onStyle, animate, reducedMotion }) {
		let progress = reducedMotion ? 1 : 0
		let playing = !reducedMotion
		let follow = false

		const feature = (geometry, properties = {}) => ({ type: 'Feature', properties, geometry })
		const frame = () => {
			const { coordinates, head, bearing } = sliceAlong(ROUTE, progress)
			return {
				travelled: feature({ type: 'LineString', coordinates }),
				head: feature({ type: 'Point', coordinates: head }, { bearing }),
				position: head
			}
		}

		const distance = controls.readout('Distance travelled')
		const slider = controls.slider(
			'Progress',
			{ min: 0, max: 1, step: 0.001, value: progress, format: (v) => `${Math.round(v * 100)}%` },
			(value) => {
				progress = value
				render()
			}
		)

		function render() {
			const current = frame()
			map.getSource('travelled')?.setData(current.travelled)
			map.getSource('head')?.setData(current.head)
			distance(`${formatDistance(TOTAL_KM * progress)} of ${formatDistance(TOTAL_KM)}`)
			if (follow) map.jumpTo({ center: current.position })
		}

		onStyle(({ colors }) => {
			const current = frame()
			map.addImage('arrow', arrowIcon(colors.categorical[3], colors.symbolStroke), { pixelRatio: 2 })
			map.addSource('route', { type: 'geojson', data: feature({ type: 'LineString', coordinates: ROUTE }) })
			map.addSource('travelled', { type: 'geojson', data: current.travelled })
			map.addSource('head', { type: 'geojson', data: current.head })
			map.addSource('stops', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: STOPS.map((name) => feature({ type: 'Point', coordinates: cityByName(name).coordinates }, { name }))
				}
			})

			map.addLayer({
				id: 'route',
				type: 'line',
				source: 'route',
				paint: { 'line-color': colors.textMuted, 'line-width': 1.5, 'line-dasharray': [1, 2] }
			})
			map.addLayer({
				id: 'travelled',
				type: 'line',
				source: 'travelled',
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: { 'line-color': colors.categorical[3], 'line-width': 3.5 }
			})
			map.addLayer({
				id: 'stops',
				type: 'circle',
				source: 'stops',
				paint: {
					'circle-radius': 4.5,
					'circle-color': colors.background,
					'circle-stroke-color': colors.categorical[3],
					'circle-stroke-width': 2
				}
			})
			map.addLayer({
				id: 'head',
				type: 'symbol',
				source: 'head',
				layout: {
					'icon-image': 'arrow',
					'icon-rotate': ['get', 'bearing'],
					// Rotate relative to the map, not the screen, so the arrow stays on course when the map turns.
					'icon-rotation-alignment': 'map',
					'icon-allow-overlap': true
				}
			})
			render()
		})

		animate((_, delta) => {
			if (!playing) return
			progress += delta / DURATION
			if (progress >= 1) {
				progress = 1
				playing = false
				play.set(false)
			}
			slider.set(progress)
			render()
		})

		const play = controls.toggle('Play', playing, (value) => {
			if (value && progress >= 1) progress = 0
			playing = value
		})
		controls.toggle('Camera follows', follow, (value) => {
			follow = value
			if (value) map.easeTo({ zoom: 4, center: frame().position, duration: 600 })
		})
		controls.buttons([
			[
				'Restart',
				() => {
					progress = 0
					playing = true
					play.set(true)
				},
				'tertiary'
			]
		])
	}
}
