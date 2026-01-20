# @lukekaalim/act-backstage

Backstage is a collection of utilities for creating Act renderers
fairly simply. Most renderers in Act are just composed
of one or more "RenderSpace"'s, which are the systems
that keep track of which HTML/ThreeJs/SVG nodes correspond
to which commit.

## API

<TypeDoc project="@lukekaalim/act-backstage" name="NodeBuilder" />

<TypeDoc project="@lukekaalim/act-backstage" name="RenderSpace2" />

<TypeDoc project="@lukekaalim/act-backstage" name="setPropObject" />

## Guide

We're going to build a classic render function