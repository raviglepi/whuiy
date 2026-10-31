/** @since 0.4.0 */

import {Token} from "whuiy";

/** Content: the only token whose value is projected as text. */
export const Text = Token("Text").content<string>();

// The two facts the whole document follows.
/** @since 0.4.0 */
export const Theme = Token("Theme").single<string>();
/** @since 0.4.0 */
export const Route = Token("Route").single<string>();
/** @since 0.4.0 */
export const Narrow = Token("Narrow").single<boolean>();

// Structure.
/** @since 0.4.0 */
export const Craft = Token("Craft")();
/** @since 0.4.0 */
export const Chrome = Token("Chrome")();
/** @since 0.4.0 */
export const Stack = Token("Stack")();
/** @since 0.4.0 */
export const Page = Token("Page")();
/** @since 0.4.0 */
export const Slug = Token("Slug").single<string>();
/** @since 0.4.0 */
export const Sidebar = Token("Sidebar")();
/** @since 0.4.0 */
export const TopNav = Token("TopNav")();
/** @since 0.4.0 */
export const ChapterList = Token("ChapterList")();
/** @since 0.4.0 */
export const NavEntry = Token("NavEntry")();
/** @since 0.4.0 */
export const Columns = Token("Columns")();
/** @since 0.4.0 */
export const Entry = Token("Entry")();
/** @since 0.4.0 */
export const Control = Token("Control")();
/** @since 0.4.0 */
export const Hovered = Token("Hovered").single<boolean>();
/** @since 0.4.0 */
export const Pressed = Token("Pressed").single<boolean>();
/** @since 0.4.0 */
export const Hoverable = Token("Hoverable")();
/** @since 0.4.0 */
export const Chip = Token("Chip")();
/** @since 0.4.0 */
export const Selected = Token("Selected").single<boolean>();

// Search.
/** @since 0.4.0 */
export const Sheet = Token("Sheet")();
/** @since 0.4.0 */
export const Open = Token("Open").single<boolean>();
/** @since 0.4.0 */
export const Query = Token("Query").single<string>();
/** @since 0.4.0 */
export const Results = Token("Results")();
/** @since 0.4.0 */
export const SearchRow = Token("SearchRow")();
/** @since 0.4.0 */
export const SearchEmpty = Token("SearchEmpty")();
/** @since 0.4.0 */
export const SheetInput = Token("SheetInput")();
/** @since 0.4.0 */
export const SheetClose = Token("SheetClose")();
/** @since 0.4.0 */
export const SheetHeader = Token("SheetHeader")();
/** @since 0.4.0 */
export const SearchTrigger = Token("SearchTrigger")();

// Demos: each carries its own state so a page is a closed description.
/** @since 0.4.0 */
export const OutlineDemo = Token("OutlineDemo")();
/** @since 0.4.0 */
export const Outlined = Token("Outlined").single<boolean>();
/** @since 0.4.0 */
export const OutlineStrength = Token("OutlineStrength").single<number>();
/** @since 0.4.0 */
export const OutlineChoice = Token("OutlineChoice").single<string>();
/** @since 0.4.0 */
export const OutlineStrengthInput = Token("OutlineStrengthInput")();

/** @since 0.4.0 */
export const NestedDemo = Token("NestedDemo")();
/** @since 0.4.0 */
export const OuterRadius = Token("OuterRadius").single<number>();
/** @since 0.4.0 */
export const InnerPadding = Token("InnerPadding").single<number>();
/** @since 0.4.0 */
export const OuterInput = Token("OuterInput")();
/** @since 0.4.0 */
export const PaddingInput = Token("PaddingInput")();
/** @since 0.4.0 */
export const OutlineReadout = Token("OutlineReadout").content<string>();
/** @since 0.4.0 */
export const NestedReadout = Token("NestedReadout").content<string>();
/** @since 0.4.0 */
export const ProportionalValue = Token("ProportionalValue").content<string>();
/** @since 0.4.0 */
export const TabularValue = Token("TabularValue").content<string>();

/** @since 0.4.0 */
export const NumericDemo = Token("NumericDemo")();
/** @since 0.4.0 */
export const Reading = Token("Reading").single<number>();
/** @since 0.4.0 */
export const RevealDemo = Token("RevealDemo")();
/** @since 0.4.0 */
export const Revealed = Token("Revealed").single<boolean>();

// Paths a rule walks: the graph only navigates downward, so the description
// names the parts a rule needs to reach.
/** @since 0.4.0 */
export const Stage = Token("Stage")();
/** @since 0.4.0 */
export const Photos = Token("Photos")();
/** @since 0.4.0 */
export const Controls = Token("Controls")();
/** @since 0.4.0 */
export const ReadoutRow = Token("ReadoutRow")();
/** @since 0.4.0 */
export const Numbers = Token("Numbers")();
/** @since 0.4.0 */
export const ProportionalColumn = Token("ProportionalColumn")();
/** @since 0.4.0 */
export const TabularColumn = Token("TabularColumn")();
/** @since 0.4.0 */
export const Knob = Token("Knob")();
/** @since 0.4.0 */
export const ThemeSwitch = Token("ThemeSwitch")();
/** @since 0.4.0 */
export const Body = Token("Body")();
/** @since 0.4.0 */
export const Layout = Token("Layout")();
