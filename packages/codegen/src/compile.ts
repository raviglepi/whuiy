/** @since 0.4.0 */

import type {DecoratorMetadata} from "whuiy/primitives";
import type {TokenDefinitionRef, TokenInstanceRef, TokenTerm, TokenValue} from "whuiy";
import type {
  DeriveRule,
  EventRule,
  ListRule,
  Program,
  Rule,
  ShowRule,
  StyleRule,
} from "./descriptors.ts";

import {Predicate, Schema} from "effect";

import {getDecoratorMetadata, getElementMetadata, isContentDefinition} from "whuiy/primitives";
import {isTokenInstance} from "whuiy";

interface Site {
  readonly node: TokenInstanceRef;
  readonly parent: Site | undefined;
  readonly children: Site[];
}

interface Cell {
  readonly definition: TokenDefinitionRef;
  readonly initial: string;
  readonly key: string;
  readonly type: string;
}

type Substitution = ReadonlyMap<TokenInstanceRef, string> | undefined;

const RESERVED_NAMES = ["parent", "setters", "value"];

function buildSite(node: TokenInstanceRef, parent: Site | undefined): Site {
  const site: Site = {children: [], node, parent};
  for (const relation of node.relations) site.children.push(buildSite(relation, site));
  return site;
}

function flattenSites(site: Site, into: Site[]): void {
  into.push(site);
  for (const child of site.children) flattenSites(child, into);
}

const encodeJsonString = Schema.encodeSync(Schema.fromJsonString(Schema.String));

function quote(value: string): string {
  return encodeJsonString(value);
}

