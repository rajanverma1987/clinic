# CursorMD/New – Source of Truth

The **`CursorMD/New`** folder is the **only canonical source of truth** for this project.

## Boundary Rule: Nothing Outside

- **All implementation must be made only as per the files in CursorMD/New.** No features, permissions, data models, APIs, real-time events, or architecture may be added that are not defined in this folder.
- **Other docs** (e.g. other CursorMD files, implementation plans) must not drive implementation. If they conflict with or go beyond CursorMD/New, CursorMD/New wins. Do not implement anything that exists only in other docs.
- **To add new scope** (new feature, role, entity, event, permission): first update the appropriate file(s) in CursorMD/New, then implement in code.

## CursorMD/New Contents (Read Before Implementing)

| File                                      | Governs                                                                                                                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **clinic-complete-specification.md**      | Permission matrix (Super Admin, Doctor, Admin, Manager), feature specs per role, dashboard widgets, backend folder structure, technical recommendations. |
| **clinic-dashboard-architecture.mermaid** | Roles, dashboards, core modules, real-time features, backend (API, WebSocket, Cache, DB).                                                                |
| **database-schema.mermaid**               | Entities, relationships, field names. Use for models and API contracts.                                                                                  |
| **realtime-caching-strategy.md**          | WebSocket event names, Redis pub/sub, cache layers, TTLs, invalidation, client socket usage.                                                             |
| **CURSORMD_NEW_CHECKLIST.md**             | Point-by-point checklist of every item from the four spec files; implement each point.                                                                   |

## Cursor Rules Enforcing This

- **`.cursor/rules/cursor-md-new-source-of-truth.mdc`** (always apply): Read the relevant CursorMD/New file(s) before implementing; implement only what they define; CursorMD/New wins on conflicts.
- **`.cursor/rules/cursor-md-new-boundary.mdc`** (always apply): Do not implement anything not specified in CursorMD/New; new scope must be added to CursorMD/New first.

When working in this repo, CursorMD/New is always followed and nothing is implemented outside it.

## Project mapping

See **`CursorMD/PROJECT_CURSORMD_NEW_ALIGNMENT.md`** for how the codebase maps to CursorMD/New (roles, Tenant=Clinic, real-time events, cache TTLs, permissions).
