/**
 * Tiny hyperscript helper. Text is always inserted as text nodes, never as HTML,
 * so feature properties and other data can be rendered without escaping.
 */
export function h(tag, props = {}, ...children) {
	const element = document.createElement(tag)
	for (const [key, value] of Object.entries(props ?? {})) {
		if (value === undefined || value === null || value === false) continue
		if (key === 'class') element.className = value
		else if (key === 'style' && typeof value === 'object') Object.assign(element.style, value)
		else if (key === 'dataset') Object.assign(element.dataset, value)
		else if (key.startsWith('on') && typeof value === 'function') {
			element.addEventListener(key.slice(2).toLowerCase(), value)
		} else if (key in element && key !== 'list' && key !== 'form') element[key] = value
		else element.setAttribute(key, value === true ? '' : value)
	}
	element.append(...children.flat().filter((child) => child !== null && child !== undefined && child !== false))
	return element
}

export function clear(element) {
	element.replaceChildren()
	return element
}

/** localStorage that never throws (private mode, blocked storage, quota). */
export const storage = {
	get(key) {
		try {
			return window.localStorage.getItem(key)
		} catch {
			return null
		}
	},
	set(key, value) {
		try {
			window.localStorage.setItem(key, value)
		} catch {
			// Persistence is a nicety; the app works without it.
		}
	}
}

export function prefersReducedMotion() {
	return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export function formatNumber(value, digits = 0) {
	return Number(value).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}
