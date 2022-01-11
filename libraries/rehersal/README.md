# @lukekaalim/act-rehersal

![npm (scoped)](https://img.shields.io/npm/v/@lukekaalim/act-rehersal)

A component library for building documentation websites. You may even be using it right now.

This library relies css modules, so it cannot be imported in a regular node context -
you must use a bundler like vite, rollup, webpack, parcel or esbuild.

> More specicially, it uses `import` against css files suffixed with the extension ".module.css".

Rehersal provides an overall visual app structure with the Layout components like
_Rehersal_, _Workspace_, _GridMount_ and so on.

It also provides a set
of standard input elements in the Tool components like _TextInput_, _NumberInput_ and so on.

Finally, it also provides a markdown renderer in the _Document_ component, so you can embed
markdown into your documentation.

## Install
```bash
npm install @lukekaalim/act-rehersal
```