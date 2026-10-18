@context/INDEX.md

## Architecture

`architecture.yaml` declares this repo's modules. Before changing a file, run `architecture owner <path>` and `architecture show <module>`, and follow that module's contract, `verified_by` test, `reads` and `does_not`. Decide implementation details from the declaration and `~/.claude/skills/architecture/references/principles.md`; ask Ben only about intent. Register added, moved, renamed or deleted files in the same commit. Require `architecture check` and the contract tests to pass at merge.
