import { h } from './dom.js'

/**
 * Popup body built from DOM nodes (never HTML strings), so feature properties cannot inject markup.
 * `rows` is a list of `[label, value]` pairs.
 */
export function popupContent(title, rows = []) {
	return h(
		'div',
		{ class: 'popup' },
		h('p', { class: 'popup__title' }, title),
		rows.length > 0 &&
			h(
				'dl',
				{ class: 'popup__rows' },
				rows.flatMap(([label, value]) => [h('dt', {}, label), h('dd', {}, String(value))])
			)
	)
}
