# Cascade / Whuiy: design intent from the user's threads

Read-only research note, 2026-10-30. Code state: b206f98 on feat/build-cascade-ui. No source files modified.

## 0. Where the intent lives

The Cascade project (7dbf7d8d-8b97-404c-bbb2-ccf1efaa9ad0) holds 27 threads. Six carry user-authored design statements:

| thread                               | date       | what it settles                                                                   |
| ------------------------------------ | ---------- | --------------------------------------------------------------------------------- |
| 7c0ad32c-e777-4d72-a6af-2396182022eb | 2026-10-30 | the takeover brief: precompile target, comptime, typeInfo, Canon framing          |
| e487f0ca-a206-4a8b-a71e-b22b7ece1663 | 2026-09-12 | what compiling rules means, and the per-element reframing                         |
| 94510784-6c73-477c-8168-ca214f90cc92 | 2026-09-10 | style typing, then the "just trust typescript" reversal, legacy primitive removal |
| 3f30fc54-4502-47a7-b8b1-3c374e0a7537 | 2026-09-12 | Cascade to Whuiy rename, breaking 0.3.0                                           |
| 7e29c1dc-9744-4a8c-8ba5-1db5b53fab78 | 2026-09-12 | @whuiy/dom and shared primitives ownership (WhUIy project)                        |
| 92083e55-7293-4b02-aa86-b8a728132897 | 2026-09-16 | generated tokens require the build-time plugins (WhUIy project)                   |

The remaining Cascade threads are "what is this project for" Q&A (d1df10b8, dc5f2f61, 73efbe78, 0644b37f, 4fa8244c, cc9e69d7, 2f1a3a30, 9f3a48da, 26066455, 7cf23c93, 4aaa6502, 861c4fd8, 6be14a07, 2078693f, 1ac71bc6). The user asks once and an assistant tours the code. They are snapshots of the API at a date, not statements of intent. Same for ea2865f5 (CI fix) and 89ceb0f3 (diverged branch).

Cross-project searches for cascade, whuiy, precompile, typeInfo, type-fest, content mapper, described UI, comptime, unplugin found no other user-authored UI design thread. Lounge fb94748d mentions typeInfo and cascade only in passing, about agent tooling.

Caveat: most design statements are one or two lowercase lines with typos. Quotes below are verbatim.

## 1. "Precompile" means two different things

The word appears once, in the takeover brief:

> "hill climb this until its as usable as react/foldkit/solid, acceptable performance, and precompiles to normal effect + html" - 7c0ad32c pos 0

Read with the older compile thread, that covers two layers, only one of which is built.

### 1a. Build-time type surface (shipped)

The existing Style/Event/Element token families are generated at build time from platform typings. In packages/react/src/primitives.ts each family is a comptime(() => typeInfo<...>().fields...) over React.CSSProperties, React.DOMAttributes<HTMLElement> (on* only) and HTMLElementTagNameMap. Token names are PascalCase of the platform key; token value types come from the same source.

Evidence that this build step is load-bearing: the DOM prototype failed in the browser until the Vite plugins were added - "Whuiy's generated tokens need the existing typesugar/comptime Vite plugins" (92083e55 pos 7). The first DOM package hand-enumerated its primitives and review called that out as falsely broad; the fix was generated families (7e29c1dc pos 16-20).

So in its shipped sense, precompile = a build-time transform that reflects platform types into the token registry, removing hand-written registries from the source. It is not about rules yet.

### 1b. Rules compilation (designed, never built)

e487f0ca pos 0 is the whole idea, prompted by Zod:

> "recently Zed has gotten a <schema>.compile() method that basically generates a standard javascript function that proves a value matches the schema ... I've also found a Vite plugin called comptime, which does what the name suggests"

> "Make @cascade/dom (so instead of using React, it's just html). Allow Cascade.compile(). So you would be able to wrap every rule and stuff into comptime(...), and get a basically html native UI, while still being able to write Cascade"

> "A smart "compiler" for rules. Basically figuring out which rules trigger what, and be able to "erase" the rules at runtime, and only leave the output of a runtime that ensures they're being followed, without knowing the rules"

Why he wants it, pos 4:

> "even with a @cascade/compiler as just "precompute conditions so we dont check things that will never happen", isnt having an ui library that just becomes html kinda sick? i mean, states and stuff are handled with effect, and "re-renders" dont exist because a virtual dom doesnt exist. it wouldnt have the react rerender problem, and it would basically not have a framework. it would be the same as just raw dogging html with effect"

