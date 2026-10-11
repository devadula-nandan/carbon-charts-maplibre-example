/** Small, dependency-free geodesy helpers used by the examples. */
const RAD = Math.PI / 180
const EARTH_RADIUS_KM = 6371.0088

/** Deterministic PRNG (mulberry32) so sample data is identical on every load. */
export function seededRandom(seed = 1) {
	let state = seed >>> 0
	return () => {
		state = (state + 0x6d2b79f5) >>> 0
		let t = state
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

/** Great-circle distance in kilometres between two [lng, lat] positions. */
export function haversine([lng1, lat1], [lng2, lat2]) {
	const dLat = (lat2 - lat1) * RAD
	const dLng = (lng2 - lng1) * RAD
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLng / 2) ** 2
	return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** Total length of a line in kilometres. */
export function lineLength(coordinates) {
	let total = 0
	for (let i = 1; i < coordinates.length; i++) total += haversine(coordinates[i - 1], coordinates[i])
	return total
}

/** Initial bearing in degrees (0 = north, clockwise) from one position to another. */
export function bearing([lng1, lat1], [lng2, lat2]) {
	const dLng = (lng2 - lng1) * RAD
	const y = Math.sin(dLng) * Math.cos(lat2 * RAD)
	const x = Math.cos(lat1 * RAD) * Math.sin(lat2 * RAD) - Math.sin(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.cos(dLng)
	return (Math.atan2(y, x) / RAD + 360) % 360
}

/**
 * Points along the great circle between two positions.
 * Longitudes are left "unwrapped" (they may pass ±180) so that MapLibre draws the arc
 * across the antimeridian instead of the long way around the world.
 */
export function greatCircle(from, to, steps = 64) {
	const [lng1, lat1] = [from[0] * RAD, from[1] * RAD]
	const [lng2, lat2] = [to[0] * RAD, to[1] * RAD]
	const d =
		2 *
		Math.asin(
			Math.sqrt(Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2)
		)
	if (!Number.isFinite(d) || d === 0) return [from, to]

	const points = []
	let previousLng = from[0]
	for (let i = 0; i <= steps; i++) {
		const f = i / steps
		const a = Math.sin((1 - f) * d) / Math.sin(d)
		const b = Math.sin(f * d) / Math.sin(d)
		const x = a * Math.cos(lat1) * Math.cos(lng1) + b * Math.cos(lat2) * Math.cos(lng2)
		const y = a * Math.cos(lat1) * Math.sin(lng1) + b * Math.cos(lat2) * Math.sin(lng2)
		const z = a * Math.sin(lat1) + b * Math.sin(lat2)
		let lng = Math.atan2(y, x) / RAD
		const lat = Math.atan2(z, Math.hypot(x, y)) / RAD
		while (lng - previousLng > 180) lng -= 360
		while (lng - previousLng < -180) lng += 360
		previousLng = lng
		points.push([lng, lat])
	}
	return points
}

/**
 * Slice a line at a fraction (0–1) of its length.
 * Returns the coordinates up to that point, the interpolated head position and its bearing.
 */
export function sliceAlong(coordinates, fraction) {
	const clamped = Math.max(0, Math.min(1, fraction))
	const target = lineLength(coordinates) * clamped
	const out = [coordinates[0]]
	let travelled = 0
	for (let i = 1; i < coordinates.length; i++) {
		const segment = haversine(coordinates[i - 1], coordinates[i])
		if (travelled + segment >= target && segment > 0) {
			const t = (target - travelled) / segment
			const [a, b] = [coordinates[i - 1], coordinates[i]]
			const head = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
			out.push(head)
			return { coordinates: out, head, bearing: bearing(a, b) }
		}
		travelled += segment
		out.push(coordinates[i])
	}
	const last = coordinates[coordinates.length - 1]
	return { coordinates: out, head: last, bearing: bearing(coordinates[coordinates.length - 2] ?? last, last) }
}

/** [west, south, east, north] of a list of positions. */
export function boundsOf(positions) {
	let [west, south, east, north] = [Infinity, Infinity, -Infinity, -Infinity]
	for (const [lng, lat] of positions) {
		west = Math.min(west, lng)
		east = Math.max(east, lng)
		south = Math.min(south, lat)
		north = Math.max(north, lat)
	}
	return [west, south, east, north]
}

export function formatDistance(km) {
	return km >= 100 ? `${Math.round(km).toLocaleString('en-US')} km` : km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(km * 1000)} m`
}
