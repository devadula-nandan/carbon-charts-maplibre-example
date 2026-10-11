import maplibregl from 'maplibre-gl'
import { docs } from '../lib/docs.js'

// Mapzen Terrarium elevation tiles, hosted on the AWS Open Data registry. No key required.
const DEM = {
	type: 'raster-dem',
	tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
	encoding: 'terrarium',
	tileSize: 256,
	maxzoom: 13,
	attribution:
		'<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noreferrer">Terrain: Mapzen, AWS Open Data</a>'
}

export default {
	id: 'terrain',
	title: 'Terrain and hillshade',
	category: 'Spatial charts',
	summary: 'Raster DEM tiles drive 3D terrain, hillshading, elevation tints and a themed sky.',
	description: [
		'One raster-dem source powers three features. setTerrain() displaces the whole map into 3D; a hillshade layer shades slopes; and a color-relief layer tints by elevation using the ["elevation"] expression. Shadow, highlight and tint colors come from the active Carbon theme.',
		'Terrain and hillshade use two separate sources pointing at the same tiles — MapLibre recommends this so each can pick its own resolution. With terrain enabled the camera can pitch up to 85°, and setSky() fills the space above the horizon.'
	],
	apis: [
		docs.map('setTerrain'),
		docs.source('raster-dem'),
		docs.layer('hillshade'),
		docs.layer('color-relief'),
		docs.map('setSky'),
		docs.cls('TerrainControl'),
		docs.map('queryTerrainElevation')
	],
	view: { center: [7.6586, 45.9763], zoom: 11.6, pitch: 68, bearing: 30 },
	mapOptions: { maxPitch: 85 },

	setup(ctx) {
		const { map, controls, onStyle } = ctx
		const settings = { terrain: true, exaggeration: 1.4, hillshade: true, relief: false }

		// A built-in button that toggles the same terrain source.
		map.addControl(new maplibregl.TerrainControl({ source: 'terrain-dem', exaggeration: settings.exaggeration }), 'top-right')

		const applyTerrain = () =>
			map.setTerrain(settings.terrain ? { source: 'terrain-dem', exaggeration: settings.exaggeration } : null)
		const visibility = (flag) => (flag ? 'visible' : 'none')

		onStyle(({ colors }) => {
			map.addSource('terrain-dem', DEM)
			map.addSource('hillshade-dem', DEM)

			map.addLayer(
				{
					id: 'relief',
					type: 'color-relief',
					source: 'hillshade-dem',
					layout: { visibility: visibility(settings.relief) },
					paint: {
						'color-relief-opacity': 0.7,
						'color-relief-color': [
							'interpolate',
							['linear'],
							['elevation'],
							...colors.sequentialTeal.flatMap((color, index, ramp) => [(4800 * index) / (ramp.length - 1), color])
						]
					}
				},
				'landuse'
			)
			map.addLayer(
				{
					id: 'hillshade',
					type: 'hillshade',
					source: 'hillshade-dem',
					layout: { visibility: visibility(settings.hillshade) },
					paint: {
						'hillshade-shadow-color': colors.dark ? '#000000' : '#525252',
						'hillshade-highlight-color': colors.dark ? '#6f6f6f' : '#ffffff',
						'hillshade-accent-color': colors.dark ? '#161616' : '#8d8d8d',
						'hillshade-exaggeration': 0.6
					}
				},
				'landuse'
			)

			map.setSky({
				'sky-color': colors.dark ? '#001141' : '#a6c8ff',
				'horizon-color': colors.dark ? '#393939' : '#edf5ff',
				'fog-color': colors.background,
				'sky-horizon-blend': 0.7,
				'horizon-fog-blend': 0.8,
				'fog-ground-blend': 0.6
			})
			applyTerrain()
		})

		controls.toggle('3D terrain', settings.terrain, (value) => {
			settings.terrain = value
			applyTerrain()
		})
		controls.slider('Exaggeration', { min: 0.5, max: 3, step: 0.1, value: settings.exaggeration, format: (v) => `${v.toFixed(1)}×` }, (value) => {
			settings.exaggeration = value
			if (settings.terrain) applyTerrain()
		})
		controls.toggle('Hillshade', settings.hillshade, (value) => {
			settings.hillshade = value
			if (map.getLayer('hillshade')) map.setLayoutProperty('hillshade', 'visibility', visibility(value))
		})
		controls.toggle('Elevation tint (color-relief)', settings.relief, (value) => {
			settings.relief = value
			if (map.getLayer('relief')) map.setLayoutProperty('relief', 'visibility', visibility(value))
		})

		const elevation = controls.readout('Elevation under pointer')
		map.on('mousemove', (event) => {
			// Returns null until the DEM tile under the pointer has loaded.
			const metres = map.queryTerrainElevation(event.lngLat)
			elevation(metres === null ? '—' : `${Math.round(metres / settings.exaggeration).toLocaleString('en-US')} m`)
		})

		controls.buttons([
			['Matterhorn', () => map.flyTo({ center: [7.6586, 45.9763], zoom: 11.6, pitch: 68, bearing: 30 }), 'tertiary'],
			['Grand Canyon', () => map.flyTo({ center: [-112.115, 36.1], zoom: 11.4, pitch: 65, bearing: -20 }), 'tertiary'],
			['Mount Fuji', () => map.flyTo({ center: [138.7274, 35.3606], zoom: 10.8, pitch: 62, bearing: 160 }), 'tertiary']
		])
	}
}
