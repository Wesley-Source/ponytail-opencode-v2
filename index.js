// Entry point expected by OpenCode's local plugin discovery
// (.opencode/plugins/<name>/index.js). The actual V2 implementation lives in
// ponytail-v2.mjs; this file only re-exports its default definition.
export { default } from './ponytail-v2.mjs';
