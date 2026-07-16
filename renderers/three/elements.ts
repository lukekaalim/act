import * as three from "three";
import { Ref } from "@lukekaalim/act";
import { createPrimitiveRegistry } from "@lukekaalim/act-backstage";
import { setProps } from "./props";

export type PropsFromClass<T extends three.Object3D> = {
  position?: three.Vector3Like,
  rotation?: three.Euler,
  quaternion?: three.QuaternionLike,
  scale?: three.Vector3,
  //pivot?: three.Vector3Like | null,

  name?: string,
  layers?: three.Layers,

  visible?: boolean,
  static?: boolean,
  renderOrder?: number,
  receiveShadow?: boolean,
  castShadow?: boolean,
  frustumCulled?: boolean,

  animations?: three.AnimationClip[],
  
  userData?: {},

  //up?: three.Vector3Like,

  //onChildAdded?: (child: three.Object3D) => void,
  //onChildRemoved?: (child: three.Object3D) => void,
  //onAdded?: (self: T) => void,
  //onRemoved?: (self: T) => void,

  ref?: Ref<null | T>
}
  & (T extends three.Mesh | three.Points | three.Line ? DrawableProps : {})
  & (T extends three.Sprite ? SpriteProps : {})
  & (T extends three.Light ? LightProps : {})
  & (T extends three.Camera ? CameraProps<T> : {})
  & (T extends three.Scene ? SceneProps : {})

type SceneProps = {
  fog?: three.FogExp2 | three.Fog | null,
  overrideMaterial?: three.Material | null,

  background?: three.Color | three.Texture | null,
  backgroundBlurriness?: number,
  backgroundRotation?: number,
  backgroundIntensity?: three.Euler,

  environment?: three.Texture | null,
  environmentRotation?: number,
  environmentIntensity?: three.Euler,
}

type DrawableProps = {
  geometry?: three.BufferGeometry,
  material?: three.Material | three.Material[]
}
type LightProps = {
  color?: three.Color,
  intensity?: number,
}
type SpriteProps = {
  center?: three.Vector2Like,
} & DrawableProps;
type CameraProps<T extends three.Camera> =
  & T extends three.PerspectiveCamera ? {
    aspect?: number,
    far?: number,
    near?: number,
    focus?: number,
    fov?: number,
    zoom?: number,
  } : {}
  & T extends three.OrthographicCamera ? {
    far?: number,
    near?: number,

    top?: number,
    right?: number,
    left?: number,
    bottom?: number,
    
    zoom?: number,
  } : {}

type BuiltinRegistry = {
  [Property in keyof THREE_CLASS_MAP]: PropsFromClass<InstanceType<THREE_CLASS_MAP[Property]>>
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
export interface ExtendedPrimitives {}

type AllPrimitives = ExtendedPrimitives & BuiltinRegistry;

export const registry = createPrimitiveRegistry<AllPrimitives, three.Object3D>();
/**
 * Type checked act-three primitive elements.
 */
export const a3 = registry.elements;


type THREE_CLASS_MAP = typeof THREE_OBJECT3D_CLASS_MAP;
const THREE_OBJECT3D_CLASS_MAP = {
  mesh: three.Mesh,
  instancedMesh: three.InstancedMesh,
  skinnedMesh: three.SkinnedMesh,

  points: three.Points,

  object: three.Object3D,
  group: three.Group,
  scene: three.Scene,

  sprite: three.Sprite,

  pointLight: three.PointLight,
  directionalLight: three.DirectionalLight,

  line: three.Line,
  lineLoop: three.LineLoop,
  lineSegments: three.LineSegments,

  perspectiveCamera: three.PerspectiveCamera,
  orthographicCamera: three.OrthographicCamera,
  cubeCamera: three.CubeCamera,
}

registry
  .addGlobalCreateHandler((type, props) => {
    const ObjectClass = (THREE_OBJECT3D_CLASS_MAP as any)[type];
    if (ObjectClass) {
      const object = new (ObjectClass as typeof three.Object3D)();
      setProps(object, props as PropsFromClass<three.Object3D>);
      return object;
    }
    console.warn(`I WONT MAKE ${type}`)
    return null;
  })
  .addGlobalUpdateHandler((type, object, next, prev) => {
    setProps(object, next as PropsFromClass<three.Object3D>);
  })
  .registerUnhandledPrimitives(Object.keys(THREE_OBJECT3D_CLASS_MAP) as any[])