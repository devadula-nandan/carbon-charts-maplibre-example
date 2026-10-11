import { feature } from 'topojson-client'
import topology from 'world-atlas/countries-110m.json'
import { seededRandom } from './geo.js'

/**
 * Natural Earth 1:110m countries (via the `world-atlas` package), bundled so the
 * choropleth examples work without a second network dependency.
 *
 * Natural Earth has no statistics, so each country gets a deterministic sample
 * `value` between 0 and 100. Replace it with your own measure.
 */
function build() {
	const random = seededRandom(20240611)
	const collection = feature(topology, topology.objects.countries)
	return {
		type: 'FeatureCollection',
		features: collection.features
			.filter((country) => country.properties?.name !== 'Antarctica')
			.map((country, index) => ({
				type: 'Feature',
				// A numeric id is required for `setFeatureState`.
				id: index,
				properties: { name: country.properties?.name ?? 'Unknown', value: Math.round(random() * 100) },
				geometry: country.geometry
			}))
	}
}

let cache
export function countriesGeoJson() {
	cache ??= build()
	return cache
}
