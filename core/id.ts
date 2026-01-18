let latestId = 0;

declare const opaqueType: unique symbol;
export type OpaqueID<T extends string> = number & { readonly [opaqueType]: T };


/**
 * Produces a (relatively within this runtime) unique incrementing value.
 * 
 * If namespace is passed, then the incrementing value is unique to the
 * namespace (otherwise is globally shared with all other ids)
 * 
 * The "OpaqueID" type helps avoid cross-contamination of different ID types
 * (being automatically cast to number and such) at Type time, but provides
 * no runtime checks.
 */
export const createId = <T extends string>(namespace?: T): OpaqueID<T> => {
  if (namespace) {
    if (!(namespace in namespaces))
      namespaces[namespace] = 0;
   
    return namespaces[namespace]++ as OpaqueID<T>;
  }
  return latestId++ as OpaqueID<T>;
};

const namespaces: Record<string, number> = {}
window.__LUKEKAALIM_ACT_GLOBAL_NAMESPACE_ID = namespaces;

declare global {
  var __LUKEKAALIM_ACT_GLOBAL_NAMESPACE_ID: Record<string, number>;
}