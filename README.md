# Carbon × MapLibre examples

Live, documented [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) examples styled with the
[Carbon Design System spatial-chart](https://carbondesignsystem.com/data-visualization/spatial-charts/) map themes —
White, Gray 10, Gray 90 and Gray 100 — on [OpenFreeMap](https://openfreemap.org/) vector tiles. No access token is required.

**Live site: <https://devadula-nandan.github.io/carbon-charts-maplibre-example/>**

> [!NOTE]
> This is only an example. It shows Carbon colors applied on top of MapLibre's capabilities; it is not an official
> Carbon Design System or IBM product, and not a supported library. It was built by [Claude](https://claude.com/claude-code)
> (Anthropic's AI model) as a way to check what Claude can do, so treat the code as a demonstration and review it before reusing it.

Every example is a running map with interactive controls, an explanation of how it works, links to the MapLibre APIs it
uses, and its full source. Switch the Carbon theme in the header and every example re-themes itself, data colors included.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/fork/github/devadula-nandan/carbon-charts-maplibre-example?title=Carbon%20%C3%97%20MapLibre%20examples)

## Examples

### Basemap

| Example | What it shows | Source |
| --- | --- | --- |
| [Carbon themes](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/themes) | The White, Gray 10, Gray 90 and Gray 100 map themes on open vector tiles. | [`themes.js`](src/examples/themes.js) |
| [Compare themes](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/compare) | Swipe between two Carbon themes rendered by two synchronized maps. | [`compare.js`](src/examples/compare.js) |
| [Globe projection](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/globe) | Switch between Web Mercator and the globe, with an optional atmosphere. | [`globe.js`](src/examples/globe.js) |
| [Label language](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/localization) | Switch label language with a text-field expression and lazy-load right-to-left shaping. | [`localization.js`](src/examples/localization.js) |

### Spatial charts

| Example | What it shows | Source |
| --- | --- | --- |
| [Proportional symbols](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/proportional-symbols) | Circles sized by value with a circle layer and a square-root scale. | [`proportional-symbols.js`](src/examples/proportional-symbols.js) |
| [Choropleth](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/choropleth) | Shade regions by value with a fill layer, a sequential palette and hover state. | [`choropleth.js`](src/examples/choropleth.js) |
| [Fill patterns](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/patterns) | Texture regions with fill-pattern images generated at runtime. | [`patterns.js`](src/examples/patterns.js) |
| [Heatmap](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/heatmap) | Show point density with a heatmap layer that hands over to circles when you zoom in. | [`heatmap.js`](src/examples/heatmap.js) |
| [Clusters](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/clusters) | Aggregate dense points with GeoJSON clustering and expand clusters on click. | [`clusters.js`](src/examples/clusters.js) |
| [Connections](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/connections) | Draw origin–destination arcs with a line layer, data-driven width and a gradient. | [`connections.js`](src/examples/connections.js) |
| [Icons and labels](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/symbols) | Place icons with formatted labels using a symbol layer and on-demand images. | [`symbols.js`](src/examples/symbols.js) |
| [3D buildings](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/extrusions) | Extrude building footprints from the vector tiles and color them by height. | [`extrusions.js`](src/examples/extrusions.js) |
| [Terrain and hillshade](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/terrain) | Raster DEM tiles drive 3D terrain, hillshading, elevation tints and a themed sky. | [`terrain.js`](src/examples/terrain.js) |

### Sources

| Example | What it shows | Source |
| --- | --- | --- |
| [Raster imagery](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/raster) | Blend a raster tile source into the vector basemap and tune it with paint properties. | [`raster.js`](src/examples/raster.js) |
| [Canvas and image sources](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/canvas-source) | Georeference an animated canvas and a static image onto the map. | [`canvas-source.js`](src/examples/canvas-source.js) |
| [Custom protocol](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/custom-protocol) | Serve tiles from JavaScript with addProtocol — no server and no network. | [`custom-protocol.js`](src/examples/custom-protocol.js) |
| [Custom WebGL layer](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/custom-layer) | Render your own geometry and shaders inside the map’s WebGL context. | [`custom-layer.js`](src/examples/custom-layer.js) |

### Interaction

| Example | What it shows | Source |
| --- | --- | --- |
| [Popups and hover state](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/popups) | Tooltips on hover, popups on click, and highlighting with feature-state. | [`popups.js`](src/examples/popups.js) |
| [Markers](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/markers) | HTML markers: default pins, custom elements, popups and dragging. | [`markers.js`](src/examples/markers.js) |
| [Map controls](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/map-controls) | Every built-in control, plus a custom one implementing IControl. | [`map-controls.js`](src/examples/map-controls.js) |
| [Camera](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/camera) | Move the camera with jumpTo, easeTo, flyTo and fitBounds; read it back on every frame. | [`camera.js`](src/examples/camera.js) |
| [Gestures and events](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/interactions) | Enable or disable each gesture handler, constrain the camera and watch the event stream. | [`interactions.js`](src/examples/interactions.js) |
| [Filters and queries](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/filters) | Filter a layer with expressions and query what is actually rendered. | [`filters.js`](src/examples/filters.js) |
| [Data-driven styling](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/expressions) | One dataset, four color encodings: interpolate, step, match and case expressions. | [`expressions.js`](src/examples/expressions.js) |
| [Measure distances](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/measure) | Click to draw a path and measure it — interactive editing with one GeoJSON source. | [`measure.js`](src/examples/measure.js) |
| [Inspect and debug](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/inspect) | Read vector-tile features under the pointer and turn on MapLibre’s debug overlays. | [`inspect.js`](src/examples/inspect.js) |
| [Export as image](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/export) | Capture the WebGL canvas to a PNG, with the required attribution burned in. | [`export.js`](src/examples/export.js) |

### Animation

| Example | What it shows | Source |
| --- | --- | --- |
| [Live data](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/live-data) | Stream position updates into a GeoJSON source with partial updates. | [`live-data.js`](src/examples/live-data.js) |
| [Animated route](https://devadula-nandan.github.io/carbon-charts-maplibre-example/#/animation) | Reveal a route over time, move an icon along it and optionally follow with the camera. | [`animation.js`](src/examples/animation.js) |
## Themes

`carbonStyle(theme)` in [`src/theme/style.js`](src/theme/style.js) returns a complete MapLibre style document built from the
tokens in [`src/theme/palettes.js`](src/theme/palettes.js).

| Theme | Background | Water | Park | Building | Label |
| --- | --- | --- | --- | --- | --- |
| White (`white`) | `#ffffff` | `#d0e2ff` | `#defbe6` | `#e0e0e0` | `#161616` |
| Gray 10 (`g10`) | `#f4f4f4` | `#a6c8ff` | `#a7f0ba` | `#e0e0e0` | `#161616` |
| Gray 90 (`g90`) | `#262626` | `#2c3a52` | `#1f3324` | `#333333` | `#f4f4f4` |
| Gray 100 (`g100`) | `#161616` | `#1c2638` | `#1a241c` | `#242424` | `#f4f4f4` |

Dark-theme water is the original gray (`#393939`, `#262626`) tinted with Carbon blue at the same lightness; it is not a
Carbon token.

Each palette also carries Carbon data-visualization colors for the examples: a categorical set tuned for light or dark
backgrounds, three sequential ramps (reversed on dark themes so high values stay prominent), and alert colors.

To use a theme in your own project, copy those two files:

```js
import maplibregl from 'maplibre-gl'
import { carbonStyle } from './theme/style.js'

const map = new maplibregl.Map({ container: 'map', style: carbonStyle('g100') })

// Later: switch theme. Layers you added at runtime must be re-added on "style.load".
map.setStyle(carbonStyle('white'), { diff: false })
```

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev       # http://localhost:5173
npm test          # unit tests
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## Project layout

```text
index.html               App shell: header, navigation, map stage, documentation panel
src/main.js              Hash router, theme switcher, documentation rendering
src/theme/               Carbon palettes and the style generator
src/lib/runner.js        Map lifecycle: creation, re-theming, error handling, teardown
src/lib/controls.js      Carbon-styled form controls used by the examples
src/data/                Bundled sample data and geodesy helpers
src/examples/            One file per example, plus the registry (index.js)
tests/                   Vitest suites
.github/workflows/       CI and GitHub Pages deployment
```

## Writing an example

1. Create `src/examples/<id>.js` with a default export:

   ```js
   import { docs } from '../lib/docs.js'

   export default {
   	id: 'my-example', // must match the file name
   	title: 'My example',
   	category: 'Spatial charts',
   	summary: 'One sentence shown under the title and in the README.',
   	description: ['Paragraph one.', 'Paragraph two.'],
   	apis: [docs.map('addLayer'), docs.layer('circle')],
   	view: { center: [0, 20], zoom: 2 },

   	setup({ map, controls, onStyle }) {
   		// Runs after the style loads and again after every theme change.
   		onStyle(({ colors }) => {
   			map.addSource('points', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
   			map.addLayer({ id: 'points', type: 'circle', source: 'points', paint: { 'circle-color': colors.primary } })
   		})

   		controls.slider('Radius', { min: 2, max: 20, step: 1, value: 5 }, (value) =>
   			map.setPaintProperty('points', 'circle-radius', value)
   		)
   	}
   }
   ```

2. Add the id to `ORDER` in [`src/examples/index.js`](src/examples/index.js).
3. Add a row to the table above, then run `npm test`.

The context passed to `setup` provides:

| Member | Purpose |
| --- | --- |
| `map` | The `maplibregl.Map` instance |
| `onStyle(fn)` | Add sources, layers and images. `fn({ map, colors, theme })` re-runs after each theme change, because `setStyle` discards runtime additions |
| `colors`, `theme` | The active palette and theme id (live getters on the context object) |
| `controls` | `button`, `buttons`, `toggle`, `select`, `slider`, `readout`, `legend`, `log`, `code`, `note`, `custom` |
| `animate(fn)`, `every(ms, fn)` | Animation-frame loop and interval that stop automatically on teardown |
| `onCleanup(fn)`, `signal` | Release anything else you created (extra maps, protocols, DOM listeners) |
| `reducedMotion` | `true` when the user prefers reduced motion; do not auto-play animation |
| `notify` | Show an inline notification over the map |

Optional definition fields: `mapOptions` (extra `Map` options), `navigation: false` (skip the default navigation control)
and `style` (options for `carbonStyle`, such as `{ labels: false }`).

## What the tests cover

The test suite runs every example without a browser. `maplibre-gl` is replaced by a fake map that records sources and
layers, and for each example in each of the four themes the resulting style is checked with the official
[`@maplibre/maplibre-gl-style-spec`](https://www.npmjs.com/package/@maplibre/maplibre-gl-style-spec) validator. The suite
also checks that re-theming rebuilds an identical layer stack, that teardown removes every map, and that every example
has documentation and a row in this README.

Rendering itself (WebGL output, tile servers) is not covered by automated tests.

## Deploying to GitHub Pages

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) tests, builds and publishes `dist/` on every push to `main`.
One-time setup in the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The build uses relative asset paths (`base: './'`) and hash-based routes (`#/choropleth`), so it works under
`/carbon-charts-maplibre-example/`, on a custom domain or in a fork without any configuration.

## Data and services

| What | Source | Notes |
| --- | --- | --- |
| Basemap tiles and fonts | [OpenFreeMap](https://openfreemap.org/) | OpenMapTiles schema, © OpenStreetMap contributors |
| Elevation | [Mapzen Terrarium tiles](https://registry.opendata.aws/terrain-tiles/) on AWS Open Data | Terrain example only |
| Satellite imagery | [NASA GIBS](https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api) Blue Marble | Raster example only |
| Country boundaries | [Natural Earth](https://www.naturalearthdata.com/) 1:110m via [`world-atlas`](https://github.com/topojson/world-atlas) | Bundled |
| Right-to-left text | [`mapbox-gl-rtl-text`](https://github.com/mapbox/mapbox-gl-rtl-text) from unpkg | Loaded lazily by the label-language example |

City populations, country values, events and vehicle positions are sample data generated for these examples. They are
not real statistics.
