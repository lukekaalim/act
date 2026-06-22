import { EffectCleanup, EffectConstructor } from "@lukekaalim/act";
import { CommitRef2, CommitTree2, Delta, EffectCleanupState, EffectID } from "@lukekaalim/act-recon";

export type EffectConstructorTask = {
  type: 'constructor',
  id: EffectID,
  ref: CommitRef2,
  func: EffectConstructor,
}
export type EffectCleanupTask = {
  type: 'cleanup',
  id: EffectID,
  ref: CommitRef2,
  func: EffectCleanup,
}

export type ResolvedEffectTask =
  | EffectConstructorTask
  | EffectCleanupTask

/**
 * A Debug-exclusive class that will iteratively run an
 * effect each call to "work()", for ease of breakpoints.
 */
export class EffectWorker {
  tree: CommitTree2;

  tasks: ResolvedEffectTask[] = [];
  taskIndex: number = 0;

  added: Map<EffectID, EffectCleanupState> = new Map();
  removed: Map<EffectID, EffectCleanupState> = new Map();

  get done() {
    return this.tasks.length === 0 || (this.taskIndex >= this.tasks.length);
  }

  get task(): ResolvedEffectTask | null {
    return this.tasks[this.taskIndex] || null;
  }

  clear() {
    this.tasks = [];
    this.taskIndex = 0;
    this.added.clear();
    this.removed.clear();
  }

  loadDelta(delta: Delta) {
    this.clear();
    
    this.taskIndex = 0;
    const cleanups: EffectCleanupTask[] = [];
    const constructors: EffectConstructorTask[] = [];

    for (const task of delta.effects.values()) {
      const cleanup = this.tree.cleanups.get(task.id);

      if (cleanup) {
        cleanups.push({ type: 'cleanup', func: cleanup.func, id: task.id, ref: task.ref });
      }

      if (task.effect) {
        constructors.push({ type: 'constructor', func: task.effect, id: task.id, ref: task.ref });
      }
    }
    
    this.tasks = [...cleanups, ...constructors];
  }

  constructor (tree: CommitTree2) {
    this.tree = tree;
  }

  work() {
    const task = this.tasks[this.taskIndex++];
    if (!task)
      return;

    switch (task.type) {
      case 'cleanup':
        task.func()
        this.tree.cleanups.delete(task.id);
        this.removed.set(task.id, task);
        this.added.delete(task.id);
        return;
      case 'constructor':
        const cleanupFunc = task.func();
        
        if (cleanupFunc) {
          const cleanup = {
            id: task.id,
            ref: task.ref,
            func: cleanupFunc
          }
          this.tree.cleanups.set(task.id, cleanup);
          this.removed.delete(task.id)
          this.added.set(task.id, cleanup);
        }
        return;
    }
  }
}