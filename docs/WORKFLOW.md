# Workflow

Current operating mode:
- foundation cleanup completed
- product planning before expansion
- determinism before convenience
- explicit ownership before flexibility

Current execution flow:
1. review in `docs/review/`
2. active cleanup tracking in `docs/hygiene/` and `docs/todo/`
3. architecture/design authority in `app_architecture/`

Short rule:
- if work changes runtime contracts, update `app_architecture/`
- if work changes cleanup priority, update `docs/hygiene/` or `docs/todo/`
- if work is a major scrutiny pass, write it under `docs/review/`
- if work introduces or changes testing rules, update `docs/hygiene/TESTING_STRATEGY.md`
- if work introduces or clarifies a repo convention, update `app_architecture/CONVENTIONS.md`
