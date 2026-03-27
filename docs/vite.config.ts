
import 'tsx'


import { resolve, dirname } from 'node:path';
import { defineConfig, Plugin } from "vite";
import { SourceDescription } from 'rollup';
import braceExpansion from 'brace-expansion';
import * as td from "typedoc";

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkDirective from 'remark-directive';
import { JsonStreamStringify } from 'json-stream-stringify';
import { nanoid } from 'nanoid';

import ts, { createWatchCompilerHost } from 'typescript';

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

const TypedocJSONPlugin = (): Plugin => {
  const applications = new Map<string, td.Application>();
  const firstLoadPromises = new Map<string, Promise<td.ProjectReflection>>();
  const projects = new Map<string, td.ProjectReflection>();

  const projectIds = new Map<string, string>();

  return {
    name: 'typedoc',

    configureServer(devServer) {
      devServer.middlewares.use(async (req, res, next) => {
        console.log(req.url);

        if (req.url) {
          if (req.url.startsWith('/typedoc/')) {
            const id = req.url.slice('/typedoc/'.length);
            const key = projectIds.get(id) as string;

            let project = projects.get(key);
            if (!project) {
              const promise = firstLoadPromises.get(key);
              if (!promise) {
                res.statusCode = 404;
                res.end();
                return;
              }
              project = await promise;
            }

            const app = applications.get(key) as td.Application;
            res.statusCode = 200;
            res.setHeader('content-type', 'applicaton/json');
            const stream = new JsonStreamStringify(app.serializer.projectToObject(project, '/'));
            stream.pipe(res);
          }
        }

        next();
      })
    },

    async resolveId(id, importer) {
      if (id.startsWith(TYPEDOC_PREFIX)) {
          const entryPointSources = braceExpansion(id.slice(TYPEDOC_PREFIX.length));

          const entryPoints = await Promise.all(entryPointSources
            .map(source => this.resolve(source, importer, { skipSelf: true })
            .then(result => {
              if (!result)
                return null;
              if (result.external)
                return null;
              return result.id;
            })))

          return RESOLVED_TYPEDOC_ID_PREFIX + entryPoints.join(',');
      }
      return null;
    },
  async load(importString, options) {
    if (importString.startsWith(RESOLVED_TYPEDOC_ID_PREFIX)) {
      const entryPointSources = importString.slice(RESOLVED_TYPEDOC_ID_PREFIX.length).split(',');
      
      const key = [...entryPointSources].sort().join(',');
      
      if (!applications.has(key)) {
        console.log(`STARTING NEW APP: `, entryPointSources)

        const id = nanoid();
        projectIds.set(id, key);
        projectIds.set(key, id);

        const app = await td.Application.bootstrapWithPlugins({
          entryPoints: entryPointSources,
          sort: ['source-order']
        });
        app.logger = new td.ConsoleLogger();
        applications.set(key, app);

        const firstLoadPromise = new Promise<td.ProjectReflection>(r => {
          app.convertAndWatch(async project => {
            projects.set(key, project);
            r(project)
          });
        });
        firstLoadPromises.set(key, firstLoadPromise);
      }
      const id = projectIds.get(key) as string;

      return {
        code: `export default await fetch('/typedoc/${id}').then(r => r.json())`
      };
    }
  },
  }
}

const plugin: Plugin = {
  name: 'markdown-parser',
  enforce: 'pre',
  transform(src, id, options) {
    if (id.endsWith(MARKDOWN_SUFFIX)) {
      const root = parser.parse(src)
      return {
        code: `export default ${JSON.stringify(root, null, 2)}`,
        map: null
      }
    }
  }
}

export default defineConfig({
  build: {
    sourcemap: true
  },
  optimizeDeps: {
    // Act relies on some global state
    exclude: ['@lukekaalim/act']
  },
  plugins: [plugin, TypedocJSONPlugin()]
})