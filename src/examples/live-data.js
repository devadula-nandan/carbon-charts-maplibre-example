import { seededRandom } from '../data/geo.js'
import { docs } from '../lib/docs.js'

const CENTER = [13.405, 52.52]
const COUNT = 60
const STATUSES = ['On time', 'Delayed', 'Stopped']

/** A tiny simulation: vehicles wander around a city and occasionally change status. */
function createFleet() {
	const random = seededRandom(42)
	return Array.from({ length: COUNT }, (_, id) => ({
		id,
		lng: CENTER[0] + (random() - 0.5) * 0.3,
		lat: CENTER[1] + (random() - 0.5) * 0.16,
		heading: random() * Math.PI * 2,
		speed: 0.002 + random() * 0.004,
		status: STATUSES[0],
		random
	}))
}

function step(vehicle, delta) {
	const { random } = vehicle
	if (random() < 0.004) vehicle.status = STATUSES[Math.floor(random() * STATUSES.length)]
	if (vehicle.status === 'Stopped') return
	const factor = vehicle.status === 'Delayed' ? 0.4 : 1
	vehicle.heading += (random() - 0.5) * 0.4
	vehicle.lng += Math.cos(vehicle.heading) * vehicle.speed * factor * delta
	vehicle.lat += Math.sin(vehicle.heading) * vehicle.speed * factor * delta * 0.6
	// Steer back towards the city when a vehicle strays too far.
	if (Math.abs(vehicle.lng - CENTER[0]) > 0.2 || Math.abs(vehicle.lat - CENTER[1]) > 0.11) {
		vehicle.heading = Math.atan2((CENTER[1] - vehicle.lat) / 0.6, CENTER[0] - vehicle.lng)
	}
}

const toFeature = (vehicle) => ({
	type: 'Feature',
	id: vehicle.id,
	properties: { status: vehicle.status },
	geometry: { type: 'Point', coordinates: [vehicle.lng, vehicle.lat] }
})

export default {
	id: 'live-data',
	title: 'Live data',
	category: 'Animation',
	summary: 'Stream position updates into a GeoJSON source with partial updates.',
	description: [
		'Real-time maps rarely need to resend everything. GeoJSONSource.updateData() takes a diff — features to add, remove or update by id — and patches the source in the worker. Here 60 simulated vehicles report a new position several times a second, and only geometry and status are sent.',
		'setData() replaces the whole collection instead; use it when most features change or when ids are not stable. Updates are throttled to the chosen rate rather than sent every animation frame.'
	],
	apis: [
		docs.cls('GeoJSONSource', 'updateData'),
		docs.cls('GeoJSONSource', 'setData'),
		docs.type('GeoJSONSourceDiff'),
		docs.source('geojson'),
		docs.expression('match')
	],
	view: { center: CENTER, zoom: 10.6 },

	setup({ map, controls, onStyle, animate, reducedMotion }) {
		const fleet = createFleet()
		let running = !reducedMotion
		let rate = 10
		let elapsed = 0
		let updates = 0
		const sent = controls.readout('Updates sent', '0')
		const counts = controls.readout('Fleet status')

		const legend = controls.legend('Status')
		onStyle(({ colors }) => {
			const statusColors = [colors.alert.low, colors.alert.medium, colors.alert.critical]
			map.addSource('fleet', {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: fleet.map(toFeature) }
			})
			map.addLayer({
				id: 'fleet',
				type: 'circle',
				source: 'fleet',
				paint: {
					'circle-radius': 6,
					'circle-color': ['match', ['get', 'status'], ...STATUSES.flatMap((status, i) => [status, statusColors[i]]), colors.textMuted],
					'circle-stroke-color': colors.symbolStroke,
					'circle-stroke-width': 1.5
				}
			})
			legend.update(STATUSES.map((status, index) => ({ color: statusColors[index], label: status, shape: 'circle' })))
		})

		const report = () =>
			counts(STATUSES.map((status) => `${fleet.filter((vehicle) => vehicle.status === status).length} ${status.toLowerCase()}`).join(' · '))
		report()

		animate((_, delta) => {
			if (!running) return
			elapsed += delta
			if (elapsed < 1 / rate) return

			for (const vehicle of fleet) step(vehicle, elapsed * 10)
			elapsed = 0

			// The source is briefly absent while a new theme's style is loading.
			map.getSource('fleet')?.updateData({
				update: fleet.map((vehicle) => ({
					id: vehicle.id,
					newGeometry: { type: 'Point', coordinates: [vehicle.lng, vehicle.lat] },
					addOrUpdateProperties: [{ key: 'status', value: vehicle.status }]
				}))
			})
			sent(String(++updates))
			if (updates % rate === 0) report()
		})

		controls.toggle('Stream updates', running, (value) => (running = value))
		controls.slider('Update rate', { min: 1, max: 30, step: 1, value: rate, format: (v) => `${v} / s` }, (value) => (rate = value))
		controls.buttons([
			[
				'Reset with setData',
				() => {
					fleet.splice(0, fleet.length, ...createFleet())
					map.getSource('fleet')?.setData({ type: 'FeatureCollection', features: fleet.map(toFeature) })
					report()
				},
				'tertiary'
			]
		])
	}
}
