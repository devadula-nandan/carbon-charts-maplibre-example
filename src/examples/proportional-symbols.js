import maplibregl from 'maplibre-gl'
import { citiesGeoJson, MAX_POPULATION } from '../data/cities.js'
import { docs } from '../lib/docs.js'
import { popupContent } from '../lib/popup.js'

export default {
	id: 'proportional-symbols',
	title: 'Proportional symbols',
	category: 'Spatial charts',
	summary: 'Circles sized by value with a circle layer and a square-root scale.',
	description: [
		'Proportional symbols encode a quantity as circle area. Because area grows with the square of the radius, the radius is driven by ["sqrt", ["get", "population"]] so that a city twice as large gets a circle with twice the area.',
		'The radius also scales with zoom. A zoom "interpolate" must be the outermost expression, with the data-driven part nested in its stops. Click a circle for details.'
	],
	apis: [
		docs.layer('circle'),
		docs.source('geojson'),
		docs.expression('interpolate'),
		docs.expression('sqrt'),
		docs.map('setPaintProperty'),
		docs.cls('Popup')
	],
	view: { center: [20, 22], zoom: 1.6 },

	setup({ map, controls, onStyle }) {
		let scale = 1
		let opacity = 0.75
		const popup = new maplibregl.Popup({ closeButton: false, offset: 8 })

		// Radius in pixels: `size` px for the largest city at low zoom, doubling by zoom 6.
		const radius = () => {
			const size = 22 * scale
			const unit = ['/', ['sqrt', ['get', 'population']], Math.sqrt(MAX_POPULATION)]
			return ['interpolate', ['linear'], ['zoom'], 1, ['*', size, unit], 6, ['*', size * 2, unit]]
		}

		onStyle(({ colors }) => {
			map.addSource('cities', { type: 'geojson', data: citiesGeoJson() })
			map.addLayer({
				id: 'city-symbols',
				type: 'circle',
				source: 'cities',
				paint: {
					'circle-radius': radius(),
					'circle-color': colors.primary,
					'circle-opacity': opacity,
					'circle-stroke-width': 1,
					'circle-stroke-color': colors.symbolStroke
				},
				// Draw small circles on top of large ones so none are hidden.
				layout: { 'circle-sort-key': ['-', ['get', 'population']] }
			})
		})

		map.on('click', 'city-symbols', (event) => {
			const feature = event.features[0]
			popup
				.setLngLat(feature.geometry.coordinates)
				.setDOMContent(
					popupContent(feature.properties.name, [
						['Region', feature.properties.region],
						['Population', `${feature.properties.population} M`]
					])
				)
				.addTo(map)
		})
		map.on('mouseenter', 'city-symbols', () => (map.getCanvas().style.cursor = 'pointer'))
		map.on('mouseleave', 'city-symbols', () => (map.getCanvas().style.cursor = ''))

		controls.slider('Symbol scale', { min: 0.4, max: 2, step: 0.1, value: scale, format: (v) => `${v.toFixed(1)}×` }, (value) => {
			scale = value
			if (map.getLayer('city-symbols')) map.setPaintProperty('city-symbols', 'circle-radius', radius())
		})
		controls.slider('Opacity', { min: 0.2, max: 1, step: 0.05, value: opacity, format: (v) => `${Math.round(v * 100)}%` }, (value) => {
			opacity = value
			if (map.getLayer('city-symbols')) map.setPaintProperty('city-symbols', 'circle-opacity', opacity)
		})
		controls.note('Sample data: approximate metropolitan population in millions.')
	}
}
