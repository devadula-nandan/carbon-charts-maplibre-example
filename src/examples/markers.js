import maplibregl from 'maplibre-gl'
import { h } from '../lib/dom.js'
import { docs } from '../lib/docs.js'
import { popupContent } from '../lib/popup.js'

const SITES = [
	{ name: 'Tower Bridge', coordinates: [-0.0754, 51.5055], status: 'Operational' },
	{ name: 'St Paul’s', coordinates: [-0.0984, 51.5138], status: 'Maintenance' },
	{ name: 'Waterloo', coordinates: [-0.1133, 51.5033], status: 'Operational' }
]

export default {
	id: 'markers',
	title: 'Markers',
	category: 'Interaction',
	summary: 'HTML markers: default pins, custom elements, popups and dragging.',
	description: [
		'A Marker is an HTML element pinned to a coordinate, so it can contain anything the DOM can: buttons, live text, CSS animation. Use markers for a handful of rich, interactive points and layers for anything numerous.',
		'This example shows the default pin tinted with the theme’s primary color, custom elements styled with CSS variables (they re-theme without any JavaScript), a marker with an attached popup, and a draggable marker that reports its position on "dragend".'
	],
	apis: [
		docs.cls('Marker'),
		docs.cls('Marker', 'setPopup'),
		docs.cls('Marker', 'setDraggable'),
		docs.cls('Marker', 'getLngLat'),
		docs.type('MarkerOptions')
	],
	view: { center: [-0.0955, 51.5075], zoom: 13.6 },

	setup({ map, controls, onStyle, onCleanup }) {
		let draggablePosition = [-0.0865, 51.5005]
		let rotate = false
		let themed = []
		const position = controls.readout('Draggable marker')
		const report = () => position(`${draggablePosition[0].toFixed(5)}, ${draggablePosition[1].toFixed(5)}`)
		report()

		// Custom element markers take their colors from CSS, so they are created once.
		const custom = SITES.map((site) => {
			const element = h(
				'button',
				{ type: 'button', class: `site-marker site-marker--${site.status.toLowerCase()}`, 'aria-label': `${site.name}: ${site.status}` },
				h('span', { class: 'site-marker__dot' }),
				h('span', { class: 'site-marker__label' }, site.name)
			)
			return new maplibregl.Marker({ element, anchor: 'left', offset: [-8, 0] })
				.setLngLat(site.coordinates)
				.setPopup(new maplibregl.Popup({ offset: 12 }).setDOMContent(popupContent(site.name, [['Status', site.status]])))
				.addTo(map)
		})

		// The default pin's color is baked into its SVG, so it is rebuilt for each theme.
		onStyle(({ colors }) => {
			themed.forEach((marker) => marker.remove())

			const pin = new maplibregl.Marker({ color: colors.primary })
				.setLngLat([-0.1246, 51.5007])
				.setPopup(new maplibregl.Popup({ offset: 28 }).setDOMContent(popupContent('Default marker', [['Color', colors.primary]])))
				.addTo(map)

			const draggable = new maplibregl.Marker({
				color: colors.categorical[3],
				draggable: true,
				rotationAlignment: rotate ? 'map' : 'viewport'
			})
				.setLngLat(draggablePosition)
				.addTo(map)
			draggable.on('dragend', () => {
				draggablePosition = draggable.getLngLat().toArray()
				report()
			})

			themed = [pin, draggable]
		})

		onCleanup(() => [...custom, ...themed].forEach((marker) => marker.remove()))

		controls.toggle('Rotate draggable marker with the map', rotate, (value) => {
			rotate = value
			themed[1]?.setRotationAlignment(value ? 'map' : 'viewport')
		})
		controls.buttons([
			['Rotate map', () => map.easeTo({ bearing: map.getBearing() + 45 }), 'tertiary'],
			['Open all popups', () => custom.forEach((marker) => marker.getPopup().addTo(map)), 'tertiary']
		])
		controls.note('Drag the magenta pin. Custom markers are real buttons: Tab to one and press Enter.')
	}
}
