import type {Setters} from "@whuiy/codegen";

import {Effect} from "effect";

/** @since 0.4.0 */
export interface AppState {
  readonly count: number;
  readonly query: string;
  readonly theme: string;
}

const ITEMS = Array.from({length: 200}, (_, index) => `row ${String(index + 1).padStart(3, "0")}`);
const LIMIT = 50;

/** @since 0.4.0 */
export const handleIncrement = (setters: Setters<AppState>) =>
  Effect.sync(() => setters.count.update(current => current + 1));

/** @since 0.4.0 */
export const handleQuery = (setters: Setters<AppState>, event: InputEvent) => {
  const target = event.target;
  return Effect.sync(() =>
    setters.query.set(target instanceof HTMLInputElement ? target.value : ""),
  );
};

/** @since 0.4.0 */
export const handleTheme = (setters: Setters<AppState>) =>
  Effect.sync(() => setters.theme.update(theme => (theme === "dark" ? "light" : "dark")));

/** @since 0.4.0 */
export const handleDouble = (setters: Setters<AppState>) =>
  Effect.gen(function* () {
    yield* Effect.sleep("1 millis");
    setters.count.update(current => current * 2);
  });

/** @since 0.4.0 */
export const labelText = (state: {readonly count: number}): string => String(state.count);

/** @since 0.4.0 */
export const filterRows = (state: {readonly query: string}): readonly string[] =>
  ITEMS.filter(item => item.includes(state.query)).slice(0, LIMIT);

/** @since 0.4.0 */
export const themeBackground = (state: {readonly theme: string}): string =>
  state.theme === "dark" ? "#12141a" : "#ffffff";

/** @since 0.4.0 */
export const themeForeground = (state: {readonly theme: string}): string =>
  state.theme === "dark" ? "#e7e9ee" : "#15171c";

/** @since 0.4.0 */
export const hasMatches = (state: {readonly query: string}): boolean =>
  filterRows(state).length > 0;
