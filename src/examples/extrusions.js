import { docs } from '../lib/docs.js'
import { rampStops } from '../theme/palettes.js'
import { BASEMAP_SOURCE, FIRST_LABEL_LAYER } from '../theme/style.js'

export default {
	id: 'extrusions',
	title: '3D buildings',
	category: 'Spatial charts',
	summary: 'Extrude building footprints from the vector tiles and color them by height.',
	description: [
		'A fill-extrusion layer turns polygons into prisms. Building heights come straight from the OpenMapTiles building layer (render_height and render_min_height), so no extra data is needed. Color is interpolated over height with the theme’s sequential palette, or kept neutral.',
		'Lighting is part of the style: setLight() moves the light source and changes its intensity. Drag with the right mouse button, or Ctrl + drag, to rotate and tilt.'
	],
	apis: [
		docs.layer('fill-extrusion'),
		docs.map('setLight'),
		docs.spec('Light', 'light/'),
		docs.expression('interpolate'),
		docs.map('setPaintProperty'),
		docs.map('easeTo')
	],
	view: { center: [-74.0085, 40.7095], zoom: 15.4, pitch: 60, bearing: -24 },
	mapOptions: { maxPitch: 80 },

	setup(ctx) {
		const { map, controls, onStyle } = ctx
		const settings = { exaggeration: 1, opacity: 0.9, byHeight: true, azimuth: 210 }

		const height = (property) => ['*', settings.exaggeration, ['coalesce', ['get', property], 0]]
		const color = () =>
			settings.byHeight
				? ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 0], ...rampStops(ctx.colors.sequential, 0, 250)]
				: ctx.colors.building
		// Light position is [radial distance, azimuth, polar angle].
		const light = () => ({ anchor: 'map', position: [1.5, settings.azimuth, 50], intensity: 0.5, color: '#ffffff' })

		const legend = controls.legend('Building height')
		onStyle(({ colors }) => {
			map.setLayoutProperty('building', 'visibility', 'none')
			map.addLayer(
				{
					id: 'building-3d',
					type: 'fill-extrusion',
					source: BASEMAP_SOURCE,
					'source-layer': 'building',
					minzoom: 13,
					filter: ['!=', ['get', 'hide_3d'], true],
					paint: {
						'fill-extrusion-color': color(),
						'fill-extrusion-height': height('render_height'),
						'fill-extrusion-base': height('render_min_height'),
						'fill-extrusion-opacity': settings.opacity,
						'fill-extrusion-vertical-gradient': true
					}
				},
				FIRST_LABEL_LAYER
			)
			map.setLight(light())
			legend.ramp(settings.byHeight ? colors.sequential : null, '0 m', '250 m +')
		})

		const setPaint = (property, value) => {
			if (map.getLayer('building-3d')) map.setPaintProperty('building-3d', property, value)
		}
		controls.toggle('Color by height', settings.byHeight, (value) => {
			settings.byHeight = value
			setPaint('fill-extrusion-color', color())
			legend.ramp(value ? ctx.colors.sequential : null, '0 m', '250 m +')
		})
		controls.slider('Height exaggeration', { min: 0, max: 3, step: 0.1, value: 1, format: (v) => `${v.toFixed(1)}×` }, (value) => {
			settings.exaggeration = value
			setPaint('fill-extrusion-height', height('render_height'))
			setPaint('fill-extrusion-base', height('render_min_height'))
		})
		controls.slider('Opacity', { min: 0.2, max: 1, step: 0.05, value: settings.opacity, format: (v) => `${Math.round(v * 100)}%` }, (value) => {
			settings.opacity = value
			setPaint('fill-extrusion-opacity', value)
		})
		controls.slider('Light direction', { min: 0, max: 360, step: 5, value: settings.azimuth, format: (v) => `${v}°` }, (value) => {
			settings.azimuth = value
			map.setLight(light())
		})
		controls.buttons([
			['Orbit', () => map.easeTo({ bearing: map.getBearing() + 90, duration: 4000 }), 'tertiary'],
			['Top-down', () => map.easeTo({ pitch: 0, bearing: 0 }), 'tertiary'],
			['Tilt', () => map.easeTo({ pitch: 60, bearing: -24 }), 'tertiary']
		])
	}
}