The assistant's first answer (pos 3) said a Zod-style general compiler is out of reach because rules are arbitrary generators: "You can statically understand the condition shape and the declared write footprint, but you cannot in general erase or analyze the generator body". It proposed compiling the rule dispatch plan instead:

    const runtime = Cascade.compile(
      new Cascade().rule(Button(Disabled()), disableButton)
    )

with generated per-rule matchers and direct invalidation wiring, while handler bodies stay ordinary JS.

The user then set the framing that stuck (pos 6):

> "i think the "compiled" rules part is better when you think of it as per element. like, you dont need to look through every element to see if a rule applies, if its relations can never have that rule. specially when rules get more complex and more tokens appear. a giant rule set can basically be stripped to just some checks per element, like any other code. and the rules that set how an element looks in the first place are kind of never seen"

The assistant's reply (pos 7) opens "Exactly. That's the right mental model" and is the closest thing to a settled design. Its content:

- Compile a local behavior program per token definition / element kind, not a global engine.
- Dispatch tables per definition: rulesFor.Button.Disabled = [applyDisabledButton], so Button is never tested against Input(Invalid()) or Dialog(Open()).
- Guards for compound conditions: has(Disabled) && has(Variant, "danger") && !has(Loading), then direct mutations.
- Four rule classes: construction/appearance (once, on creation), reactive transition (on declared local dependency change), event (on browser event), async/effect (on explicit input change).
- Boundary: static appearance -> create DOM once and erase the source rule/token metadata (tree-shakeable); reactive behavior -> local generated update functions and subscriptions, only retained dependencies survive.
- Open caveat: arbitrary generator bodies stay dynamic Effect code; only their scheduling becomes local and constant-sized.
- Later, optional declarative tier for full erasure:

  const rules = Cascade.rules({
  disabledButton: Cascade.when(Button(Disabled())).set(
  Style.Opacity(0.5),
  Style.Cursor("not-allowed"),
  ),
  })

  lowering to button.style.opacity = "0.5"; button.style.cursor = "not-allowed".

- Product sentence offered: "Cascade compiles static UI policy into native DOM construction and local update code. Dynamic rules retain Effect semantics, but only run for elements whose relevant state changed."

### 1c. What "the output" is, precisely

- Specified by the user: plain Effect for state, plain HTML for output, no VDOM, no rerender step, rules erased where static.
- Accepted from the assistant: per-element guard functions and direct DOM property/listener patches, plus retained DOM nodes with an identity/patching model.
- Not specified anywhere: the packaging. Is it Cascade.compile() at runtime, a comptime(...) wrapper, a Vite plugin, or a separate @cascade/compiler? The user says "wrap every rule and stuff into comptime(...)"; the assistant sketches Cascade.compile(new Cascade()...). Neither was chosen.
- Not built: there is no compile() and no compiler package in this repo (rg over packages/_/src and packages/_/test finds nothing). The only build-time transform is the primitive-family generation described in 1a.

Also non-goals both parties agreed on: a dynamic token graph cannot become zero-cost; DOM listeners, node identity, cleanup and arbitrary handlers still run; invalidation still needs dependency information at runtime.

## 2. Type-level API goals

### 2a. Which compile util (settled)

7c0ad32c pos 0:

> "dont use typesugar's compile util, use the other one i forgot the name but was better"

pos 47, the user's answer when the assistant was guessing:

> "yes comptime from unplugin thats the name"

Two npm packages answer to that description, so the name should be pinned before anything is swapped:

- comptime@0.1.0, lukeed/comptime, "A Zig-inspired build-time evaluation primitive, exposed as Vite and Rolldown plugins". This is the one the repo already depends on (packages/package.json) and wires first-class in packages/vite.config.ts: plugins are [typesugar(), comptime()], with the comment that typesugar must run before comptime.
- unplugin-comptime@0.0.2, sylv/unplugin-comptime, "Run and inline code at compile time for Vite, Rollup, Webpack, and esbuild".

The codebase's current split (comptime from the comptime package for evaluation, typesugar only for typeInfo) already matches the user's instruction, so the likely reading is lukeed's comptime. The alternative package was looked up in the same thread but never adopted.

### 2b. typeInfo: typesugar today, TS 7.1 mappers floated

pos 0:

> "for typeinfo, consider typescript 7.1 content mappers, since those didnt exist when i started the idea and may be better than typefest typeInfo, but thats on your decision"

Facts:

