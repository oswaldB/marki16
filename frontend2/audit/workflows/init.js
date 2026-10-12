import { execute as loadAllExecute } from './load-all.js';

export async function execute(context, params) {
  return await loadAllExecute(context, params);
}
