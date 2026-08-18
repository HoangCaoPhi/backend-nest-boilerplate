export abstract class ValueObject<TProps extends object = object> {
  protected abstract readonly props: TProps;

  equals(other?: ValueObject<TProps>): boolean {
    if (other === null || other === undefined) return false;
    if (other.constructor !== this.constructor) return false;
    return structurallyEqual(this.props, other.props);
  }
}

// Structural, so the order props were declared in cannot change the answer — unlike
// comparing JSON.stringify output. Hand-rolled rather than pulled from node:util so the
// domain layer keeps depending on nothing at all.
function structurallyEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left instanceof Date || right instanceof Date) {
    return left instanceof Date && right instanceof Date && left.getTime() === right.getTime();
  }
  if (typeof left !== 'object' || typeof right !== 'object' || left === null || right === null) {
    return false;
  }
  if (Array.isArray(left) !== Array.isArray(right)) return false;

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;

  return leftKeys.every(
    (key) =>
      Object.hasOwn(right, key) &&
      structurallyEqual((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]),
  );
}
