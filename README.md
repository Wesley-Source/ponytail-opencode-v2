# ponytail — OpenCode V2 port

Local port of [@dietrichgebert/ponytail](https://github.com/DietrichGebert/ponytail) **v4.10.0** to the **OpenCode V2 plugin API**.

> **AI agents:** follow [Install](#install) exactly, in order. Don't improvise paths or config keys.

## Install

**Step 1 — detect OpenCode version.**

```bash
opencode --version
```

- **V2.x** → continue below.
- **V1.x** → do NOT use this repo. Install upstream instead: `opencode npm add @dietrichgebert/ponytail` (or follow `README.upstream.md`).

**Step 2 — clone into the global plugins dir (exact path).**

```bash
mkdir -p ~/.opencode/plugins
git clone https://github.com/Wesley-Source/ponytail-opencode-v2 ~/.opencode/plugins/ponytail
```

OpenCode V2 auto-discovers local plugins in `~/.opencode/plugins/<name>/` (loads `index.js`). No plugin registration needed.

**Step 3 — register the skills in `~/.config/opencode/opencode.json`.**

Open this file (create it if missing) and make `"skills"` contain the **absolute** path (JSON does not expand `~`; substitute the real home dir):

```json
{
  "skills": [
    "/home/YOUR_USER/.opencode/plugins/ponytail/skills"
  ]
}
```

If the file already has other keys (`plugins`, `mcp`, …), only add/extend the `"skills"` array — keep everything else unchanged.

**Step 4 — verify.**

1. Restart OpenCode. Boot must be clean — specifically **no** `SchemaError(Expected object at ["default"])`.
2. Run `/ponytail` → switches mode (`lite` / `full` / `ultra`).
3. `cat ~/.config/opencode/.ponytail-active` → shows the persisted mode after a switch.

## Troubleshooting

- `Plugin must export a default definition with an id and an effect or setup function. (cause: SchemaError(Expected object at ["default"]))` — a **V1** plugin is loaded on an OpenCode **V2** server. This repo exists to fix exactly that for ponytail; make sure the clone lives at `~/.opencode/plugins/ponytail` and there is no other ponytail copy in the plugins dir.
- `/ponytail` missing → Step 3 was skipped or the skills path isn't absolute. Fix `opencode.json` and restart.
- Mode doesn't persist → check the state file path `~/.config/opencode/.ponytail-active` is writable (respects `XDG_CONFIG_HOME`).

## What this port changes vs upstream

- **`ponytail-v2.mjs`** — new; the V2 plugin definition (mode persistence + system-prompt injection + command registration)
- **`index.js`** — new; entry point re-exporting the V2 definition (what OpenCode's local plugin discovery loads)
- **`package.json`** — `main`/`exports` point to `ponytail-v2.mjs`
- Everything else is verbatim from upstream v4.10.0 (see `README.upstream.md` for full upstream docs)

| V1 (upstream) | V2 (this port) |
|---|---|
| `config` hook (command registration) | `ctx.command.transform` |
| `experimental.chat.system.transform` | `ctx.session.hook("context")` |
| `command.execute.before` (mode switch) | the `ponytail` command's own `execute()` persists the mode |

The upstream package only implements the V1 plugin API, which OpenCode 2 rejects at load time — hence this port.

## Credits

All credit for ponytail itself goes to [Dietrich Gebert](https://github.com/DietrichGebert) — this repo only adapts the loading layer for OpenCode V2. MIT license (upstream), kept intact in [LICENSE](LICENSE).
