import maplibregl from 'maplibre-gl'
import { h } from '../lib/dom.js'
import { docs } from '../lib/docs.js'
import { PALETTES, THEMES } from '../theme/palettes.js'
import { carbonStyle } from '../theme/style.js'

export default {
	id: 'compare',
	title: 'Compare themes',
	category: 'Basemap',
	summary: 'Swipe between two Carbon themes rendered by two synchronized maps.',
	description: [
		'A second, non-interactive map is stacked on top of the first and clipped with CSS clip-path. The primary map handles all input; every "move" event copies its camera to the second map with jumpTo(), so both stay locked together.',
		'Drag the handle, or focus it and use the arrow keys. The left side follows the header theme switcher; choose the right side below.'
	],
	apis: [docs.cls('Map'), docs.map('jumpTo'), docs.event('move'), docs.map('remove')],
	view: { center: [-0.1195, 51.5033], zoom: 13.2 },

	setup({ map, controls, onCleanup, onStyle, signal, theme }) {
		let position = 50
		let otherTheme = PALETTES[theme].dark ? 'white' : 'g100'

		const leftBadge = h('span', { class: 'compare__badge compare__badge--left' })
		const rightBadge = h('span', { class: 'compare__badge compare__badge--right' })
		const pane = h('div', { class: 'compare__map' })
		const clip = h('div', { class: 'compare__clip' }, pane)
		const handle = h('div', {
			class: 'compare__handle',
			role: 'slider',
			tabIndex: 0,
			'aria-label': 'Comparison position',
			'aria-valuemin': 0,
			'aria-valuemax': 100
		})
		const root = h('div', { class: 'compare' }, clip, leftBadge, rightBadge, handle)
		// Sit above the canvas but below MapLibre's own controls.
		map.getCanvasContainer().after(root)

		const other = new maplibregl.Map({
			container: pane,
			style: carbonStyle(otherTheme),
			center: map.getCenter(),
			zoom: map.getZoom(),
			bearing: map.getBearing(),
			pitch: map.getPitch(),
			interactive: false,
			attributionControl: false
		})
		onCleanup(() => {
			other.remove()
			root.remove()
		})

		const sync = () =>
			other.jumpTo({
				center: map.getCenter(),
				zoom: map.getZoom(),
				bearing: map.getBearing(),
				pitch: map.getPitch()
			})
		map.on('move', sync)
		map.on('resize', () => other.resize())

		const setPosition = (next) => {
			position = Math.max(0, Math.min(100, next))
			clip.style.clipPath = `inset(0 0 0 ${position}%)`
			handle.style.left = `${position}%`
			handle.setAttribute('aria-valuenow', String(Math.round(position)))
		}
		setPosition(position)

		const fromPointer = (event) => {
			const rect = root.getBoundingClientRect()
			setPosition(((event.clientX - rect.left) / rect.width) * 100)
		}
		handle.addEventListener(
			'pointerdown',
			(event) => {
				handle.setPointerCapture(event.pointerId)
				handle.addEventListener('pointermove', fromPointer, { signal })
				event.preventDefault()
			},
			{ signal }
		)
		const release = () => handle.removeEventListener('pointermove', fromPointer)
		handle.addEventListener('pointerup', release, { signal })
		handle.addEventListener('pointercancel', release, { signal })
		handle.addEventListener(
			'keydown',
			(event) => {
				const step = { ArrowLeft: -2, ArrowRight: 2, Home: -100, End: 100 }[event.key]
				if (!step) return
				setPosition(position + step)
				event.preventDefault()
			},
			{ signal }
		)

		const setBadges = (leftTheme) => {
			leftBadge.textContent = PALETTES[leftTheme].label
			rightBadge.textContent = PALETTES[otherTheme].label
		}
		onStyle(({ theme: current }) => setBadges(current))

		controls.select(
			'Right side theme',
			THEMES.map((id) => [id, PALETTES[id].label]),
			otherTheme,
			(next) => {
				otherTheme = next
				other.setStyle(carbonStyle(next), { diff: false })
				rightBadge.textContent = PALETTES[next].label
			}
		)
		controls.buttons([['Center the handle', () => setPosition(50), 'tertiary']])
	}
}
