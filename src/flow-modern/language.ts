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

  public propertyDeclarations(properties: Property[], isInput: boolean, closure?: (property: Property) => void) {
    if (!properties) return;
    properties.forEach(property => {
      this.propertyDeclaration(property, isInput, closure);
    });
  }

  public descriptionComment(description) {
    return description.split('\n')
      .forEach(line => {
        this.printOnNewline(`// ${line.trim()}`);
      })
  }

  public propertyDeclarationSelectionSet(property: Property, closure: Function) {
    const {
      selectionSet
    } = property;

    if (!(property.type instanceof GraphQLNonNull)) {
      this.print('?')
    }

    closure(selectionSet);
  }

  public propertyDeclarationSelection(property: Property) {
  }

  public propertyDeclaration(property: Property) {
    this.printOnNewline(property.name);

    if (!(property.type instanceof GraphQLNonNull)) {
      // When field is nullable, also allow not requiring this property
      // to satisfy this type.
      this.print('?')
    }

    this.print(': ');
  }

  // public propertyDeclaration(property: Property, isInput: boolean, closure?: (property: Property) => void) {
  //   const {
  //     name,
  //     type,
  //     typeName,
  //     description,
  //     selectionSet,
  //   } = property;

  //   if (selectionSet) {
  //     const typeCase = typeCaseForSelectionSet(selectionSet);
  //     const exhaustiveVariants = typeCase.exhaustiveVariants;

  //     this.printOnNewline(name)
  //     if (isInput && isNullable) {
  //       this.print('?')
  //     }
  //     this.print(':')
  //     if (isNullable) {
  //       this.print(' ?');
  //     }

  //     this.pushScope({ typeName: name });

  //     if (closure) {
  //       closure();
  //     }

  //     this.withinBlock(() => {
  //       exhaustiveVariants.forEach((variant) => {
  //         const properties = this.propertiesFromFields(variant.selections);

  //         this.propertyDeclarations(
  //           this.propertiesFromFields(variant.selections)
  //         );
  //       });
  //     }, '{|', '|}');

  //     this.popScope();
  //   } else {
  //     this.printOnNewline(name)
  //     if (isInput && isNullable) {
  //       this.print('?')
  //     }
  //     // const typeName = this.helpers.typeNameFromGraphQLType(name, type);
  //     this.print(`: ${typeName}`);
  //   }
  //   this.print(',');
  //   }
  // }
}
