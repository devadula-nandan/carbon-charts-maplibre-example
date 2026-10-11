import { CITIES, cityByName, citiesGeoJson } from '../data/cities.js'
import { greatCircle, haversine } from '../data/geo.js'
import { docs } from '../lib/docs.js'

const HUBS = ['London', 'New York', 'Singapore', 'Dubai', 'São Paulo']

function routesFrom(hubName) {
	const hub = cityByName(hubName)
	return {
		type: 'FeatureCollection',
		features: CITIES.filter((city) => city !== hub).map((city) => ({
			type: 'Feature',
			properties: {
				to: city.name,
				// Sample "volume": bigger and closer cities exchange more.
				volume: Math.round((city.population * hub.population) / Math.sqrt(haversine(hub.coordinates, city.coordinates)))
			},
			geometry: { type: 'LineString', coordinates: greatCircle(hub.coordinates, city.coordinates) }
		}))
	}
}

export default {
	id: 'connections',
	title: 'Connections',
	category: 'Spatial charts',
	summary: 'Draw origin–destination arcs with a line layer, data-driven width and a gradient.',
	description: [
		'Connection maps link places with great-circle arcs. Width encodes volume, and line-gradient fades each arc from origin to destination to show direction. Gradients need lineMetrics: true on the GeoJSON source so MapLibre can compute ["line-progress"].',
		'Arc longitudes are left unwrapped across the antimeridian, so routes over the Pacific take the short way. Switch to a dashed style to see line-dasharray instead.'
	],
	apis: [
		docs.layer('line'),
		docs.spec('line-gradient', 'layers/#line-gradient'),
		docs.expression('line-progress'),
		docs.spec('line-dasharray', 'layers/#line-dasharray'),
		docs.cls('GeoJSONSource', 'setData')
	],
	view: { center: [20, 25], zoom: 1.6 },

	setup(ctx) {
		const { map, controls, onStyle } = ctx
		let hub = HUBS[0]
		let style = 'gradient'

		const applyLineStyle = () => {
			const color = ctx.colors.categorical[1]
			// A property cannot be removed with `null` while another depends on it, so set both explicitly.
			map.setPaintProperty(
				'routes',
				'line-gradient',
				style === 'gradient' ? ['interpolate', ['linear'], ['line-progress'], 0, 'rgba(0, 0, 0, 0)', 0.15, color, 1, color] : undefined
			)
			map.setPaintProperty('routes', 'line-dasharray', style === 'dashed' ? [2, 2] : undefined)
		}

		onStyle(({ colors }) => {
			map.addSource('routes', { type: 'geojson', data: routesFrom(hub), lineMetrics: true })
			map.addSource('cities', { type: 'geojson', data: citiesGeoJson() })

			map.addLayer({
				id: 'routes',
				type: 'line',
				source: 'routes',
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: {
					'line-color': colors.categorical[1],
					'line-opacity': 0.85,
					'line-width': ['interpolate', ['linear'], ['get', 'volume'], 0, 0.5, 15, 4]
				}
			})
			map.addLayer({
				id: 'cities',
				type: 'circle',
				source: 'cities',
				paint: {
					'circle-radius': ['case', ['==', ['get', 'name'], hub], 7, 3],
					'circle-color': ['case', ['==', ['get', 'name'], hub], colors.categorical[3], colors.categorical[1]],
					'circle-stroke-color': colors.symbolStroke,
					'circle-stroke-width': 1
				}
			})
			applyLineStyle()
		})

		controls.select('Origin', HUBS, hub, (next) => {
			hub = next
			map.getSource('routes')?.setData(routesFrom(hub))
			if (!map.getLayer('cities')) return
			map.setPaintProperty('cities', 'circle-radius', ['case', ['==', ['get', 'name'], hub], 7, 3])
			map.setPaintProperty('cities', 'circle-color', [
				'case',
				['==', ['get', 'name'], hub],
				ctx.colors.categorical[3],
				ctx.colors.categorical[1]
			])
			map.flyTo({ center: cityByName(hub).coordinates, zoom: 1.8 })
		})
		controls.select(
			'Line style',
			[
				['gradient', 'Gradient (direction)'],
				['solid', 'Solid'],
				['dashed', 'Dashed']
			],
			style,
			(next) => {
				style = next
				if (map.getLayer('routes')) applyLineStyle()
			}
		)
	}
}
