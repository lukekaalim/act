// @flow strict

export const lerp = (v1/*: number*/, v2/*: number*/, t/*: number*/)/*: number*/ => {
  return v1 + (t * (v2 - v1));
}

export class Vector2 {
  /*:: x: number*/
  /*:: y: number*/
  constructor(x/*: number*/, y/*: number*/) {
    this.x = x;
    this.y = y;
  }

  add(operand/*: Vector2*/)/*: Vector2*/ {
    return new Vector2(this.x + operand.x, this.y + operand.y)
  }

  scalarMultiply(operand/*: number*/)/*: Vector2*/ {
    return new Vector2(this.x * operand, this.y * operand)
  }
  scalarDivide(operand/*: number*/)/*: Vector2*/ {
    return new Vector2(this.x / operand, this.y / operand)
  }

  negate()/*: Vector2*/ {
    return new Vector2(-this.x, -this.y);
  }

  magnitude()/*: number*/ {
   return Math.sqrt((this.x * this.x) + (this.y * this.y));
  }

  unit()/*: Vector2*/ {
    return this.scalarDivide(this.magnitude());
  }

  static lerp(a/*: Vector2*/, b/*: Vector2*/, t/*: number*/)/*: Vector2*/ {
    return new Vector2(
      lerp(a.x, b.x, t),
      lerp(a.y, b.y, t),
    );
  }

  static zero()/*: Vector2*/ {
    return new Vector2(0, 0);
  }
}
