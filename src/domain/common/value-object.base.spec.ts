import { ValueObject } from './value-object.base';

interface MoneyProps {
  amount: number;
  currency: string;
}

class Money extends ValueObject<MoneyProps> {
  protected readonly props: MoneyProps;

  constructor(props: MoneyProps) {
    super();
    this.props = props;
  }
}

class Weight extends ValueObject<MoneyProps> {
  protected readonly props: MoneyProps;

  constructor(props: MoneyProps) {
    super();
    this.props = props;
  }
}

describe('ValueObject', () => {
  it('is equal when every field matches', () => {
    expect(new Money({ amount: 10, currency: 'VND' }).equals(new Money({ amount: 10, currency: 'VND' }))).toBe(true);
  });

  it('ignores the order the props were declared in', () => {
    const declaredOneWay = new Money({ amount: 10, currency: 'VND' });
    const declaredTheOther = new Money({ currency: 'VND', amount: 10 } as MoneyProps);

    expect(declaredOneWay.equals(declaredTheOther)).toBe(true);
  });

  it('is not equal when a field differs', () => {
    expect(new Money({ amount: 10, currency: 'VND' }).equals(new Money({ amount: 11, currency: 'VND' }))).toBe(false);
  });

  it('is not equal to a different value object type with identical props', () => {
    expect(new Money({ amount: 10, currency: 'VND' }).equals(new Weight({ amount: 10, currency: 'VND' }))).toBe(false);
  });

  it('is not equal to null or undefined', () => {
    expect(new Money({ amount: 10, currency: 'VND' }).equals(undefined)).toBe(false);
  });
});
