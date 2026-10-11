import maplibregl from 'maplibre-gl'
import { CITIES } from '../data/cities.js'
import { docs } from '../lib/docs.js'

const HALF_SIZE = 0.012 // quad half-width in Mercator units (the whole world is 1 unit wide)

function hexToRgb(hex) {
	const value = Number.parseInt(hex.slice(1), 16)
	return [(value >> 16) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]
}

/**
 * A layer drawn with raw WebGL: one quad per city, shaded as expanding pulse rings.
 * It uses MapLibre's shader prelude (`projectTile`) so the same code works in
 * Mercator and on the globe.
 */
function createPulseLayer(color, animated) {
	const programs = new Map()
	let buffer = null
	let vertexCount = 0
	let map = null

	const compile = (gl, type, source) => {
		const shader = gl.createShader(type)
		gl.shaderSource(shader, source)
		gl.compileShader(shader)
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			const log = gl.getShaderInfoLog(shader)
			gl.deleteShader(shader)
			throw new Error(`Shader failed to compile: ${log}`)
		}
		return shader
	}

	// MapLibre needs a different shader variant per projection; cache one program for each.
	const programFor = (gl, shaderData) => {
		if (programs.has(shaderData.variantName)) return programs.get(shaderData.variantName)
		const vertex = `#version 300 es
			${shaderData.vertexShaderPrelude}
			${shaderData.define}
			in vec2 a_pos;
			in vec2 a_uv;
			out vec2 v_uv;
			void main() {
				v_uv = a_uv;
				gl_Position = projectTile(a_pos);
			}`
		const fragment = `#version 300 es
			precision highp float;
			uniform vec3 u_color;
			uniform float u_time;
			in vec2 v_uv;
			out vec4 fragColor;
			void main() {
				float d = length(v_uv);
				if (d > 1.0) discard;
				float ring = fract(d * 2.0 - u_time * 0.5);
				float alpha = smoothstep(0.75, 1.0, ring) * (1.0 - d) + smoothstep(0.16, 0.1, d);
				// MapLibre blends with premultiplied alpha.
				fragColor = vec4(u_color * alpha, alpha);
			}`
		const program = gl.createProgram()
		gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertex))
		gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment))
		gl.linkProgram(program)
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			throw new Error(`Program failed to link: ${gl.getProgramInfoLog(program)}`)
		}
		programs.set(shaderData.variantName, program)
		return program
	}

	return {
		id: 'pulses',
		type: 'custom',
		renderingMode: '2d',

		onAdd(owner, gl) {
			map = owner
			const vertices = []
			for (const city of CITIES) {
				const { x, y } = maplibregl.MercatorCoordinate.fromLngLat(city.coordinates)
				const corners = [[-1, -1], [1, -1], [-1, 1], [-1, 1], [1, -1], [1, 1]]
				for (const [u, v] of corners) vertices.push(x + u * HALF_SIZE, y + v * HALF_SIZE, u, v)
			}
			vertexCount = vertices.length / 4
			buffer = gl.createBuffer()
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
		},

		render(gl, args) {
			const program = programFor(gl, args.shaderData)
			const projection = args.defaultProjectionData
			gl.useProgram(program)

			// Uniforms consumed by MapLibre's `projectTile`.
			const uniform = (name) => gl.getUniformLocation(program, name)
			gl.uniformMatrix4fv(uniform('u_projection_matrix'), false, projection.mainMatrix)
			gl.uniformMatrix4fv(uniform('u_projection_fallback_matrix'), false, projection.fallbackMatrix)
			gl.uniform4f(uniform('u_projection_tile_mercator_coords'), ...projection.tileMercatorCoords)
			gl.uniform4f(uniform('u_projection_clipping_plane'), ...projection.clippingPlane)
			gl.uniform1f(uniform('u_projection_transition'), projection.projectionTransition)

			gl.uniform3f(uniform('u_color'), ...color)
			gl.uniform1f(uniform('u_time'), animated ? performance.now() / 1000 : 1.3)

			const position = gl.getAttribLocation(program, 'a_pos')
			const uv = gl.getAttribLocation(program, 'a_uv')
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
			gl.enableVertexAttribArray(position)
			gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 16, 0)
			gl.enableVertexAttribArray(uv)
			gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 16, 8)

			gl.enable(gl.BLEND)
			gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
			gl.drawArrays(gl.TRIANGLES, 0, vertexCount)

			// Ask for another frame: custom layers are only drawn when the map repaints.
			if (animated) map.triggerRepaint()
		},

		onRemove(_, gl) {
			for (const program of programs.values()) gl.deleteProgram(program)
			programs.clear()
			gl.deleteBuffer(buffer)
		}
	}
}

export default {
	id: 'custom-layer',
	title: 'Custom WebGL layer',
	category: 'Sources',
	summary: 'Render your own geometry and shaders inside the map’s WebGL context.',
	description: [
		'When the built-in layer types are not enough, a custom layer implements onAdd, render and onRemove and draws directly into MapLibre’s WebGL context — sharing its depth buffer, camera and draw order. This is how deck.gl and three.js integrate.',
		'This layer draws one quad per city and shades animated pulse rings in the fragment shader, tinted with the theme’s primary color. It includes MapLibre’s shader prelude and calls projectTile(), so it stays correct when you switch to the globe.'
	],
	apis: [
		docs.iface('CustomLayerInterface'),
		docs.type('CustomRenderMethodInput'),
		docs.cls('MercatorCoordinate', 'fromLngLat'),
		docs.map('triggerRepaint'),
		docs.map('setProjection')
	],
	view: { center: [30, 25], zoom: 1.8 },

	setup({ map, controls, onStyle, reducedMotion, notify }) {
		let globe = false

		onStyle(({ colors }) => {
			map.setProjection({ type: globe ? 'globe' : 'mercator' })
			// The shaders are GLSL ES 3.00, which needs the WebGL 2 context MapLibre uses by default.
			if (!map.getCanvas().getContext('webgl2')) {
				notify.show('This example needs WebGL 2, which this browser did not provide.', { kind: 'warning' })
				return
			}
			map.addLayer(createPulseLayer(hexToRgb(colors.primary), !reducedMotion))
		})

		controls.toggle('Globe projection', globe, (value) => {
			globe = value
			map.setProjection({ type: globe ? 'globe' : 'mercator' })
		})
		controls.note(reducedMotion ? 'Animation is off because your system prefers reduced motion.' : 'Rings are animated in the fragment shader.')
	}
}
