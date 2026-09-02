import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './styles.css'

/**
 * Open-source Carbon map themes on MapLibre GL.
 *
 * Carbon spatial-chart themes:
 * https://carbondesignsystem.com/data-visualization/spatial-charts/
 * This demo mirrors White, Gray 10, Gray 90, and Gray 100 with MapLibre
 * and OpenFreeMap vector tiles.
 */
const PALETTES = {
	white: {
		background: '#ffffff',
		landuse: '#f4f4f4',
		park: '#defbe6',
		water: '#d0e2ff',
		building: '#e0e0e0',
		buildingOutline: '#c6c6c6',
		roadMinor: '#c6c6c6',
		roadMajor: '#a8a8a8',
		rail: '#c6c6c6',
		boundary: '#8d8d8d',
		text: '#161616',
		textMuted: '#525252',
		halo: '#ffffff'
	},
	g10: {
		background: '#f4f4f4',
		landuse: '#ffffff',
		park: '#a7f0ba',
		water: '#a6c8ff',
		building: '#e0e0e0',
		buildingOutline: '#c6c6c6',
		roadMinor: '#c6c6c6',
		roadMajor: '#a8a8a8',
		rail: '#c6c6c6',
		boundary: '#8d8d8d',
		text: '#161616',
		textMuted: '#525252',
		halo: '#f4f4f4'
	},
	g90: {
		background: '#262626',
		landuse: '#2c2c2c',
		park: '#1f3324',
		water: '#393939',
		building: '#333333',
		buildingOutline: '#1e1e1e',
		roadMinor: '#525252',
		roadMajor: '#6f6f6f',
		rail: '#4c4c4c',
		boundary: '#6f6f6f',
		text: '#f4f4f4',
		textMuted: '#c6c6c6',
		halo: '#161616'
	},
	g100: {
		background: '#161616',
		landuse: '#1c1c1c',
		park: '#1a241c',
		water: '#262626',
		building: '#242424',
		buildingOutline: '#111111',
		roadMinor: '#525252',
		roadMajor: '#6f6f6f',
		rail: '#3d3d3d',
		boundary: '#525252',
		text: '#f4f4f4',
		textMuted: '#c6c6c6',
		halo: '#161616'
	}
}

const THEME_KEY = 'carbon-maplibre-theme'
const START = {
	center: [-73.9565, 40.7185],
	zoom: 13.6
}

const CITIES = [
	{ name: 'New York', coordinates: [-74.006, 40.7128], value: 8.8 },
	{ name: 'Los Angeles', coordinates: [-118.2437, 34.0522], value: 3.9 },
	{ name: 'Chicago', coordinates: [-87.6298, 41.8781], value: 2.7 },
	{ name: 'Houston', coordinates: [-95.3698, 29.7604], value: 2.3 },
	{ name: 'Toronto', coordinates: [-79.3832, 43.6532], value: 2.9 },
	{ name: 'Mexico City', coordinates: [-99.1332, 19.4326], value: 9.2 },
	{ name: 'London', coordinates: [-0.1276, 51.5072], value: 9.0 },
	{ name: 'Paris', coordinates: [2.3522, 48.8566], value: 2.1 },
	{ name: 'Berlin', coordinates: [13.405, 52.52], value: 3.7 },
	{ name: 'São Paulo', coordinates: [-46.6333, -23.5505], value: 12.3 },
	{ name: 'Lagos', coordinates: [3.3792, 6.5244], value: 14.8 },
	{ name: 'Cairo', coordinates: [31.2357, 30.0444], value: 10.0 },
	{ name: 'Mumbai', coordinates: [72.8777, 19.076], value: 20.4 },
	{ name: 'Delhi', coordinates: [77.209, 28.6139], value: 16.8 },
	{ name: 'Tokyo', coordinates: [139.6917, 35.6895], value: 13.9 },
	{ name: 'Shanghai', coordinates: [121.4737, 31.2304], value: 24.8 },
	{ name: 'Sydney', coordinates: [151.2093, -33.8688], value: 5.3 }
]

const citiesGeoJson = {
	type: 'FeatureCollection',
	features: CITIES.map((city) => ({
		type: 'Feature',
		properties: { name: city.name, value: city.value },
		geometry: { type: 'Point', coordinates: city.coordinates }
	}))
}

