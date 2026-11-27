import { readFile } from 'node:fs/promises';

const environmentFlags = { newResultCard: 'FF_NEW_RESULT_CARD', detailedReason: 'FF_DETAILED_REASON', completionLog: 'FF_COMPLETION_LOG' };

export function resolveConfig(defaults, env) {
  const config = globalThis.structuredClone(defaults);
  config.environment = env.APP_ENV || defaults.environment;
  for (const [name, variable] of Object.entries(environmentFlags)) {
    if (env[variable] === undefined) continue;
    if (!['true', 'false'].includes(env[variable])) throw new Error(`${variable} must be true or false`);
    config.flags[name].enabled = env[variable] === 'true';
  }
  if (env.FF_ROLLOUT_PERCENT !== undefined) {
    if (!/^(0|[1-9]\d?|100)$/.test(env.FF_ROLLOUT_PERCENT)) throw new Error('FF_ROLLOUT_PERCENT must be an integer from 0 to 100');
    config.rolloutPercent = Number(env.FF_ROLLOUT_PERCENT);
  }
  if (env.AB_ENABLED !== undefined) {
    if (!['true', 'false'].includes(env.AB_ENABLED)) throw new Error('AB_ENABLED must be true or false');
    config.experiment.enabled = env.AB_ENABLED === 'true';
  }
  return config;
}

export async function loadConfig(env = process.env) {
  return resolveConfig(JSON.parse(await readFile(new URL('../config/flags.json', import.meta.url), 'utf8')), env);
}
