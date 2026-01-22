export * from './component.ts';
export * from './hooks.ts';
export * from './context.ts';
export * from './errors.ts';

export * from './element.ts';
export * from './node.ts';
export * from './id.ts';
export * from './special.ts';

declare global {
  var __LUKEKAALIM_ACT_GLOBAL_CHECK: number;
}

if (globalThis['__LUKEKAALIM_ACT_GLOBAL_CHECK']) {
  console.warn(`There are multiple (at least ${globalThis.__LUKEKAALIM_ACT_GLOBAL_CHECK}) copies of Act running!`)
  globalThis.__LUKEKAALIM_ACT_GLOBAL_CHECK++;
} else {
  globalThis.__LUKEKAALIM_ACT_GLOBAL_CHECK = 1;
}
