// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { blackhole, maps } from './helpers/fake-maplibre.js'

vi.mock('maplibre-gl', () => import('./helpers/fake-maplibre.js'))

const { CATEGORIES, EXAMPLES, UNLISTED, findExample } = await import('../src/examples/index.js')
const { mountExample } = await import('../src/lib/runner.js')
const { THEMES } = await import('../src/theme/palettes.js')

const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8')
let frames = []

beforeAll(() => {
	// jsdom has no canvas implementation and no animation frames.
	HTMLCanvasElement.prototype.getContext = () => blackhole()
	HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,AAAA'
	globalThis.requestAnimationFrame = (callback) => frames.push(callback)
	globalThis.cancelAnimationFrame = () => {}
})

afterEach(() => {
	frames = []
	maps.length = 0
	document.body.replaceChildren()
})

/** Layers and sources the style-spec validator cannot check: they only exist at runtime. */
function validatable(style) {
	const runtimeSources = Object.entries(style.sources)
		.filter(([, source]) => source.type === 'canvas')
		.map(([id]) => id)
	return {
		...style,
		sources: Object.fromEntries(Object.entries(style.sources).filter(([id]) => !runtimeSources.includes(id))),
		layers: style.layers.filter((layer) => layer.type !== 'custom' && !runtimeSources.includes(layer.source))
	}
}

function mount(example, theme) {
	const stage = document.body.appendChild(document.createElement('div'))
	const controls = document.body.appendChild(document.createElement('div'))
	const problems = []
	const notify = {
		show: (message, { kind = 'error' } = {}) => kind === 'error' && problems.push(message),
		dismiss() {},
		clear() {}
	}
	const handle = mountExample(example, { stage, controls, notify, theme })
	const map = maps[0]
	map.fire('style.load')
	return { handle, map, problems, stage, controls }
}

describe('example registry', () => {
	it('lists every example file', () => {
		expect(UNLISTED).toEqual([])
		expect(EXAMPLES.length).toBeGreaterThan(20)
	})

	it('has unique ids that match the file names', () => {
		const ids = EXAMPLES.map((example) => example.id)
		expect(new Set(ids).size).toBe(ids.length)
		for (const example of EXAMPLES) {
			expect(example.file).toBe(`src/examples/${example.id}.js`)
			expect(findExample(example.id)).toBe(example)
		}
	})

	it('keeps each category contiguous in the navigation order', () => {
		const sequence = EXAMPLES.map((example) => example.category).filter((category, i, all) => category !== all[i - 1])
		expect(sequence).toEqual(CATEGORIES)
	})

	it.each(EXAMPLES.map((example) => [example.id, example]))('%s is fully documented', (_, example) => {
		expect(example.title).toBeTruthy()
		expect(example.summary.length).toBeGreaterThan(20)
		expect(example.description.length).toBeGreaterThan(0)
		for (const paragraph of example.description) expect(paragraph.length).toBeGreaterThan(80)
		expect(example.apis.length).toBeGreaterThan(2)
		for (const [label, href] of example.apis) {
			expect(label).toBeTruthy()
			expect(href).toMatch(/^https:\/\/maplibre\.org\//)
		}
		expect(example.source).toContain(`id: '${example.id}'`)
		expect(example.setup).toBeTypeOf('function')
		expect(example.view.center).toHaveLength(2)
		// Every example is linked from the README with its live URL.
		expect(readme).toContain(`#/${example.id})`)
	})
})

describe.each(EXAMPLES.map((example) => [example.id, example]))('example: %s', (_, example) => {
	it.each(THEMES)('produces a valid style in the %s theme', (theme) => {
		const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
		const { map, problems, handle } = mount(example, theme)

		expect(problems).toEqual([])
		expect(errorLog).not.toHaveBeenCalled()
		expect(validateStyleMin(validatable(map.getStyle())).map((error) => error.message)).toEqual([])

		handle.destroy()
		errorLog.mockRestore()
	})

	it('survives theme changes, animation frames and teardown', () => {
		const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
		const { map, problems, handle, stage } = mount(example, THEMES[0])
		const initialLayers = map.getStyle().layers.map((layer) => layer.id)

		// Run two animation frames.
		for (const time of [1000, 1016]) {
			for (const callback of frames.splice(0)) callback(time)
		}

		for (const theme of [...THEMES.slice(1), THEMES[0]]) {
			handle.setTheme(theme)
			expect(map.getStyle().metadata['carbon:theme']).toBe(theme)
			expect(validateStyleMin(validatable(map.getStyle())).map((error) => error.message)).toEqual([])
		}
		// Re-theming must rebuild exactly the same layer stack, with no duplicates or leftovers.
		expect(map.getStyle().layers.map((layer) => layer.id)).toEqual(initialLayers)
		expect(problems).toEqual([])
		expect(errorLog).not.toHaveBeenCalled()

		handle.destroy()
		expect(maps.every((instance) => instance.removed)).toBe(true)
		expect(stage.children).toHaveLength(0)
		// Destroying twice, or re-theming afterwards, must be harmless.
		handle.destroy()
		handle.setTheme(THEMES[1])
		errorLog.mockRestore()
	})
})
