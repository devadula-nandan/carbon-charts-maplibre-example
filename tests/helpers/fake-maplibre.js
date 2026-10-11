/**
 * A WebGL-free stand-in for maplibre-gl, used to run every example in Node.
 *
 * `FakeMap` keeps a real style document: sources and layers added by an example are
 * recorded exactly as MapLibre would hold them, so the result can be checked with the
 * official style-spec validator. Everything else (popups, markers, controls, camera
 * calls) is absorbed by a "black hole" proxy that accepts any call.
 */
export function blackhole() {
	return new Proxy(function () {}, {
		get(_, key) {
			// Not a thenable (so `await` resolves) and coerces to a harmless primitive.
			if (key === 'then') return undefined
			if (key === Symbol.toPrimitive) return () => 0
			return blackhole()
		},
		apply: () => blackhole(),
		construct: () => blackhole()
	})
}

export const maps = []

export class FakeMap {
	constructor(options) {
		this.options = options
		this.handlers = {}
		this.images = new Set()
		this.removed = false
		this._load(options.style)
		maps.push(this)
		return new Proxy(this, {
			get: (target, key) => (key in target ? target[key] : blackhole()),
			set: (target, key, value) => {
				target[key] = value
				return true
			}
		})
	}

	_load(style) {
		this.style = structuredClone(style)
		this.images.clear()
	}

	_layer(id) {
		const layer = this.style.layers.find((candidate) => candidate.id === id)
		if (!layer) throw new Error(`Layer "${id}" does not exist in the map's style`)
		return layer
	}

	on(type, layerOrHandler, handler) {
		;(this.handlers[type] ??= []).push(handler ?? layerOrHandler)
		return this
	}

	once(...args) {
		return this.on(...args)
	}

	fire(type, event = {}) {
		for (const handler of this.handlers[type] ?? []) handler(event)
	}

	setStyle(style) {
		this._load(style)
		this.fire('style.load')
	}

	getStyle() {
		return this.style
	}

	addSource(id, source) {
		if (this.style.sources[id]) throw new Error(`Source "${id}" already exists`)
		this.style.sources[id] = source
	}

	getSource(id) {
		return this.style.sources[id] ? blackhole() : undefined
	}

	addLayer(layer, beforeId) {
		if (this.style.layers.some((candidate) => candidate.id === layer.id)) {
			throw new Error(`Layer "${layer.id}" already exists`)
		}
		if (layer.type !== 'custom' && layer.source && !this.style.sources[layer.source]) {
			throw new Error(`Layer "${layer.id}" uses missing source "${layer.source}"`)
		}
		if (beforeId === undefined) this.style.layers.push(layer)
		else this.style.layers.splice(this.style.layers.indexOf(this._layer(beforeId)), 0, layer)
	}

	getLayer(id) {
		return this.style.layers.find((layer) => layer.id === id)
	}

	setPaintProperty(id, property, value) {
		const layer = this._layer(id)
		layer.paint ??= {}
		if (value === undefined || value === null) delete layer.paint[property]
		else layer.paint[property] = value
	}

	setLayoutProperty(id, property, value) {
		const layer = this._layer(id)
		layer.layout ??= {}
		if (value === undefined || value === null) delete layer.layout[property]
		else layer.layout[property] = value
	}

	setFilter(id, filter) {
		this._layer(id).filter = filter
	}

	addImage(id) {
		if (this.images.has(id)) throw new Error(`Image "${id}" already exists`)
		this.images.add(id)
	}

	hasImage(id) {
		return this.images.has(id)
	}

	setTerrain(terrain) {
		if (terrain && !this.style.sources[terrain.source]) throw new Error(`Terrain source "${terrain.source}" is missing`)
		this.style.terrain = terrain ?? undefined
	}

	getTerrain() {
		return this.style.terrain ?? null
	}

	setSky(sky) {
		this.style.sky = sky
	}

	setProjection(projection) {
		this.style.projection = projection
	}

	setLight(light) {
		this.style.light = light
	}

	remove() {
		this.removed = true
	}

	getCenter() {
		return { lng: 0, lat: 0, toArray: () => [0, 0] }
	}

	getZoom() {
		return 2
	}

	getPitch() {
		return 0
	}

	getBearing() {
		return 0
	}

	isZooming() {
		return false
	}

	hasControl() {
		return false
	}

	areTilesLoaded() {
		return true
	}

	queryRenderedFeatures() {
		return []
	}

	queryTerrainElevation() {
		return null
	}
}

const fake = blackhole()
export default new Proxy(fake, {
	get: (target, key) => (key === 'Map' ? FakeMap : target[key])
})
