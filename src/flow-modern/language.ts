import {
  GraphQLInputField,
  GraphQLField,
  GraphQLNonNull,
  GraphQLList,
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
}
