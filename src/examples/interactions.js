import { docs } from '../lib/docs.js'

const HANDLERS = [
	['scrollZoom', 'Scroll to zoom'],
	['dragPan', 'Drag to pan'],
	['dragRotate', 'Right-drag to rotate and pitch'],
	['boxZoom', 'Shift-drag box zoom'],
	['doubleClickZoom', 'Double-click to zoom'],
	['keyboard', 'Keyboard navigation'],
	['touchZoomRotate', 'Pinch to zoom and rotate'],
	['touchPitch', 'Two-finger pitch']
]
const BOUNDS = [
	[-10.8, 49.5],
	[2.2, 59.5]
]
const EVENTS = ['click', 'dblclick', 'contextmenu', 'dragend', 'zoomend', 'rotateend', 'pitchend', 'boxzoomend']

export default {
	id: 'interactions',
	title: 'Gestures and events',
	category: 'Interaction',
	summary: 'Enable or disable each gesture handler, constrain the camera and watch the event stream.',
	description: [
		'Every gesture is a handler object on the map — map.scrollZoom, map.dragPan, map.keyboard and so on — with enable() and disable(). Cooperative gestures require Ctrl/⌘ + scroll (or two fingers on touch) so an embedded map does not hijack page scrolling.',
		'setMaxBounds() and setMinZoom()/setMaxZoom() keep users inside your area of interest. The log lists user-facing events with their coordinates; "originalEvent" is only present when a person, not code, caused the move.'
	],
	apis: [
		docs.cls('ScrollZoomHandler'),
		docs.cls('DragPanHandler'),
		docs.cls('KeyboardHandler'),
		docs.cls('CooperativeGesturesHandler'),
		docs.map('setMaxBounds'),
		docs.map('setMinZoom'),
		docs.type('MapEventType')
	],
	view: { center: [-3.2, 54.6], zoom: 4.6 },

	setup({ map, controls, onStyle }) {
		const log = controls.log('Events', 8)

		for (const type of EVENTS) {
			map.on(type, (event) => {
				const where = event.lngLat ? ` at ${event.lngLat.lng.toFixed(3)}, ${event.lngLat.lat.toFixed(3)}` : ''
				const who = event.originalEvent ? 'user' : 'code'
				log(`${type}${where} (${who})`)
			})
		}

		// Outline of the max-bounds box, so the constraint is visible.
		onStyle(({ colors }) => {
			const [[west, south], [east, north]] = BOUNDS
			map.addSource('bounds', {
				type: 'geojson',
				data: {
					type: 'Feature',
					properties: {},
					geometry: { type: 'LineString', coordinates: [[west, south], [east, south], [east, north], [west, north], [west, south]] }
				}
			})
			map.addLayer({
				id: 'bounds',
				type: 'line',
				source: 'bounds',
				paint: { 'line-color': colors.categorical[3], 'line-width': 2, 'line-dasharray': [3, 2] }
			})
		})

		controls.toggle('Cooperative gestures', false, (value) => {
			if (value) map.cooperativeGestures.enable()
			else map.cooperativeGestures.disable()
		})
		controls.toggle('Restrict panning to the dashed box', false, (value) => map.setMaxBounds(value ? BOUNDS : null))
		controls.slider('Minimum zoom', { min: 0, max: 8, step: 0.5, value: 0, format: (v) => v.toFixed(1) }, (value) => map.setMinZoom(value))

		for (const [handler, label] of HANDLERS) {
			controls.toggle(label, map[handler].isEnabled(), (value) => {
				if (value) map[handler].enable()
				else map[handler].disable()
			})
		}
	}
}
