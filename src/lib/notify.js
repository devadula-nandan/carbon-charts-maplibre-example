import { h } from './dom.js'

/**
 * Carbon-style inline notifications stacked over the map.
 * Identical messages are collapsed so a failing tile source cannot flood the UI.
 */
export function createNotifier(container) {
	const active = new Map()

	function dismiss(key) {
		active.get(key)?.remove()
		active.delete(key)
	}

	function show(message, { kind = 'error', title, key = `${kind}:${message}`, timeout = 0 } = {}) {
		if (active.has(key)) return key
		const element = h(
			'div',
			{ class: `notification notification--${kind}`, role: kind === 'error' ? 'alert' : 'status' },
			h('div', { class: 'notification__body' }, title && h('strong', {}, title), h('span', {}, message)),
			h('button', {
				class: 'notification__close',
				type: 'button',
				'aria-label': 'Dismiss notification',
				textContent: '×',
				onClick: () => dismiss(key)
			})
		)
		active.set(key, element)
		container.append(element)
		// Keep the stack short: drop the oldest when more than three are visible.
		if (active.size > 3) dismiss(active.keys().next().value)
		if (timeout) window.setTimeout(() => dismiss(key), timeout)
		return key
	}

	function clearAll() {
		for (const key of [...active.keys()]) dismiss(key)
	}

	return { show, dismiss, clear: clearAll }
}
