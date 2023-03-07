# Libraries

Act has several libraries to achieve common goals.
Libraries normally export either [Components]() or [Hooks]() as the primary way they can interact with Act.

Libraries should all use the same version of act - so
Act is normally declared as a "peer dependency" for each library
that depends on it.

## [Rehersal](libraries/rehersal)

Components and Styles to create a Documentation Website (like this one!) for showing off your Act components, APIs, and other shared pieces of information.

## [Markdown](libraries/markdown)

Converts markdown AST nodes into Act Elements.

## [Curve](libraries/curve)

Provides animation utilities and hooks to render real-time animation.