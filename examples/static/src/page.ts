import {Element, Style, Token, Whuiy} from "whuiy";

const Page = Token("Page")();
const Heading = Token("Heading").content<string>();
const Item = Token("Item")();
const Name = Token("Name").content<string>();
const Price = Token("Price").content<string>();
const Amount = Token("Amount")<number>();
const Sale = Token("Sale")();

const sale = (amount: number): string => `$${(amount * 0.8).toFixed(2)}`;

const listStyle = [
  Style.Display("grid"),
  Style.Gap("0.75rem"),
  Style.Margin("0"),
  Style.Padding("0"),
  Style.ListStyle("none"),
  Style.MaxWidth("24rem"),
] as const;

const itemStyle = [
  Style.Display("grid"),
  Style.Gap("0.25rem"),
  Style.Padding("1rem"),
  Style.BorderRadius("0.75rem"),
  Style.Border("1px solid rgb(0 0 0 / 12%)"),
] as const;

const item = (name: string, amount: number, onSale: boolean) =>
  Item(
    Element.Li(Name(name), Amount(amount), Price(`$${amount.toFixed(2)}`), ...itemStyle),
    ...(onSale ? [Sale()] : []),
  );

/** @since 0.4.0 */
export const page = Page(
  Element.Main(
    Heading("Three plans"),
    Element.Ul(
      item("Basic", 10, false),
      item("Pro", 20, true),
      item("Team", 40, false),
      ...listStyle,
    ),
    Style.Display("grid"),
    Style.Gap("1rem"),
    Style.FontFamily("ui-sans-serif, system-ui, sans-serif"),
    Style.Margin("4rem auto"),
    Style.Width("max-content"),
  ),
);

/** @since 0.4.0 */
export const ui = new Whuiy().rule(Item(Sale()), function* (item) {
  const line = item.get(Element.Li);
  const amount = line.get(Amount).value() ?? 0;
  yield* line.get(Price).pipe(Token.setValue(sale(amount)));
  yield* line.pipe(Token.add(Style.BorderColor("#c2410c")));
});
