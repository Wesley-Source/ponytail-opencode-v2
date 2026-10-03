// ponytail — local OpenCode V2 port of @dietrichgebert/ponytail v4.10.0.
//
// The upstream package only implements the V1 plugin API (default export is an
// async function returning hooks), which OpenCode 2 rejects at load time with:
//   "Plugin must export a default definition with an id and an effect or setup
//    function. (cause: SchemaError(Expected object at [\"default\"]))"
//
// This port keeps the upstream helper modules untouched (hooks/, .opencode/)
// and re-exposes the same behavior through the V2 API:
//   - V1 `config` hook (command registration)  -> ctx.command.transform
//   - V1 `experimental.chat.system.transform`   -> ctx.session.hook("context")
//   - V1 `command.execute.before` (mode switch) -> the `ponytail` command's own
//     execute() persists the mode before submitting the template.
// Skills are discovered from the copied skills/ directory via the `skills`
// array in opencode.json (same effect as the V1 config.skills.paths push).

import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The shared instruction builder is CommonJS; bridge to it from this ES module.
const require = createRequire(import.meta.url);
const { getPonytailInstructions } = require('./hooks/ponytail-instructions');
const { getDefaultMode, normalizePersistedMode } = require('./hooks/ponytail-config');
const { parseCommandFile } = require('./.opencode/plugins/ponytail-frontmatter.cjs');

const commandDir = path.join(__dirname, '.opencode', 'command');

// OpenCode has no flag-file convention of its own; keep mode beside its config.
// Same location the V1 plugin used, so an existing switch survives the port.
const statePath = path.join(
  process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'),
  'opencode',
  '.ponytail-active',
);

function readMode() {
  try {
    return normalizePersistedMode(fs.readFileSync(statePath, 'utf8').trim()) || getDefaultMode();
  } catch (e) {
    return getDefaultMode();
  }
}

function writeMode(mode) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, mode);
}

function loadCommands() {
  const commands = [];
  for (const file of fs.readdirSync(commandDir).filter((f) => f.endsWith('.md'))) {
    const parsed = parseCommandFile(path.join(commandDir, file));
    if (parsed) commands.push({ name: path.basename(file, '.md'), ...parsed });
  }
  return commands;
}

export default {
  id: 'ponytail',
  async setup(ctx) {
    const commands = loadCommands();

    // Register the package's slash commands. `/ponytail <level>` persists the
    // mode before its template runs, mirroring V1's command.execute.before:
    // the transform reads the flag on the next model request, so the mode
    // applies from that point on.
    await ctx.command.transform((editor) => {
      for (const command of commands) {
        editor.add({
          name: command.name,
          description: command.description || '',
          execute: async ({ sessionID, prompt, delivery }) => {
            let args = '';
            if (command.name === 'ponytail') {
              args = String(prompt?.text || '').trim().replace(/^\/?ponytail\b/i, '').trim();
              const mode = args ? normalizePersistedMode(args) : getDefaultMode();
              if (mode) writeMode(mode);
            }
            const text = command.template.replaceAll('$ARGUMENTS', args);
            await ctx.session.prompt({ sessionID, text, delivery });
          },
        });
      }
    });

    // Append the ruleset to the system prompt on every agent-loop model
    // request. `off` persists like any mode; the hook reads it and stays silent.
    await ctx.session.hook('context', (event) => {
      const mode = readMode();
      if (mode === 'off') return;
      const instructions = getPonytailInstructions(mode);
      event.system.push({ type: 'text', text: instructions });
    });
  },
};
