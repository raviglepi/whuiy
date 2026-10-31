/**
 * Generates the platform descriptor lists behind `Style`, `Event`, `Element`,
 * and `Property`.
 *
 * The source of truth is the `lib.dom.d.ts` shipped with the TypeScript compiler.
 * Run `bun run generate` after upgrading TypeScript; `bun run generate:check`
 * fails when the committed file is stale.
 */

const OUTPUT = "packages/core/src/generated/platform.ts";

/**
 * The element interfaces whose writable primitive properties become `Property`
 * tokens. `HTMLElement` carries the global attributes; the rest cover the
 * controls and media elements an app actually binds.
 */
const PROPERTY_ROOTS = [
  "HTMLElement",
  "HTMLAnchorElement",
  "HTMLAudioElement",
  "HTMLButtonElement",
  "HTMLDetailsElement",
  "HTMLDialogElement",
  "HTMLFormElement",
  "HTMLImageElement",
  "HTMLInputElement",
  "HTMLLabelElement",
  "HTMLMediaElement",
  "HTMLOptionElement",
  "HTMLSelectElement",
  "HTMLTextAreaElement",
  "HTMLVideoElement",
];

/** Properties that parse or serialize markup are not exposed as tokens. */
const DENIED_PROPERTIES = new Set([
  "innerHTML",
  "innerText",
  "outerHTML",
  "outerText",
  // Anchor URL decomposition: settings that read as form fields and mislead.
  "hash",
  "host",
  "hostname",
  "password",
  "pathname",
  "port",
  "protocol",
  "search",
  "username",
]);

const PRIMITIVE_TYPES = new Set(["boolean", "number", "string"]);

interface InterfaceBlock {
  readonly bases: readonly string[];
  readonly members: readonly string[];
  readonly typed: readonly TypedMember[];
}

interface TypedMember {
  readonly name: string;
  readonly optional: boolean;
  readonly readonly: boolean;
  readonly type: string;
}

