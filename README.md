# ponytail — OpenCode V2 port

Local port of [@dietrichgebert/ponytail](https://github.com/DietrichGebert/ponytail) **v4.10.0** to the **OpenCode V2 plugin API**.

The upstream package only implements the V1 plugin API (default export is an async function returning hooks), which OpenCode 2 rejects at load time with:

```
Plugin must export a default definition with an id and an effect or setup function.
(cause: SchemaError(Expected object at ["default"]))
```

This port keeps every upstream file untouched (`hooks/`, `skills/`, `.opencode/`, commands, etc.) and re-exposes the same behavior through the V2 API:

| V1 | V2 (this port) |
|---|---|
| `config` hook (command registration) | `ctx.command.transform` |
| `experimental.chat.system.transform` | `ctx.session.hook("context")` |
| `command.execute.before` (mode switch) | the `ponytail` command's own `execute()` persists the mode |

## What's changed vs upstream

- **`ponytail-v2.mjs`** — new; the V2 plugin definition (mode persistence + system-prompt injection + command registration)
- **`index.js`** — new; entry point re-exporting the V2 definition (what OpenCode's local plugin discovery loads)
- **`package.json`** — `main`/`exports` point to `ponytail-v2.mjs`
- Everything else is verbatim from upstream v4.10.0 (see `README.upstream.md` for full upstream docs)

## Install (OpenCode 2)

```bash
git clone https://github.com/Wesley-Source/ponytail-opencode-v2 ~/.opencode/plugins/ponytail
```

Add the skills to `~/.config/opencode/opencode.json`:

```json
{
  "skills": [
    "/home/YOU/.opencode/plugins/ponytail/skills"
  ]
}
```

Restart OpenCode. Use `/ponytail` to switch modes (`lite`, `full`, `ultra`); the mode persists in `~/.config/opencode/.ponytail-active`.

## Credits

All credit for ponytail itself goes to [Dietrich Gebert](https://github.com/DietrichGebert) — this repo only adapts the loading layer for OpenCode V2. MIT license (upstream), kept intact in [LICENSE](LICENSE).
