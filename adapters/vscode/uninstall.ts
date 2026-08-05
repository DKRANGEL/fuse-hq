/**
 * `vscode:uninstall` hook (see package.json scripts) — VS Code executes this
 * with plain Node after the extension has been fully uninstalled. The `vscode`
 * module does not exist here; only Node APIs are available.
 *
 * Removes the Pixel Agents hook entries from ~/.claude/settings.json so an
 * uninstalled extension leaves no hooks running behind the user's back. The
 * copied hook script under ~/.pixel-agents/hooks/ is left in place: the
 * standalone CLI shares it and re-adds its own entries on next run.
 */
import { uninstallHooks } from '../../server/src/providers/hook/claude/claudeHookInstaller.js';

// uninstallHooks never rejects (parse failures are logged and abort the write),
// so a bare void is safe: no unhandledRejection can leak from the uninstall hook.
void uninstallHooks();
