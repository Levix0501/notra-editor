import { Check, ChevronDown } from 'lucide-react';
import * as React from 'react';

import { cn } from '../lib/utils';
import { Button } from './primitives/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from './primitives/command';
import { Popover, PopoverContent, PopoverTrigger } from './primitives/popover';

interface LanguageOption {
	label: string;
	value: string;
}

export const LANGUAGES: LanguageOption[] = [
	{ label: 'Auto', value: 'auto' },
	{ label: 'Plain Text', value: 'plaintext' },
	{ label: 'ABAP', value: 'abap' },
	{ label: 'Agda', value: 'agda' },
	{ label: 'Arduino', value: 'arduino' },
	{ label: 'ASCII Art', value: 'ascii' },
	{ label: 'Assembly', value: 'x86asm' },
	{ label: 'Bash', value: 'bash' },
	{ label: 'BASIC', value: 'basic' },
	{ label: 'BNF', value: 'bnf' },
	{ label: 'C', value: 'c' },
	{ label: 'C#', value: 'csharp' },
	{ label: 'C++', value: 'cpp' },
	{ label: 'Clojure', value: 'clojure' },
	{ label: 'CoffeeScript', value: 'coffeescript' },
	{ label: 'Coq', value: 'coq' },
	{ label: 'CSS', value: 'css' },
	{ label: 'Dart', value: 'dart' },
	{ label: 'Dhall', value: 'dhall' },
	{ label: 'Diff', value: 'diff' },
	{ label: 'Docker', value: 'dockerfile' },
	{ label: 'EBNF', value: 'ebnf' },
	{ label: 'Elixir', value: 'elixir' },
	{ label: 'Elm', value: 'elm' },
	{ label: 'Erlang', value: 'erlang' },
	{ label: 'F#', value: 'fsharp' },
	{ label: 'Flow', value: 'flow' },
	{ label: 'Fortran', value: 'fortran' },
	{ label: 'Gherkin', value: 'gherkin' },
	{ label: 'GLSL', value: 'glsl' },
	{ label: 'Go', value: 'go' },
	{ label: 'GraphQL', value: 'graphql' },
	{ label: 'Groovy', value: 'groovy' },
	{ label: 'Haskell', value: 'haskell' },
	{ label: 'HCL', value: 'hcl' },
	{ label: 'HTML', value: 'html' },
	{ label: 'Idris', value: 'idris' },
	{ label: 'Java', value: 'java' },
	{ label: 'JavaScript', value: 'javascript' },
	{ label: 'JSON', value: 'json' },
	{ label: 'Julia', value: 'julia' },
	{ label: 'Kotlin', value: 'kotlin' },
	{ label: 'LaTeX', value: 'latex' },
	{ label: 'Less', value: 'less' },
	{ label: 'Lisp', value: 'lisp' },
	{ label: 'LiveScript', value: 'livescript' },
	{ label: 'LLVM IR', value: 'llvm' },
	{ label: 'Lua', value: 'lua' },
	{ label: 'Makefile', value: 'makefile' },
	{ label: 'Markdown', value: 'markdown' },
	{ label: 'Markup', value: 'markup' },
	{ label: 'MATLAB', value: 'matlab' },
	{ label: 'Mathematica', value: 'mathematica' },
	{ label: 'Mermaid', value: 'mermaid' },
	{ label: 'Nix', value: 'nix' },
	{ label: 'Notion Formula', value: 'notion' },
	{ label: 'Objective-C', value: 'objectivec' },
	{ label: 'OCaml', value: 'ocaml' },
	{ label: 'Pascal', value: 'pascal' },
	{ label: 'Perl', value: 'perl' },
	{ label: 'PHP', value: 'php' },
	{ label: 'PowerShell', value: 'powershell' },
	{ label: 'Prolog', value: 'prolog' },
	{ label: 'Protocol Buffers', value: 'protobuf' },
	{ label: 'PureScript', value: 'purescript' },
	{ label: 'Python', value: 'python' },
	{ label: 'R', value: 'r' },
	{ label: 'Racket', value: 'racket' },
	{ label: 'Reason', value: 'reasonml' },
	{ label: 'Ruby', value: 'ruby' },
	{ label: 'Rust', value: 'rust' },
	{ label: 'Sass', value: 'sass' },
	{ label: 'Scala', value: 'scala' },
	{ label: 'Scheme', value: 'scheme' },
	{ label: 'SCSS', value: 'scss' },
	{ label: 'Shell', value: 'shell' },
	{ label: 'Smalltalk', value: 'smalltalk' },
	{ label: 'Solidity', value: 'solidity' },
	{ label: 'SQL', value: 'sql' },
	{ label: 'Swift', value: 'swift' },
	{ label: 'TOML', value: 'toml' },
	{ label: 'TypeScript', value: 'typescript' },
	{ label: 'VB.Net', value: 'vbnet' },
	{ label: 'Verilog', value: 'verilog' },
	{ label: 'VHDL', value: 'vhdl' },
	{ label: 'Visual Basic', value: 'vb' },
	{ label: 'WebAssembly', value: 'wasm' },
	{ label: 'XML', value: 'xml' },
	{ label: 'YAML', value: 'yaml' },
	{ label: 'Zig', value: 'zig' }
];

