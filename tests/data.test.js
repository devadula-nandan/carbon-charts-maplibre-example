import { describe, expect, it } from 'vitest'
import { CITIES, REGIONS, citiesGeoJson, cityByName } from '../src/data/cities.js'
import { countriesGeoJson } from '../src/data/countries.js'
import { boundsOf, formatDistance, greatCircle, haversine, lineLength, seededRandom, sliceAlong } from '../src/data/geo.js'
import { CATEGORIES, eventsGeoJson } from '../src/data/points.js'

const validPosition = ([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lat) <= 90

describe('geo helpers', () => {
	it('seededRandom is deterministic and within [0, 1)', () => {
		const a = seededRandom(5)
		const b = seededRandom(5)
		for (let i = 0; i < 100; i++) {
			const value = a()
			expect(value).toBe(b())
			expect(value).toBeGreaterThanOrEqual(0)
			expect(value).toBeLessThan(1)
		}
	})

	it('measures great-circle distance', () => {
		const london = cityByName('London').coordinates
		const paris = cityByName('Paris').coordinates
		expect(haversine(london, paris)).toBeGreaterThan(335)
		expect(haversine(london, paris)).toBeLessThan(350)
		expect(haversine(london, london)).toBe(0)
	})

	it('builds arcs that keep their endpoints and never jump across the antimeridian', () => {
		const tokyo = cityByName('Tokyo').coordinates
		const la = cityByName('Los Angeles').coordinates
		const arc = greatCircle(tokyo, la, 32)
		expect(arc).toHaveLength(33)
		expect(arc[0][0]).toBeCloseTo(tokyo[0])
		// Unwrapped: Los Angeles is reached at -118 + 360.
		expect(arc.at(-1)[0]).toBeCloseTo(la[0] + 360)
		for (let i = 1; i < arc.length; i++) expect(Math.abs(arc[i][0] - arc[i - 1][0])).toBeLessThan(30)
		expect(lineLength(arc)).toBeCloseTo(haversine(tokyo, la), 0)
	})

	it('handles identical endpoints', () => {
		expect(greatCircle([1, 2], [1, 2])).toEqual([[1, 2], [1, 2]])
	})

	it('slices a line by fraction', () => {
		const line = [[0, 0], [10, 0], [20, 0]]
		expect(sliceAlong(line, 0).coordinates).toHaveLength(2)
		const half = sliceAlong(line, 0.5)
		expect(half.head[0]).toBeCloseTo(10)
		expect(half.bearing).toBeCloseTo(90)
		expect(sliceAlong(line, 1).head).toEqual([20, 0])
		// Out-of-range input is clamped rather than extrapolated.
		expect(sliceAlong(line, 7).head).toEqual([20, 0])
		expect(sliceAlong(line, -1).head[0]).toBeCloseTo(0)
	})

	it('computes bounds and formats distances', () => {
		expect(boundsOf([[1, 2], [-3, 8]])).toEqual([-3, 2, 1, 8])
		expect(formatDistance(0.25)).toBe('250 m')
		expect(formatDistance(12.34)).toBe('12.3 km')
		expect(formatDistance(1234.5)).toBe('1,235 km')
	})
})

describe('sample data', () => {
	it('cities are well formed', () => {
		const names = CITIES.map((city) => city.name)
		expect(new Set(names).size).toBe(names.length)
		for (const city of CITIES) {
			expect(validPosition(city.coordinates)).toBe(true)
			expect(REGIONS).toContain(city.region)
			expect(city.population).toBeGreaterThan(0)
		}
		const ids = citiesGeoJson().features.map((feature) => feature.id)
		expect(new Set(ids).size).toBe(CITIES.length)
	})

	it('countries have unique numeric ids, names and values', () => {
		const { features } = countriesGeoJson()
		expect(features.length).toBeGreaterThan(150)
		expect(new Set(features.map((feature) => feature.id)).size).toBe(features.length)
		for (const feature of features) {
			expect(Number.isInteger(feature.id)).toBe(true)
			expect(feature.properties.name).toBeTruthy()
			expect(feature.properties.value).toBeGreaterThanOrEqual(0)
			expect(feature.properties.value).toBeLessThanOrEqual(100)
			expect(['Polygon', 'MultiPolygon']).toContain(feature.geometry.type)
		}
		expect(countriesGeoJson()).toBe(countriesGeoJson())
	})

	it('events are deterministic and valid', () => {
		const first = eventsGeoJson()
		expect(eventsGeoJson()).toEqual(first)
		expect(first.features.length).toBeGreaterThan(1000)
		for (const feature of first.features) {
			expect(validPosition(feature.geometry.coordinates)).toBe(true)
			expect(CATEGORIES).toContain(feature.properties.category)
			expect(feature.properties.magnitude).toBeGreaterThanOrEqual(1)
			expect(feature.properties.magnitude).toBeLessThanOrEqual(10)
		}
	})
})