const MEMBER = /^\s*(?:readonly\s+)?["']?([A-Za-z_][\w-]*)["']?\s*\??\s*:\s*[^(]+;\s*$/;
const TYPED_MEMBER = /^\s*(readonly\s+)?([A-Za-z_$][\w$]*)\s*(\?)?\s*:\s*([^;()]+?)\s*;\s*$/;

function stripComments(source: string): string {
  return source.replaceAll(/\/\*[\s\S]*?\*\//g, "").replaceAll(/^\s*\/\/.*$/gm, "");
}

function depthAfter(character: string, depth: number): number {
  if (character === "{") return depth + 1;
  if (character === "}") return depth - 1;
  return depth;
}

function bodyEnd(source: string, open: number): number {
  let depth = 1;
  for (let index = open + 1; index < source.length; index += 1) {
    depth = depthAfter(source.charAt(index), depth);
    if (depth === 0) return index;
  }
  throw new Error("Unbalanced interface declaration");
}

function memberName(line: string): readonly string[] {
  const name = MEMBER.exec(line)?.[1];
  return name === undefined ? [] : [name];
}

function members(body: string): readonly string[] {
  return body.split("\n").flatMap(line => memberName(line));
}

function typedMember(line: string): readonly TypedMember[] {
  const match = TYPED_MEMBER.exec(line);
  if (match === null) return [];
  return [buildTypedMember(match)];
}

function buildTypedMember(match: RegExpExecArray): TypedMember {
  return {
    name: match[2] ?? "",
    optional: match[3] === "?",
    readonly: match[1] !== undefined,
    type: (match[4] ?? "").replaceAll(/\s+/g, " ").trim(),
  };
}

function typedMembers(body: string): readonly TypedMember[] {
  return body.split("\n").flatMap(line => typedMember(line));
}

function basesOf(declaration: string): readonly string[] {
  return declaration
    .split(",")
    .map(base => base.trim())
    .filter(base => base.length > 0);
}

function offsetOf(match: RegExpMatchArray): number {
  return match.index ?? 0;
}

function basesFrom(match: RegExpMatchArray): readonly string[] {
  return basesOf(match[2] ?? "");
}

function addBlock(
  blocks: Map<string, InterfaceBlock>,
  source: string,
  match: RegExpMatchArray,
): void {
  const name = match[1];
  if (name === undefined) return;
  const open = offsetOf(match) + match[0].length - 1;
  const body = source.slice(open + 1, bodyEnd(source, open));
  blocks.set(name, {bases: basesFrom(match), members: members(body), typed: typedMembers(body)});
}

function parseInterfaces(source: string): ReadonlyMap<string, InterfaceBlock> {
  const blocks = new Map<string, InterfaceBlock>();
  for (const match of source.matchAll(/interface\s+(\w+)(?:\s+extends\s+([^{]+))?\s*\{/g))
    addBlock(blocks, source, match);
  return blocks;
}

function keysOf(
  blocks: ReadonlyMap<string, InterfaceBlock>,
  name: string,
  seen: Set<string> = new Set(),
): readonly string[] {
  const block = blocks.get(name);
  if (block === undefined) return [];
  seen.add(name);
  const bases = block.bases.filter(base => !seen.has(base));
  return [...block.members, ...bases.flatMap(base => keysOf(blocks, base, seen))];
}

function typedMembersOf(
  blocks: ReadonlyMap<string, InterfaceBlock>,
  name: string,
  seen: Set<string> = new Set(),
): readonly TypedMember[] {
  const block = blocks.get(name);
  if (block === undefined) return [];
  seen.add(name);
  const bases = block.bases.filter(base => !seen.has(base));
  return [...block.typed, ...bases.flatMap(base => typedMembersOf(blocks, base, seen))];
}

interface PropertyEntry {
  readonly name: string;
  readonly type: "boolean" | "number" | "string";
}

function isPrimitiveType(type: string): type is PropertyEntry["type"] {
  return PRIMITIVE_TYPES.has(type);
}

function isWritableMember(member: TypedMember): boolean {
  return !member.readonly && !member.optional;
}

function isPropertyMember(member: TypedMember): boolean {
  if (!isWritableMember(member)) return false;
  if (!isPrimitiveType(member.type)) return false;
  return !DENIED_PROPERTIES.has(member.name);
}

function collectPropertyTypes(
  blocks: ReadonlyMap<string, InterfaceBlock>,
): ReadonlyMap<string, ReadonlySet<string>> {
  const types = new Map<string, Set<string>>();
  for (const root of PROPERTY_ROOTS) addPropertyTypes(types, typedMembersOf(blocks, root));
  return types;
}

function addPropertyTypes(types: Map<string, Set<string>>, members: readonly TypedMember[]): void {
  for (const member of members) addPropertyType(types, member);
}

function addPropertyType(types: Map<string, Set<string>>, member: TypedMember): void {
  if (!isPropertyMember(member)) return;
  const known = types.get(member.name) ?? new Set<string>();
  known.add(member.type);
  types.set(member.name, known);
}

function primitiveOrUndefined(type: string): PropertyEntry["type"] | undefined {
  return isPrimitiveType(type) ? type : undefined;
}

function singleType(types: ReadonlySet<string>): PropertyEntry["type"] | undefined {
  const [first, ...rest] = types;
  if (first === undefined || rest.length > 0) return undefined;
  return primitiveOrUndefined(first);
}

function propertyEntries(blocks: ReadonlyMap<string, InterfaceBlock>): readonly PropertyEntry[] {
  const entries: PropertyEntry[] = [];
  for (const [name, types] of collectPropertyTypes(blocks)) {
    const type = singleType(types);
    if (type !== undefined) entries.push({name, type});
  }
  return entries.sort((left, right) => left.name.localeCompare(right.name));
}

function literal(name: string): string {
  const escaped = name.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return `  "${escaped}",`;
}

function renderProperties(entries: readonly PropertyEntry[]): readonly string[] {
  return [
    "/** @since 0.4.0 */",
    "export interface PropertyTypes {",
    ...entries.map(entry => `  readonly ${entry.name}: "${entry.type}";`),
    "}",
    "",
    "/** @since 0.4.0 */",
    "export const propertyNames: readonly (keyof PropertyTypes)[] = [",
    ...entries.map(entry => `  "${entry.name}",`),
    "];",
    "",
  ];
}

function renderList(name: string, names: readonly string[]): readonly string[] {
  return [
    "/** @since 0.4.0 */",
    `export const ${name}: readonly string[] = [`,
    ...names.map(literal),
    "];",
    "",
  ];
}

function render(
  styles: readonly string[],
  events: readonly string[],
  tags: readonly string[],
  properties: readonly PropertyEntry[],
): string {
  return [
    "// Generated by tools/generate-primitives.ts from lib.dom.d.ts. Do not edit.",
    "",
    ...renderList("styleProperties", styles),
    ...renderList("eventTypes", events),
    ...renderList("elementTags", tags),
    ...renderProperties(properties),
  ].join("\n");
}

function findDomLib(): string {
  const candidates = [
    ...new Bun.Glob("node_modules/.bun/@tsrs+*/**/lib.dom.d.ts").scanSync({cwd: process.cwd()}),
    ...new Bun.Glob("node_modules/.bun/@typescript+*/**/lib/lib.dom.d.ts").scanSync({
      cwd: process.cwd(),
    }),
  ];
  const found = candidates.find(path => path.includes("linux-x64-gnu")) ?? candidates[0];
  if (found === undefined) throw new Error("Cannot find lib.dom.d.ts. Run bun install first.");
  return found;
}

async function descriptors(): Promise<string> {
  const blocks = parseInterfaces(stripComments(await Bun.file(findDomLib()).text()));
  return render(
    keysOf(blocks, "CSSStyleProperties"),
    keysOf(blocks, "HTMLElementEventMap"),
    keysOf(blocks, "HTMLElementTagNameMap"),
    propertyEntries(blocks),
  );
}

const check = process.argv.includes("--check");
const generated = await descriptors();
const output = Bun.file(OUTPUT);
const current = (await output.exists()) ? await output.text() : "";

if (!check) {
  await Bun.write(OUTPUT, generated);
  process.stdout.write(`Wrote ${OUTPUT}.\n`);
} else if (current === generated) {
  process.stdout.write(`${OUTPUT} is current.\n`);
} else {
  process.stderr.write(`${OUTPUT} is stale. Run bun run generate.\n`);
  process.exit(1);
}
