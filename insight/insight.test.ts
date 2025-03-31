import '@types/node';

import { OpaqueID } from '@lukekaalim/act'
import { CommitRef } from '@lukekaalim/act-recon'
import { describe, it } from 'node:test'
import { deepEqual } from 'node:assert/strict'
import { findCommonAncestor } from './utils'

describe('@lukekaalim/act-insight', () => {
  describe('findCommonAncestor', () => {
    it ('should find a common ancestor', () => {
      const a: OpaqueID<'CommitID'> = 'A' as any;
      const b: OpaqueID<'CommitID'> = 'B' as any;
      const c: OpaqueID<'CommitID'> = 'C' as any;
      const d: OpaqueID<'CommitID'> = 'D' as any;
      const e: OpaqueID<'CommitID'> = 'E' as any;
      const f: OpaqueID<'CommitID'> = 'F' as any;

      const refZ = CommitRef.from([a]);
      const refA = CommitRef.from([a, b]);
      const refB = CommitRef.from([a, c]);
      const refC = CommitRef.from([a, c, d, e]);
      const refD = CommitRef.from([a, c, f]);

      deepEqual(findCommonAncestor([refA, refB]), refZ)
      deepEqual(findCommonAncestor([refB, refC, refD]), refB)
    })
  })
})