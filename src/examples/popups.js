import maplibregl from 'maplibre-gl'
import { citiesGeoJson } from '../data/cities.js'
import { docs } from '../lib/docs.js'
import { popupContent } from '../lib/popup.js'

const ANCHORS = ['auto', 'top', 'bottom', 'left', 'right']

export default {
	id: 'popups',
	title: 'Popups and hover state',
	category: 'Interaction',
	summary: 'Tooltips on hover, popups on click, and highlighting with feature-state.',
	description: [
		'Two Popup instances cover the common pattern: a lightweight tooltip that follows hover, and a dismissible popup pinned on click. Content is built with setDOMContent() from DOM nodes, so data values are never parsed as HTML.',
		'The hovered and selected circles are restyled through feature-state. The paint expressions read ["feature-state", "hover"] and ["feature-state", "selected"], which MapLibre updates without touching the source data. Layer-scoped events (map.on("click", layerId, …)) deliver the features under the pointer.'
	],
	apis: [
		docs.cls('Popup'),
		docs.cls('Popup', 'setDOMContent'),
		docs.map('setFeatureState'),
		docs.expression('feature-state'),
		docs.event('mousemove'),
		docs.map('on')
	],
	view: { center: [15, 30], zoom: 2.1 },

	setup({ map, controls, onStyle }) {
		let anchor = 'auto'
		let hovered = null
		let selected = null
		const selection = controls.readout('Selected', 'Nothing — click a city')

		const tooltip = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 14, className: 'popup--tooltip' })
		let popup = null

		const state = (id, values) => {
			if (id !== null && map.getSource('cities')) map.setFeatureState({ source: 'cities', id }, values)
		}
		const flag = (name) => ['boolean', ['feature-state', name], false]

		onStyle(({ colors }) => {
			map.addSource('cities', { type: 'geojson', data: citiesGeoJson() })
			map.addLayer({
				id: 'cities',
				type: 'circle',
				source: 'cities',
				paint: {
					'circle-radius': ['case', flag('selected'), 11, flag('hover'), 9, 6],
					'circle-color': ['case', flag('selected'), colors.categorical[3], colors.primary],
					'circle-stroke-color': ['case', flag('hover'), colors.highlight, colors.symbolStroke],
					'circle-stroke-width': ['case', flag('hover'), 2.5, 1],
					// Paint transitions animate feature-state changes.
					'circle-radius-transition': { duration: 150 }
				}
			})
			// A style swap clears feature-state; restore the selection.
			state(selected, { selected: true })
		})

		map.on('mousemove', 'cities', (event) => {
			const feature = event.features[0]
			if (feature.id !== hovered) {
				state(hovered, { hover: false })
				hovered = feature.id
				state(hovered, { hover: true })
			}
			map.getCanvas().style.cursor = 'pointer'
			tooltip.setLngLat(feature.geometry.coordinates).setText(feature.properties.name).addTo(map)
		})
		map.on('mouseleave', 'cities', () => {
			state(hovered, { hover: false })
			hovered = null
			map.getCanvas().style.cursor = ''
			tooltip.remove()
		})

		const select = (feature) => {
			state(selected, { selected: false })
			popup?.remove()
			selected = feature?.id ?? null
			selection(feature ? feature.properties.name : 'Nothing — click a city')
			if (!feature) return

			state(selected, { selected: true })
			const opened = new maplibregl.Popup({ offset: 16, anchor: anchor === 'auto' ? undefined : anchor, focusAfterOpen: true })
				.setLngLat(feature.geometry.coordinates)
				.setDOMContent(
					popupContent(feature.properties.name, [
						['Region', feature.properties.region],
						['Population', `${feature.properties.population} M`],
						['Longitude', feature.geometry.coordinates[0].toFixed(3)],
						['Latitude', feature.geometry.coordinates[1].toFixed(3)]
					])
				)
				.addTo(map)
			// Closing the popup (button, Escape or map click) clears the selection.
			opened.on('close', () => {
				if (popup === opened) select(null)
			})
			popup = opened
		}
		map.on('click', 'cities', (event) => select(event.features[0]))

		controls.select('Popup anchor', ANCHORS, anchor, (next) => (anchor = next))
		controls.note('Hover for a tooltip, click to pin a popup. Press Escape or click the map to close it.')
	}
}