- type-fest 5.9 contains no typeInfo (checked the installed package). type-fest is used as pure type utilities: PascalCase in primitives.ts, IsEqual and IsNever in core/rules.ts. The phrase "typefest typeInfo" most likely means typesugar's reflection API, since it is named earlier in the same sentence pair.
- The typeInfo in the code is typesugar's comptime reflection: typeInfo<T>().fields, used inside comptime(() => ...) to enumerate CSS properties, on* handlers and HTML tags.
- TS 7.1 exists only as beta/next builds at the time of writing (7.1.0-beta, 7.1.0-dev.*); this workspace pins typescript ^7 at the root and ^6 in packages. No thread evaluates content mappers, and no code uses them. It is an explicitly delegated open decision ("thats on your decision"), not a choice.

### 2c. What the type layer is for

- Exhaustive coverage with no hand-maintained lists: every CSSProperties key, every on* DOM attribute, every HTMLElementTagNameMap tag becomes a token definition.
- Names and values derived from the platform type, so adapter vocabulary cannot drift from React/DOM. This is the fix for the review finding that hand-enumerated DOM primitives were "falsely broad over handwritten runtime subsets" (7e29c1dc pos 16-20).
- Payload types must be the platform's own: after the style reversal, StyleValue<P> is simply the non-optional React.CSSProperties[P]; Event handlers are (event) => Effect<void>.
- Type-level rule safety rides on the same toolchain: RuleValidation uses type-fest IsEqual/IsNever to reject overlapping conditions writing the same slot.

## 3. Authoring API shape

### 3a. Core vocabulary as built (unchanged through the rename)

    const Disabled = Token("Disabled")()
    const Button = Token("Button")()

    const runtime = yield* new Whuiy()
      .rule(Button(Disabled()), function* (button) {
        yield* button.get(Opacity()).pipe(Token.setValue(0.5))
      })
      .make()

- Tokens are facts and relations. Token("Name")() makes a definition; calling it with child terms makes an instance; Not(...) is negation; aliases exist in token.ts.
- Rules are a condition pattern plus a generator yielding typed writes (add/del/set), so behavior is data the graph can inspect, not a callback hidden in a component.
- Builder: immutable Whuiy, .extend(bundle), .rule(...), .make(): Effect<WhuiyRuntime>. The runtime owns mounts, a changes stream and a ruleFailures stream (packages/core/src/whuiy.ts, graph.ts).
- Adapters project the mounted graph: react/src/projection.tsx collects Style/Event/Element decorator metadata, builds the host tree, attaches Effect-backed handlers, and reprojects on changes.
- Known adapter limitation from the compile thread: Mount.changes is Stream<void> (graph.ts), which is enough for React but "too lossy for a raw DOM adapter"; structured records such as relation-added / value-changed / mounted were proposed, not implemented (e487f0ca pos 5).

### 3b. Adapter split the user asked for

7e29c1dc pos 0:

> "Can you make @whuiy/dom? Basically @whuiy/react, but for pure html"

pos 22:

> "dont use Color or Size (which also arent used in the react version)"
> "since the Style and listeners and other stuff are shared between react and dom, can you move it to the base package instead?"

Result (pos 53): core owns the Element/Style/Event token families and their metadata; adapters own only projection and lifecycle; adapter-only metadata lives behind an internal whuiy/primitives subpath. This is the settled ownership rule for any new renderer.

### 3c. Declarative rules tier (sketch only)

Cascade.rules({...}) with Cascade.when(...).set(...) appears once, at e487f0ca pos 7, explicitly "introduce later - not a replacement for generators". The user never replied to it. Treat it as a sketch that makes full erasure possible, not as decided API.

## 4. Rejected, removed, unfinished

| item                                                   | state                                                                    | evidence                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------ | ----------------------------------- |
| Zod-style compiler of arbitrary rule bodies            | rejected as the general answer; handlers stay dynamic                    | e487f0ca pos 3, 7                   |
| Global candidate-rule scan over every live node        | rejected in favor of per-element rule plans                              | e487f0ca pos 6-7                    |
| Cascade.compile() and any @cascade/compiler package    | never built                                                              | e487f0ca, rg over packages          |
| Structured GraphChange records instead of Stream<void> | proposed, not built                                                      | e487f0ca pos 5                      |
| Declarative Cascade.rules / when / set tier            | sketch only                                                              | e487f0ca pos 7                      |
| @whuiy/dom                                             | built in the WhUIy project, absent from main here                        | 7e29c1dc, packages/                 |
| Duplicated per-adapter primitives                      | removed; vocabulary moved to core                                        | 7e29c1dc pos 22-24, 53              |
| Semantic Size/Color wrappers in Style tokens           | built, then rejected outright                                            | 94510784 pos 13-19, 7e29c1dc pos 22 |
| Row, Column, Text, Image, ImageSource                  | deleted with their projection path and demo                              | 94510784 pos 20-26                  |
| Derived CSS classifier over React.CSSProperties        | abandoned: the CSS types cannot distinguish size/color from open strings | 94510784 pos 0-9                    |
| TS 7.1 content mappers for typeInfo                    | floated, never evaluated                                                 | 7c0ad32c pos 0                      |
| Cascade name                                           | renamed Whuiy, breaking minor 0.3.0 with a changeset                     | 3f30fc54 pos 0, 7, 11               |

