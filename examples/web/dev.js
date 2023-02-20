import * as esbuild from 'esbuild'

const dev = async () => {
  const c = await esbuild.context({
    entryPoints: ['src/main.tsx'],
    jsxImportSource: '@lukekaalim/act-jsx',
    jsx: 'automatic',
    outdir: 'www/js',
    bundle: true,
    sourcemap: true
  })
  const { host, port } = await c.serve({ servedir: 'www' });
  await c.watch();
  console.info(`http://localhost:${port}`)
};
dev();
