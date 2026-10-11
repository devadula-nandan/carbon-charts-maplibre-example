import { CITIES, cityByName } from '../data/cities.js'
import { boundsOf } from '../data/geo.js'
import { docs } from '../lib/docs.js'

const TOUR = ['New York', 'London', 'Cairo', 'Mumbai', 'Tokyo', 'Sydney', 'São Paulo']

export default {
	id: 'camera',
	title: 'Camera',
	category: 'Interaction',
	summary: 'Move the camera with jumpTo, easeTo, flyTo and fitBounds; read it back on every frame.',
	description: [
		'The camera is described by center, zoom, bearing, pitch and padding. jumpTo() changes it instantly, easeTo() interpolates linearly, and flyTo() follows a zoom-out-and-in curve suited to long distances. fitBounds() computes the camera that frames a bounding box.',
		'Animated moves are skipped automatically for users who prefer reduced motion unless you pass essential: true. The readouts are updated from the "move" event, which fires for user gestures and programmatic moves alike.'
	],
	apis: [
		docs.map('flyTo'),
		docs.map('easeTo'),
		docs.map('jumpTo'),
		docs.map('fitBounds'),
		docs.map('setPadding'),
		docs.event('move'),
		docs.type('CameraOptions')
	],
	view: { center: [-74.006, 40.7128], zoom: 10, maxPitch: 80 },

	setup({ map, controls, onStyle }) {
		let stop = 0
		let destination = TOUR[1]

		onStyle(({ colors }) => {
			map.addSource('tour', {
				type: 'geojson',
				data: {
					type: 'FeatureCollection',
					features: TOUR.map((name) => ({
						type: 'Feature',
						properties: { name },
						geometry: { type: 'Point', coordinates: cityByName(name).coordinates }
					}))
				}
			})
			map.addLayer({
				id: 'tour',
				type: 'circle',
				source: 'tour',
				paint: {
					'circle-radius': 6,
					'circle-color': colors.primary,
					'circle-stroke-color': colors.symbolStroke,
					'circle-stroke-width': 1.5
				}
			})
		})

		controls.select('Destination', CITIES.map((city) => city.name).sort(), destination, (next) => (destination = next))
		controls.buttons([
			['flyTo', () => map.flyTo({ center: cityByName(destination).coordinates, zoom: 10, speed: 1.2, curve: 1.6 })],
			['easeTo', () => map.easeTo({ center: cityByName(destination).coordinates, zoom: 10, duration: 2500 }), 'tertiary'],
			['jumpTo', () => map.jumpTo({ center: cityByName(destination).coordinates, zoom: 10 }), 'tertiary']
		])
		controls.buttons([
			[
				'Next tour stop',
				() => {
					stop = (stop + 1) % TOUR.length
					map.flyTo({ center: cityByName(TOUR[stop]).coordinates, zoom: 10.5, pitch: 45, bearing: stop * 40 })
				},
				'tertiary'
			],
			[
				'Fit all tour stops',
				() => map.fitBounds(boundsOf(TOUR.map((name) => cityByName(name).coordinates)), { padding: 48, pitch: 0, bearing: 0 }),
				'tertiary'
			]
		])

		const pitch = controls.slider('Pitch', { min: 0, max: 80, step: 1, value: 0, format: (v) => `${Math.round(v)}°` }, (value) => map.setPitch(value))
		const bearing = controls.slider('Bearing', { min: -180, max: 180, step: 1, value: 0, format: (v) => `${Math.round(v)}°` }, (value) =>
			map.setBearing(value)
		)
		controls.toggle('Reserve 200 px on the left (padding)', false, (value) =>
			map.easeTo({ padding: { left: value ? 200 : 0 }, duration: 600 })
		)

		const center = controls.readout('Center')
		const zoom = controls.readout('Zoom')
		const update = () => {
			const { lng, lat } = map.getCenter()
			center(`${lng.toFixed(4)}, ${lat.toFixed(4)}`)
			zoom(map.getZoom().toFixed(2))
			pitch.set(map.getPitch())
			bearing.set(map.getBearing())
		}
		map.on('move', update)
		update()
	}
}
