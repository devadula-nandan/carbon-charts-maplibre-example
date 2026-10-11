import maplibregl from 'maplibre-gl'
import { docs } from '../lib/docs.js'
import { LABEL_LAYERS, nameExpression } from '../theme/style.js'

const LANGUAGES = [
	['en', 'English'],
	['local', 'Local names'],
	['ar', 'Arabic'],
	['de', 'German'],
	['es', 'Spanish'],
	['fr', 'French'],
	['he', 'Hebrew'],
	['ja', 'Japanese'],
	['ko', 'Korean'],
	['ru', 'Russian']
]

const RTL_PLUGIN = 'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js'

export default {
	id: 'localization',
	title: 'Label language',
	category: 'Basemap',
	summary: 'Switch label language with a text-field expression and lazy-load right-to-left shaping.',
	description: [
		'OpenMapTiles ships a name:xx property for dozens of languages. The basemap labels use ["coalesce", ["get", "name:xx"], ["get", "name:latin"], ["get", "name"]], so missing translations fall back gracefully. Changing language is one setLayoutProperty() call per label layer.',
		'Arabic and Hebrew need bidirectional text shaping, provided by the RTL text plugin. It is registered lazily: the script is only downloaded once a label actually needs it.'
	],
	apis: [
		docs.map('setLayoutProperty'),
		docs.expression('coalesce'),
		docs.fn('setRTLTextPlugin'),
		docs.fn('getRTLTextPluginStatus'),
		docs.spec('text-field', 'layers/#text-field')
	],
	view: { center: [32, 36], zoom: 3.6 },

	setup({ map, controls, onStyle, notify }) {
		let language = 'en'

		// The plugin can only be registered once per page.
		if (maplibregl.getRTLTextPluginStatus() === 'unavailable') {
			maplibregl.setRTLTextPlugin(RTL_PLUGIN, true).catch(() => {
				notify.show('The right-to-left text plugin could not be loaded. Arabic and Hebrew labels may look wrong.', {
					kind: 'warning'
				})
			})
		}

		const apply = () => {
			for (const id of LABEL_LAYERS) {
				if (map.getLayer(id)) map.setLayoutProperty(id, 'text-field', nameExpression(language))
			}
		}
		onStyle(apply)

		controls.select('Language', LANGUAGES, language, (next) => {
			language = next
			apply()
		})
		controls.buttons([
			['Europe', () => map.flyTo({ center: [12, 49], zoom: 3.8 }), 'tertiary'],
			['Middle East', () => map.flyTo({ center: [42, 29], zoom: 4.2 }), 'tertiary'],
			['East Asia', () => map.flyTo({ center: [125, 36], zoom: 3.8 }), 'tertiary']
		])
	}
}
