import { h } from './dom.js'

const KEYWORDS = new Set(
	'import export default from const let var function return if else for while of in new class extends async await try catch finally throw typeof instanceof this null undefined true false break continue switch case void delete'.split(
		' '
	)
)

// Order matters: comments and strings are matched before anything inside them can be.
const TOKEN =
	/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\[\s\S]|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")|(\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b)|([A-Za-z_$][\w$]*)/g

/** Dependency-free JavaScript highlighter. Returns a DocumentFragment of text nodes and spans. */
export function highlight(source) {
	const fragment = document.createDocumentFragment()
	let last = 0
	for (const match of source.matchAll(TOKEN)) {
		const [text, comment, string, number, word] = match
		const kind = comment ? 'comment' : string ? 'string' : number ? 'number' : KEYWORDS.has(word) ? 'keyword' : null
		if (!kind) continue
		if (match.index > last) fragment.append(source.slice(last, match.index))
		fragment.append(h('span', { class: `tok-${kind}` }, text))
		last = match.index + text.length
	}
	fragment.append(source.slice(last))
	return fragment
}
