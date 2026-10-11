import { PALETTES, DEFAULT_THEME, isTheme } from './palettes.js'

export const TILES_URL = 'https://tiles.openfreemap.org/planet'
export const GLYPHS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf'
export const BASEMAP_SOURCE = 'openmaptiles'

const ATTRIBUTION =
	'<a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>'

/** Ids of every basemap label layer, in draw order. Handy for `beforeId` and for localization. */
export const LABEL_LAYERS = ['road-label', 'water-label', 'place-neighbourhood', 'place-city', 'place-country']

/** The first label layer: insert data layers before it to keep labels readable on top. */
export const FIRST_LABEL_LAYER = LABEL_LAYERS[0]

/** `text-field` expression for a language code, falling back to the local name. */
export function nameExpression(language = 'en') {
	return language === 'local'
		? ['get', 'name']
		: ['coalesce', ['get', `name:${language}`], ['get', 'name:latin'], ['get', 'name']]
}

/**
 * Build a complete MapLibre style document for a Carbon theme.
 *
 * @param {'white'|'g10'|'g90'|'g100'} theme
 * @param {{ language?: string, labels?: boolean }} [options]
 */
export function carbonStyle(theme = DEFAULT_THEME, { language = 'en', labels = true } = {}) {
	const p = PALETTES[isTheme(theme) ? theme : DEFAULT_THEME]
	const name = nameExpression(language)

	const base = [
		{
			id: 'background',
			type: 'background',
			paint: { 'background-color': p.background }
		},
		{
			id: 'landuse',
			type: 'fill',
			source: BASEMAP_SOURCE,
			'source-layer': 'landuse',
			paint: { 'fill-color': p.landuse, 'fill-opacity': 0.5 }
		},
		{
			id: 'park',
			type: 'fill',
			source: BASEMAP_SOURCE,
			'source-layer': 'park',
			paint: { 'fill-color': p.park, 'fill-opacity': 0.45 }
		},
		{
			id: 'landcover-wood',
			type: 'fill',
			source: BASEMAP_SOURCE,
			'source-layer': 'landcover',
			filter: ['==', ['get', 'class'], 'wood'],
			paint: { 'fill-color': p.park, 'fill-opacity': 0.35 }
		},
		{
			id: 'water',
			type: 'fill',
			source: BASEMAP_SOURCE,
			'source-layer': 'water',
			paint: { 'fill-color': p.water, 'fill-antialias': true }
		},
		{
			id: 'waterway',
			type: 'line',
			source: BASEMAP_SOURCE,
			'source-layer': 'waterway',
			paint: { 'line-color': p.water, 'line-width': 0.8 }
		},
		{
			id: 'pier',
			type: 'fill',
			source: BASEMAP_SOURCE,
			'source-layer': 'transportation',
			filter: ['all', ['==', ['geometry-type'], 'Polygon'], ['==', ['get', 'class'], 'pier']],
			paint: { 'fill-color': p.background }
		},
		{
			id: 'building',
			type: 'fill',
			source: BASEMAP_SOURCE,
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
			source: BASEMAP_SOURCE,
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
			source: BASEMAP_SOURCE,
			'source-layer': 'transportation',
			minzoom: 14,
			filter: ['all', ['==', ['geometry-type'], 'LineString'], ['==', ['get', 'class'], 'path']],
			paint: {
				'line-color': p.roadMinor,
				'line-opacity': 0.7,
				'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.4, 17, 1.4]
			}
		},
		{
			id: 'road-minor',
			type: 'line',
			source: BASEMAP_SOURCE,
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
			source: BASEMAP_SOURCE,
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
			source: BASEMAP_SOURCE,
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
			source: BASEMAP_SOURCE,
			'source-layer': 'transportation',
			minzoom: 12,
			filter: ['all', ['==', ['geometry-type'], 'LineString'], ['==', ['get', 'brunnel'], 'bridge']],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': p.roadMajor,
				'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.4, 16, 5]
			}
		},
		{
			id: 'boundary',
			type: 'line',
			source: BASEMAP_SOURCE,
			'source-layer': 'boundary',
			filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
			paint: {
				'line-color': p.boundary,
				'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.6, 8, 1.4]
			}
		}
	]

	const labelLayers = [
		{
			id: 'road-label',
			type: 'symbol',
			source: BASEMAP_SOURCE,
			'source-layer': 'transportation_name',
			minzoom: 13,
			layout: {
				'symbol-placement': 'line',
				'text-field': name,
				'text-font': ['Noto Sans Regular'],
				'text-size': ['interpolate', ['linear'], ['zoom'], 13, 10, 16, 12],
				'text-rotation-alignment': 'map',
				'text-keep-upright': true
			},
			paint: { 'text-color': p.textMuted, 'text-halo-color': p.halo, 'text-halo-width': 1 }
		},
		{
			id: 'water-label',
			type: 'symbol',
			source: BASEMAP_SOURCE,
			'source-layer': 'water_name',
			layout: {
				'text-field': name,
				'text-font': ['Noto Sans Italic'],
				'text-size': 12,
				'text-max-width': 6
			},
			paint: { 'text-color': p.textMuted, 'text-halo-color': p.halo, 'text-halo-width': 1 }
		},
		{
			id: 'place-neighbourhood',
			type: 'symbol',
			source: BASEMAP_SOURCE,
			'source-layer': 'place',
			minzoom: 12,
			filter: ['match', ['get', 'class'], ['suburb', 'neighbourhood', 'quarter'], true, false],
			layout: {
				'text-field': name,
				'text-font': ['Noto Sans Bold'],
				'text-size': ['interpolate', ['linear'], ['zoom'], 12, 11, 15, 14],
				'text-transform': 'uppercase',
				'text-letter-spacing': 0.08,
				'text-max-width': 8
			},
			paint: { 'text-color': p.text, 'text-halo-color': p.halo, 'text-halo-width': 1.2 }
		},
		{
			id: 'place-city',
			type: 'symbol',
			source: BASEMAP_SOURCE,
			'source-layer': 'place',
			minzoom: 4,
			maxzoom: 13,
			filter: ['==', ['get', 'class'], 'city'],
			layout: {
				'text-field': name,
				'text-font': ['Noto Sans Regular'],
				'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 10, 16],
				'text-max-width': 8
			},
			paint: { 'text-color': p.text, 'text-halo-color': p.halo, 'text-halo-width': 1 }
		},
		{
			id: 'place-country',
			type: 'symbol',
			source: BASEMAP_SOURCE,
			'source-layer': 'place',
			maxzoom: 8,
			filter: ['==', ['get', 'class'], 'country'],
			layout: {
				'text-field': name,
				'text-font': ['Noto Sans Bold'],
				'text-size': ['interpolate', ['linear'], ['zoom'], 2, 11, 6, 16],
				'text-max-width': 6.5
			},
			paint: { 'text-color': p.text, 'text-halo-color': p.halo, 'text-halo-width': 1.2 }
		}
	]

	return {
		version: 8,
		name: `Carbon ${p.label}`,
		metadata: { 'carbon:theme': isTheme(theme) ? theme : DEFAULT_THEME },
		sources: {
			[BASEMAP_SOURCE]: { type: 'vector', url: TILES_URL, attribution: ATTRIBUTION }
		},
		glyphs: GLYPHS_URL,
		layers: labels ? [...base, ...labelLayers] : base
	}
}
