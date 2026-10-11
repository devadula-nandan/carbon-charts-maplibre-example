import maplibregl from 'maplibre-gl'
import { eventsGeoJson } from '../data/points.js'
import { docs } from '../lib/docs.js'
import { popupContent } from '../lib/popup.js'

export default {
	id: 'clusters',
	title: 'Clusters',
	category: 'Spatial charts',
	summary: 'Aggregate dense points with GeoJSON clustering and expand clusters on click.',
	description: [
		'A GeoJSON source with cluster: true groups nearby points on a worker thread and re-clusters as you zoom. clusterProperties aggregates values across each cluster — here the maximum magnitude, which drives the cluster color.',
		'Clicking a cluster asks the source for getClusterExpansionZoom() and eases there. Clicking a single point opens a popup. The cluster radius can be changed live with setClusterOptions().'
	],
	apis: [
		docs.source('geojson'),
		docs.cls('GeoJSONSource', 'getClusterExpansionZoom'),
		docs.cls('GeoJSONSource', 'setClusterOptions'),
		docs.layer('symbol'),
		docs.expression('step'),
		docs.map('easeTo')
	],
	view: { center: [10, 30], zoom: 1.8 },

	setup({ map, controls, onStyle }) {
		const data = eventsGeoJson()
		const popup = new maplibregl.Popup({ offset: 10 })
		let clusterRadius = 50

		onStyle(({ colors }) => {
			map.addSource('events', {
				type: 'geojson',
				data,
				cluster: true,
				clusterRadius,
				clusterMaxZoom: 9,
				clusterProperties: { maxMagnitude: ['max', ['get', 'magnitude']] }
			})

			map.addLayer({
				id: 'clusters',
				type: 'circle',
				source: 'events',
				filter: ['has', 'point_count'],
				paint: {
					'circle-color': ['step', ['get', 'maxMagnitude'], colors.alert.low, 7, colors.alert.medium, 9, colors.alert.high, 9.8, colors.alert.critical],
					'circle-radius': ['step', ['get', 'point_count'], 14, 25, 18, 100, 24, 400, 30],
					'circle-stroke-color': colors.symbolStroke,
					'circle-stroke-width': 1.5,
					'circle-opacity': 0.92
				}
			})
			map.addLayer({
				id: 'cluster-count',
				type: 'symbol',
				source: 'events',
				filter: ['has', 'point_count'],
				layout: {
					'text-field': ['get', 'point_count_abbreviated'],
					'text-font': ['Noto Sans Bold'],
					'text-size': 12,
					'text-allow-overlap': true
				},
				// Alert colors are mid-tone; near-black text meets contrast on all four of them.
				paint: { 'text-color': '#161616' }
			})
			map.addLayer({
				id: 'unclustered',
				type: 'circle',
				source: 'events',
				filter: ['!', ['has', 'point_count']],
				paint: {
					'circle-radius': 5,
					'circle-color': colors.primary,
					'circle-stroke-color': colors.symbolStroke,
					'circle-stroke-width': 1
				}
			})
		})

		map.on('click', 'clusters', async (event) => {
			const feature = event.features[0]
			const zoom = await map.getSource('events').getClusterExpansionZoom(feature.properties.cluster_id)
			map.easeTo({ center: feature.geometry.coordinates, zoom })
		})
		map.on('click', 'unclustered', (event) => {
			const { city, category, magnitude } = event.features[0].properties
			popup
				.setLngLat(event.features[0].geometry.coordinates)
				.setDOMContent(popupContent(category, [['Near', city], ['Magnitude', magnitude]]))
				.addTo(map)
		})
		for (const layer of ['clusters', 'unclustered']) {
			map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'))
			map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''))
		}

		const legend = controls.legend('Highest magnitude in cluster')
		onStyle(({ colors }) =>
			legend.update([
				{ color: colors.alert.low, label: 'Below 7', shape: 'circle' },
				{ color: colors.alert.medium, label: '7 – 9', shape: 'circle' },
				{ color: colors.alert.high, label: '9 – 9.8', shape: 'circle' },
				{ color: colors.alert.critical, label: '9.8 and above', shape: 'circle' }
			])
		)
		controls.slider('Cluster radius', { min: 20, max: 120, step: 5, value: clusterRadius, format: (v) => `${v} px` }, (value) => {
			clusterRadius = value
			map.getSource('events')?.setClusterOptions({ cluster: true, clusterRadius, clusterMaxZoom: 9 })
		})
	}
}
