/** @since 0.4.0 */

import type {LiveToken, TokenDefinitionRef} from "whuiy";

/** A missing value reads as its documented default. */
export const asText = (value: string | undefined, fallback: string): string => value ?? fallback;

export const asNumber = (value: number | undefined, fallback: number): number => value ?? fallback;

export const isOn = (value: boolean | undefined): boolean => value === true;

/** The one place a boolean fact picks its presentation. */
export const either = <Value>(flag: boolean, yes: Value, no: Value): Value => (flag ? yes : no);

/**
 * The graph is undirected, so a node inside a `<div>` has two div relations:
 * its own child and its owner. A node's own relations are listed first.
 */
export const inner = <Target extends TokenDefinitionRef>(node: LiveToken, target: Target) => {
  const [found] = node.all(target);
  if (found === undefined) {
    throw new Error(`Token ${node.definition.name} has no ${target.name} relation`);
  }
  return found;
};
