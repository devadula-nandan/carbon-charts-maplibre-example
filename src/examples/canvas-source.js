import { docs } from '../lib/docs.js'
import { FIRST_LABEL_LAYER } from '../theme/style.js'

const SIZE = 512
// Corners of the georeferenced canvas: top-left, top-right, bottom-right, bottom-left.
const RADAR_CORNERS = [
	[-1.2, 52.15],
	[0.95, 52.15],
	[0.95, 50.85],
	[-1.2, 50.85]
]
const IMAGE_CORNERS = [
	[1.5, 51.6],
	[3.2, 51.6],
	[3.2, 50.9],
	[1.5, 50.9]
]

function drawRadar(context, seconds, colors) {
	const c = SIZE / 2
	const angle = (seconds * 1.2) % (Math.PI * 2)
	context.clearRect(0, 0, SIZE, SIZE)

	context.strokeStyle = colors.primary
	context.lineWidth = 2
	for (const radius of [0.3, 0.6, 0.9]) {
		context.globalAlpha = 0.5
		context.beginPath()
		context.arc(c, c, c * radius, 0, Math.PI * 2)
		context.stroke()
	}

	// Trailing sweep: a fan of wedges with falling opacity.
	context.fillStyle = colors.primary
	for (let i = 0; i < 40; i++) {
		context.globalAlpha = 0.35 * (1 - i / 40)
		context.beginPath()
		context.moveTo(c, c)
		context.arc(c, c, c * 0.9, angle - (i + 1) * 0.03, angle - i * 0.03)
		context.closePath()
		context.fill()
	}
	context.globalAlpha = 1
}

/** A static, generated picture: stands in for a floor plan, scan or weather still. */
function hatchImage(colors) {
	const canvas = document.createElement('canvas')
	canvas.width = 340
	canvas.height = 140
	const context = canvas.getContext('2d')
	context.fillStyle = colors.categorical[3]
	context.globalAlpha = 0.25
	context.fillRect(0, 0, canvas.width, canvas.height)
	context.globalAlpha = 1
	context.strokeStyle = colors.categorical[3]
	context.lineWidth = 3
	context.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3)
	context.lineWidth = 1
	for (let x = -canvas.height; x < canvas.width; x += 14) {
		context.beginPath()
		context.moveTo(x, canvas.height)
		context.lineTo(x + canvas.height, 0)
		context.stroke()
	}
	context.fillStyle = colors.text
	context.font = '600 20px "IBM Plex Sans", sans-serif'
	context.fillText('image source', 16, 34)
	return canvas.toDataURL('image/png')
}

export default {
	id: 'canvas-source',
	title: 'Canvas and image sources',
	category: 'Sources',
	summary: 'Georeference an animated canvas and a static image onto the map.',
	description: [
		'Canvas and image sources stretch a picture between four geographic corners; a raster layer draws it, so it pitches, rotates and reprojects with the map. A canvas source with animate: true is re-read every frame — ideal for radar loops, simulations or video-like overlays drawn with the 2D canvas API.',
		'The radar sweep is drawn on an offscreen canvas in the theme’s primary color; pause() and play() stop and resume the per-frame copy. The hatched rectangle is an image source created from a data URL; "Move image" calls setCoordinates().'
	],
	apis: [
		docs.source('canvas'),
		docs.source('image'),
		docs.cls('CanvasSource', 'play'),
		docs.cls('CanvasSource', 'pause'),
		docs.cls('ImageSource', 'setCoordinates'),
		docs.layer('raster')
	],
	view: { center: [0.9, 51.45], zoom: 7.1 },

	setup(ctx) {
		const { map, controls, onStyle, animate, reducedMotion } = ctx
		const canvas = document.createElement('canvas')
		canvas.width = canvas.height = SIZE
		const context = canvas.getContext('2d')
		let playing = !reducedMotion
		let shifted = false

		drawRadar(context, 0.6, ctx.colors)
		animate((seconds) => {
			if (playing) drawRadar(context, seconds, ctx.colors)
		})

		onStyle(({ colors }) => {
			shifted = false
			drawRadar(context, performance.now() / 1000, colors)
			map.addSource('radar', { type: 'canvas', canvas, coordinates: RADAR_CORNERS, animate: playing })
			map.addSource('plan', { type: 'image', url: hatchImage(colors), coordinates: IMAGE_CORNERS })
			map.addLayer({ id: 'plan', type: 'raster', source: 'plan', paint: { 'raster-fade-duration': 0 } }, FIRST_LABEL_LAYER)
			map.addLayer({ id: 'radar', type: 'raster', source: 'radar', paint: { 'raster-fade-duration': 0 } }, FIRST_LABEL_LAYER)
		})

		controls.toggle('Animate radar', playing, (value) => {
			playing = value
			const source = map.getSource('radar')
			if (!source) return
			if (value) source.play()
			else source.pause()
		})
		controls.buttons([
			[
				'Move image',
				() => {
					shifted = !shifted
					const dy = shifted ? -0.9 : 0
					map.getSource('plan')?.setCoordinates(IMAGE_CORNERS.map(([lng, lat]) => [lng, lat + dy]))
				},
				'tertiary'
			],
			['Tilt the map', () => map.easeTo({ pitch: map.getPitch() > 10 ? 0 : 55, bearing: map.getPitch() > 10 ? 0 : -25 }), 'tertiary']
		])
	}
}
