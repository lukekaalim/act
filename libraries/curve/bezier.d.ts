import { TimeSpan } from "./schedule";

export type CubicBezier = [number, number, number, number];

export type CubicBezierAnimation = {
  type: 'cubic-bezier',
  span: TimeSpan,
  shape: CubicBezier,
};
export type CubicBezierPoint = {
  progress: number,

  position: number,
  velocity: number,
  acceleration: number,
};

export function useBezierAnimation(
  bezier: CubicBezierAnimation,
  animate: (point: CubicBezierPoint) => unknown,
): void;

export function createInitialCubicBezierAnimation(
  target: number,
): CubicBezierAnimation;

export function interpolateCubicBezierAnimation(
  bezier: CubicBezierAnimation,
  target: number,
  durationMs: number,
  impulse: number,
  start: number
): CubicBezierAnimation;
