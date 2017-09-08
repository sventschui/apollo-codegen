import {
  getNamedType,
  GraphQLEnumType,
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLInputField,
  GraphQLList,
  GraphQLNonNull,
  isCompositeType,
} from 'graphql';

import { wrap } from '../utilities/printing';

import {
  CompilerContext
} from '../compiler';

import {
  FlowGenerator,
  Property
} from './language';

import { Helpers } from './helpers';

function isGraphQLInputField(field: GraphQLField<any, any> | GraphQLInputField): field is GraphQLInputField {
  return 'defaultValue' in field;
}

export function generateSource(context: CompilerContext) {
  const generator = new FlowAPIGenerator(context);

  generator.fileHeader();

  context.typesUsed.forEach(type => {
    generator.typeDeclarationForGraphQLType(type);
  });

  Object.values(context.operations).forEach(operation => {
    // generator.interfaceVariablesDeclarationForOperation(operation);
    // generator.typeDeclarationForOperation(operation);
  });

  Object.values(context.fragments).forEach(fragment => {
    console.log(fragment);
  });

  return generator.output;
}

export class FlowAPIGenerator extends FlowGenerator<CompilerContext> {
  helpers: Helpers;

  constructor(context: CompilerContext) {
    super(context);
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
      const properties = this.propertiesFromFields(Object.values(type.getFields()));
      // this.propertyDeclarations(properties, true);
    });
  }

  public propertiesFromFields(fields: GraphQLInputField[]) {
    return fields.map(field => this.propertyFromField(field));
  }

  private propertyFromField(field: GraphQLField<any, any> | GraphQLInputField) {
    let {
      name: fieldName,
      type: fieldType,
      description: fieldDescription,
    } = field;

    let property: Property = {
      fieldName,
      typeName: fieldType.toString(),
      description: fieldDescription
    };

    let fieldDefaultValue;
    if (isGraphQLInputField(field)) {
      fieldDefaultValue = field.defaultValue;
    }

    const isNullable = fieldType instanceof GraphQLNonNull;

    if (isCompositeType(getNamedType(fieldType))) {
      const typeName = this.helpers.typeNameFromGraphQLType(fieldType);
      // TODO: What is going on here?
      let isArray = false;
      let isArrayElementNullable = null;
      if (fieldType instanceof GraphQLList) {
        isArray = true;
        isArrayElementNullable = !(fieldType instanceof GraphQLNonNull);
      } else if (fieldType instanceof GraphQLNonNull && fieldType.ofType instanceof GraphQLList) {
        isArray = true;
        isArrayElementNullable = !(fieldType.ofType.ofType instanceof GraphQLNonNull);
      }

      // TODO: Figure out what this needs to return ... probably need
      // to use flattenIR here.
      return property
    }

    // fieldName = fieldName || field.responseName;

    // const propertyName = fieldName;

    // let property = { fieldName, fieldType, propertyName, description };

    // let isNullable = true;
    // if (fieldType instanceof GraphQLNonNull) {
    //   isNullable = false;
    // }
    // const namedType = getNamedType(fieldType);
    // if (isCompositeType(namedType)) {
    //   const typeName = typeNameFromGraphQLType(context, fieldType);
    //   let isArray = false;
    //   let isArrayElementNullable = null;
    //   if (fieldType instanceof GraphQLList) {
    //     isArray = true;
    //     isArrayElementNullable = !(fieldType.ofType instanceof GraphQLNonNull);
    //   } else if (fieldType instanceof GraphQLNonNull && fieldType.ofType instanceof GraphQLList) {
    //     isArray = true;
    //     isArrayElementNullable = !(fieldType.ofType.ofType instanceof GraphQLNonNull);
    //   }
    //   return {
    //     ...property,
    //     typeName, fields: field.fields, isComposite: true, fragmentSpreads, inlineFragments, fieldType,
    //     isArray, isNullable, isArrayElementNullable,
    //   };
    // } else {
    //   if (field.fieldName === '__typename') {
    //     const typeName = typeNameFromGraphQLType(context, fieldType, null, false);
    //     return { ...property, typeName, isComposite: false, fieldType, isNullable: false };
    //   } else {
    //     const typeName = typeNameFromGraphQLType(context, fieldType, null, isNullable);
    //     return { ...property, typeName, isComposite: false, fieldType, isNullable };
    //   }
    // }
  }



}
