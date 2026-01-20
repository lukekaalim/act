# Searching the Depths
_luke kaalim, 19/01/2026_

Act isn't really build for performance - while I
want to keep things generally "interactive" at
some levels of complexity, I don't really
have a hard perf target, or even any systems
or checks to keep me honest.

Nevertheless, I still enjoy finding a new way
of solving a problem, that ends up making
a somewhat faster implementation.

This article is about one of them! Its not
particularly stunning or even a significant change,
but I thought it was neat.

## The General Problem

One common mini task that act needs to do
is find out where two commits might share a
common ancestor.

E.g, for our Reconciler, we don't want to
create a new Task if there is
_already_ an task working on one of
our ancestors.

> The reconciler is not allowed to
> render the same node twice in a single
> pass. So if you create a Task for an
> child where one of it's parents also has
> a Task, it's parent will probably try to render the
> child eventually - but our own task might have
> beaten them to the punch! This leaves us in
> an undefined state, which is undesirable.

Previously, I was naively just looping through the lists
of parents. As I've been muddling about with my data structures,
I've removed the fixed array of ancestors in each commit,
and replaced them with a direct reference to their parent
(to be a bit kinder to the garbage collector)

So now traversal of the parent lists is a little longer,
as it's not a flat array but a recursive search - so
this is the thing I wanted to make an incremental
improvement for.

## Noticing a use case

I was struck by a bit of inspiration while I was writing
the code for getting a renderer to do a "second pass" - if
there are commits that are requesting re-renders but we've already
visited them, we queue them into a "Missed" array.

Once we do all of our main tasks, we check the missed array
and add them all back in as new tasks at once. In theory,
assuming no _new_ tasks are added, we can do the entire
missed array in once stroke, meaning that most renders
occur in 2 passes.

However, I was noticing that it took more that two passes,
even when _no further updates were added_ - I realized
that depending on the insertion order of the "missed" array,
a child could be added, which would preclude the addition
of it's ancestor, which would cause the just-reinserted
task to become missed _again_. Not super ideal.

A simple fix would be to just change the insertion order - 
as long as all parents got added first, then there
would be no misses, as children can always be queued after
parents. So, I just sorted the array by the relative length
of their distance from the root, and that was that.

## Bit by the refactor

I mentioned I refactored the "array of ancestors" - well,
when I did that, I realized it would break my 