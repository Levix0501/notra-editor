export interface Language {
	label: string;
	value: string;
	/**
	 * Aliases recognized by highlight.js for this language. Used by
	 * `normalizeLanguage` so the markdown input rule (e.g. ```js + Enter)
	 * stores the canonical `value` instead of the raw alias. Only canonical
	 * values are listed in this table; an alias that already exists as a
	 * canonical `value` (e.g. `html` for `xml`) is intentionally excluded
	 * to preserve the existing UI label.
	 */
	aliases?: string[];
}

// Curated set transcribed from demo/notra/components/editor/ui/language-select.tsx.
// Keep the order: auto and plaintext first, then alphabetical by label.
// `aliases` mirror the `aliases` field of the corresponding highlight.js
// language module (highlight.js@11). Entries missing from highlight.js's
// shipped languages have no aliases.
export const LANGUAGES: Language[] = [
	{ label: 'Auto', value: 'auto' },
	{ label: 'Plain Text', value: 'plaintext' },
	{ label: 'ABAP', value: 'abap' },
	{ label: 'Agda', value: 'agda' },
	{ label: 'Arduino', value: 'arduino', aliases: ['ino'] },
	{ label: 'ASCII Art', value: 'ascii' },
	{ label: 'Assembly', value: 'x86asm' },
	{ label: 'Bash', value: 'bash', aliases: ['sh', 'zsh'] },
	{ label: 'BASIC', value: 'basic' },
	{ label: 'BNF', value: 'bnf' },
	{ label: 'C', value: 'c', aliases: ['h'] },
	{ label: 'C#', value: 'csharp', aliases: ['cs', 'c#'] },
	{
		label: 'C++',
		value: 'cpp',
		aliases: ['cc', 'c++', 'h++', 'hpp', 'hh', 'hxx', 'cxx']
	},
	{ label: 'Clojure', value: 'clojure', aliases: ['clj', 'edn'] },
	{
		label: 'CoffeeScript',
		value: 'coffeescript',
		aliases: ['coffee', 'cson', 'iced']
	},
	{ label: 'Coq', value: 'coq' },
	{ label: 'CSS', value: 'css' },
	{ label: 'Dart', value: 'dart' },
	{ label: 'Dhall', value: 'dhall' },
	{ label: 'Diff', value: 'diff', aliases: ['patch'] },
	{ label: 'Docker', value: 'dockerfile', aliases: ['docker'] },
	{ label: 'EBNF', value: 'ebnf' },
	{ label: 'Elixir', value: 'elixir', aliases: ['ex', 'exs'] },
	{ label: 'Elm', value: 'elm' },
	{ label: 'Erlang', value: 'erlang', aliases: ['erl'] },
	{ label: 'F#', value: 'fsharp', aliases: ['fs', 'f#'] },
	{ label: 'Flow', value: 'flow' },
	{ label: 'Fortran', value: 'fortran', aliases: ['f90', 'f95'] },
	{ label: 'Gherkin', value: 'gherkin', aliases: ['feature'] },
	{ label: 'GLSL', value: 'glsl' },
	{ label: 'Go', value: 'go', aliases: ['golang'] },
	{ label: 'GraphQL', value: 'graphql', aliases: ['gql'] },
	{ label: 'Groovy', value: 'groovy' },
	{ label: 'Haskell', value: 'haskell', aliases: ['hs'] },
	{ label: 'HCL', value: 'hcl' },
	{ label: 'HTML', value: 'html' },
	{ label: 'Idris', value: 'idris' },
	{ label: 'Java', value: 'java', aliases: ['jsp'] },
	{
		label: 'JavaScript',
		value: 'javascript',
		aliases: ['js', 'jsx', 'mjs', 'cjs']
	},
	{ label: 'JSON', value: 'json', aliases: ['jsonc'] },
	{ label: 'Julia', value: 'julia' },
	{ label: 'Kotlin', value: 'kotlin', aliases: ['kt', 'kts'] },
	{ label: 'LaTeX', value: 'latex', aliases: ['tex'] },
	{ label: 'Less', value: 'less' },
	{ label: 'Lisp', value: 'lisp' },
	{ label: 'LiveScript', value: 'livescript', aliases: ['ls'] },
	{ label: 'LLVM IR', value: 'llvm' },
	{ label: 'Lua', value: 'lua', aliases: ['pluto'] },
	{ label: 'Makefile', value: 'makefile', aliases: ['mk', 'mak', 'make'] },
	{ label: 'Markdown', value: 'markdown', aliases: ['md', 'mkdown', 'mkd'] },
	{ label: 'Markup', value: 'markup' },
	{ label: 'MATLAB', value: 'matlab' },
	{ label: 'Mathematica', value: 'mathematica', aliases: ['mma', 'wl'] },
	{ label: 'Mermaid', value: 'mermaid' },
	{ label: 'Nix', value: 'nix', aliases: ['nixos'] },
	{ label: 'Notion Formula', value: 'notion' },
	{
		label: 'Objective-C',
		value: 'objectivec',
		aliases: ['mm', 'objc', 'obj-c', 'obj-c++', 'objective-c++']
	},
	{ label: 'OCaml', value: 'ocaml', aliases: ['ml'] },
	{ label: 'Pascal', value: 'pascal' },
	{ label: 'Perl', value: 'perl', aliases: ['pl', 'pm'] },
	{ label: 'PHP', value: 'php' },
	{ label: 'PowerShell', value: 'powershell', aliases: ['pwsh', 'ps', 'ps1'] },
	{ label: 'Prolog', value: 'prolog' },
	{ label: 'Protocol Buffers', value: 'protobuf', aliases: ['proto'] },
	{ label: 'PureScript', value: 'purescript' },
	{ label: 'Python', value: 'python', aliases: ['py', 'gyp', 'ipython'] },
	{ label: 'R', value: 'r' },
	{ label: 'Racket', value: 'racket' },
	{ label: 'Reason', value: 'reasonml', aliases: ['re'] },
	{
		label: 'Ruby',
		value: 'ruby',
		aliases: ['rb', 'gemspec', 'podspec', 'thor', 'irb']
	},
	{ label: 'Rust', value: 'rust', aliases: ['rs'] },
	{ label: 'Sass', value: 'sass' },
	{ label: 'Scala', value: 'scala' },
	{ label: 'Scheme', value: 'scheme', aliases: ['scm'] },
	{ label: 'SCSS', value: 'scss' },
	{ label: 'Shell', value: 'shell', aliases: ['console', 'shellsession'] },
	{ label: 'Smalltalk', value: 'smalltalk', aliases: ['st'] },
	{ label: 'Solidity', value: 'solidity' },
	{ label: 'SQL', value: 'sql' },
	{ label: 'Swift', value: 'swift' },
	{ label: 'TOML', value: 'toml' },
	{
		label: 'TypeScript',
		value: 'typescript',
		aliases: ['ts', 'tsx', 'mts', 'cts']
	},
	{ label: 'VB.Net', value: 'vbnet', aliases: ['vb'] },
	{ label: 'Verilog', value: 'verilog', aliases: ['v', 'sv', 'svh'] },
	{ label: 'VHDL', value: 'vhdl' },
	{ label: 'Visual Basic', value: 'visualbasic' },
	{ label: 'WebAssembly', value: 'wasm' },
	{
		label: 'XML',
		value: 'xml',
		// Note: highlight.js also lists "html" here, but `html` is its own
		// canonical entry above; including it would rewrite html → xml.
		aliases: ['xhtml', 'rss', 'atom', 'xjb', 'xsd', 'xsl', 'plist', 'wsf', 'svg']
	},
	{ label: 'YAML', value: 'yaml', aliases: ['yml'] }
];

const ALIAS_TO_CANONICAL = (() => {
	const map = new Map<string, string>();

	for (const lang of LANGUAGES) {
		for (const alias of lang.aliases ?? []) {
			map.set(alias, lang.value);
		}
	}

	return map;
})();

/**
 * Resolve a user-supplied language identifier to a canonical LANGUAGES.value.
 * Aliases (e.g. `js`, `ts`, `py`) collapse to their canonical form
 * (`javascript`, `typescript`, `python`); unknown identifiers and canonical
 * values pass through unchanged. Empty / undefined input returns ''.
 */
export function normalizeLanguage(input: string | undefined | null): string {
	if (!input) return '';

	return ALIAS_TO_CANONICAL.get(input) ?? input;
}

export function getLanguageLabel(value: string | null | undefined): string {
	if (!value) return 'Auto';

	const found = LANGUAGES.find((l) => l.value === value);

	return found?.label ?? value;
}
