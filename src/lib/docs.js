/** Link builders for the MapLibre GL JS API reference and the MapLibre Style Spec. */
const API = 'https://maplibre.org/maplibre-gl-js/docs/API'
const SPEC = 'https://maplibre.org/maplibre-style-spec'

export const docs = {
	/** A `Map` method, e.g. docs.map('flyTo'). */
	map: (method) => [`Map#${method}`, `${API}/classes/Map/#${method.toLowerCase()}`],
	/** A class and optionally one of its members, e.g. docs.cls('Popup', 'setLngLat'). */
	cls: (name, member) => [
		member ? `${name}#${member}` : name,
		`${API}/classes/${name}/${member ? `#${member.toLowerCase()}` : ''}`
	],
	type: (name) => [name, `${API}/type-aliases/${name}/`],
	iface: (name) => [name, `${API}/interfaces/${name}/`],
	fn: (name) => [`${name}()`, `${API}/functions/${name}/`],
	/** A map event, e.g. docs.event('click'). */
	event: (name) => [`"${name}" event`, `${API}/type-aliases/MapEventType/#${name.toLowerCase()}`],
	/** A style-spec layer type, e.g. docs.layer('circle'). */
	layer: (type) => [`${type} layer`, `${SPEC}/layers/#${type}`],
	source: (type) => [`${type} source`, `${SPEC}/sources/#${type}`],
	expression: (name) => [`["${name}"]`, `${SPEC}/expressions/#${name}`],
	spec: (label, path) => [label, `${SPEC}/${path}`]
}
