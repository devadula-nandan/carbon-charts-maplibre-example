import maplibregl from 'maplibre-gl'
import { PALETTES } from '../theme/palettes.js'
import { carbonStyle } from '../theme/style.js'
import { createControls } from './controls.js'
import { h, prefersReducedMotion } from './dom.js'

/** Tile and glyph requests that are cancelled while panning are not failures. */
function isBenign(error) {
	const message = String(error?.message ?? '')
	return error?.name === 'AbortError' || /abort/i.test(message)
}

function describeError(error) {
	const message = String(error?.message ?? error ?? 'Unknown map error')
	if (error?.status === 429) return 'The tile server is rate limiting requests. Wait a moment and try again.'
	if (error?.status >= 500) return `The tile server returned an error (${error.status}). Data may be incomplete.`
	if (/failed to fetch|networkerror|load failed/i.test(message)) {
		return navigator.onLine === false
			? 'You are offline. The map will resume loading tiles when the connection returns.'
			: 'Some map data could not be downloaded. Check your connection or try again.'
	}
	return message
}

export function supportsWebGL() {
	try {
		const canvas = document.createElement('canvas')
		return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
	} catch {
		return false
	}
}

/**
 * Mount one example: create its map, hand it a context object, and return a handle
 * that can re-theme or destroy it. All listeners, timers, animation frames and extra
 * maps registered through the context are released on `destroy()`.
 *
 * @param {object} example        an entry from `src/examples`
 * @param {object} host
 * @param {HTMLElement} host.stage     element that receives the map container
 * @param {HTMLElement} host.controls  element that receives the example's controls
 * @param {object} host.notify         notifier from `createNotifier`
 * @param {string} host.theme          initial Carbon theme
 */
export function mountExample(example, { stage, controls, notify, theme }) {
	const cleanups = []
	const styleCallbacks = []
	const abort = new AbortController()
	let currentTheme = theme
	let styleReady = false
	let destroyed = false
	let map = null

	const container = h('div', { class: 'map', role: 'region', 'aria-label': `${example.title} map` })
	const loading = h('div', { class: 'loading-bar', hidden: true, 'aria-hidden': 'true' })
	stage.append(container, loading)

	const guard = (label, fn) => {
		try {
			return fn()
		} catch (error) {
			console.error(`[${example.id}] ${label}`, error)
			notify.show(String(error?.message ?? error), { title: `${example.title}: ${label} failed. ` })
			return undefined
		}
	}

	const runStyleCallbacks = () => {
		if (destroyed) return
		styleReady = true
		const args = { map, colors: PALETTES[currentTheme], theme: currentTheme }
		for (const callback of styleCallbacks) guard('adding layers', () => callback(args))
	}

	function destroy() {
		if (destroyed) return
		destroyed = true
		abort.abort()
		for (const cleanup of cleanups.splice(0).reverse()) {
			try {
				cleanup()
			} catch (error) {
				console.warn(`[${example.id}] cleanup failed`, error)
			}
		}
		try {
			map?.remove()
		} catch (error) {
			console.warn(`[${example.id}] map.remove() failed`, error)
		}
		map = null
		container.remove()
		loading.remove()
	}

	if (!supportsWebGL()) {
		container.append(
			h(
				'div',
				{ class: 'map-fallback' },
				h('h3', {}, 'WebGL is not available'),
				h(
					'p',
					{},
					'MapLibre GL JS renders with WebGL. Enable hardware acceleration or try another browser to see this example. The source code is still available in the panel.'
				)
			)
		)
		return { destroy, setTheme() {}, map: null }
	}

	try {
		map = new maplibregl.Map({
			container,
			style: carbonStyle(currentTheme, example.style),
			center: [0, 20],
			zoom: 1.5,
			attributionControl: { compact: true },
			...example.view,
			...example.mapOptions
		})
	} catch (error) {
		console.error(`[${example.id}] map creation failed`, error)
		notify.show(String(error?.message ?? error), { title: 'The map could not be created. ' })
		return { destroy, setTheme() {}, map: null }
	}

	if (example.navigation !== false) {
		map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
	}

	map.on('style.load', runStyleCallbacks)
	map.on('error', (event) => {
		if (destroyed || isBenign(event.error)) return
		console.warn(`[${example.id}]`, event.error ?? event)
		notify.show(describeError(event.error))
	})
	map.on('dataloading', () => (loading.hidden = false))
	map.on('idle', () => (loading.hidden = true))
	map.on('webglcontextlost', () => {
		notify.show('The browser reclaimed the graphics context. The map will redraw when it is restored.', {
			kind: 'warning',
			key: 'context-lost'
		})
	})
	map.on('webglcontextrestored', () => notify.dismiss('context-lost'))

	const onOffline = () =>
		notify.show('You are offline. Tiles already in memory stay visible.', { kind: 'warning', key: 'offline' })
	const onOnline = () => {
		notify.dismiss('offline')
		map?.triggerRepaint()
	}
	window.addEventListener('offline', onOffline, { signal: abort.signal })
	window.addEventListener('online', onOnline, { signal: abort.signal })

	/** Everything an example needs. See README → "Writing an example". */
	const ctx = {
		map,
		container,
		controls: createControls(controls),
		/** Aborted when the example is torn down; pass it to `fetch` and `addEventListener`. */
		signal: abort.signal,
		reducedMotion: prefersReducedMotion(),
		notify,
		get theme() {
			return currentTheme
		},
		get colors() {
			return PALETTES[currentTheme]
		},
		/**
		 * Register a function that adds sources, layers and images.
		 * It runs once the style is ready and again after every theme change,
		 * because `setStyle` replaces everything that was added at runtime.
		 */
		onStyle(callback) {
			styleCallbacks.push(callback)
			if (styleReady) guard('adding layers', () => callback({ map, colors: PALETTES[currentTheme], theme: currentTheme }))
		},
		onCleanup(callback) {
			cleanups.push(callback)
		},
		/** requestAnimationFrame loop that stops on teardown. `callback(seconds, deltaSeconds)`. */
		animate(callback) {
			let frame = 0
			let previous = 0
			let running = true
			const tick = (now) => {
				if (!running || destroyed) return
				const seconds = now / 1000
				try {
					callback(seconds, previous ? Math.min(seconds - previous, 0.1) : 0)
				} catch (error) {
					// Stop the loop instead of throwing sixty times a second.
					running = false
					console.error(`[${example.id}] animation`, error)
					notify.show(String(error?.message ?? error), { title: `${example.title}: animation stopped. ` })
					return
				}
				previous = seconds
				frame = requestAnimationFrame(tick)
			}
			frame = requestAnimationFrame(tick)
			const stop = () => {
				running = false
				cancelAnimationFrame(frame)
			}
			cleanups.push(stop)
			return stop
		},
		/** setInterval that stops on teardown. */
		every(ms, callback) {
			const id = window.setInterval(() => guard('timer', callback), ms)
			const stop = () => window.clearInterval(id)
			cleanups.push(stop)
			return stop
		}
	}

	guard('setup', () => example.setup(ctx))

	return {
		map,
		destroy,
		setTheme(next) {
			if (destroyed || next === currentTheme) return
			currentTheme = next
			styleReady = false
			// MapLibre can render one frame of the old terrain against the new, still-loading style and throw.
			// Dropping terrain first avoids that; the example re-enables it on "style.load".
			if (map.getTerrain()) map.setTerrain(null)
			// A full (non-diff) swap guarantees a "style.load" event, which re-adds the example's layers.
			map.setStyle(carbonStyle(next, example.style), { diff: false })
		}
	}
}
