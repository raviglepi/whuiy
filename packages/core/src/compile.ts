/** @since 0.4.0 */

import type {RuntimeRule} from "./rules.ts";
import type {TokenDefinitionRef, TokenInstanceRef} from "./token.ts";

import {getDetachedNegativeDefinitions, getDetachedRelations} from "./token.ts";

/**
 * One rule lowered into the token definitions it depends on.
 *
 * **When to use**
 *
 * Read plans when you need to explain why a token changed, or to inspect which
 * element kinds a rule can ever reach.
 *
 * @since 0.4.0
 * @category Models
 */
export interface RulePlan {
  readonly condition: TokenInstanceRef;
  /** Every definition whose change can make this rule newly match. */
  readonly dependencies: readonly TokenDefinitionRef[];
  readonly name: string;
  readonly negatives: readonly TokenDefinitionRef[];
  readonly rule: RuntimeRule;
  /** Definitions that make this rule a candidate when any of them changes. */
  readonly watched: readonly TokenDefinitionRef[];
}

/**
 * Rules lowered to per-element dispatch tables.
 *
 * **When to use**
 *
 * A compiled program lets a runtime test each element against only the rules
 * that can reach its definition.
 *
 * @since 0.4.0
 * @category Models
 */
export interface RuleProgram {
  readonly plans: readonly RulePlan[];
  plansFor(definition: TokenDefinitionRef): readonly RulePlan[];
  explain(definition: TokenDefinitionRef): readonly string[];
}

function collectDependencies(
  condition: TokenInstanceRef,
  into: readonly TokenDefinitionRef[],
): readonly TokenDefinitionRef[] {
  return [
    condition.definition,
    ...into,
    ...getDetachedRelations(condition).flatMap(relation => collectDependencies(relation, into)),
  ];
}

function collectNegatives(
  condition: TokenInstanceRef,
  into: readonly TokenDefinitionRef[],
): readonly TokenDefinitionRef[] {
  return [
    ...getDetachedNegativeDefinitions(condition),
    ...into,
    ...getDetachedRelations(condition).flatMap(relation => collectNegatives(relation, into)),
  ];
}

function uniqueDefinitions(
  definitions: readonly TokenDefinitionRef[],
): readonly TokenDefinitionRef[] {
  return [...new Set(definitions)];
}

function plan(rule: RuntimeRule): RulePlan {
  const dependencies = uniqueDefinitions(collectDependencies(rule.condition, []));
  return {
    condition: rule.condition,
    dependencies,
    name: rule.name,
    negatives: getDetachedNegativeDefinitions(rule.condition),
    rule,
    watched: uniqueDefinitions([...dependencies, ...collectNegatives(rule.condition, [])]),
  };
}

function appendPlan(
  index: Map<TokenDefinitionRef, RulePlan[]>,
  definition: TokenDefinitionRef,
  entry: RulePlan,
): void {
  index.set(definition, [...(index.get(definition) ?? []), entry]);
}

function indexPlans(plans: readonly RulePlan[]): ReadonlyMap<TokenDefinitionRef, RulePlan[]> {
  const index = new Map<TokenDefinitionRef, RulePlan[]>();
  for (const entry of plans)
    for (const definition of entry.watched) appendPlan(index, definition, entry);
  return index;
}

function describe(plan: RulePlan): string {
  const positives = plan.dependencies.map(definition => definition.name).join(" + ");
  const negatives = plan.negatives.map(definition => "-" + definition.name).join(" ");
  return negatives.length === 0
    ? `${plan.name}: ${positives}`
    : `${plan.name}: ${positives} ${negatives}`;
}

/**
 * Lowers rules to per-element dispatch tables.
 *
 * **When to use**
 *
 * Call this directly when you want to inspect the plan before allocating a
 * runtime, or when a custom adapter needs the element-to-rule mapping.
 *
 * @since 0.4.0
 * @category Constructors
 */
export function compileRules(rules: readonly RuntimeRule[]): RuleProgram {
  const plans = rules.map(rule => plan(rule));
  const index = indexPlans(plans);
  return {
    explain: definition => (index.get(definition) ?? []).map(entry => describe(entry)),
    plans,
    plansFor: definition => index.get(definition) ?? [],
  };
}
