import { context } from 'esbuild';
import pkg from './package.json'

const createExtensionContext = async () => {
  const extensionContext =  context({
    entryPoints: [
      'src/content.ts',
      'src/background.ts',
      'src/devpage.ts',
      'src/devpanel.ts',
    ],
    bundle: true,
    outdir: 'dist',
    plugins: [
      { name: 'printer', setup(build) {
        build.onEnd(() => {
          console.log('Build Complete', new Date())
        })
      } }
    ]
  });

  return extensionContext;
}

const main = async (mode: string = "build") => {
  const extensionContext = await createExtensionContext();

  switch (mode) {
    case 'build':
      console.log(`Building`, pkg.name, pkg.version);
      await extensionContext.rebuild();
      return;
    case 'watch':
      console.log(`Watching`, pkg.name, pkg.version);
      await extensionContext.watch();
      return;
    case 'serve':
      console.log(`Serving`, pkg.name, pkg.version);
      return extensionContext.serve();
    default:
      console.warn(`Unknown command "${mode}"`)
  }
};
main(...process.argv.slice(2))