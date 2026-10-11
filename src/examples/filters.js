import { CATEGORIES, eventsGeoJson } from '../data/points.js'
import { docs } from '../lib/docs.js'

export default {
	id: 'filters',
	title: 'Filters and queries',
	category: 'Interaction',
	summary: 'Filter a layer with expressions and query what is actually rendered.',
	description: [
		'setFilter() applies an expression to every feature on the GPU-side of the pipeline, so toggling categories or dragging the magnitude threshold never re-uploads data. The filter combines an "in" test on category with a ">=" test on magnitude inside "all".',
		'queryRenderedFeatures() answers “what is on screen?”. It feeds the per-category counts after every "idle" event, and a click queries a 12-pixel box around the pointer and lists the events found there.'
	],
	apis: [
		docs.map('setFilter'),
		docs.map('queryRenderedFeatures'),
		docs.expression('all'),
		docs.expression('in'),
		docs.expression('match'),
		docs.event('idle')
	],
	view: { center: [100, 22], zoom: 3.2 },

	setup({ map, controls, onStyle }) {
		const data = eventsGeoJson({ perMillion: 4 })
		const enabled = new Set(CATEGORIES)
		let minimum = 1

		const filter = () => ['all', ['in', ['get', 'category'], ['literal', [...enabled]]], ['>=', ['get', 'magnitude'], minimum]]
		const applyFilter = () => {
			if (map.getLayer('events')) map.setFilter('events', filter())
		}

		const legend = controls.legend('Category')
		onStyle(({ colors }) => {
			const palette = CATEGORIES.flatMap((category, index) => [category, colors.categorical[index]])
			map.addSource('events', { type: 'geojson', data })
			map.addLayer({
				id: 'events',
				type: 'circle',
				source: 'events',
				filter: filter(),
				paint: {
					'circle-radius': ['interpolate', ['linear'], ['get', 'magnitude'], 1, 2.5, 10, 9],
					'circle-color': ['match', ['get', 'category'], ...palette, colors.textMuted],
					'circle-stroke-color': colors.symbolStroke,
					'circle-stroke-width': 0.75,
					'circle-opacity': 0.85
				}
			})
			legend.update(CATEGORIES.map((category, index) => ({ color: colors.categorical[index], label: category, shape: 'circle' })))
		})

		for (const category of CATEGORIES) {
			controls.toggle(category, true, (value) => {
				if (value) enabled.add(category)
				else enabled.delete(category)
				applyFilter()
			})
		}
		controls.slider('Minimum magnitude', { min: 1, max: 10, step: 0.5, value: minimum, format: (v) => v.toFixed(1) }, (value) => {
			minimum = value
			applyFilter()
		})

		const visible = controls.readout('Rendered in view')
		const count = () => {
			if (!map.getLayer('events')) return
			const features = map.queryRenderedFeatures({ layers: ['events'] })
			// A feature that spans tile borders can be returned more than once.
			const ids = new Set(features.map((feature) => feature.id))
			visible(`${ids.size.toLocaleString('en-US')} of ${data.features.length.toLocaleString('en-US')} events`)
		}
		map.on('idle', count)

		const picked = controls.log('Events under the last click (12 px box)', 6)
		map.on('click', (event) => {
			if (!map.getLayer('events')) return
			const { x, y } = event.point
			const hits = map.queryRenderedFeatures([[x - 6, y - 6], [x + 6, y + 6]], { layers: ['events'] })
			if (hits.length === 0) return picked('No events here')
			for (const hit of hits.slice(0, 6)) {
				picked(`${hit.properties.category} · magnitude ${hit.properties.magnitude} · near ${hit.properties.city}`)
			}
		})
		map.on('mouseenter', 'events', () => (map.getCanvas().style.cursor = 'pointer'))
		map.on('mouseleave', 'events', () => (map.getCanvas().style.cursor = ''))
	}
}
