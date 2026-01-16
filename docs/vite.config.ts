
import 'tsx'


import { resolve, dirname } from 'node:path';
import { defineConfig, Plugin } from "vite";
import * as td from "typedoc";

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkDirective from 'remark-directive';

const TYPEDOC_PREFIX = 'typedoc:';
const RESOLVED_TYPEDOC_ID_PREFIX = `\0${TYPEDOC_PREFIX}`

const MARKDOWN_SUFFIX = '.md?parse';
const RESOLVED_MARKDOWN_PREFIX = '\0markdown_parse:';

export const parser = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkGfm)
  .use(remarkDirective)
  .use(remarkMdx)

const plugin: Plugin = {
  name: 'typedoc',
  transform(src, id, options) {
    if (id.endsWith(MARKDOWN_SUFFIX)) {
      console.log('TRANSFORM', { id })
      const root = parser.parse(src)
      return `export default ${JSON.stringify(root, null, 2)}`;
    }
  },

  resolveId(id, importer) {
    console.log({ id })
    if (id.endsWith(MARKDOWN_SUFFIX)) {
      console.log(`Found a candidate!`, id);
      return RESOLVED_MARKDOWN_PREFIX + id;
    }

    if (id.startsWith(TYPEDOC_PREFIX)) {
        const pathWithoutPrefix = id.slice(TYPEDOC_PREFIX.length);

      if (importer) {
        const resolvedPath = resolve(dirname(importer), pathWithoutPrefix);

        return RESOLVED_TYPEDOC_ID_PREFIX + resolvedPath;
      } else {
        return RESOLVED_TYPEDOC_ID_PREFIX + pathWithoutPrefix;
      }
    }
    return null;
  },
  async load(id, options) {
    if (id.startsWith(RESOLVED_MARKDOWN_PREFIX)) {
      const pathWithoutPrefix = id.slice(RESOLVED_MARKDOWN_PREFIX.length);
      const url = new URL(pathWithoutPrefix, 'https://example.com')

      return 'Sample Value'
    }

    if (id.startsWith(RESOLVED_TYPEDOC_ID_PREFIX)) {
      const pathWithoutPrefix = id.slice(RESOLVED_TYPEDOC_ID_PREFIX.length);

      const app = await td.Application.bootstrapWithPlugins({
        entryPoints: [pathWithoutPrefix],
        sort: ['source-order']
      });

      const project = await app.convert();
      if (project) {
        const sources = new Set<string>();
        project.traverse(refl => {
          if (refl.isDeclaration()) {
            if (refl.sources)
              for (const source of refl.sources)
                sources.add(source.fullFileName)
          }
        })
        for (const source of sources)
          this.addWatchFile(source);

        const projectJSON = app.serializer.projectToObject(project, '/');
        return `export default ` + JSON.stringify(projectJSON, null, 2);
      }
      return `export default "ERROR"`
    }
  },
}

export default defineConfig({
  optimizeDeps: {
    // Act relies on some global state
    exclude: ['@lukekaalim/act']
  },
  plugins: [plugin]
})