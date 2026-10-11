import { eventsGeoJson } from '../data/points.js'
import { docs } from '../lib/docs.js'
import { FIRST_LABEL_LAYER } from '../theme/style.js'

export default {
	id: 'heatmap',
	title: 'Heatmap',
	category: 'Spatial charts',
	summary: 'Show point density with a heatmap layer that hands over to circles when you zoom in.',
	description: [
		'A heatmap layer accumulates a kernel around every point and maps the resulting density to color with ["heatmap-density"]. Each point’s contribution is weighted by its magnitude; intensity and radius grow with zoom to keep the surface readable.',
		'Density is a poor fit for individual inspection, so the heatmap fades out between zoom 5 and 7 while a circle layer fades in. The color ramp is the theme’s sequential palette, starting from full transparency.'
	],
	apis: [
		docs.layer('heatmap'),
		docs.expression('heatmap-density'),
		docs.spec('heatmap-weight', 'layers/#heatmap-weight'),
		docs.expression('interpolate'),
		docs.map('setPaintProperty')
	],
	view: { center: [95, 25], zoom: 2.6 },

	setup({ map, controls, onStyle }) {
		const data = eventsGeoJson()
		const settings = { radius: 1, intensity: 1, opacity: 0.85 }

		const paint = {
			radius: () => ['interpolate', ['linear'], ['zoom'], 0, 4 * settings.radius, 6, 28 * settings.radius],
			intensity: () => ['interpolate', ['linear'], ['zoom'], 0, 0.6 * settings.intensity, 6, 2 * settings.intensity],
			opacity: () => ['interpolate', ['linear'], ['zoom'], 5, settings.opacity, 7, 0]
		}

		onStyle(({ colors }) => {
			// On dark themes the sequential ramp already runs dark → light, which reads as "glow".
			const ramp = colors.sequential
			map.addSource('events', { type: 'geojson', data })
			map.addLayer(
				{
					id: 'events-heat',
					type: 'heatmap',
					source: 'events',
					maxzoom: 7,
					paint: {
						'heatmap-weight': ['interpolate', ['linear'], ['get', 'magnitude'], 1, 0.1, 10, 1],
						'heatmap-intensity': paint.intensity(),
						'heatmap-radius': paint.radius(),
						'heatmap-opacity': paint.opacity(),
						'heatmap-color': [
							'interpolate',
							['linear'],
							['heatmap-density'],
							0,
							'rgba(0, 0, 0, 0)',
							...ramp.flatMap((color, index) => [(index + 1) / ramp.length, color])
						]
					}
				},
				FIRST_LABEL_LAYER
			)
			map.addLayer(
				{
					id: 'events-point',
					type: 'circle',
					source: 'events',
					minzoom: 5,
					paint: {
						'circle-radius': ['interpolate', ['linear'], ['get', 'magnitude'], 1, 2, 10, 7],
						'circle-color': colors.primary,
						'circle-stroke-color': colors.symbolStroke,
						'circle-stroke-width': 0.75,
						'circle-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0, 7, 0.9],
						'circle-stroke-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0, 7, 0.9]
					}
				},
				FIRST_LABEL_LAYER
			)
		})

		const bind = (key, property) => (value) => {
			settings[key] = value
			if (map.getLayer('events-heat')) map.setPaintProperty('events-heat', property, paint[key]())
		}
		const times = (v) => `${v.toFixed(1)}×`
		controls.slider('Radius', { min: 0.4, max: 2.5, step: 0.1, value: 1, format: times }, bind('radius', 'heatmap-radius'))
		controls.slider('Intensity', { min: 0.2, max: 3, step: 0.1, value: 1, format: times }, bind('intensity', 'heatmap-intensity'))
		controls.slider(
			'Opacity',
			{ min: 0.1, max: 1, step: 0.05, value: settings.opacity, format: (v) => `${Math.round(v * 100)}%` },
			bind('opacity', 'heatmap-opacity')
		)
		controls.note(`${data.features.length.toLocaleString('en-US')} deterministic sample events. Zoom past level 6 to see individual points.`)
	}
}