function identifier(name: string): string {
  const cleaned = name.replaceAll(/[^A-Za-z0-9_$]/g, "_");
  return /^[A-Za-z_$]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

function uncapitalize(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function isElement(site: Site | undefined): boolean {
  return site !== undefined && getElementMetadata(site.node.definition) !== undefined;
}

function isDecorator(node: TokenInstanceRef): boolean {
  return getDecoratorMetadata(node.definition) !== undefined;
}

function isInstance(target: TokenDefinitionRef | TokenInstanceRef): target is TokenInstanceRef {
  // SAFETY: both branches are token terms; definitions simply are not in the instance set.
  return isTokenInstance(target as TokenTerm);
}

function targetName(target: TokenDefinitionRef | TokenInstanceRef): string {
  return isInstance(target) ? `${target.definition.name} instance` : target.name;
}

function matchingSites(
  sites: readonly Site[],
  target: TokenDefinitionRef | TokenInstanceRef,
): readonly Site[] {
  if (isInstance(target)) return sites.filter(site => site.node === target);
  return sites.filter(site => site.node.definition === target);
}

function resolveSite(options: {
  readonly kind: string;
  readonly sites: readonly Site[];
  readonly target: TokenDefinitionRef | TokenInstanceRef;
}): Site {
  const found = matchingSites(options.sites, options.target);
  if (found.length === 0)
    throw new Error(
      `No description node matches ${targetName(options.target)} (${options.kind} target)`,
    );
  if (found.length > 1)
    throw new Error(
      `${found.length} description nodes match ${targetName(options.target)}; give the ${options.kind} target its own definition`,
    );
  return found[0]!;
}

function eventType(definition: TokenDefinitionRef): string {
  const decorator = getDecoratorMetadata(definition);
  if (decorator?.kind !== "event")
    throw new Error(`${definition.name} is not an event token; bind events with an Event token`);
  return decorator.property.slice(2).toLowerCase();
}

function styleProperty(definition: TokenDefinitionRef): string {
  const decorator = getDecoratorMetadata(definition);
  if (decorator?.kind !== "style")
    throw new Error(`${definition.name} is not a style token; write styles with a Style token`);
  return decorator.property;
}

function capitalized(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function valueLiteral(value: TokenValue): string {
  if (Predicate.isString(value)) return quote(value);
  if (Predicate.isNumber(value)) return String(value);
  return otherValueLiteral(value);
}

function otherValueLiteral(value: TokenValue): string {
  if (Predicate.isBoolean(value)) return String(value);
  return quote("");
}

function valueType(value: TokenValue): string {
  if (Predicate.isString(value)) return "string";
  if (Predicate.isNumber(value)) return "number";
  return otherValueType(value);
}

function otherValueType(value: TokenValue): string {
  if (Predicate.isBoolean(value)) return "boolean";
  throw new Error(
    `State cells support string, number, and boolean values; received ${String(value)}`,
  );
}

function collectContentSites(site: Site, into: Site[]): void {
  if (isContentDefinition(site.node.definition)) {
    into.push(site);
    return;
  }
  for (const child of site.children) collectContentSites(child, into);
}

function cellOf(instance: TokenInstanceRef): Cell {
  const value = instance.value();
  return {
    definition: instance.definition,
    initial: valueLiteral(value),
    key: uncapitalize(instance.definition.name),
    type: valueType(value),
  };
}

function templateChild(site: Site, label: string): Site {
  const children = site.children.filter(child => !isDecorator(child.node));
  if (children.length !== 1)
    throw new Error(
      `List target ${label} needs exactly one template child; found ${children.length}`,
    );
  return children[0]!;
}

function templateParent(site: Site, label: string): Site {
  const parent = site.parent;
  if (parent === undefined || !isElement(parent))
    throw new Error(`List target ${label} must sit inside an element`);
  return parent;
}

function onlyTemplate(site: Site, label: string): Site {
  const parent = templateParent(site, label);
  const siblings = parent.children.filter(
    child => child.node !== site.node && !isDecorator(child.node),
  );
  if (siblings.length > 0)
    throw new Error(
      `List target ${label} shares its element with other content; wrap it in its own element`,
    );
  return templateChild(site, label);
}

function validateSites(sites: readonly Site[]): void {
  for (const site of sites) validateSite(site);
}

function validateSite(site: Site): void {
  const decorator = getDecoratorMetadata(site.node.definition);
  validateStaticEvent(decorator, site);
  validateStylePlacement(decorator, site);
}

function validateStaticEvent(decorator: ReturnType<typeof getDecoratorMetadata>, site: Site): void {
  if (decorator?.kind === "event")
    throw new Error(
      `Event ${site.node.definition.name} is described statically; bind it with a rules.on(...) rule`,
    );
}

function isElementDecorator(decorator: ReturnType<typeof getDecoratorMetadata>): boolean {
  return decorator !== undefined && decorator.kind !== "event";
}

function validateStylePlacement(
  decorator: ReturnType<typeof getDecoratorMetadata>,
  site: Site,
): void {
  if (!isElementDecorator(decorator)) return;
  if (isElement(site.parent)) return;
  throw new Error(
    `Style and property tokens must sit on an element; ${site.node.definition.name} does not`,
  );
}

const EVENT_ARGUMENTS = ["", "setters", "setters, event"] as const;

function eventArguments(arity: number): string {
  return EVENT_ARGUMENTS[arity] ?? "setters, event";
}

function isUsableContainer(container: string | undefined): container is string {
  return container !== undefined && container !== "" && container !== "parent";
}

class Emitter {
  readonly #cells: readonly Cell[];
  readonly #claims = new Set<string>();
  readonly #containers = new Map<TokenInstanceRef, string>();
  readonly #lines: string[] = [];
  readonly #names = new Set<string>(RESERVED_NAMES);
  readonly #program: Program;
  readonly #roots: string[] = [];
  readonly #settlers = new Map<string, string[]>();
  readonly #sites: readonly Site[];
  readonly #skipped = new Set<TokenInstanceRef>();
  readonly #tree: Site;
  readonly #updaters: string[] = [];
  readonly #used = new Set<string>();
  readonly #vars = new Map<TokenInstanceRef, string>();
  #depth = 0;
  #usesEffect = false;

  constructor(program: Program) {
    this.#program = program;
    this.#tree = buildSite(program.description, undefined);
    const sites: Site[] = [];
    flattenSites(this.#tree, sites);
    this.#sites = sites;
    this.#cells = program.state.map(instance => cellOf(instance));
    for (const cell of this.#cells) this.#names.add(cell.key);
    this.#skipListTargets(program, sites);
  }

  #skipListTargets(program: Program, sites: readonly Site[]): void {
    for (const rule of program.rules) this.#skipListTarget(rule, sites);
  }

  #skipListTarget(rule: Rule, sites: readonly Site[]): void {
    if (rule.kind !== "list") return;
    this.#skipped.add(resolveSite({kind: "list", sites, target: rule.target}).node);
  }

  compile(options: {readonly source: string | undefined}): string {
    this.#emitMount();
    const imports = this.#imports();
    const top =
      imports.length === 0
        ? [headerLine(options.source), ""]
        : [headerLine(options.source), "", ...imports, ""];
    return `${[...top, ...this.#lines].join("\n")}\n`;
  }

  #imports(): readonly string[] {
    const lines = [this.#effectImport(), this.#runtimeImport()].filter(line => line !== undefined);
    if (lines.length < 2) return lines;
    return [lines[0]!, "", lines[1]!];
  }

  #effectImport(): string | undefined {
    return this.#usesEffect ? 'import {Effect} from "effect";' : undefined;
  }

  #runtimeImport(): string | undefined {
    if (this.#used.size === 0) return undefined;
    return `import {${[...this.#used].sort().join(", ")}} from ${quote(this.#program.runtime)};`;
  }

  #emitMount(): void {
    this.line("export function mount(parent: HTMLElement): () => void {");
    this.#depth += 1;
    for (const cell of this.#cells) this.line(`let ${cell.key} = ${cell.initial};`);
    this.line("");
    this.#emitNode(this.#tree, "parent", undefined);
    this.#emitRules();
    this.#emitSetters();
    for (const updater of this.#updaters) this.line(`${updater}();`);
    this.#emitDispose();
    this.#depth -= 1;
    this.line("}");
  }

  line(text: string): void {
    this.#lines.push(text.length === 0 ? "" : `${"  ".repeat(this.#depth)}${text}`);
  }

  #use(name: string): void {
    this.#used.add(name);
  }

  #name(hint: string): string {
    const base = identifier(hint);
    let name = base;
    let index = 2;
    while (this.#names.has(name)) {
      name = `${base}${index}`;
      index += 1;
    }
    this.#names.add(name);
    return name;
  }

  #define(hint: string, node: TokenInstanceRef): string {
    const name = this.#name(hint);
    this.#vars.set(node, name);
    return name;
  }

  #append(name: string, parent: string | undefined): void {
    if (parent === undefined) return;
    this.line(`${parent}.append(${name});`);
    if (parent === "parent") this.#roots.push(name);
  }

  #emitNode(site: Site, parent: string | undefined, substitution: Substitution): void {
    if (this.#skipped.has(site.node)) {
      this.#containers.set(site.node, parent ?? "");
      return;
    }
    this.#emitKind(site, parent, substitution);
  }

  #emitKind(site: Site, parent: string | undefined, substitution: Substitution): void {
    const element = getElementMetadata(site.node.definition);
    if (element !== undefined) {
      this.#emitElement(site, parent, element.tag, substitution);
      return;
    }
    if (isContentDefinition(site.node.definition)) {
      this.#emitContent(site, parent, substitution);
      return;
    }
    this.#emitChildren(site, parent, substitution);
  }

  #emitChildren(site: Site, parent: string | undefined, substitution: Substitution): void {
    for (const child of site.children) this.#emitContentChild(child, parent, substitution);
  }

  #emitContentChild(site: Site, parent: string | undefined, substitution: Substitution): void {
    if (isDecorator(site.node)) return;
    this.#emitNode(site, parent, substitution);
  }

  #emitElement(
    site: Site,
    parent: string | undefined,
    tag: string,
    substitution: Substitution,
  ): void {
    const name = this.#define(tag, site.node);
    this.line(`const ${name} = document.createElement(${quote(tag)});`);
    for (const child of site.children) this.#applyDecorator(child, name);
    this.#emitChildren(site, name, substitution);
    this.#append(name, parent);
  }

  #applyDecorator(site: Site, element: string): void {
    const decorator = getDecoratorMetadata(site.node.definition);
    if (decorator === undefined) return;
    this.#applyDecoratorKind(site, element, decorator);
  }

  #applyDecoratorKind(site: Site, element: string, decorator: DecoratorMetadata): void {
    if (decorator.kind === "event") return;
    if (decorator.kind === "style") {
      this.#applyStyle(site, element, decorator.property);
      return;
    }
    this.#applyProperty(site, element, decorator.property);
  }

  #applyStyle(site: Site, element: string, property: string): void {
    this.line(`${element}.style.${property} = ${valueLiteral(site.node.value())};`);
  }

  #applyProperty(site: Site, element: string, property: string): void {
    this.line(`${element}.${property} = ${valueLiteral(site.node.value())};`);
  }

  #emitContent(site: Site, parent: string | undefined, substitution: Substitution): void {
    const substituted = substitution?.get(site.node);
    const name = this.#define(uncapitalize(site.node.definition.name), site.node);
    this.line(
      `const ${name} = document.createTextNode(${substituted ?? valueLiteral(site.node.value())});`,
    );
    this.#append(name, parent);
  }

  #resolve(target: TokenDefinitionRef | TokenInstanceRef, kind: string): Site {
    const site = resolveSite({kind, sites: this.#sites, target});
    if (this.#insideSkipped(site))
      throw new Error(
        `${targetName(target)} is inside a list template; the template's content token carries the per-row value`,
      );
    return site;
  }

  #insideSkipped(site: Site): boolean {
    const parent = site.parent;
    if (parent === undefined) return false;
    if (this.#skipped.has(parent.node)) return true;
    return this.#insideSkipped(parent);
  }

  #elementVars(site: Site): readonly string[] {
    if (isElement(site)) {
      const name = this.#vars.get(site.node);
      return name === undefined ? [] : [name];
    }
    return site.children.flatMap(child => this.#elementVars(child));
  }

  #elementOf(site: Site, label: string): string {
    const elements = this.#elementVars(site);
    if (elements.length === 0)
      throw new Error(`Event target ${label} contains no element to listen on`);
    if (elements.length > 1)
      throw new Error(
        `Event target ${label} contains ${elements.length} elements; bind the handler to a token whose subtree has one element`,
      );
    return elements[0]!;
  }

  #firstElementVar(site: Site): string | undefined {
    for (const child of site.children) {
      const found = this.#elementOrFirst(child);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  #elementOrFirst(site: Site): string | undefined {
    if (isElement(site)) return this.#vars.get(site.node);
    return this.#firstElementVar(site);
  }

  #containerOf(site: Site): string {
    const container = this.#containers.get(site.node);
    if (isUsableContainer(container)) return container;
    throw new Error(`List target must be the only child of an element`);
  }

  #keyOf(definition: TokenDefinitionRef): string {
    const cell = this.#cells.find(entry => entry.definition === definition);
    if (cell === undefined) throw new Error(`${definition.name} is not a declared state cell`);
    return cell.key;
  }

  #stateArgument(deps: readonly TokenDefinitionRef[]): string {
    return `{${deps.map(definition => this.#keyOf(definition)).join(", ")}}`;
  }

  #register(deps: readonly TokenDefinitionRef[], updater: string): void {
    this.#updaters.push(updater);
    for (const definition of deps) {
      const key = this.#keyOf(definition);
      const existing = this.#settlers.get(key);
      if (existing === undefined) this.#settlers.set(key, [updater]);
      else existing.push(updater);
    }
  }

  #claim(name: string): void {
    if (this.#claims.has(name))
      throw new Error(`Two rules lower to the same update function ${name}`);
    this.#claims.add(name);
  }

  #emitRules(): void {
    for (const rule of this.#program.rules) this.#emitRule(rule);
  }

  #emitRule(rule: Rule): void {
    if (rule.kind === "event") {
      this.#emitEvent(rule);
      return;
    }
    this.#emitComputedRule(rule);
  }

  #emitComputedRule(rule: Exclude<Rule, EventRule>): void {
    if (rule.kind === "derive") {
      this.#emitDerive(rule);
      return;
    }
    this.#emitDomRule(rule);
  }

  #emitDomRule(rule: Exclude<Rule, DeriveRule | EventRule>): void {
    if (rule.kind === "list") {
      this.#emitList(rule);
      return;
    }
    if (rule.kind === "show") {
      this.#emitShow(rule);
      return;
    }
    this.#emitStyle(rule);
  }

  #emitEvent(rule: EventRule): void {
    const site = this.#resolve(rule.target, "event");
    const element = this.#elementOf(site, targetName(rule.target));
    this.#use(rule.handlerName);
    this.#usesEffect = true;
    const listener = rule.arity >= 2 ? "event => {" : "() => {";
    this.line(`${element}.addEventListener(${quote(eventType(rule.event))}, ${listener}`);
    this.#depth += 1;
    this.line(`Effect.runFork(${rule.handlerName}(${eventArguments(rule.arity)}));`);
    this.#depth -= 1;
    this.line(`});`);
  }

  #emitDerive(rule: DeriveRule): void {
    const site = this.#resolve(rule.target, "derive");
    if (!isContentDefinition(site.node.definition))
      throw new Error(`Derive target ${targetName(rule.target)} is not a content token`);
    const text = this.#vars.get(site.node);
    if (text === undefined)
      throw new Error(`Derive target ${targetName(rule.target)} was not projected`);
    const updater = `update${site.node.definition.name}`;
    this.#claim(updater);
    this.#use(rule.mapperName);
    this.line(`function ${updater}(): void {`);
    this.#depth += 1;
    this.line(`${text}.data = String(${rule.mapperName}(${this.#stateArgument(rule.deps)}));`);
    this.#depth -= 1;
    this.line(`}`);
    this.#register(rule.deps, updater);
  }

  #emitShow(rule: ShowRule): void {
    const site = this.#resolve(rule.target, "show");
    const element = this.#elementOf(site, targetName(rule.target));
    const updater = `update${site.node.definition.name}Visible`;
    this.#claim(updater);
    this.#use(rule.mapperName);
    this.line(`function ${updater}(): void {`);
    this.#depth += 1;
    this.line(`${element}.hidden = !${rule.mapperName}(${this.#stateArgument(rule.deps)});`);
    this.#depth -= 1;
    this.line(`}`);
    this.#register(rule.deps, updater);
  }

  #emitStyle(rule: StyleRule): void {
    const site = this.#resolve(rule.target, "style");
    const element = this.#elementOf(site, targetName(rule.target));
    const property = styleProperty(rule.property);
    const updater = `update${site.node.definition.name}${capitalized(property)}`;
    this.#claim(updater);
    this.#use(rule.mapperName);
    this.line(`function ${updater}(): void {`);
    this.#depth += 1;
    this.line(
      `${element}.style.${property} = String(${rule.mapperName}(${this.#stateArgument(rule.deps)}));`,
    );
    this.#depth -= 1;
    this.line(`}`);
    this.#register(rule.deps, updater);
  }

  #emitList(rule: ListRule): void {
    const site = this.#resolve(rule.target, "list");
    const container = this.#containerOf(site);
    const template = onlyTemplate(site, targetName(rule.target));
    const placeholders: Site[] = [];
    collectContentSites(template, placeholders);
    if (placeholders.length !== 1)
      throw new Error(
        `List template for ${targetName(rule.target)} needs exactly one content token to fill; found ${placeholders.length}`,
      );
    const creator = `create${template.node.definition.name}`;
    const updater = `update${site.node.definition.name}`;
    this.#claim(creator);
    this.#claim(updater);
    this.#use(rule.mapperName);
    this.line(`function ${creator}(value: string) {`);
    this.#depth += 1;
    this.#emitNode(template, undefined, new Map([[placeholders[0]!.node, "value"]]));
    this.line(`return ${this.#firstElementVar(template)};`);
    this.#depth -= 1;
    this.line(`}`);
    this.line(`function ${updater}(): void {`);
    this.#depth += 1;
    this.line(
      `${container}.replaceChildren(...${rule.mapperName}(${this.#stateArgument(rule.deps)}).map(${creator}));`,
    );
    this.#depth -= 1;
    this.line(`}`);
    this.#register(rule.deps, updater);
  }

  #emitSetters(): void {
    this.line(`const setters = {`);
    this.#depth += 1;
    for (const cell of this.#cells) this.#emitCellSetter(cell);
    this.#depth -= 1;
    this.line(`};`);
  }

  #emitCellSetter(cell: Cell): void {
    const updates = this.#settlers.get(cell.key) ?? [];
    this.line(`${cell.key}: {`);
    this.#depth += 1;
    this.line(`set: (next: ${cell.type}): void => {`);
    this.#depth += 1;
    this.line(`${cell.key} = next;`);
    this.#emitUpdates(updates);
    this.#depth -= 1;
    this.line(`},`);
    this.line(`update: (updater: (current: ${cell.type}) => ${cell.type}): void => {`);
    this.#depth += 1;
    this.line(`${cell.key} = updater(${cell.key});`);
    this.#emitUpdates(updates);
    this.#depth -= 1;
    this.line(`},`);
    this.#depth -= 1;
    this.line(`},`);
  }

  #emitUpdates(updates: readonly string[]): void {
    for (const update of updates) this.line(`${update}();`);
  }

  #emitDispose(): void {
    if (this.#roots.length === 0) {
      this.line(`return () => {};`);
      return;
    }
    this.line(`return () => {`);
    this.#depth += 1;
    for (const root of this.#roots) this.line(`parent.removeChild(${root});`);
    this.#depth -= 1;
    this.line(`};`);
  }
}

function headerLine(source: string | undefined): string {
  return source === undefined
    ? "// Generated by @whuiy/codegen. Do not edit."
    : `// Generated by @whuiy/codegen from ${source}. Do not edit.`;
}

/**
 * Lowers a declared program to a self-contained module that builds DOM nodes
 * and updates them from named Effect handlers.
 *
 * **When to use**
 *
 * Run this in a build step, write the returned source to a file, and import
 * `mount` from the built app. The generated module imports the program's rule
 * handlers from its `runtime` module and never imports `whuiy`.
 *
 * @since 0.4.0
 * @category Destructors
 */
export function compile(program: Program, options?: {readonly source?: string}): string {
  const sites: Site[] = [];
  flattenSites(buildSite(program.description, undefined), sites);
  validateSites(sites);
  return new Emitter(program).compile({source: options?.source});
}
