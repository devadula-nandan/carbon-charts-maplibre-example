import 'maplibre-gl/dist/maplibre-gl.css'
import './styles.css'

import { CATEGORIES, EXAMPLES, findExample } from './examples/index.js'
import { clear, h, storage } from './lib/dom.js'
import { highlight } from './lib/highlight.js'
import { createNotifier } from './lib/notify.js'
import { mountExample } from './lib/runner.js'
import { DEFAULT_THEME, PALETTES, THEMES, isTheme } from './theme/palettes.js'

const THEME_KEY = 'carbon-maplibre-theme'
const REPO = 'https://github.com/devadula-nandan/carbon-charts-maplibre-example'
const APP_TITLE = 'Carbon × MapLibre examples'

const $ = (id) => document.getElementById(id)
const el = {
	stage: $('stage'),
	notifications: $('notifications'),
	controls: $('controls'),
	controlsSection: document.querySelector('[data-controls-section]'),
	navList: $('nav-list'),
	navFilter: $('nav-filter'),
	navEmpty: $('nav-empty'),
	sideNav: $('side-nav'),
	menuButton: $('menu-button'),
	scrim: $('scrim'),
	themeSwitcher: $('theme-switcher'),
	main: $('main'),
	category: $('doc-category'),
	title: $('doc-title'),
	summary: $('doc-summary'),
	description: $('doc-description'),
	apis: $('doc-apis'),
	source: $('doc-source'),
	file: $('doc-file'),
	copy: $('copy-source'),
	prev: $('pager-prev'),
	next: $('pager-next')
}

const notify = createNotifier(el.notifications)
const stored = storage.get(THEME_KEY)
let theme = isTheme(stored) ? stored : DEFAULT_THEME
let mounted = null
let current = null

/* ---------- Theme ---------- */

function applyTheme(next, { persist = true } = {}) {
	theme = next
	document.body.className = `theme-${theme}${PALETTES[theme].dark ? ' is-dark' : ''}`
	for (const button of el.themeSwitcher.children) {
		const active = button.dataset.theme === theme
		button.classList.toggle('is-active', active)
		button.setAttribute('aria-pressed', String(active))
	}
	if (persist) storage.set(THEME_KEY, theme)
	mounted?.setTheme(theme)
}

el.themeSwitcher.append(
	...THEMES.map((id) =>
		h('button', { type: 'button', class: 'theme-btn', dataset: { theme: id }, onClick: () => applyTheme(id) }, PALETTES[id].label)
	)
)

/* ---------- Navigation ---------- */

const navLinks = new Map()
el.navList.append(
	...CATEGORIES.map((category) =>
		h(
			'section',
			{ class: 'side-nav__group' },
			h('h2', { class: 'side-nav__heading' }, category),
			h(
				'ul',
				{},
				EXAMPLES.filter((example) => example.category === category).map((example) => {
					const link = h('a', { class: 'side-nav__link', href: `#/${example.id}` }, example.title)
					navLinks.set(example.id, link)
					return h('li', {}, link)
				})
			)
		)
	)
)

el.navFilter.addEventListener('input', () => {
	const query = el.navFilter.value.trim().toLowerCase()
	let matches = 0
	for (const example of EXAMPLES) {
		const haystack = `${example.title} ${example.summary} ${example.category}`.toLowerCase()
		const match = haystack.includes(query)
		navLinks.get(example.id).parentElement.hidden = !match
		if (match) matches++
	}
	for (const group of el.navList.children) {
		group.hidden = [...group.querySelectorAll('li')].every((item) => item.hidden)
	}
	el.navEmpty.hidden = matches > 0
})

function setNavOpen(open) {
	el.sideNav.classList.toggle('is-open', open)
	el.scrim.hidden = !open
	el.menuButton.setAttribute('aria-expanded', String(open))
	el.menuButton.setAttribute('aria-label', open ? 'Close example list' : 'Open example list')
}
el.menuButton.addEventListener('click', () => setNavOpen(!el.sideNav.classList.contains('is-open')))
el.scrim.addEventListener('click', () => setNavOpen(false))
document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && el.sideNav.classList.contains('is-open')) {
		setNavOpen(false)
		el.menuButton.focus()
	}
})

/* ---------- Example page ---------- */

function renderDocs(example) {
	const index = EXAMPLES.indexOf(example)
	el.category.textContent = example.category
	el.title.textContent = example.title
	el.summary.textContent = example.summary
	clear(el.description).append(...example.description.map((paragraph) => h('p', {}, paragraph)))
	clear(el.apis).append(
		...example.apis.map(([label, href]) => h('li', {}, h('a', { href, target: '_blank', rel: 'noreferrer' }, label)))
	)
	clear(el.source).append(highlight(example.source))
	el.source.scrollTop = 0
	el.file.textContent = example.file
	el.file.href = `${REPO}/blob/main/${example.file}`

	const link = (anchor, target, prefix) => {
		anchor.hidden = !target
		if (!target) return
		anchor.href = `#/${target.id}`
		clear(anchor).append(h('span', { class: 'pager__label' }, prefix), target.title)
	}
	link(el.prev, EXAMPLES[index - 1], 'Previous')
	link(el.next, EXAMPLES[index + 1], 'Next')
}

function show(example) {
	if (example === current) return
	current = example

	mounted?.destroy()
	mounted = null
	notify.clear()
	clear(el.controls)
	el.controlsSection.hidden = true

	renderDocs(example)
	for (const [id, link] of navLinks) {
		if (id === example.id) link.setAttribute('aria-current', 'page')
		else link.removeAttribute('aria-current')
	}
	navLinks.get(example.id)?.scrollIntoView({ block: 'nearest' })
	document.title = `${example.title} · ${APP_TITLE}`
	document.querySelector('.docs').scrollTop = 0

	mounted = mountExample(example, { stage: el.stage, controls: el.controls, notify, theme })
	// Handy when exploring from the browser console during development.
	if (import.meta.env.DEV) window.__map = mounted.map
}

function route() {
	const id = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''))
	const example = findExample(id)
	setNavOpen(false)
	if (!example) {
		// Unknown or empty hash: fall back to the first example without adding a history entry.
		const fallback = EXAMPLES[0]
		window.history.replaceState(null, '', `#/${fallback.id}`)
		show(fallback)
		if (id) notify.show(`There is no example called “${id}”. Showing “${fallback.title}” instead.`, { kind: 'warning', timeout: 6000 })
		return
	}
	show(example)
}

el.copy.addEventListener('click', async () => {
	try {
		await navigator.clipboard.writeText(current.source)
		el.copy.textContent = 'Copied'
	} catch {
		// Clipboard access can be denied; select the code so Ctrl/⌘+C still works.
		window.getSelection()?.selectAllChildren(el.source)
		el.copy.textContent = 'Press ⌘/Ctrl+C'
	}
	window.setTimeout(() => (el.copy.textContent = 'Copy'), 2000)
})

window.addEventListener('hashchange', route)
window.addEventListener('error', (event) => {
	// A bug in one example must not leave a blank page without explanation.
	if (event.error) notify.show(String(event.error.message ?? event.error), { title: 'Unexpected error. ' })
})
window.addEventListener('unhandledrejection', (event) => {
	if (event.reason?.name === 'AbortError') return
	notify.show(String(event.reason?.message ?? event.reason), { title: 'Unexpected error. ' })
})

applyTheme(theme, { persist: false })
route()
