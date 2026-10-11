/**
 * Sample data: approximate metropolitan population in millions.
 * Values are rounded and only meant to drive the visual encodings in the examples.
 */
export const REGIONS = ['Americas', 'Europe', 'Africa', 'Asia', 'Oceania']

export const CITIES = [
	{ name: 'New York', region: 'Americas', coordinates: [-74.006, 40.7128], population: 19.5 },
	{ name: 'Los Angeles', region: 'Americas', coordinates: [-118.2437, 34.0522], population: 12.9 },
	{ name: 'Chicago', region: 'Americas', coordinates: [-87.6298, 41.8781], population: 9.3 },
	{ name: 'Houston', region: 'Americas', coordinates: [-95.3698, 29.7604], population: 7.3 },
	{ name: 'Toronto', region: 'Americas', coordinates: [-79.3832, 43.6532], population: 6.4 },
	{ name: 'Mexico City', region: 'Americas', coordinates: [-99.1332, 19.4326], population: 21.8 },
	{ name: 'Bogotá', region: 'Americas', coordinates: [-74.0721, 4.711], population: 11.3 },
	{ name: 'Lima', region: 'Americas', coordinates: [-77.0428, -12.0464], population: 11.0 },
	{ name: 'São Paulo', region: 'Americas', coordinates: [-46.6333, -23.5505], population: 22.4 },
	{ name: 'Buenos Aires', region: 'Americas', coordinates: [-58.3816, -34.6037], population: 15.4 },
	{ name: 'London', region: 'Europe', coordinates: [-0.1276, 51.5072], population: 9.6 },
	{ name: 'Paris', region: 'Europe', coordinates: [2.3522, 48.8566], population: 11.2 },
	{ name: 'Madrid', region: 'Europe', coordinates: [-3.7038, 40.4168], population: 6.7 },
	{ name: 'Berlin', region: 'Europe', coordinates: [13.405, 52.52], population: 3.6 },
	{ name: 'Rome', region: 'Europe', coordinates: [12.4964, 41.9028], population: 4.3 },
	{ name: 'Istanbul', region: 'Europe', coordinates: [28.9784, 41.0082], population: 15.8 },
	{ name: 'Moscow', region: 'Europe', coordinates: [37.6173, 55.7558], population: 12.7 },
	{ name: 'Stockholm', region: 'Europe', coordinates: [18.0686, 59.3293], population: 1.7 },
	{ name: 'Lagos', region: 'Africa', coordinates: [3.3792, 6.5244], population: 15.9 },
	{ name: 'Cairo', region: 'Africa', coordinates: [31.2357, 30.0444], population: 21.8 },
	{ name: 'Kinshasa', region: 'Africa', coordinates: [15.2663, -4.4419], population: 16.3 },
	{ name: 'Nairobi', region: 'Africa', coordinates: [36.8219, -1.2921], population: 5.3 },
	{ name: 'Johannesburg', region: 'Africa', coordinates: [28.0473, -26.2041], population: 6.2 },
	{ name: 'Casablanca', region: 'Africa', coordinates: [-7.5898, 33.5731], population: 3.9 },
	{ name: 'Dubai', region: 'Asia', coordinates: [55.2708, 25.2048], population: 3.0 },
	{ name: 'Tehran', region: 'Asia', coordinates: [51.389, 35.6892], population: 9.5 },
	{ name: 'Karachi', region: 'Asia', coordinates: [67.0011, 24.8607], population: 17.2 },
	{ name: 'Mumbai', region: 'Asia', coordinates: [72.8777, 19.076], population: 21.3 },
	{ name: 'Delhi', region: 'Asia', coordinates: [77.209, 28.6139], population: 32.9 },
	{ name: 'Dhaka', region: 'Asia', coordinates: [90.4125, 23.8103], population: 23.2 },
	{ name: 'Bangkok', region: 'Asia', coordinates: [100.5018, 13.7563], population: 11.1 },
	{ name: 'Singapore', region: 'Asia', coordinates: [103.8198, 1.3521], population: 6.0 },
	{ name: 'Jakarta', region: 'Asia', coordinates: [106.8456, -6.2088], population: 11.2 },
	{ name: 'Manila', region: 'Asia', coordinates: [120.9842, 14.5995], population: 14.7 },
	{ name: 'Shanghai', region: 'Asia', coordinates: [121.4737, 31.2304], population: 29.2 },
	{ name: 'Beijing', region: 'Asia', coordinates: [116.4074, 39.9042], population: 21.8 },
	{ name: 'Seoul', region: 'Asia', coordinates: [126.978, 37.5665], population: 9.9 },
	{ name: 'Tokyo', region: 'Asia', coordinates: [139.6917, 35.6895], population: 37.2 },
	{ name: 'Sydney', region: 'Oceania', coordinates: [151.2093, -33.8688], population: 5.1 },
	{ name: 'Melbourne', region: 'Oceania', coordinates: [144.9631, -37.8136], population: 5.2 },
	{ name: 'Auckland', region: 'Oceania', coordinates: [174.7633, -36.8485], population: 1.7 }
]

export const MAX_POPULATION = Math.max(...CITIES.map((city) => city.population))

export function cityByName(name) {
	return CITIES.find((city) => city.name === name)
}

/** The cities as a GeoJSON FeatureCollection. Each feature has a numeric `id` for feature-state. */
export function citiesGeoJson(cities = CITIES) {
	return {
		type: 'FeatureCollection',
		features: cities.map((city) => ({
			type: 'Feature',
			id: CITIES.indexOf(city),
			properties: { name: city.name, region: city.region, population: city.population },
			geometry: { type: 'Point', coordinates: city.coordinates }
		}))
	}
}
