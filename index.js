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
		park: '#defbe6',
		water: '#d0e2ff',
		road: '#e0e0e0',
		boundary: '#8d8d8d',
		text: '#161616',
		halo: '#ffffff'
	},
	g10: {
		background: '#f4f4f4',
		park: '#a7f0ba',
		water: '#a6c8ff',
		road: '#e0e0e0',
		boundary: '#8d8d8d',
		text: '#161616',
		halo: '#f4f4f4'
	},
	g90: {
		background: '#262626',
		park: '#044317',
		water: '#001d6c',
		road: '#525252',
		boundary: '#6f6f6f',
		text: '#f4f4f4',
		halo: '#161616'
	},
	g100: {
		background: '#161616',
		park: '#022d0d',
		water: '#001141',
		road: '#393939',
		boundary: '#525252',
		text: '#f4f4f4',
		halo: '#161616'
	}
}

const THEME_KEY = 'carbon-maplibre-theme'

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
				id: 'park',
				type: 'fill',
				source: 'openmaptiles',
				'source-layer': 'park',
				paint: { 'fill-color': p.park, 'fill-opacity': 0.55 }
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
				id: 'road',
				type: 'line',
				source: 'openmaptiles',
				'source-layer': 'transportation',
				minzoom: 5,
				filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary', 'secondary'], true, false],
				paint: {
					'line-color': p.road,
					'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.5, 14, 2.2]
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
			},
			{
				id: 'place-city',
				type: 'symbol',
				source: 'openmaptiles',
				'source-layer': 'place',
				minzoom: 4,
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
		center: [10, 20],
		zoom: 1.6,
		attributionControl: true
	})

	map.addControl(new maplibregl.NavigationControl(), 'top-right')
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