function carbonStyle(theme) {
	const p = PALETTES[theme]

	return {
		version: 8,
		name: `Carbon ${theme}`,
		sources: {
			openmaptiles: {
				type: 'vector',
				url: 'https://tiles.openfreemap.org/planet',
				attribution:
					'<a href="https://openfreemap.org/" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>'
			}
		},
		glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
		layers: [
			{
				id: 'background',
				type: 'background',
				paint: { 'background-color': p.background }
			},
			{
				id: 'landuse',
				type: 'fill',
				source: 'openmaptiles',
				'source-layer': 'landuse',
				paint: { 'fill-color': p.landuse, 'fill-opacity': 0.5 }
			},
			{
				id: 'park',
				type: 'fill',
				source: 'openmaptiles',
				'source-layer': 'park',
				paint: { 'fill-color': p.park, 'fill-opacity': 0.45 }
			},
			{
				id: 'landcover-wood',
				type: 'fill',
				source: 'openmaptiles',
				'source-layer': 'landcover',
				filter: ['==', ['get', 'class'], 'wood'],
				paint: { 'fill-color': p.park, 'fill-opacity': 0.35 }
			},
			{
				id: 'water',
				type: 'fill',
				source: 'openmaptiles',
				'source-layer': 'water',
				paint: { 'fill-color': p.water, 'fill-antialias': true }
			},
			{
				id: 'waterway',
				type: 'line',
				source: 'openmaptiles',
				'source-layer': 'waterway',
				paint: { 'line-color': p.water, 'line-width': 0.8 }
			},
			{
				id: 'pier',
				type: 'fill',
				source: 'openmaptiles',
				'source-layer': 'transportation',
				filter: ['==', ['get', 'class'], 'pier'],
				paint: { 'fill-color': p.background }
			},
			{
				id: 'building',
				type: 'fill',
				source: 'openmaptiles',
				'source-layer': 'building',
				minzoom: 13,
				paint: {
					'fill-color': p.building,
					'fill-opacity': 0.9,
					'fill-outline-color': p.buildingOutline
				}
			},
			{
				id: 'rail',
				type: 'line',
				source: 'openmaptiles',
				'source-layer': 'transportation',
				minzoom: 13,
				filter: ['match', ['get', 'class'], ['rail', 'transit'], true, false],
				paint: {
					'line-color': p.rail,
					'line-width': ['interpolate', ['linear'], ['zoom'], 13, 0.6, 16, 1.4]
				}
			},
			{
				id: 'road-path',
				type: 'line',
				source: 'openmaptiles',
				'source-layer': 'transportation',
				minzoom: 14,
				filter: ['==', ['get', 'class'], 'path'],
				paint: {
					'line-color': p.roadMinor,
					'line-opacity': 0.7,
					'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.4, 17, 1.4]
				}
			},
			{
				id: 'road-minor',
				type: 'line',
				source: 'openmaptiles',
				'source-layer': 'transportation',
				minzoom: 11,
				filter: ['match', ['get', 'class'], ['minor', 'service', 'tertiary'], true, false],
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: {
					'line-color': p.roadMinor,
					'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 11, 0.6, 14, 1.6, 17, 6]
				}
			},
			{
				id: 'road-major',
				type: 'line',
				source: 'openmaptiles',
				'source-layer': 'transportation',
				minzoom: 8,
				filter: ['match', ['get', 'class'], ['primary', 'secondary', 'trunk'], true, false],
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: {
					'line-color': p.roadMajor,
					'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 8, 0.8, 12, 1.8, 17, 8]
				}
			},
			{
				id: 'road-motorway',
				type: 'line',
				source: 'openmaptiles',
				'source-layer': 'transportation',
				minzoom: 5,
				filter: ['==', ['get', 'class'], 'motorway'],
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: {
					'line-color': p.roadMajor,
					'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 5, 0.8, 10, 2, 17, 10]
				}
			},
			{
				id: 'bridge',
				type: 'line',
				source: 'openmaptiles',
				'source-layer': 'transportation',
				minzoom: 12,
				filter: ['==', ['get', 'brunnel'], 'bridge'],
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: {
					'line-color': p.roadMajor,
					'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.4, 16, 5]
				}
			},
			{
				id: 'boundary',
				type: 'line',
				source: 'openmaptiles',
				'source-layer': 'boundary',
				filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
				paint: {
					'line-color': p.boundary,
					'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.6, 8, 1.4]
				}
			},
			{
				id: 'road-label',
				type: 'symbol',
				source: 'openmaptiles',
				'source-layer': 'transportation_name',
				minzoom: 13,
				layout: {
					'symbol-placement': 'line',
					'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
					'text-font': ['Noto Sans Regular'],
					'text-size': ['interpolate', ['linear'], ['zoom'], 13, 10, 16, 12],
					'text-rotation-alignment': 'map',
					'text-keep-upright': true
				},
				paint: {
					'text-color': p.textMuted,
					'text-halo-color': p.halo,
					'text-halo-width': 1
				}
			},
			{
				id: 'water-label',
				type: 'symbol',
				source: 'openmaptiles',
				'source-layer': 'water_name',
				layout: {
					'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
					'text-font': ['Noto Sans Italic'],
					'text-size': 12,
					'text-max-width': 6
				},
				paint: {
					'text-color': p.textMuted,
					'text-halo-color': p.halo,
					'text-halo-width': 1
				}
			},
			{
				id: 'place-neighbourhood',
				type: 'symbol',
				source: 'openmaptiles',
				'source-layer': 'place',
				minzoom: 12,
				filter: ['match', ['get', 'class'], ['suburb', 'neighbourhood', 'quarter'], true, false],
				layout: {
					'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
					'text-font': ['Noto Sans Bold'],
					'text-size': ['interpolate', ['linear'], ['zoom'], 12, 11, 15, 14],
					'text-transform': 'uppercase',
					'text-letter-spacing': 0.08,
					'text-max-width': 8
				},
				paint: {
					'text-color': p.text,
					'text-halo-color': p.halo,
					'text-halo-width': 1.2
				}
			},
			{
				id: 'place-city',
				type: 'symbol',
				source: 'openmaptiles',
				'source-layer': 'place',
				minzoom: 4,
				maxzoom: 13,
				filter: ['==', ['get', 'class'], 'city'],
				layout: {
					'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
					'text-font': ['Noto Sans Regular'],
					'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 10, 16],
					'text-max-width': 8
				},
				paint: {
					'text-color': p.text,
					'text-halo-color': p.halo,
					'text-halo-width': 1
				}
			},
			{
				id: 'place-country',
				type: 'symbol',
				source: 'openmaptiles',
				'source-layer': 'place',
				maxzoom: 8,
				filter: ['==', ['get', 'class'], 'country'],
				layout: {
					'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
					'text-font': ['Noto Sans Bold'],
					'text-size': ['interpolate', ['linear'], ['zoom'], 2, 11, 6, 16],
					'text-max-width': 6.5
				},
				paint: {
					'text-color': p.text,
					'text-halo-color': p.halo,
					'text-halo-width': 1.2
				}
			}
		]
	}
}

