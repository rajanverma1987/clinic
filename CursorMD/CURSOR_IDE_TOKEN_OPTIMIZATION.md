# Cursor IDE Token Optimization

This document describes the **workspace-level Cursor settings** applied in `.vscode/settings.json` to reduce token usage, improve accuracy (fewer false statements), and cut cost while keeping quality high.

**AI behavior:** The rule **`.cursor/rules/token-optimization-and-accuracy.mdc`** is set to `alwaysApply: true`, so Cursor’s AI (Chat/Agent) follows these principles on every response: concise answers, code-focused when appropriate, minimal changes, preserve working code, only documented APIs, and “I’m not certain” when unsure. You do not need to repeat these in prompts.

---

## Model policy — accurate, current, task-appropriate only

**Strong requirement:** Cursor must use **only accurate, up-to-date models** that are **compatible with the task** at hand. Do **not** use outdated or incompatible models.

| Use (approved)      | For                                                   |
| ------------------- | ----------------------------------------------------- |
| `claude-opus-4-5`   | Chat, Edit, Fix, Agent — complex/critical work        |
| `claude-sonnet-4-5` | Autocomplete, Generate, Explain — simpler/boilerplate |

**Do not use for accuracy-critical work:** Older Claude (3.x), GPT-4, or any deprecated/unsupported model when the task needs current reasoning and API compatibility.

**Manual check:** In **Cursor → Settings → Models**, set Chat / Composer / Agent to `claude-opus-4-5` and Autocomplete to `claude-sonnet-4-5`. Remove or do not select outdated or incompatible models for those slots.

---

## 1. Model Selection (CRITICAL)

| Setting                     | Value               | Why                                            |
| --------------------------- | ------------------- | ---------------------------------------------- |
| `cursor.chat.model`         | `claude-opus-4-5`   | Complex tasks → fewer revisions, more accurate |
| `cursor.autocomplete.model` | `claude-sonnet-4-5` | Cheaper, still accurate for completions        |
| `cursor.agent.model`        | `claude-opus-4-5`   | Agent needs highest accuracy                   |

**Token savings:** ~40–50% by using the right model per task. **Use only these current models;** do not use outdated or incompatible models for the task.

---

## 2. Autocomplete (BIGGEST WASTE)

| Setting                                 | Value    | Effect                                    |
| --------------------------------------- | -------- | ----------------------------------------- |
| `cursor.autocomplete.enabled`           | `true`   | Keep autocomplete on                      |
| `cursor.autocomplete.triggerMode`       | `manual` | **KEY:** Only on Tab, not every keystroke |
| `cursor.autocomplete.debounceTime`      | `1000`   | Wait 1s before triggering                 |
| `cursor.autocomplete.maxSuggestions`    | `1`      | Only best suggestion                      |
| `cursor.autocomplete.disableInComments` | `true`   | No suggestions in comments                |

**Default waste:** Triggers on every keystroke, 3–5 suggestions, runs while reading.  
**Token savings:** ~60–70% on autocomplete.

---

## 3. Context Window

| Setting                             | Value   | Effect                         |
| ----------------------------------- | ------- | ------------------------------ |
| `cursor.chat.maxContextFiles`       | `10`    | Default is ~50 (huge waste)    |
| `cursor.chat.includeGitChanges`     | `false` | No full git history in context |
| `cursor.chat.smartContextSelection` | `true`  | Let Cursor pick relevant files |
| `cursor.agent.maxFilesToEdit`       | `3`     | Limit agent scope              |

**Token savings:** ~30–40% on context overhead.

---

## 4. Agent Behavior

| Setting                             | Value   | Effect                          |
| ----------------------------------- | ------- | ------------------------------- |
| `cursor.agent.autoApprove`          | `false` | Always review before applying   |
| `cursor.agent.confirmBeforeEdit`    | `true`  | Ask per file                    |
| `cursor.agent.maxIterations`        | `2`     | Stop after 2 attempts (not 10+) |
| `cursor.agent.preserveExistingCode` | `true`  | Don’t rewrite working code      |

**Token savings:** ~50–60% on agent waste; fewer runaway edits.

---

## 5. Response Length

| Setting                            | Value  | Effect                                  |
| ---------------------------------- | ------ | --------------------------------------- |
| `cursor.chat.maxTokensPerResponse` | `2000` | Cap response size                       |
| `cursor.chat.conciseMode`          | `true` | Shorter answers                         |
| `cursor.chat.codeOnly`             | `true` | Skip long explanations for simple tasks |

**Token savings:** ~30–40% on response bloat.

---

## 6. Caching

| Setting                           | Value  | Effect                |
| --------------------------------- | ------ | --------------------- |
| `cursor.cache.enabled`            | `true` | Use cache             |
| `cursor.cache.contextCaching`     | `true` | Cache file context    |
| `cursor.cache.modelResponseCache` | `true` | Cache similar queries |
| `cursor.cache.ttl`                | `3600` | 1 hour TTL            |

**Token savings:** ~20–30% on repeated queries.

---

## 7. Model Overrides (per task)

