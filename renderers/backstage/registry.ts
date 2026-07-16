import { Element, ElementType, h, Props, Ref } from "@lukekaalim/act";

export const createPrimitiveRegistry = <PropsMap extends {}, Base>() => {
  type AnyType = keyof PropsMap;


  // Defined inside the function to avoid
  // passing a headache full of generics
  type PrimitiveRegistry = {
    registerPrimitive<Type extends AnyType, Primitive extends Base>(
      type: Type,
      createHandler: (initial: PropsMap[Type]) => Primitive,
      updateHandler: (instance: Primitive, next: PropsMap[Type], prev:PropsMap[Type]) => void,
    ): PrimitiveRegistry,

    addGlobalCreateHandler(handler: GlobalCreateHandler): PrimitiveRegistry;
    addGlobalUpdateHandler(handler: GlobalUpdateHandler): PrimitiveRegistry;
    registerUnhandledPrimitives(types: AnyType[]): PrimitiveRegistry;

    create(element: Element): null | Base,
    update(instance: Base, next: Element, prev: null | Element): void,

    elements: { [Type in AnyType]: ElementType<PropsMap[Type] extends Props ? PropsMap[Type] : {}> },
  }

  type PrimitiveHandler = {
    type: keyof PropsMap,
    createHandler: (initial: PropsMap[keyof PropsMap]) => Base,
    updateHandler: (instance: Base, next: PropsMap[keyof PropsMap], prev:PropsMap[keyof PropsMap]) => void,
  }
  type GlobalCreateHandler = (type: AnyType, initial: PropsMap[AnyType]) => null | Base;
  type GlobalUpdateHandler = (type: AnyType, instance: Base, next: PropsMap[AnyType], prev:PropsMap[AnyType]) => void;

  const primitiveHandlers: Map<keyof PropsMap, PrimitiveHandler> = new Map();
  const globalCreateHandlers: GlobalCreateHandler[] = [];
  const globalUpdateHandlers: GlobalUpdateHandler[] = [];

  const registry: PrimitiveRegistry = {
    registerPrimitive(type, createHandler, updateHandler) {
      primitiveHandlers.set(type, { type, createHandler: createHandler as any, updateHandler: updateHandler as any });
      (registry.elements as any)[type] = type;
      return registry;
    },
    registerUnhandledPrimitives(types) {
      for (const type of types) {
        (registry.elements as any)[type] = type;
      }
      return registry;
    },
    addGlobalCreateHandler(handler) {
      globalCreateHandlers.push(handler);
      return registry;
    },
    addGlobalUpdateHandler(handler) {
      globalUpdateHandlers.push(handler);
      return registry;
    },
    create(element) {
      const handler = primitiveHandlers.get(element.type as any);
      if (handler) {
        return handler.createHandler(element.props as any);
      }
      for (const globalHandler of globalCreateHandlers) {
        const instance = globalHandler(element.type as any, element.props as any)
        if (instance)
          return instance;
      }
      return null;
    },
    update(instance, next, prev) {
      const handler = primitiveHandlers.get(next.type as any);
      if (handler) {
        handler.updateHandler(instance as any, next.props as any, prev && prev.props as any);
      }
      for (const globalHandler of globalUpdateHandlers) {
        globalHandler(next.type as any, instance, next.props as any, prev && prev.props as any);
      }
    },
    elements: {} as any,
  }

  return registry;
}

/**
 * Users can write:
 * ```ts
 * declare module "@lukekaalim/act-three" {
 *   interface ExtendedPrimitives {
 *     MyPrimitive: { myProps: boolean }
 *   }
 * }
 * ```
 * to add a new type definition for an element,
 * and then supply an implementation via:
 * 
 * ```ts
 * registry
 *  .registerPrimitive(
 *    'MyPrimitive',
 *    () => new MyPrimitive(),
 *    (primitive, props) => { primitive.myProps = props.myProps; })
 *  );
 * 
 * ```
 */
interface ExtendedPrimitives {
}
type BuiltinPrimitives = {
  div: {}
}

type AllPrimitives = BuiltinPrimitives & ExtendedPrimitives;

const test = createPrimitiveRegistry<AllPrimitives, HTMLElement | MyExtensionClass>()
  .registerPrimitive('button', () => new MyExtensionClass(), (instance) => {

  })
  

const test2 = createPrimitiveRegistry<{ red: { hi: true } }, MyCompetingPrimitive>()
  .registerPrimitive('red', () => new MyCompetingPrimitive(), (instance) => {

  })

h(test.elements.div, { innerText: 'hello', ref: { current: null } })
h(test.elements.button, { onClick: console.log })
h(test2.elements.red, { hi: true })

const a3 = test2.elements;


interface ExtendedPrimitives {
  button: { onClick?: () => void },
}

class MyExtensionClass {

}
class MyCompetingPrimitive {
  hi = true;
}