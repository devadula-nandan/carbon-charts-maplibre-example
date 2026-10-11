import { h, clear } from './dom.js'

let uid = 0
const nextId = () => `ctl-${++uid}`

/**
 * Builds the "Controls" section of an example out of Carbon-styled form elements.
 * Every helper returns a small handle so the example can update the control later.
 */
export function createControls(container) {
	const field = (label, id, ...children) =>
		h('div', { class: 'field' }, label && h('label', { class: 'field__label', htmlFor: id }, label), ...children)

	const add = (element) => {
		container.append(element)
		container.closest('[data-controls-section]')?.removeAttribute('hidden')
		return element
	}

	return {
		/** A row of buttons: `buttons([['Fly', fn], ['Reset', fn, 'ghost']])`. */
		buttons(items) {
			const row = h(
				'div',
				{ class: 'btn-row' },
				items.map(([label, onClick, kind = 'primary']) =>
					h('button', { type: 'button', class: `btn btn--${kind}`, onClick }, label)
				)
			)
			add(row)
			return { element: row }
		},

		button(label, onClick, kind = 'primary') {
			const button = h('button', { type: 'button', class: `btn btn--${kind}`, onClick }, label)
			add(h('div', { class: 'btn-row' }, button))
			return { element: button, setLabel: (text) => (button.textContent = text) }
		},

		toggle(label, value, onChange) {
			const id = nextId()
			const input = h('input', {
				id,
				type: 'checkbox',
				class: 'toggle__input',
				role: 'switch',
				checked: Boolean(value),
				onChange: () => onChange(input.checked)
			})
			add(h('div', { class: 'toggle' }, input, h('label', { class: 'toggle__label', htmlFor: id }, label)))
			return {
				get value() {
					return input.checked
				},
				set(next) {
					input.checked = Boolean(next)
				}
			}
		},

		/** `options` is a list of values or of `[value, label]` pairs. */
		select(label, options, value, onChange) {
			const id = nextId()
			const select = h(
				'select',
				{ id, class: 'select', onChange: () => onChange(select.value) },
				options.map((option) => {
					const [optionValue, optionLabel] = Array.isArray(option) ? option : [option, option]
					return h('option', { value: optionValue, selected: optionValue === value }, optionLabel)
				})
			)
			add(field(label, id, select))
			return {
				get value() {
					return select.value
				},
				set(next) {
					select.value = next
				}
			}
		},

		slider(label, { min = 0, max = 1, step = 0.01, value = min, format = (v) => v }, onChange) {
			const id = nextId()
			const output = h('output', { class: 'field__value', htmlFor: id }, String(format(value)))
			const input = h('input', {
				id,
				type: 'range',
				class: 'slider',
				min,
				max,
				step,
				value,
				onInput: () => {
					const next = Number(input.value)
					output.textContent = String(format(next))
					onChange(next)
				}
			})
			add(
				h(
					'div',
					{ class: 'field' },
					h('div', { class: 'field__head' }, h('label', { class: 'field__label', htmlFor: id }, label), output),
					input
				)
			)
			return {
				get value() {
					return Number(input.value)
				},
				set(next) {
					input.value = next
					output.textContent = String(format(Number(next)))
				}
			}
		},

		/** A labelled live value. Returns a setter. */
		readout(label, initial = '—') {
			const value = h('dd', { class: 'readout__value' }, initial)
			add(h('dl', { class: 'readout' }, h('dt', { class: 'readout__label' }, label), value))
			return (text) => {
				value.textContent = text
			}
		},

		note(text) {
			const element = h('p', { class: 'note' }, text)
			add(element)
			return (next) => {
				element.textContent = next
			}
		},

		/**
		 * A swatch legend. `items` are `{ color, label, shape? }`; call `update` from `onStyle`
		 * so the swatches follow the active Carbon theme.
		 */
		legend(title) {
			const list = h('ul', { class: 'legend__list' })
			const gradient = h('div', { class: 'legend__ramp', hidden: true })
			const scale = h('div', { class: 'legend__scale', hidden: true })
			add(h('div', { class: 'legend' }, title && h('p', { class: 'legend__title' }, title), gradient, scale, list))
			return {
				update(items) {
					clear(list).append(
						...items.map(({ color, label, shape = 'square' }) =>
							h(
								'li',
								{ class: 'legend__item' },
								h('span', { class: `legend__swatch legend__swatch--${shape}`, style: { background: color } }),
								label
							)
						)
					)
				},
				/** Continuous ramp with a low and a high label. Pass `null` to hide it. */
				ramp(colors, low = '', high = '') {
					gradient.hidden = scale.hidden = !colors
					if (!colors) return
					gradient.style.background = `linear-gradient(to right, ${colors.join(', ')})`
					clear(scale).append(h('span', {}, low), h('span', {}, high))
				}
			}
		},

		/** Append any element to the controls panel. */
		custom(element) {
			return add(element)
		},

		/** A labelled block of preformatted text. Returns a setter. */
		code(label, initial = '') {
			const pre = h('pre', { class: 'code code--inline', tabIndex: 0 }, initial)
			add(h('div', { class: 'field' }, h('p', { class: 'field__label' }, label), pre))
			return (text) => {
				pre.textContent = text
			}
		},

		/** A scrolling log of the most recent `limit` entries. Returns an `append` function. */
		log(label, limit = 8) {
			const list = h('ol', { class: 'log', 'aria-live': 'polite' })
			add(h('div', { class: 'field' }, h('p', { class: 'field__label' }, label), list))
			return (text) => {
				list.prepend(h('li', {}, text))
				while (list.children.length > limit) list.lastChild.remove()
			}
		}
	}
}
