import { createId, Element, ElementType, h, primitiveNodeTypes, specialNodeTypes } from "@lukekaalim/act";
import { Commit2, CommitID, CommitRef2, Reconciler2 } from "@lukekaalim/act-recon";
import { deserializeSSRPayload, RehydratableComponent, SSRContext, SSRPayload, ssrStringToSymbolMap } from "./ssr";
import { RenderSpace2 } from "@lukekaalim/act-backstage";
import { recon } from "../three/deps";


export const rehydrate = (
  targets: { [key: string]: RehydratableComponent },
  reconciler: Reconciler2,
  space: RenderSpace2<HTMLElement | SVGElement | Text, 'web:html' | 'web:svg'>,
  payload: SSRPayload
) => {
  const context = deserializeSSRPayload(payload, "client", () => {});

  const refs = new Map<CommitID, CommitRef2>();
  const elements = new Map<CommitID, Element>();
  const roots = [] as CommitRef2[]
  const targetRefs = [] as CommitRef2[]

  for (const commit of context.commits.values()) {
    const ref = CommitRef2.rehydrate(createId("CommitID"), commit.distance);
    refs.set(commit.id, ref);
    context.commitIdRemap.set(ref.id, commit.id);

    if (commit.elementType.startsWith('special:mount:')) {
      const targetName = commit.elementType.slice('special:mount:'.length);
      const target = targets[targetName];

      const props = Object.fromEntries(commit.props);
      const element = h(target, props);
      elements.set(commit.id, element);

      targetRefs.push(ref);
    } else {
      const elementType = (ssrStringToSymbolMap[commit.elementType]
        || commit.elementType
        || specialNodeTypes.placeholder) as string | symbol

      switch (elementType) {
        case specialNodeTypes.provider:
          if (commit.id === context.contextCommitID) {
            elements.set(commit.id, h(specialNodeTypes.provider, { id: SSRContext.id, value: context }));
            reconciler.tree.contexts.set(ref.id, {
              id: ref.id,
              contextId: SSRContext.id,
              value: context,
              consumers: new Map()
            });
            continue;
          }
        default:
          const props = Object.fromEntries(commit.props);
          elements.set(commit.id, h(elementType, props));
          continue;
      }
    }
  }

  const primitiveCommits: Commit2[] = []

  for (const dehydratedCommit of context.commits.values()) {
    const ref = refs.get(dehydratedCommit.id) as CommitRef2;
    ref.parent = (dehydratedCommit.parent && refs.get(dehydratedCommit.parent)) || null;

    const children = dehydratedCommit.children.map(c => refs.get(c)).filter(x => !!x);
    const element = elements.get(dehydratedCommit.id) as Element;
    element.children = children.map(c => elements.get(c.id) as Element)

    if (!ref.parent) {
      roots.push(ref);
    }

    const commit = reconciler.pools.commit.acquire(ref,
      element,
      children
    );

    switch (commit.element.type) {
      case primitiveNodeTypes.string:
      case primitiveNodeTypes.boolean:
      case primitiveNodeTypes.number:
        primitiveCommits.push(commit);
    }

    const node = document.querySelector(`[data-commit-id="${dehydratedCommit.id}"]`)
    if (node instanceof HTMLElement) {
      space.nodeByCommit.set(commit.ref.id, node);
      space.commitByNode.set(node, commit);
    }
    if (commit.element.type === specialNodeTypes.render) {
      space.roots.set(commit.ref.id, commit);
    }

    reconciler.tree.commits.set(commit.ref.id, commit)
  }

  const primitiveParent = new Map<CommitID, Commit2>();

  for (const primitiveCommit of primitiveCommits) {
    const parent = space.findParent(primitiveCommit.ref)
    if (parent.node && parent.commit) {
      primitiveParent.set(parent.commit.ref.id, parent.commit)
    }
  }

  for (const [id, commit] of primitiveParent) {
    const node = space.nodeByCommit.get(id);
    if (!node)
      continue;

    const textElements = [...node.childNodes]
      .filter((x): x is Text => x instanceof Text)

  
    let queue = [...commit.children];
    let index = 0;

    let subject: CommitRef2 | undefined;
    while (subject = queue.shift()) {
      const commit = reconciler.tree.commits.get(subject.id) as Commit2;
      if (space.nodeByCommit.has(commit.ref.id))
        continue;

      switch (commit.element.type) {
        case primitiveNodeTypes.string:
        case primitiveNodeTypes.boolean:
        case primitiveNodeTypes.number:
          space.nodeByCommit.set(commit.ref.id, textElements[index]);
          index++;
          continue;
      }
      queue.unshift(...commit.children)
    }
  }

  reconciler.bus.render = (delta) => {
    space.bus.render(delta)
  };

  for (const ref of targetRefs.sort((left, right) => left.length - right.length)) {
    reconciler.render(ref);
  }
}
