import { defineConfig } from 'vite';
import flowParser from 'flow-parser';
import { join, dirname, isAbsolute, normalize } from 'path';
import { readFile } from 'fs/promises';

function myPlugin() {
  const resolvedVirtualModuleId = '\0' + 'flow:'

  return {
    name: 'my-plugin', // required, will show up in warnings and errors
    resolveId(id: string, source?: string) {
      if (id.startsWith('flow:')) {
        const path = id.slice(resolvedVirtualModuleId.length - 1);
        if (isAbsolute(path) || !source)
          return resolvedVirtualModuleId + normalize(path);
        return resolvedVirtualModuleId + join(dirname(source), path);
      }
    },
    async load(id: string) {
      if (id.startsWith('\0flow:')) {
        const path = id.slice(resolvedVirtualModuleId.length);
        const file = await readFile(path, 'utf8');
        const ast = flowParser.parse(file, { types: true });
        return `export const ast = ${JSON.stringify(ast, null, 2)}`
      }
    },
  }
}


export default defineConfig({
  plugins: [myPlugin()]
});