Status of the DOM package deserves emphasis: it shipped in the WhUIy project with generated primitive families, Happy DOM tests and consolidated core ownership (7e29c1dc pos 53), but main here has only core and react. Porting it is unfinished work, not a rejected idea.

## 5. Where the user overruled the assistant

1. Compiler scope. Assistant: a general compiler is not credible, compile the dispatch plan. User reframed to per element - "you dont need to look through every element to see if a rule applies, if its relations can never have that rule" - and added the stronger claim that appearance rules are "kind of never seen". Assistant conceded with "Exactly" and rebuilt the proposal around per-definition programs (e487f0ca pos 3-7).

2. Style typing, twice. First the user demanded derived style types, then reversed himself when the types resisted: "css types are, like, way less structural than i thought ... its not worth it to, like, make type wrappers for them ... can we take a step back, and just kinda trust typescript with it? like, just Style.Height(whatever). like, simplify it" (94510784 pos 9). The assistant's Size/Color utility wrappers survived one release, then the user killed them in the DOM thread: "dont use Color or Size (which also arent used in the react version)" (7e29c1dc pos 22).

3. "Just react". After the legacy cleanup the user cut further: "can you remove Row, Image, and the 0.1.0 primitivies, so its more "just react"" (94510784 pos 20), clarifying in pos 21 that he meant Row, Column, Text, Image. The assistant deleted the specialized projection branches, the contact-row demo and its export.

4. Ownership. The assistant's first DOM pass duplicated primitives and kept semantic values. User rejected both and required shared Style/listeners in the base package (7e29c1dc pos 22); the assistant then redesigned around core-owned, renderer-neutral vocabulary (pos 24, 33).

5. Naming. The assistant kept Cascade API symbols while renaming packages; user authorized the break: "You can make breaking changes (like Cascade API names to Whuiy) its like, 0.2. Just make sure to make a changeset (technically a minor version)" (3f30fc54 pos 7).

6. Stopping on hard types. In 94510784 pos 0 the user pre-authorized a stop: "if you have a hard time do this, please stop the task and tell me whats happening, so i can fix it for you (typescript is hard for agents)". The assistant used it (pos 8); that stop is the origin of the simplification, not a failure to finish.

## 6. Canon framing, and how thin it is

7c0ad32c pos 0:

> "read my philosophy on canon (this is basically a bootleg of canon so i can have something that exists for ui rather than waiting for the language to be done), that things should be described, and that ui is made with assumptions that arent written to computers"

The doctrine itself is in /home/raviglepi/canon/PHILOSOPHY.md: "A program should describe the concepts it works with, how they relate, what constraints apply, and why an operation follows", and "Canon treats a program as a graph of concepts, values, relations, and operations. The graph is the idea being expressed."

Gap: no thread translates the UI half ("ui is made with assumptions that arent written to computers") into Whuiy terms. The concrete translations that do exist are structural only: UI state as a token graph, behavior as rules over relations, renderers as projections. If that doctrine is supposed to drive API decisions, it is currently an unstated premise; the only place it is written down for UI is this one sentence in the takeover brief.

## 7. Open decisions the takeover has to make

- Whether to build rules compilation at all, and in which form: per-definition codegen, Cascade.compile(), or the declarative rules tier first. Nothing in the threads chooses.
- Whether Mount.changes grows structured change records. A retained-DOM adapter that patches locally needs them; React does not.
- typesugar typeInfo vs TS 7.1 content mappers, and whether to move to 7.1 dev. Explicitly delegated to the implementer.
- Confirming that the unplugin comptime the user meant is comptime@0.1.0 (already wired in) rather than unplugin-comptime.
- Whether @whuiy/dom is ported from the WhUIy project into this repo before compiler work begins.
- Whether the Canon "described UI" doctrine produces any API requirement beyond the token graph already built.
