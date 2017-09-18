import {
  GraphQLInputField,
  GraphQLField,
  GraphQLNonNull,
  GraphQLList,
  isAbstractType,
  isCompositeType,
  getNamedType
} from 'graphql';

import CodeGenerator from '../utilities/CodeGenerator';

type TypeDeclarationOptions = {
  typeName: string,
  brackets?: boolean
}

export interface Property {
  fieldName: string;
  typeName: string;
  description?: string;
  isComposite: boolean,
  isArray: boolean,
  isNullable: boolean,
  isArrayElementNullable: boolean
}

export class FlowGenerator<Context> extends CodeGenerator<Context, { typeName: string }> {
  constructor(context: Context) {
    super(context);
  }

  public typeDeclaration(options: TypeDeclarationOptions, closure: () => void) {
    const {
      typeName,
      brackets,
    } = Object.assign({
      brackets: true
    }, options);

    this.printNewlineIfNeeded();
    this.printNewline();
    this.print(`export type ${ typeName } =`);
    this.pushScope({ typeName });

    if (brackets) {
      this.withinBlock(closure, '{|', '|}');
    } else {
      this.withinBlock(closure, '', '');
    }

    this.popScope();
    this.print(';');
  }

  public propertyDeclarations(properties: Property[], isInput: boolean) {
    if (!properties) return;
    properties.forEach(property => {
      this.propertyDeclaration(property, isInput);
    });
  }

  public propertyDeclaration(property: Property, isInput: boolean, closure: Function) {
    const {
      fieldName: name,
      typeName: fieldType,
      description
    } = property;

    let isNullable = true;
    if (fieldType instanceof GraphQLNonNull) {
      isNullable = false;
    }

    if (description) {
      description.split('\n')
        .forEach(line => {
          generator.printOnNewline(`// ${line.trim()}`);
        })
    }

    if (closure) {
      this.printOnNewline(name)
      if (isInput && isNullable) {
        this.print('?')
      }
      this.print(':')
      if (isNullable) {
        this.print(' ?');
      }
      if (isArray) {
        if (!isNullable) {
          this.print(' ');
        }
        this.print(' Array<');
        if (isArrayElementNullable) {
          this.print('?');
        }
      }

      this.pushScope({ typeName: name });

      this.withinBlock(closure, open, close);

      this.popScope();

      if (isArray) {
        this.print(' >');
      }

    } else {
      this.printOnNewline(name)
      if (isInput && isNullable) {
        this.print('?')
      }
      console.log('fieldType:', fieldType)
      this.print(`: ${this.helpers.typeNameFromGraphQLType(fieldType)}`);
    }
    this.print(',');
    }
  }
}
