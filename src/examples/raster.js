import { docs } from '../lib/docs.js'

// NASA Global Imagery Browse Services — public WMTS, no key required. Note the {z}/{y}/{x} order.
const BLUE_MARBLE = {
	type: 'raster',
	tiles: [
		'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg'
	],
	tileSize: 256,
	maxzoom: 8,
	attribution:
		'Imagery: <a href="https://earthdata.nasa.gov/gibs" target="_blank" rel="noreferrer">NASA EOSDIS GIBS</a>, Blue Marble'
}

const PRESETS = {
	Natural: { opacity: 1, saturation: 0, contrast: 0, hue: 0 },
	// Fully desaturated imagery sits comfortably inside Carbon's gray themes.
	'Carbon gray': { opacity: 0.85, saturation: -1, contrast: 0.15, hue: 0 },
	Muted: { opacity: 0.6, saturation: -0.5, contrast: 0, hue: 0 }
}

export default {
	id: 'raster',
	title: 'Raster imagery',
	category: 'Sources',
	summary: 'Blend a raster tile source into the vector basemap and tune it with paint properties.',
	description: [
		'Raster sources bring in imagery, WMS/WMTS services or pre-rendered tiles. The raster layer is inserted below the basemap’s boundary and label layers, so vector borders and names stay sharp on top of NASA’s Blue Marble.',
		'Raster paint properties adjust the picture on the GPU: opacity, saturation, contrast and hue rotation. The "Carbon gray" preset removes all color so that data layers in the Carbon palette remain the only colored marks on the map.'
	],
	apis: [
		docs.source('raster'),
		docs.layer('raster'),
		docs.spec('raster-saturation', 'layers/#raster-saturation'),
		docs.spec('raster-contrast', 'layers/#raster-contrast'),
		docs.map('setPaintProperty'),
		docs.map('addLayer')
	],
	view: { center: [15, 30], zoom: 2.2, maxZoom: 9 },

	setup({ map, controls, onStyle }) {
		const settings = { ...PRESETS['Carbon gray'] }
		const PROPERTIES = {
			opacity: 'raster-opacity',
			saturation: 'raster-saturation',
			contrast: 'raster-contrast',
			hue: 'raster-hue-rotate'
		}

		onStyle(() => {
			map.addSource('imagery', BLUE_MARBLE)
			map.addLayer(
				{
					id: 'imagery',
					type: 'raster',
					source: 'imagery',
					paint: {
						'raster-opacity': settings.opacity,
						'raster-saturation': settings.saturation,
						'raster-contrast': settings.contrast,
						'raster-hue-rotate': settings.hue,
						'raster-fade-duration': 200
					}
				},
				'boundary'
			)
		})

		const set = (key, value) => {
			settings[key] = value
			if (map.getLayer('imagery')) map.setPaintProperty('imagery', PROPERTIES[key], value)
		}
		const signed = (v) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2))
		const sliders = {
			opacity: controls.slider('Opacity', { min: 0, max: 1, step: 0.05, value: settings.opacity, format: (v) => `${Math.round(v * 100)}%` }, (v) => set('opacity', v)),
			saturation: controls.slider('Saturation', { min: -1, max: 1, step: 0.05, value: settings.saturation, format: signed }, (v) => set('saturation', v)),
			contrast: controls.slider('Contrast', { min: -1, max: 1, step: 0.05, value: settings.contrast, format: signed }, (v) => set('contrast', v)),
			hue: controls.slider('Hue rotate', { min: 0, max: 360, step: 5, value: settings.hue, format: (v) => `${v}°` }, (v) => set('hue', v))
		}

		controls.buttons(
			Object.entries(PRESETS).map(([label, preset]) => [
				label,
				() => {
					for (const [key, value] of Object.entries(preset)) {
						set(key, value)
						sliders[key].set(value)
					}
				},
				'tertiary'
			])
		)
	}
}