const banner = document.getElementById('banner')
const themeButtons = [...document.querySelectorAll('.theme-btn')]

let map
let popup
let activeTheme = localStorage.getItem(THEME_KEY) || 'g100'

setChromeTheme(activeTheme)
setActiveThemeButton(activeTheme)
createMap(activeTheme)

themeButtons.forEach((button) => {
	button.addEventListener('click', () => {
		activeTheme = button.dataset.theme
		localStorage.setItem(THEME_KEY, activeTheme)
		setChromeTheme(activeTheme)
		setActiveThemeButton(activeTheme)
		if (map) {
			map.setStyle(carbonStyle(activeTheme))
		}
	})
})

function createMap(theme) {
	hideBanner()

	popup = new maplibregl.Popup({ closeButton: false, closeOnClick: true })

	map = new maplibregl.Map({
		container: 'map',
		style: carbonStyle(theme),
		center: START.center,
		zoom: START.zoom,
		maxPitch: 0,
		attributionControl: true
	})

	map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
	map.on('style.load', addProportionalSymbols)
	map.on('click', 'city-symbols', onCityClick)
	map.on('mouseenter', 'city-symbols', () => {
		map.getCanvas().style.cursor = 'pointer'
	})
	map.on('mouseleave', 'city-symbols', () => {
		map.getCanvas().style.cursor = ''
	})
	map.on('error', (event) => {
		const message = event.error?.message || 'MapLibre failed to load the vector tiles.'
		showBanner(message)
	})
}

function addProportionalSymbols() {
	if (!map.getSource('cities')) {
		map.addSource('cities', { type: 'geojson', data: citiesGeoJson })
	}

	if (map.getLayer('city-symbols')) {
		return
	}

	map.addLayer({
		id: 'city-symbols',
		type: 'circle',
		source: 'cities',
		maxzoom: 7,
		paint: {
			'circle-radius': ['interpolate', ['linear'], ['get', 'value'], 1, 6, 25, 28],
			'circle-color': '#0f62fe',
			'circle-opacity': 0.78,
			'circle-stroke-width': 1.5,
			'circle-stroke-color': '#ffffff'
		}
	})
}

function onCityClick(event) {
	const feature = event.features[0]
	popup
		.setLngLat(feature.geometry.coordinates)
		.setHTML(`<strong>${feature.properties.name}</strong><br />Value: ${feature.properties.value}`)
		.addTo(map)
}

function setChromeTheme(theme) {
	document.body.className = `theme-${theme}`
}

function setActiveThemeButton(theme) {
	themeButtons.forEach((button) => {
		button.classList.toggle('is-active', button.dataset.theme === theme)
	})
}

function showBanner(message) {
	banner.hidden = false
	banner.textContent = message
}

function hideBanner() {
	banner.hidden = true
}
