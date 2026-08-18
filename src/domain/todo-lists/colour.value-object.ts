import { ValueObject } from '../common/value-object.base';

interface ColourProps {
  code: string;
}

export class Colour extends ValueObject<ColourProps> {
  protected readonly props: ColourProps;

  private constructor(props: ColourProps) {
    super();
    this.props = props;
  }

  get code(): string {
    return this.props.code;
  }

  static readonly white = new Colour({ code: '#FFFFFF' });

  static create(code: string): Colour {
    if (!/^#[0-9A-Fa-f]{6}$/.test(code)) {
      throw new Error(`Invalid colour code: ${code}`);
    }
    return new Colour({ code });
  }
}
