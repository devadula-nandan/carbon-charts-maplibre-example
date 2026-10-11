/**
 * Carbon map themes.
 *
 * Carbon spatial-chart guidance:
 * https://carbondesignsystem.com/data-visualization/spatial-charts/
 *
 * Every theme carries three groups of tokens:
 *  - basemap colors, consumed by `carbonStyle()`
 *  - UI colors, mirrored as CSS custom properties in `styles.css`
 *  - data-vis colors (categorical, sequential, alert), used by the examples
 */
const BLUE = ['#edf5ff', '#d0e2ff', '#a6c8ff', '#78a9ff', '#4589ff', '#0f62fe', '#0043ce', '#002d9c', '#001d6c']
const PURPLE = ['#f6f2ff', '#e8daff', '#d4bbff', '#be95ff', '#a56eff', '#8a3ffc', '#6929c4', '#491d8b', '#31135e']
const TEAL = ['#d9fbfb', '#9ef0f0', '#3ddbd9', '#08bdba', '#009d9a', '#007d79', '#005d5d', '#004144', '#022b30']

// Carbon categorical palettes — the light and dark sets are tuned for 3:1 contrast on their backgrounds.
const CATEGORICAL_LIGHT = ['#6929c4', '#1192e8', '#005d5d', '#9f1853', '#fa4d56', '#570408', '#198038', '#002d9c']
const CATEGORICAL_DARK = ['#8a3ffc', '#33b1ff', '#007d79', '#ff7eb6', '#fa4d56', '#fff1f1', '#6fdc8c', '#4589ff']

const LIGHT_DATA = {
	dark: false,
	categorical: CATEGORICAL_LIGHT,
	// Sequential ramps run from "low" to "high". On light themes high values are darker.
	sequential: BLUE.slice(1, 8),
	sequentialAlt: PURPLE.slice(1, 8),
	sequentialTeal: TEAL.slice(1, 8),
	primary: '#0f62fe',
	highlight: '#161616',
	symbolStroke: '#ffffff',
	alert: { low: '#198038', medium: '#f1c21b', high: '#ff832b', critical: '#da1e28' }
}

const DARK_DATA = {
	dark: true,
	categorical: CATEGORICAL_DARK,
	// On dark themes the ramp is reversed so that high values stay the most prominent.
	sequential: BLUE.slice(1, 8).reverse(),
	sequentialAlt: PURPLE.slice(1, 8).reverse(),
	sequentialTeal: TEAL.slice(1, 8).reverse(),
	primary: '#4589ff',
	highlight: '#ffffff',
	symbolStroke: '#161616',
	alert: { low: '#42be65', medium: '#f1c21b', high: '#ff832b', critical: '#fa4d56' }
}

export const PALETTES = {
	white: {
		label: 'White',
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
		halo: '#ffffff',
		...LIGHT_DATA
	},
	g10: {
		label: 'Gray 10',
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
		halo: '#f4f4f4',
		...LIGHT_DATA
	},
	g90: {
		label: 'Gray 90',
		background: '#262626',
		landuse: '#2c2c2c',
		park: '#1f3324',
		// Gray 80 (#393939) tinted towards Carbon blue, at the same lightness.
		water: '#2c3a52',
		building: '#333333',
		buildingOutline: '#1e1e1e',
		roadMinor: '#525252',
		roadMajor: '#6f6f6f',
		rail: '#4c4c4c',
		boundary: '#6f6f6f',
		text: '#f4f4f4',
		textMuted: '#c6c6c6',
		halo: '#161616',
		...DARK_DATA
	},
	g100: {
		label: 'Gray 100',
		background: '#161616',
		landuse: '#1c1c1c',
		park: '#1a241c',
		// Gray 90 (#262626) tinted towards Carbon blue, at the same lightness.
		water: '#1c2638',
		building: '#242424',
		buildingOutline: '#111111',
		roadMinor: '#525252',
		roadMajor: '#6f6f6f',
		rail: '#3d3d3d',
		boundary: '#525252',
		text: '#f4f4f4',
		textMuted: '#c6c6c6',
		halo: '#161616',
		...DARK_DATA
	}
}

export const THEMES = Object.keys(PALETTES)
export const DEFAULT_THEME = 'g100'

export function isTheme(value) {
	return Object.hasOwn(PALETTES, value)
}

/** Build an `interpolate`-ready list of [stop, color, stop, color, …] from a ramp. */
export function rampStops(ramp, min, max) {
	return ramp.flatMap((color, index) => [min + ((max - min) * index) / (ramp.length - 1), color])
}
