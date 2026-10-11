import { docs } from '../lib/docs.js'
import { LABEL_LAYERS } from '../theme/style.js'

const HIDDEN_KEYS = /^name:(?!en$|latin$)/

export default {
	id: 'inspect',
	title: 'Inspect and debug',
	category: 'Interaction',
	summary: 'Read vector-tile features under the pointer and turn on MapLibre’s debug overlays.',
	description: [
		'Styling vector tiles starts with knowing what is in them. Without a layer filter, queryRenderedFeatures(point) returns every rendered feature under the pointer from every layer, each with its source-layer and properties — exactly the names you use in filters and expressions.',
		'MapLibre also has built-in debug views: tile boundaries, label collision boxes and an overdraw inspector that reveals how many times each pixel is painted. The readouts show the style’s layer count and what the map is currently loading.'
	],
	apis: [
		docs.map('queryRenderedFeatures'),
		docs.map('getStyle'),
		docs.map('areTilesLoaded'),
		docs.map('setLayoutProperty'),
		docs.cls('Map', 'showTileBoundaries'),
		docs.cls('Map', 'showCollisionBoxes'),
		docs.cls('Map', 'showOverdrawInspector'),
		docs.type('MapGeoJSONFeature')
	],
	view: { center: [-0.1195, 51.5033], zoom: 14.2 },

	setup({ map, controls, onStyle }) {
		const layers = controls.readout('Layers in style')
		const tiles = controls.readout('Tiles')
		const features = controls.code('Features under the pointer', 'Move the pointer over the map')

		let hideLabels = false
		const applyLabels = () => {
			for (const id of LABEL_LAYERS) map.setLayoutProperty(id, 'visibility', hideLabels ? 'none' : 'visible')
		}

		onStyle(() => {
			layers(String(map.getStyle().layers.length))
			applyLabels()
		})
		map.on('idle', () => tiles('All loaded'))
		map.on('dataloading', () => tiles(map.areTilesLoaded() ? 'All loaded' : 'Loading…'))

		map.on('mousemove', (event) => {
			const found = map.queryRenderedFeatures(event.point)
			if (found.length === 0) return features('No features here — only the background layer.')

			features(
				found
					.slice(0, 4)
					.map((feature) => {
						// Tiles carry ~70 translated names per label; keep the output readable.
						const properties = Object.entries(feature.properties).filter(([key]) => !HIDDEN_KEYS.test(key))
						const rows = properties.slice(0, 6).map(([key, value]) => `  ${key}: ${value}`)
						return [`${feature.layer.id}  ←  ${feature.sourceLayer} (${feature.geometry.type})`, ...rows].join('\n')
					})
					.join('\n\n')
			)
		})

		controls.toggle('Tile boundaries', false, (value) => (map.showTileBoundaries = value))
		controls.toggle('Label collision boxes', false, (value) => (map.showCollisionBoxes = value))
		controls.toggle('Overdraw inspector', false, (value) => (map.showOverdrawInspector = value))
		controls.toggle('Hide label layers', false, (value) => {
			hideLabels = value
			applyLabels()
		})
	}
}
