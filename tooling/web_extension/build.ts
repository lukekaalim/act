import { context } from 'esbuild';

const createExtensionContext = async () => {
  return context({
    entryPoints: [
      'src/content.ts',
      'src/background.ts',
      'src/devpage.ts',
      'src/devpanel.ts',
    ],
    bundle: true,
    outdir: 'dist',
  })
}

const main = async (mode: string = "build") => {
  const extensionContext = await createExtensionContext();

  switch (mode) {
    case 'build':
      console.log(`Building`);
      return extensionContext.rebuild();
    case 'watch':
      console.log(`Watching`);
      return extensionContext.watch();
    case 'serve':
      console.log(`Serving`);
      return extensionContext.serve();
  }
};
main(...process.argv.slice(2))