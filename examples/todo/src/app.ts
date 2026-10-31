import type {LiveToken, TokenRoot} from "whuiy";

import {Effect} from "effect";

import {Element, Event, Property, Style, Token, Whuiy} from "whuiy";

/** @since 0.4.0 */
export interface Todo {
  readonly done: boolean;
  readonly id: number;
  readonly title: string;
}

// State: the facts the app owns.
const Todos = Token("Todos")<readonly Todo[]>();
const Draft = Token("Draft")<string>();

// Chrome.
const App = Token("App")();
const Field = Token("Field")();
const Add = Token("Add")();
const Rows = Token("Rows")();

// One rendered todo, and the facts it carries.
const Row = Token("Row")();
const Key = Token("Key")<number>();
const Done = Token("Done").single<boolean>();

// Content: projected as text.
const Label = Token("Label").content<string>();
const Count = Token("Count").content<string>();
const Caption = Token("Caption").content<string>();

const plainButtonStyle = [
  Style.Border("none"),
  Style.Background("none"),
  Style.Cursor("pointer"),
  Style.Font("inherit"),
  Style.Padding("0.125rem 0.25rem"),
] as const;

const plainButton = <const Extra extends readonly TokenRoot[]>(label: string, ...extra: Extra) =>
  Element.Button(Caption(label), ...plainButtonStyle, ...extra);

const nextId = (todos: readonly Todo[]): number =>
  todos.reduce((highest, todo) => Math.max(highest, todo.id), 0) + 1;

const row = (app: LiveToken, todo: Todo) => {
  const todos = app.get(Todos);
  const write = (next: readonly Todo[]) => todos.pipe(Token.setValue(next));
  const toggle = () =>
    write(
      (todos.value() ?? []).map(item => (item.id === todo.id ? {...item, done: !item.done} : item)),
    );
  const remove = () => write((todos.value() ?? []).filter(item => item.id !== todo.id));
  return Row(
    Key(todo.id),
    Done(todo.done),
    Element.Li(
      Style.Display("flex"),
      Style.AlignItems("center"),
      Style.Gap("0.5rem"),
      Style.Padding("0.25rem 0"),
      Element.Input(
        Property.Type("checkbox"),
        Property.Checked(todo.done),
        Event.OnChange(toggle),
        Style.AccentColor("#4f46e5"),
      ),
      Element.Span(Label(todo.title), Style.Flex("1")),
      plainButton("×", Event.OnClick(remove), Style.Color("rgb(0 0 0 / 35%)")),
    ),
  );
};

/** @since 0.4.0 */
export const description = (todos: readonly Todo[]) =>
  App(
    Draft(""),
    Todos(todos),
    Element.Section(
      Style.Display("grid"),
      Style.Gap("0.75rem"),
      Style.MaxWidth("26rem"),
      Style.Margin("4rem auto"),
      Style.Padding("1.5rem"),
      Style.BorderRadius("0.75rem"),
      Style.Border("1px solid rgb(0 0 0 / 12%)"),
      Style.FontFamily("ui-sans-serif, system-ui, sans-serif"),
      Style.FontSize("0.95rem"),
      Element.H1(Caption("todos"), Style.FontSize("1rem"), Style.Margin("0")),
      Element.Div(
        Style.Display("flex"),
        Style.Gap("0.5rem"),
        Field(
          Element.Input(
            Property.Value(""),
            Property.Placeholder("what needs doing?"),
            Style.Padding("0.375rem 0.5rem"),
            Style.BorderRadius("0.5rem"),
            Style.Border("1px solid rgb(0 0 0 / 15%)"),
            Style.FontSize("0.9rem"),
            Style.BoxSizing("border-box"),
            Style.Flex("1"),
          ),
        ),
        Add(plainButton("add")),
      ),
      Element.P(Count(""), Style.Margin("0"), Style.Opacity("0.65")),
      Element.Ul(
        Rows(),
        Style.Margin("0"),
        Style.Padding("0"),
        Style.ListStyle("none"),
        Style.Display("grid"),
      ),
    ),
  );

const appendTodo = (options: {
  readonly draft: LiveToken<typeof Draft>;
  readonly title: string;
  readonly todos: LiveToken<typeof Todos>;
  readonly value: LiveToken<typeof Property.Value> | undefined;
}): Effect.Effect<void> => {
  const current = options.todos.value() ?? [];
  return Effect.gen(function* () {
    yield* options.todos.pipe(
      Token.setValue([...current, {done: false, id: nextId(current), title: options.title}]),
    );
    yield* options.draft.pipe(Token.setValue(""));
    if (options.value !== undefined) yield* options.value.pipe(Token.setValue(""));
  });
};

/** @since 0.4.0 */
export const ui = new Whuiy()
  // 1. Chrome wires its own controls once. The input's `value` property mirrors
  //    the draft, so clearing the draft also clears the DOM after adding.
  .rule(App(), function* (app) {
    const draft = app.get(Draft);
    const todos = app.get(Todos);
    const form = app.get(Element.Section).get(Element.Div);
    const input = form.get(Field).get(Element.Input);
    const value = input.all(Property.Value)[0];
    yield* input.pipe(
      Token.add(
        Event.OnInput(event => {
          const target = event.target;
          const next = target instanceof HTMLInputElement ? target.value : "";
          return Effect.gen(function* () {
            yield* draft.pipe(Token.setValue(next));
            if (value !== undefined) yield* value.pipe(Token.setValue(next));
          });
        }),
      ),
    );
    yield* form
      .get(Add)
      .get(Element.Button)
      .pipe(
        Token.add(
          Event.OnClick(() => {
            const title = String(draft.value() ?? "").trim();
            if (title === "") return Effect.void;
            return appendTodo({draft, title, todos, value});
          }),
        ),
      );
  })
  // 2. The list is derived from the data, and replaced as a whole.
  .rule(App(Todos()), function* (app) {
    const todos = app.get(Todos).value() ?? [];
    const section = app.get(Element.Section);
    yield* section
      .get(Element.Ul)
      .get(Rows)
      .pipe(Token.set(...todos.map(todo => row(app, todo))));
    const done = todos.filter(todo => todo.done).length;
    yield* section
      .get(Element.P)
      .get(Count)
      .pipe(Token.setValue(todos.length === 0 ? "nothing yet" : `${done} of ${todos.length} done`));
  })
  // 3. What a done todo means. One rule, run per row.
  .rule(Row(Done()), function* (rowToken) {
    const done = rowToken.get(Done).value() === true;
    yield* rowToken
      .get(Element.Li)
      .pipe(
        Token.add(
          Style.TextDecoration(done ? "line-through" : "none"),
          Style.Opacity(done ? "0.55" : "1"),
        ),
      );
  });

/** @since 0.4.0 */
export const seed: readonly Todo[] = [
  {done: true, id: 1, title: "read the takeover thread"},
  {done: false, id: 2, title: "write the todo example"},
];
