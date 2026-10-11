import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec'
import { describe, expect, it } from 'vitest'
import { DEFAULT_THEME, PALETTES, THEMES, isTheme, rampStops } from '../src/theme/palettes.js'
import { FIRST_LABEL_LAYER, LABEL_LAYERS, carbonStyle, nameExpression } from '../src/theme/style.js'

const HEX = /^#[0-9a-f]{6}$/

describe('palettes', () => {
	it('defines the four Carbon themes', () => {
		expect(THEMES).toEqual(['white', 'g10', 'g90', 'g100'])
		expect(isTheme(DEFAULT_THEME)).toBe(true)
		expect(isTheme('toString')).toBe(false)
		expect(isTheme(null)).toBe(false)
	})

	it.each(THEMES)('%s has the same, well-formed tokens as every other theme', (theme) => {
		const palette = PALETTES[theme]
		expect(Object.keys(palette).sort()).toEqual(Object.keys(PALETTES.white).sort())
		for (const [key, value] of Object.entries(palette)) {
			if (typeof value === 'string' && key !== 'label') expect(value, key).toMatch(HEX)
		}
		for (const ramp of [palette.categorical, palette.sequential, palette.sequentialAlt, palette.sequentialTeal]) {
			expect(ramp.length).toBeGreaterThanOrEqual(7)
			for (const color of ramp) expect(color).toMatch(HEX)
		}
		expect(Object.keys(palette.alert)).toEqual(['low', 'medium', 'high', 'critical'])
	})

	it('builds interpolate stops across a range', () => {
		expect(rampStops(['#000000', '#888888', '#ffffff'], 0, 10)).toEqual([0, '#000000', 5, '#888888', 10, '#ffffff'])
	})
})

describe('carbonStyle', () => {
	it.each(THEMES)('%s is a valid MapLibre style', (theme) => {
		const style = carbonStyle(theme)
		expect(validateStyleMin(style).map((error) => error.message)).toEqual([])
		expect(style.metadata['carbon:theme']).toBe(theme)
		expect(style.layers[0].paint['background-color']).toBe(PALETTES[theme].background)
	})

	it('has unique layer ids and the same layers in every theme', () => {
		const ids = carbonStyle('white').layers.map((layer) => layer.id)
		expect(new Set(ids).size).toBe(ids.length)
		for (const theme of THEMES) expect(carbonStyle(theme).layers.map((layer) => layer.id)).toEqual(ids)
	})

	it('draws all label layers last, starting at FIRST_LABEL_LAYER', () => {
		const ids = carbonStyle('g100').layers.map((layer) => layer.id)
		expect(ids.slice(-LABEL_LAYERS.length)).toEqual(LABEL_LAYERS)
		expect(FIRST_LABEL_LAYER).toBe(LABEL_LAYERS[0])
		// Examples insert below these layer ids; renaming them is a breaking change.
		for (const id of ['landuse', 'water', 'boundary', 'building']) expect(ids).toContain(id)
	})

	it('falls back to the default theme for unknown input', () => {
		expect(carbonStyle('nope').metadata['carbon:theme']).toBe(DEFAULT_THEME)
		expect(carbonStyle(undefined).metadata['carbon:theme']).toBe(DEFAULT_THEME)
	})

	it('supports label language and label-free styles', () => {
		expect(nameExpression('local')).toEqual(['get', 'name'])
		expect(nameExpression('de')[1]).toEqual(['get', 'name:de'])
		const german = carbonStyle('white', { language: 'de' })
		expect(german.layers.at(-1).layout['text-field']).toEqual(nameExpression('de'))
		expect(validateStyleMin(german)).toEqual([])
		const bare = carbonStyle('white', { labels: false })
		expect(bare.layers.some((layer) => layer.type === 'symbol')).toBe(false)
	})
})
