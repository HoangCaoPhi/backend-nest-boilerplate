export abstract class Entity<TId> {
  protected constructor(protected readonly _id: TId) {}

  get id(): TId {
    return this._id;
  }

  equals(other?: Entity<TId>): boolean {
    if (other === null || other === undefined) return false;
    if (this === other) return true;
    // Same id in two different entity types is not the same entity.
    if (other.constructor !== this.constructor) return false;
    return this._id === other._id;
  }
}