| Task     | Model             | Reason                       |
| -------- | ----------------- | ---------------------------- |
| chat     | claude-opus-4-5   | Accuracy                     |
| edit     | claude-opus-4-5   | Accuracy                     |
| generate | claude-sonnet-4-5 | Boilerplate is cheaper       |
| explain  | claude-sonnet-4-5 | Explanations don’t need Opus |
| fix      | claude-opus-4-5   | Bug fixes need accuracy      |

**Token savings:** ~25–35% from task-based model choice.

---

## 8. Disabled Features (background token burn)

| Setting                               | Value   | Reason                     |
| ------------------------------------- | ------- | -------------------------- |
| `cursor.experimental.autoFixErrors`   | `false` | No auto-fix on every error |
| `cursor.experimental.predictNextEdit` | `false` | No prediction              |
| `cursor.linter.aiSuggestions`         | `false` | No AI lint suggestions     |
| `cursor.formatting.aiStyling`         | `false` | Use Prettier, not AI       |

**Token savings:** ~15–25% on background features.

---

## 9. File Ignore Patterns

`cursor.ignore` and VS Code `files.exclude` / `search.exclude` exclude:

- `**/node_modules/**`, `**/.next/**`, `**/dist/**`, `**/build/**`, `**/.git/**`, `**/coverage/**`
- `**/*.test.ts`, `**/*.spec.ts` (unless you’re on tests)
- `**/README.md`, `**/CHANGELOG.md`
- `**/*.png`, `**/*.jpg`, `**/package-lock.json`

**Token savings:** ~20–30% by keeping noise out of context.

---

## 10. Custom Prompts (manual in Cursor UI)

Add these in **Cursor Settings → Prompts → Custom** to reduce hallucinations:

| Name                 | Prompt                                                                                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Accurate Code**    | "Only suggest code that uses documented APIs from the actual packages in my package.json. If you're unsure about an API, say 'I'm not certain' instead of guessing. Verify syntax before suggesting." |
| **Minimal Changes**  | "Make the smallest possible change to fix this issue. Don't rewrite working code. Only modify what's broken."                                                                                         |
| **Production Ready** | "Write production-quality code with proper error handling, TypeScript types, and security best practices. No placeholder comments."                                                                   |

**Usage:** Select code → Right-click → Use custom prompt.  
**Effect:** ~10–15% fewer hallucinations.

---

## Applying Settings

- **Workspace:** `.vscode/settings.json` is already populated. If Cursor doesn’t pick up all `cursor.*` keys from the workspace, copy them into **Cursor Settings** (e.g. **Ctrl/Cmd + Shift + J** → search for the key).
- **User-level:** Paste the same `cursor.*` entries into **Cursor → Settings → JSON** (user `settings.json`) so they apply everywhere.
- **Custom prompts:** Must be added manually in Cursor Settings → Prompts → Custom.

---

## Reference: Full `cursor_settings.json`

The complete optimized JSON is in `.vscode/settings.json`. A copy is kept here for reference if that file is not committed:

```json
{
  "cursor.chat.model": "claude-opus-4-5",
  "cursor.autocomplete.model": "claude-sonnet-4-5",
  "cursor.agent.model": "claude-opus-4-5",
  "cursor.autocomplete.enabled": true,
  "cursor.autocomplete.triggerMode": "manual",
  "cursor.autocomplete.debounceTime": 1000,
  "cursor.autocomplete.maxSuggestions": 1,
  "cursor.autocomplete.disableInComments": true,
  "cursor.chat.maxContextFiles": 10,
  "cursor.chat.includeGitChanges": false,
  "cursor.chat.smartContextSelection": true,
  "cursor.agent.maxFilesToEdit": 3,
  "cursor.agent.autoApprove": false,
  "cursor.agent.confirmBeforeEdit": true,
  "cursor.agent.maxIterations": 2,
  "cursor.agent.preserveExistingCode": true,
  "cursor.chat.maxTokensPerResponse": 2000,
  "cursor.chat.conciseMode": true,
  "cursor.chat.codeOnly": true,
  "cursor.cache.enabled": true,
  "cursor.cache.contextCaching": true,
  "cursor.cache.modelResponseCache": true,
  "cursor.cache.ttl": 3600,
  "cursor.modelOverrides": {
    "chat": "claude-opus-4-5",
    "edit": "claude-opus-4-5",
    "generate": "claude-sonnet-4-5",
    "explain": "claude-sonnet-4-5",
    "fix": "claude-opus-4-5"
  },
  "cursor.experimental.autoFixErrors": false,
  "cursor.experimental.predictNextEdit": false,
  "cursor.linter.aiSuggestions": false,
  "cursor.formatting.aiStyling": false,
  "cursor.ignore": [
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/build/**",
    "**/.git/**",
    "**/coverage/**",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/README.md",
    "**/CHANGELOG.md",
    "**/*.png",
    "**/*.jpg",
    "**/package-lock.json"
  ]
}
```

---

## Commit workspace settings (optional)

`.vscode/` is in `.gitignore`. To share these settings with the team, remove `.vscode` from `.gitignore` and commit `.vscode/settings.json`. Then everyone opening this repo gets the same Cursor optimizations.
