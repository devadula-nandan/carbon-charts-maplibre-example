import { CITIES, citiesGeoJson } from '../data/cities.js'
import { greatCircle } from '../data/geo.js'
import { docs } from '../lib/docs.js'

const HUB = CITIES.find((city) => city.name === 'Singapore')

export default {
	id: 'globe',
	title: 'Globe projection',
	category: 'Basemap',
	summary: 'Switch between Web Mercator and the globe, with an optional atmosphere.',
	description: [
		'MapLibre GL JS 5 can draw the same style on a globe. setProjection({ type: "globe" }) switches at runtime and transitions back to Mercator as you zoom in. setSky() adds the atmosphere halo; here it is tinted with the theme’s colors.',
		'Projection and sky belong to the style, so they are re-applied after every theme change. The arcs are plain GeoJSON lines: on the globe they follow the true great-circle path.'
	],
	apis: [docs.map('setProjection'), docs.map('setSky'), docs.spec('Projection', 'projection/'), docs.spec('Sky', 'sky/'), docs.map('setCenter')],
	view: { center: [80, 22], zoom: 1.7 },

	setup(ctx) {
		const { map, controls, onStyle, animate, reducedMotion } = ctx
		let globe = true
		let atmosphere = true
		let spinning = !reducedMotion
		let interacting = false

		const applyProjection = () => map.setProjection({ type: globe ? 'globe' : 'mercator' })
		const applySky = () => {
			const colors = ctx.colors
			map.setSky({
				'sky-color': colors.background,
				// A strong blend washes the planet in the horizon color, so keep the halo subtle and neutral.
				'horizon-color': colors.dark ? colors.roadMinor : colors.background,
				'fog-color': colors.background,
				'atmosphere-blend': atmosphere ? ['interpolate', ['linear'], ['zoom'], 0, 0.35, 5, 0.15, 7, 0] : 0
			})
		}

		const routes = {
			type: 'FeatureCollection',
			features: CITIES.filter((city) => city !== HUB && city.population > 12).map((city) => ({
				type: 'Feature',
				properties: { name: city.name },
				geometry: { type: 'LineString', coordinates: greatCircle(HUB.coordinates, city.coordinates) }
			}))
		}

		onStyle(({ colors }) => {
			applyProjection()
			applySky()

			map.addSource('routes', { type: 'geojson', data: routes })
			map.addSource('cities', { type: 'geojson', data: citiesGeoJson() })
			map.addLayer({
				id: 'routes',
				type: 'line',
				source: 'routes',
				layout: { 'line-cap': 'round' },
				paint: { 'line-color': colors.categorical[1], 'line-width': 1.5, 'line-opacity': 0.8 }
			})
			map.addLayer({
				id: 'cities',
				type: 'circle',
				source: 'cities',
				paint: {
					'circle-radius': ['interpolate', ['linear'], ['get', 'population'], 1, 2, 40, 9],
					'circle-color': colors.primary,
					'circle-stroke-color': colors.symbolStroke,
					'circle-stroke-width': 1
				}
			})
		})

		// Pause the rotation while the user is dragging or zooming.
		map.on('mousedown', () => (interacting = true))
		map.on('touchstart', () => (interacting = true))
		map.on('mouseup', () => (interacting = false))
		map.on('touchend', () => (interacting = false))
		map.on('dragend', () => (interacting = false))

		animate((_, delta) => {
			if (!spinning || interacting || map.isZooming() || map.getZoom() > 4) return
			const center = map.getCenter()
			map.setCenter([center.lng + delta * 6, center.lat])
		})

		controls.toggle('Globe projection', globe, (value) => {
			globe = value
			applyProjection()
		})
		controls.toggle('Atmosphere', atmosphere, (value) => {
			atmosphere = value
			applySky()
		})
		controls.toggle('Auto-rotate', spinning, (value) => (spinning = value))
	}
}