// Maps common abbreviations and file extensions to canonical language values
const LANGUAGE_ALIASES: Record<string, string> = {
	js: 'javascript',
	jsx: 'javascript',
	ts: 'typescript',
	tsx: 'typescript',
	py: 'python',
	rb: 'ruby',
	rs: 'rust',
	sh: 'bash',
	zsh: 'bash',
	yml: 'yaml',
	md: 'markdown',
	cs: 'csharp',
	fs: 'fsharp',
	kt: 'kotlin',
	ex: 'elixir',
	exs: 'elixir',
	erl: 'erlang',
	hs: 'haskell',
	ml: 'ocaml',
	pl: 'perl',
	ps1: 'powershell',
	proto: 'protobuf',
	tf: 'hcl',
	asm: 'x86asm',
	tex: 'latex',
	text: 'plaintext',
	txt: 'plaintext',
	plain: 'plaintext',
	objc: 'objectivec',
	'objective-c': 'objectivec',
	'c++': 'cpp',
	'f#': 'fsharp',
	'c#': 'csharp',
	gql: 'graphql',
	sol: 'solidity',
	wat: 'wasm',
	docker: 'dockerfile'
};

const LANGUAGE_VALUE_SET = new Set(LANGUAGES.map((l) => l.value));

export function resolveLanguageAlias(input: string): string {
	if (!input) return 'auto';

	const lower = input.toLowerCase();

	if (LANGUAGE_VALUE_SET.has(lower)) return lower;

	return LANGUAGE_ALIASES[lower] ?? lower;
}

export function filterLanguages(
	languages: LanguageOption[],
	search: string
): LanguageOption[] {
	if (!search) return languages;

	const lowerSearch = search.toLowerCase();

	return languages.filter((lang) =>
		lang.label.toLowerCase().includes(lowerSearch)
	);
}

interface LanguageSelectProps {
	language: string;
	onLanguageChange: (language: string) => void;
}

export function LanguageSelect({
	language,
	onLanguageChange
}: LanguageSelectProps) {
	const [open, setOpen] = React.useState(false);

	const currentLabel =
		LANGUAGES.find((lang) => lang.value === language)?.label ??
		LANGUAGES[0].label;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
				<Button
					aria-expanded={open}
					className="justify-between"
					role="combobox"
					size="sm"
					variant="ghost"
				>
					{currentLabel}
					<ChevronDown className="opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[200px] p-0">
				<Command>
					<CommandInput placeholder="Search language..." />
					<CommandList>
						<CommandEmpty>No language found.</CommandEmpty>
						<CommandGroup>
							{LANGUAGES.map((lang) => (
								<CommandItem
									key={lang.value}
									value={lang.label}
									onSelect={() => {
										onLanguageChange(lang.value);
										setOpen(false);
									}}
								>
									{lang.label}
									<Check
										className={cn(
											'ml-auto',
											language === lang.value ? 'opacity-100' : 'opacity-0'
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
