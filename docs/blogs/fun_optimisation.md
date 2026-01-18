# Fun Optimization

Act isn't really build for performance - while I
want to keep things generally "interactive" at
some levels of complexity, I don't really
have a hard perf target, or even any systems
or checks to keep me honest.

Nevertheless, I still enjoy finding a new way
of solving a problem, that ends up making
a somewhat faster implementation.

This article is about one of them!

## The Problem

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

So now traversal of the parent lists ls a little longer,
as we don't know