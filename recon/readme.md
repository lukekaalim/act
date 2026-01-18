# @lukekaalim/act-recon

![NPM Version](https://img.shields.io/npm/v/%40lukekaalim%2Fact-recon)
![npm package minimized gzipped size](https://img.shields.io/bundlejs/size/%40lukekaalim%2Fact-recon)

Reconciler implementation for @lukekaalim/act.

## Details

> This is a kind of internal library that glues together all the logic
> of the Act ecosystem, but is not used by everyday users (unless you
> are [Writing your own Renderer](), or just want to understand the
> guts - like i did!)

### What is a Reconciler?

A reconciler is more specifically a system than can take care of a tree:
 - Handling when new nodes are added to the tree
 - Handling when nodes are removed from the tree
 - And handling when a node updates or is re-ordered within the tree.

In our case specifically, we maintain a tree of [Commits](#@lukekaalim/act-recon.Commit2),
each of which represent a raw element (like a HTML or SVG element), or something more abstract
like a Component or a Context Provider.

## Systems

<TypeDoc project="@lukekaalim/act-recon" name="CommitTree2" />
<TypeDoc project="@lukekaalim/act-recon" name="WorkThread2" />
<TypeDoc project="@lukekaalim/act-recon" name="Reconciler2" />

## Data Structures

<TypeDoc project="@lukekaalim/act-recon" name="CommitRef2" extras="CommitID CommitPath" />
<TypeDoc project="@lukekaalim/act-recon" name="Commit2" extras="CommitVersion" />
<TypeDoc project="@lukekaalim/act-recon" name="WorkTask" />
<TypeDoc project="@lukekaalim/act-recon" name="Delta" />


## Externals

### Scheduler

### Render Space

## Experiments

<Demo demo="recon.experiment" />