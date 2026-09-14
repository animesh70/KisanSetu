const ENABLE_COMMANDS = new Set(['kitty effect on', 'kitty on', 'enable kitty']);
const DISABLE_COMMANDS = new Set(['kitty effect off', 'kitty off', 'disable kitty']);

export function getKittyCommand(message) {
  const normalizedMessage = String(message || '').trim().toLowerCase();
  if (ENABLE_COMMANDS.has(normalizedMessage)) return 'on';
  if (DISABLE_COMMANDS.has(normalizedMessage)) return 'off';
  return null;
}
