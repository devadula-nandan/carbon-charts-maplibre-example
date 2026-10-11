import maplibregl from 'maplibre-gl'
import { countriesGeoJson } from '../data/countries.js'
import { docs } from '../lib/docs.js'
import { popupContent } from '../lib/popup.js'
import { rampStops } from '../theme/palettes.js'

const BREAKS = [15, 30, 45, 60, 75, 90]

export default {
	id: 'choropleth',
	title: 'Choropleth',
	category: 'Spatial charts',
	summary: 'Shade regions by value with a fill layer, a sequential palette and hover state.',
	description: [
		'A choropleth colors each region by a normalized value. Carbon recommends a single-hue sequential palette; on dark themes the ramp is reversed so the highest class stays the most prominent. Choose between classed colors (a "step" expression) and a continuous ramp ("interpolate").',
		'Hover highlighting uses feature-state: setFeatureState() flips a flag on one feature and the paint expressions react to it, with no data re-upload. The fill is inserted below the basemap’s water layer so coastlines stay crisp.'
	],
	apis: [
		docs.layer('fill'),
		docs.expression('step'),
		docs.expression('interpolate'),
		docs.expression('feature-state'),
		docs.map('setFeatureState'),
		docs.map('addLayer')
	],
	view: { center: [15, 25], zoom: 1.5, maxZoom: 6 },

	setup(ctx) {
		const { map, controls, onStyle } = ctx
		let mode = 'step'
		let hovered = null
		const legend = controls.legend('Sample index (0–100)')
		const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12 })

		const fillColor = (colors) => {
			const ramp = colors.sequential
			return mode === 'step'
				? ['step', ['get', 'value'], ramp[0], ...BREAKS.flatMap((stop, index) => [stop, ramp[index + 1]])]
				: ['interpolate', ['linear'], ['get', 'value'], ...rampStops(ramp, 0, 100)]
		}

		const updateLegend = (colors) => {
			const edges = [0, ...BREAKS, 100]
			legend.update(
				mode === 'step'
					? colors.sequential.map((color, index) => ({ color, label: `${edges[index]} – ${edges[index + 1]}` }))
					: []
			)
			legend.ramp(mode === 'interpolate' ? colors.sequential : null, 'Low', 'High')
		}

		onStyle(({ colors }) => {
			hovered = null
			map.addSource('countries', { type: 'geojson', data: countriesGeoJson() })
			map.addLayer(
				{
					id: 'countries-fill',
					type: 'fill',
					source: 'countries',
					paint: {
						'fill-color': fillColor(colors),
						'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.82]
					}
				},
				'water'
			)
			map.addLayer(
				{
					id: 'countries-outline',
					type: 'line',
					source: 'countries',
					paint: {
						'line-color': ['case', ['boolean', ['feature-state', 'hover'], false], colors.highlight, colors.background],
						'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 0.5]
					}
				},
				'boundary'
			)
			// The basemap's own boundaries would double up with the outlines.
			map.setLayoutProperty('boundary', 'visibility', 'none')
			updateLegend(colors)
		})

		const setHover = (id) => {
			if (hovered !== null) map.setFeatureState({ source: 'countries', id: hovered }, { hover: false })
			hovered = id
			if (hovered !== null) map.setFeatureState({ source: 'countries', id: hovered }, { hover: true })
		}

		map.on('mousemove', 'countries-fill', (event) => {
			const feature = event.features[0]
			if (feature.id !== hovered) setHover(feature.id)
			map.getCanvas().style.cursor = 'pointer'
			popup
				.setLngLat(event.lngLat)
				.setDOMContent(popupContent(feature.properties.name, [['Index', feature.properties.value]]))
				.addTo(map)
		})
		map.on('mouseleave', 'countries-fill', () => {
			if (map.getSource('countries')) setHover(null)
			map.getCanvas().style.cursor = ''
			popup.remove()
		})

		controls.select(
			'Classification',
			[
				['step', 'Classed — step'],
				['interpolate', 'Continuous — interpolate']
			],
			mode,
			(next) => {
				mode = next
				if (!map.getLayer('countries-fill')) return
				// `ctx.colors` is always the palette of the active theme.
				map.setPaintProperty('countries-fill', 'fill-color', fillColor(ctx.colors))
				updateLegend(ctx.colors)
			}
		)
		controls.note('Boundaries: Natural Earth 1:110m. Values are deterministic sample data.')
	}
}
