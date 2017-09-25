import {
  getNamedType,
  GraphQLEnumType,
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLInputField,
  GraphQLList,
  GraphQLNonNull,
  isCompositeType,
  GraphQLError
} from 'graphql';

import { wrap } from '../utilities/printing';

import {
  CompilerContext,
  Operation,
  SelectionSet,
  Field
} from '../compiler';

import {
  typeCaseForSelectionSet
} from '../compiler/visitors/typeCase';

// import {
//   collectFragmentsReferenced
// } from '../compiler/visitors/collectFragmentsReferenced';

import {
  collectAndMergeFields
} from '../compiler/visitors/collectAndMergeFields';

import {
  FlowGenerator,
  Property
} from './language';

import { Helpers } from './helpers';

function isGraphQLInputField(field: Field): field is GraphQLInputField {
  return 'defaultValue' in field;
}

export function generateSource(context: CompilerContext) {
  const generator = new FlowAPIGenerator(context);

  generator.fileHeader();

  context.typesUsed.forEach(type => {
    generator.typeDeclarationForGraphQLType(type);
  });

  Object.values(context.operations).forEach(operation => {
    // generator.typeVariablesDeclarationForOperation(operation);
    generator.typeDeclarationForOperation(operation);
  });

  Object.values(context.fragments).forEach(fragment => {
    console.log('Fragment', fragment);
  });

  return generator.output;
}

export class FlowAPIGenerator extends FlowGenerator<CompilerContext> {
  helpers: Helpers;

  constructor(context: CompilerContext) {
    super(context);

    this.helpers = new Helpers(context.options);
  }

  public fileHeader() {
    this.printOnNewline('/* @flow */');
    this.printOnNewline('//  This file was automatically generated and should not be edited.');
  }

  public typeDeclarationForGraphQLType(type: any) {
    if (type instanceof GraphQLEnumType) {
      this.enumerationDeclaration(type);
    } else if (type instanceof GraphQLInputObjectType) {
      this.structDeclarationForInputObjectType(type);
    }
  }

  private enumerationDeclaration(type: GraphQLEnumType) {
    const { name, description } = type;
    const values = type.getValues();

    this.printNewlineIfNeeded();
    this.comment(description)
    this.printOnNewline(`export type ${name} =`);

    values.forEach((value) => {
      this.withIndent(() => {
        const descriptionLines = value.description.trim().split('\n');

        if (descriptionLines.length > 1) {
          this.withIndent(() => {
            this.comment(description);
          });
        }

        this.printOnNewline(`| "${value.value}"`);

        if (descriptionLines.length === 1) {
          if (value.description.indexOf('\n') === -1) {
            this.print(wrap(' // ', descriptionLines[0]));
          }
        }
      })
    })
    this.printNewline();
  }

  private comment(description: string) {
    const descriptionLines = description.trim().split('\n');
    descriptionLines
      .forEach(line => {
        this.printOnNewline(`// ${line.trim()}`);
      })
  }

  private structDeclarationForInputObjectType(type: GraphQLInputObjectType) {
    const { name, description } = type;
    // TODO: Figure out why typesUsed contains all input object types? Even though
    // I'm not using all of them?

    if (description) {
      this.comment(description);
    }

    this.typeDeclaration({ typeName: name }, () => {
      // const properties = this.propertiesFromFields(Object.values(type.getFields()));
      // this.propertyDeclarations(properties, true);
    });
  }

  public typeDeclarationForOperation(operation: Operation) {
    const typeName = this.typeNameFromOperation(operation);

    // const fragmentsReferenced = collectFragmentsReferenced(
    //   operation.selectionSet,
    //   this.context.fragments
    // );

    this.typeDeclarationForSelectionSet({
      typeName,
      selectionSet: operation.selectionSet
    });
  }

  private typeDeclarationForSelectionSet(
    {
      typeName,
      selectionSet
    }: {
      typeName: string,
      selectionSet: SelectionSet
    }
  ) {
    const typeCase = typeCaseForSelectionSet(selectionSet, this.context.options.mergeInFieldsFromFragmentSpreads);

    this.typeDeclaration({ typeName }, () => {
      const fields = collectAndMergeFields(
        typeCase.default,
        this.context.options.mergeInFieldsFromFragmentSpreads
      );
      const properties = this.propertiesFromFields(fields as Field[]);
      this.propertyDeclarations(properties, true);
    });
  }

  private typeNameFromOperation(operation: Operation) {
    const {
      operationName,
      operationType
    } = operation;

    switch (operationType) {
      case 'query':
        return `${operationName}Query`;
        break;
      case 'mutation':
        return `${operationName}Mutation`;
        break;
      case 'subscription':
        return `${operationName}Subscription`;
        break;
      default:
        throw new GraphQLError(`Unsupported operation type "${operationType}"`);
    }
  }

  public propertiesFromFields(fields: Field[]) {
    return fields.map(field => this.propertyFromField(field));
  }

  private propertyFromField(field: Field) {
    let {
      name: fieldName,
      type: fieldType,
      description: fieldDescription,
      selectionSet,
    } = field;

    let property: Property = {
      fieldName,
      typeName: fieldType.toString(),
      description: fieldDescription,
      selectionSet
    };

    let fieldDefaultValue;
    if (isGraphQLInputField(field)) {
      fieldDefaultValue = field.defaultValue;
    }

    const isNullable = fieldType instanceof GraphQLNonNull;

    // if (isCompositeType(getNamedType(fieldType))) {
      const typeName = this.helpers.typeNameFromGraphQLType(fieldType);
      let isArray = false;
      let isArrayElementNullable = null;
      if (fieldType instanceof GraphQLList) {
        isArray = true;
        isArrayElementNullable = !(fieldType instanceof GraphQLNonNull);
      } else if (fieldType instanceof GraphQLNonNull && fieldType.ofType instanceof GraphQLList) {
        isArray = true;
        isArrayElementNullable = !(fieldType.ofType.ofType instanceof GraphQLNonNull);
      }

      property.isArray = isArray;
      property.isArrayElementNullable = isArrayElementNullable;
      property.isNullable = isNullable;

      return property;
    // }
  }
}
