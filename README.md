# lukekaalim's act project

> This project is for education and demonstration purposes only!
>
> Do not use this for production!

Repo for **Act**, my homemade rebuild of react. Mainly build to understand
internally how a feature in react may be designed and implemented.

This repo manages a few packages:
  - [Core](/core) - The titular `@lukekaalim/act` package, which mostly declares an API
    for a reconciler to fulfil plus types.
  - [Recon](/reconciler) - The "Reconciler". Maintains all the state, keeps track of all
    the changes. The brains of the operation.
  - **Renderers/**
    - [Web](/renderers/web) Makes HTML & SVG elements in a browser environment, or a HAST object in a server environment for SSR.
    - [ThreeJs](/renderers/three) Makes 3d objects using the ThreeJS library.
  - **Utilities/**
    - [Backstage](/utils/backstage) Backend utilities for building renderers.
    Common code to describe the basic functions of a renderer.
  - **Tooling/**
    - [Debug](/tooling/debug) Protocols and Debug implementations of Reconcilers.
    - [Insight](/tooling/insight) Debug components/views for observing data derived from the debug package.
    - [Web Extension](/tooling/dev-ext) A Firefox browser extension that integrates Insight as a DevTools panel.