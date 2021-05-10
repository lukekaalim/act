// @flow strict
/*:: import type { Commit, CommitDiff } from './commit'; */
/*:: import type { Node, NormalNode } from './node'; */
/*:: import type { ContextID, ContextState } from './context'; */
/*:: import type { StateID, CommitState, StateUpdate } from './state'; */
const { nanoid: uuid } = require('nanoid');

const { updateCommit, createCommit, updateCommitWithState } = require('./commit');
const { node, normalizeNode } = require('./node');

/*::
export type RequestFrame = (frame: () => void) => mixed;

export type Graph = {
  symbols: {
    context: symbol,
  },

  states: Map<StateID, CommitState>,
  contexts: Map<StateID, ContextState<mixed>>,
  update: (state: StateUpdate) => void,
  listen: (listener: (events: CommitEvent[]) => mixed) => { closeListener: () => void },
  getRoot: () => Commit,
  updateRoot: (newNode: NormalNode) => void,
};
export type ActGraph = Graph;

export type CommitEvent =
  | { type: 'removed', commit: Commit, diff: CommitDiff }
  | { type: 'updated', commit: Commit, diff: CommitDiff }
  | { type: 'created', commit: Commit, diff: CommitDiff }
*/

const getEventsForDiff = (diff/*: CommitDiff*/)/*: CommitEvent[]*/ => {
  const createdEvents = diff.created.map(([commit, diff]) => [
    ...getEventsForDiff(diff),
    { type: 'created', commit, diff },
  ]).flat(1);
  const updatedEvents = diff.updated.map(([commit, diff]) => [
    ...getEventsForDiff(diff),
    { type: 'updated', commit, diff },
  ]).flat(1);
  const removedEvents = diff.removed.map(([commit, diff]) => [
    ...getEventsForDiff(diff),
    { type: 'removed', commit, diff },
  ]).flat(1);

  return [
    ...createdEvents,
    ...updatedEvents,
    ...removedEvents,
  ];
};

const createGraph = (rootNode/*: NormalNode*/, rf/*: RequestFrame*/)/*: ActGraph*/ => {
  let listeners = [];
  let commit, diff;

  const states = new Map();
  const contexts = new Map();
  const symbols = {
    context: Symbol(),
  };

  const queuedUpdates = [];

  const update = (stateUpdate) => {
    queuedUpdates.push(stateUpdate);
    if (queuedUpdates.length === 1)
      rf(processUpdates);
  };
  const processUpdates = () => {
    const events = [];
    while (queuedUpdates.length > 0) {
      const update = queuedUpdates[0];
      states.set(update.path[update.path.length - 1], update.newState);
      [commit, diff] = updateCommitWithState(graph, update, commit);
      events.push(...getEventsForDiff(diff), { type: 'updated', commit, diff });
      queuedUpdates.shift();
    }
    for (const listener of listeners)
      listener(events);
  };

  const listen = (listener) => {
    listeners.push(listener);
    listener([...getEventsForDiff(diff), { type: 'created', commit, diff }]);
    return { closeListener: () => {
      listeners = listeners.filter(l => l !== listener);
    } }
  };
  const getRoot = () => {
    return commit;
  };
  const updateRoot = (newNode) => {
    [commit, diff] = updateCommit(graph, newNode, commit);
    for (const listener of listeners)
      listener([...getEventsForDiff(diff), { type: 'updated', commit, diff }]);
  }

  const graph = {
    symbols,
    contexts,
    states,
    update,
    listen,
    getRoot,
    updateRoot,
  };
  [commit, diff] = createCommit(graph, rootNode, []);
  return graph;
};

module.exports = {
  graph: createGraph,
  createGraph,
};