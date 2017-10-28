import {
  GraphQLInputField,
  GraphQLField,
  GraphQLNonNull,
  GraphQLType,
  GraphQLList,
  isAbstractType,
  isCompositeType,
  getNamedType
} from 'graphql';

import CodeGenerator from '../utilities/CodeGenerator';
import { SelectionSet } from '../compiler'
import { typeCaseForSelectionSet } from '../compiler/visitors/typeCase';

import {
  CompilerContext,
  Operation,
  SelectionSet,
  Field
} from '../compiler';

import {
  collectAndMergeFields
} from '../compiler/visitors/collectAndMergeFields';

type TypeAliasDeclarationOptions = {
  typeName: string,
  endingSemi?: boolean,
  precedingNewLines?: boolean
}

type ObjectTypePropertyOptions = {
  extraIndent?: boolean
}

type ObjectTypeAnnotationOptions = {
  extraIndent?: boolean
}

export interface Property {
  name: string;
  type: GraphQLType;
  typeName: string;
  description?: string;
  selectionSet?: SelectionSet;

  // Force the output to a certain string for this property
  forceType?: string;
}


export class FlowGenerator<Context> extends CodeGenerator<Context, string> {
  constructor(context: Context) {
    super(context);
  }

  public propertiesFromFields(fields: Field[]) {
    return fields.map(field => {
      return this.propertyFromField(field)
    });
  }

  private propertyFromField(field: Field) {
    let {
      name,
      type,
      description: fieldDescription,
      selectionSet,
    } = field;

    let property: Property = {
      name,
      type,
      typeName: type.toString(),
      description: fieldDescription,
      selectionSet,
    };

    return property;
  }

  public exportedTypeAliasDeclaration(
    options: TypeAliasDeclarationOptions,
    closure: () => void
  ) {
    const defaults = {
      endingSemi: true,
      openingNewLines: true,
    };

    const {
      typeName,
      endingSemi,
      precedingNewLines
    } = {
      ...defaults,
      ...options
    };

    if (precedingNewLines) {
      this.printNewlineIfNeeded();
    }
    this.printNewline();
    this.print(`export type ${ typeName } = `);
    this.pushScope(typeName);
    closure();
    this.popScope();

    if (endingSemi) {
      this.print(';');
    }
  }

  public objectTypeAnnotation(closure: Function, options: ObjectTypeAnnotationOptions = {}) {
    let closingBracket = options.extraIndent? '  |}' : '|}';

    this.withinBlock(() => {
      closure();
    }, '{|', closingBracket);
  }

  public objectTypeProperty(
    name: string,
    value: Function,
    options: ObjectTypePropertyOptions = { extraIndent: false }
  ) {
    const { extraIndent } = options;

    const main = () => {
      this.printOnNewline(name);
      this.print(': ');
      this.print(value());
    }

    if (extraIndent) {
      this.withIndent(main)
    } else {
      main();
    }
  }

  public unionExpression(closures: Function[], options: UnionExpressionOptions = { parens: false }) {
    const { parens } = options;

    if (parens) {
      this.print('(');
    }
    this.withIndent(() => {
      closures.forEach(closure => {
        this.printOnNewline('| ');
        closure();
      });
    });

    if (parens) {
      this.printOnNewline(')');
    }
  }

  public descriptionComment(description: string) {
    return description.split('\n')
      .forEach(line => {
        this.printOnNewline(`// ${line.trim()}`);
      })
  }
}
