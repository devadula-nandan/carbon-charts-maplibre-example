import { REGIONS, citiesGeoJson } from '../data/cities.js'
import { docs } from '../lib/docs.js'
import { rampStops } from '../theme/palettes.js'

/** Each encoding returns the paint expression and the legend that explains it. */
const ENCODINGS = {
	interpolate: {
		label: 'interpolate — continuous color',
		color: (colors) => ['interpolate', ['linear'], ['get', 'population'], ...rampStops(colors.sequentialAlt, 1, 35)],
		legend: (legend, colors) => {
			legend.update([])
			legend.ramp(colors.sequentialAlt, '1 M', '35 M')
		}
	},
	step: {
		label: 'step — three classes',
		color: (colors) => ['step', ['get', 'population'], colors.sequentialAlt[1], 10, colors.sequentialAlt[3], 20, colors.sequentialAlt[6]],
		legend: (legend, colors) => {
			legend.ramp(null)
			legend.update([
				{ color: colors.sequentialAlt[1], label: 'Under 10 M', shape: 'circle' },
				{ color: colors.sequentialAlt[3], label: '10 – 20 M', shape: 'circle' },
				{ color: colors.sequentialAlt[6], label: 'Over 20 M', shape: 'circle' }
			])
		}
	},
	match: {
		label: 'match — category by region',
		color: (colors) => ['match', ['get', 'region'], ...REGIONS.flatMap((region, index) => [region, colors.categorical[index]]), colors.textMuted],
		legend: (legend, colors) => {
			legend.ramp(null)
			legend.update(REGIONS.map((region, index) => ({ color: colors.categorical[index], label: region, shape: 'circle' })))
		}
	},
	case: {
		label: 'case — highlight megacities',
		color: (colors) => ['case', ['>=', ['get', 'population'], 20], colors.alert.critical, colors.textMuted],
		legend: (legend, colors) => {
			legend.ramp(null)
			legend.update([
				{ color: colors.alert.critical, label: '20 M and above', shape: 'circle' },
				{ color: colors.textMuted, label: 'Everything else', shape: 'circle' }
			])
		}
	}
}

export default {
	id: 'expressions',
	title: 'Data-driven styling',
	category: 'Interaction',
	summary: 'One dataset, four color encodings: interpolate, step, match and case expressions.',
	description: [
		'Expressions are small JSON programs evaluated per feature (and per zoom level). They are how MapLibre maps data to visual properties. Pick an encoding to swap the circle-color expression with setPaintProperty(); the exact JSON sent to the map is printed below.',
		'"interpolate" suits continuous measures, "step" classed data, "match" categories and "case" arbitrary conditions. Continuous ramps use Carbon’s sequential palette and categories use the categorical palette of the active theme.'
	],
	apis: [
		docs.spec('Expressions', 'expressions/'),
		docs.expression('interpolate'),
		docs.expression('step'),
		docs.expression('match'),
		docs.expression('case'),
		docs.map('setPaintProperty')
	],
	view: { center: [40, 25], zoom: 1.9 },

	setup(ctx) {
		const { map, controls, onStyle } = ctx
		let encoding = 'interpolate'

		controls.select(
			'Color encoding',
			Object.entries(ENCODINGS).map(([id, { label }]) => [id, label]),
			encoding,
			(next) => {
				encoding = next
				apply(ctx.colors)
			}
		)
		const legend = controls.legend('Legend')
		const code = controls.code('circle-color expression')

		function apply(colors) {
			const expression = ENCODINGS[encoding].color(colors)
			if (map.getLayer('cities')) map.setPaintProperty('cities', 'circle-color', expression)
			ENCODINGS[encoding].legend(legend, colors)
			code(JSON.stringify(expression).replaceAll('],', '],\n ').replaceAll(',"', ', "'))
		}

		onStyle(({ colors }) => {
			map.addSource('cities', { type: 'geojson', data: citiesGeoJson() })
			map.addLayer({
				id: 'cities',
				type: 'circle',
				source: 'cities',
				paint: {
					// Zoom and data combined: the outer interpolate is on zoom, its outputs on population.
					'circle-radius': [
						'interpolate',
						['linear'],
						['zoom'],
						1,
						['interpolate', ['linear'], ['get', 'population'], 1, 3, 35, 9],
						6,
						['interpolate', ['linear'], ['get', 'population'], 1, 8, 35, 28]
					],
					'circle-color': ENCODINGS[encoding].color(colors),
					'circle-stroke-color': colors.symbolStroke,
					'circle-stroke-width': 1
				}
			})
			apply(colors)
		})
	}
}
