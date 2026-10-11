import { CITIES } from './cities.js'
import { seededRandom } from './geo.js'

export const CATEGORIES = ['Sensor', 'Outage', 'Maintenance', 'Alert']

/** Standard normal sample (Box–Muller). */
function gaussian(random) {
	const u = Math.max(random(), 1e-9)
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random())
}

/**
 * Deterministic sample events scattered around the sample cities: more events around
 * larger cities, each with a `category` and a `magnitude` from 1 to 10.
 */
export function eventsGeoJson({ perMillion = 6, spread = 1.6, seed = 7 } = {}) {
	const random = seededRandom(seed)
	const features = []
	for (const city of CITIES) {
		const count = Math.round(city.population * perMillion)
		for (let i = 0; i < count; i++) {
			const lng = city.coordinates[0] + gaussian(random) * spread
			const lat = Math.max(-80, Math.min(80, city.coordinates[1] + gaussian(random) * spread * 0.7))
			features.push({
				type: 'Feature',
				id: features.length,
				properties: {
					city: city.name,
					category: CATEGORIES[Math.floor(random() * CATEGORIES.length)],
					magnitude: Math.round((1 + random() ** 2 * 9) * 10) / 10
				},
				geometry: { type: 'Point', coordinates: [lng, lat] }
			})
		}
	}
	return { type: 'FeatureCollection', features }
}
