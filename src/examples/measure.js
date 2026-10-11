import { formatDistance, haversine, lineLength } from '../data/geo.js'
import { docs } from '../lib/docs.js'

export default {
	id: 'measure',
	title: 'Measure distances',
	category: 'Interaction',
	summary: 'Click to draw a path and measure it — interactive editing with one GeoJSON source.',
	description: [
		'Drawing tools follow one pattern: keep your geometry in plain JavaScript, and call setData() whenever it changes. Clicking empty map adds a vertex; clicking an existing vertex (found with queryRenderedFeatures) removes it; a dashed “rubber band” follows the pointer to preview the next segment.',
		'Distances are great-circle lengths from the haversine formula, labelled on each segment with a symbol layer placed along the line.'
	],
	apis: [
		docs.event('click'),
		docs.event('mousemove'),
		docs.map('queryRenderedFeatures'),
		docs.cls('GeoJSONSource', 'setData'),
		docs.spec('symbol-placement', 'layers/#symbol-placement'),
		docs.cls('LngLat')
	],
	view: { center: [-0.11, 51.505], zoom: 12.4 },
	mapOptions: { doubleClickZoom: false },

	setup({ map, controls, onStyle }) {
		const points = [
			[-0.1419, 51.5014],
			[-0.1246, 51.5007],
			[-0.0984, 51.5138]
		]
		let pointer = null
		const total = controls.readout('Total distance')

		const collection = () => ({
			type: 'FeatureCollection',
			features: [
				...points.map((coordinates, index) => ({
					type: 'Feature',
					properties: { kind: 'vertex', index },
					geometry: { type: 'Point', coordinates }
				})),
				// One feature per segment so each can carry its own label.
				...points.slice(1).map((coordinates, index) => ({
					type: 'Feature',
					properties: { kind: 'segment', label: formatDistance(haversine(points[index], coordinates)) },
					geometry: { type: 'LineString', coordinates: [points[index], coordinates] }
				})),
				...(pointer && points.length > 0
					? [
							{
								type: 'Feature',
								properties: { kind: 'preview' },
								geometry: { type: 'LineString', coordinates: [points[points.length - 1], pointer] }
							}
						]
					: [])
			]
		})

		const refresh = () => {
			map.getSource('measure')?.setData(collection())
			total(points.length > 1 ? formatDistance(lineLength(points)) : 'Add at least two points')
		}

		onStyle(({ colors }) => {
			map.addSource('measure', { type: 'geojson', data: collection() })
			map.addLayer({
				id: 'measure-preview',
				type: 'line',
				source: 'measure',
				filter: ['==', ['get', 'kind'], 'preview'],
				paint: { 'line-color': colors.primary, 'line-width': 1.5, 'line-dasharray': [2, 2], 'line-opacity': 0.8 }
			})
			map.addLayer({
				id: 'measure-line',
				type: 'line',
				source: 'measure',
				filter: ['==', ['get', 'kind'], 'segment'],
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: { 'line-color': colors.primary, 'line-width': 3 }
			})
			map.addLayer({
				id: 'measure-points',
				type: 'circle',
				source: 'measure',
				filter: ['==', ['get', 'kind'], 'vertex'],
				paint: {
					'circle-radius': 6,
					'circle-color': colors.background,
					'circle-stroke-color': colors.primary,
					'circle-stroke-width': 2.5
				}
			})
			map.addLayer({
				id: 'measure-labels',
				type: 'symbol',
				source: 'measure',
				filter: ['==', ['get', 'kind'], 'segment'],
				layout: {
					'symbol-placement': 'line-center',
					'text-field': ['get', 'label'],
					'text-font': ['Noto Sans Bold'],
					'text-size': 12,
					'text-offset': [0, -0.9],
					'text-allow-overlap': true
				},
				paint: { 'text-color': colors.text, 'text-halo-color': colors.halo, 'text-halo-width': 2 }
			})
			refresh()
		})

		map.getCanvas().style.cursor = 'crosshair'
		map.on('click', (event) => {
			const hit = map.getLayer('measure-points') && map.queryRenderedFeatures(event.point, { layers: ['measure-points'] })[0]
			if (hit) points.splice(hit.properties.index, 1)
			else points.push(event.lngLat.toArray())
			refresh()
		})
		map.on('mousemove', (event) => {
			pointer = event.lngLat.toArray()
			refresh()
		})
		map.on('mouseout', () => {
			pointer = null
			refresh()
		})

		controls.buttons([
			[
				'Undo last point',
				() => {
					points.pop()
					refresh()
				},
				'tertiary'
			],
			[
				'Clear',
				() => {
					points.length = 0
					refresh()
				},
				'tertiary'
			]
		])
		controls.note('Click the map to add a point. Click a point to remove it.')
	}
}
