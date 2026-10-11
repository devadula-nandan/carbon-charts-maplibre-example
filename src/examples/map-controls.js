import maplibregl from 'maplibre-gl'
import { h } from '../lib/dom.js'
import { docs } from '../lib/docs.js'

const HOME = { center: [4.9, 52.37], zoom: 11.5, pitch: 0, bearing: 0 }

/** A custom control only needs `onAdd` (return an element) and `onRemove`. */
class HomeControl {
	onAdd(map) {
		this.container = h(
			'div',
			{ class: 'maplibregl-ctrl maplibregl-ctrl-group' },
			h('button', { type: 'button', class: 'home-control', title: 'Reset view', 'aria-label': 'Reset view', onClick: () => map.flyTo(HOME) }, '⌂')
		)
		return this.container
	}

	onRemove() {
		this.container.remove()
	}
}

export default {
	id: 'map-controls',
	title: 'Map controls',
	category: 'Interaction',
	summary: 'Every built-in control, plus a custom one implementing IControl.',
	description: [
		'Controls are UI widgets docked in a map corner with addControl(control, position). MapLibre ships navigation, geolocation, fullscreen, scale, globe, terrain, logo and attribution controls. Toggle each one below; removeControl() takes it away again.',
		'Anything with onAdd() and onRemove() is a control: the "Reset view" button is a 15-line class. The app restyles MapLibre’s control chrome with Carbon tokens in CSS, so controls follow the theme too.'
	],
	apis: [
		docs.map('addControl'),
		docs.map('removeControl'),
		docs.iface('IControl'),
		docs.cls('NavigationControl'),
		docs.cls('GeolocateControl'),
		docs.cls('FullscreenControl'),
		docs.cls('ScaleControl'),
		docs.cls('GlobeControl'),
		docs.cls('AttributionControl')
	],
	view: HOME,
	// This example manages every control itself.
	navigation: false,
	mapOptions: { attributionControl: false },

	setup({ map, controls, notify }) {
		const scale = new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' })
		const geolocate = new maplibregl.GeolocateControl({
			positionOptions: { enableHighAccuracy: true },
			trackUserLocation: true
		})
		geolocate.on('error', () =>
			notify.show('Your location is unavailable. Check the browser permission for this site.', { kind: 'warning', timeout: 6000 })
		)

		const available = [
			['Navigation (zoom, compass, pitch)', new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right', true],
			['Geolocate', geolocate, 'top-right', true],
			['Fullscreen', new maplibregl.FullscreenControl(), 'top-right', true],
			['Globe toggle', new maplibregl.GlobeControl(), 'top-right', false],
			['Scale', scale, 'bottom-left', true],
			['Custom “Reset view” control', new HomeControl(), 'top-left', true],
			['Attribution (compact)', new maplibregl.AttributionControl({ compact: true, customAttribution: 'Carbon themes' }), 'bottom-right', true]
		]

		for (const [label, control, position, initial] of available) {
			if (initial) map.addControl(control, position)
			controls.toggle(label, initial, (value) => {
				if (value && !map.hasControl(control)) map.addControl(control, position)
				if (!value && map.hasControl(control)) map.removeControl(control)
			})
		}

		controls.select(
			'Scale unit',
			[
				['metric', 'Metric'],
				['imperial', 'Imperial'],
				['nautical', 'Nautical']
			],
			'metric',
			(unit) => scale.setUnit(unit)
		)
		controls.note('Attribution is a licence requirement of OpenStreetMap data — keep it visible in production.')
	}
}
