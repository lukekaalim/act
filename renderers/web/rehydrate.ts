import { ElementType, primitiveNodeTypes, specialNodeTypes } from "@lukekaalim/act";
import { Reconciler2 } from "@lukekaalim/act-recon";


export const rehydrate = (node: Node, tree: Reconciler2) => {

}


export const primitiveToSymbolMap: Record<string, ElementType> = {
  //'primitive:string': primitiveNodeTypes.string,
  //'primitive:number': primitiveNodeTypes.number,
  //'primitive:boolean': primitiveNodeTypes.boolean,
  'primitive:null': primitiveNodeTypes.null,
  'primitive:array': primitiveNodeTypes.array,
  'special:placeholder': specialNodeTypes.placeholder,
  'special:render': specialNodeTypes.render,

  [primitiveNodeTypes.null]: 'primitive:null',
  [primitiveNodeTypes.array]: 'primitive:array',
  [specialNodeTypes.placeholder]: 'special:placeholder',
  [specialNodeTypes.render]: 'special:render',
}