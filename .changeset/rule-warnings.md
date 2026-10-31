---
"whuiy": minor
"@whuiy/dom": minor
"@whuiy/react": minor
---

Report rules that read tokens outside their condition.

- `WhuiyRuntime.subscribeWarnings` delivers a `RuleWarning` once per rule and
  definition when a rule reads a token its condition does not include. Such a
  read is a snapshot: the rule never re-runs for that token, and the warning
  names both sides instead of leaving a value that silently never changes.
- `@whuiy/dom` and `@whuiy/react` forward warnings through their error
  reporters as a `"warning"` report kind.
- `examples/playground` and `examples/todo` show warnings in their status line,
  and their tests pin that the current rules emit none.
