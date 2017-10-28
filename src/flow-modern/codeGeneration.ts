import {
  getNamedType,
  GraphQLEnumType,
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLInputField,
  GraphQLList,
  GraphQLObjectType,
  GraphQLNonNull,
  isCompositeType,
  GraphQLError
} from 'graphql';

import Helpers from './helpers';

import { wrap } from '../utilities/printing';

import {
  CompilerContext,
  Operation,
  SelectionSet,
  Field,
} from '../compiler';

import {
  Variant
} from '../compiler/visitors/typeCase.ts';

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
    // console.log('Fragment', fragment);
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
    this.descriptionComment(description)
    // TODO: clean this up.
    this.exportedTypeAliasDeclaration({
      typeName: name,
      endingSemi: false,
      precedingNewLines: false
    }, () => {
      this.unionExpression(
        values.map((value) => {
          return () => {
            this.withIndent(() => {
              const descriptionLines = value.description.trim().split('\n');

              if (descriptionLines.length > 1) {
                this.withIndent(() => {
                  this.descriptionComment(description);
                });
              }

              this.print(`"${value.value}"`);

              if (descriptionLines.length === 1) {
                if (value.description.indexOf('\n') === -1) {
                  this.print(wrap(' // ', descriptionLines[0]));
                }
              }
            })
          };
        })
      )
    })
    this.printNewline();
  }

  private structDeclarationForInputObjectType(type: GraphQLInputObjectType) {
    const { name, description } = type;
    // TODO: Figure out why typesUsed contains all input object types? Even though
    // I'm not using all of them?

    if (description) {
      this.comment(description);
    }

    this.typeAliasDeclaration({ typeName: name }, () => {
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

  private setTypenameField(properties: Property[], possibleTypes: GraphQLObjectType[]) {
    const i = properties.findIndex(property => property.name === '__typename');
    properties[i].forceType = possibleTypes
      .map(type => `"${type.name}"`)
      .join(' | ');
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

    this.exportedTypeAliasDeclaration({ typeName }, () => {
      this.objectTypeAnnotation(() => {
        const fields = collectAndMergeFields(
          typeCase.default,
          this.context.options.mergeInFieldsFromFragmentSpreads
        );

        const properties = this.propertiesFromFields(fields);
        properties.forEach((property) => {
          const {
            name,
            type,
            description,
            selectionSet,
          } = property;

          const isNullable = !(type instanceof GraphQLNonNull)
          const objectTypePropertyName = isNullable ? `${name}?` : name;

          if (description) {
            this.descriptionComment(description);
          }

          this.objectTypeProperty(objectTypePropertyName, () => {
            if (!selectionSet) {
              return;
            }

            const typeCase = typeCaseForSelectionSet(selectionSet, this.context.options.mergeInFieldsFromFragmentSpreads);
            const variants = typeCase.exhaustiveVariants;
            console.log(variants);
            // Generate ENUM and queue up types to generate.
            if (variants.length > 1) {
              this.unionExpression(
                variants.map(variant => {
                  let fields = collectAndMergeFields(variant, this.context.options.mergeInFieldsFromFragmentSpreads);
                  return () => {
                    this.typeObject(fields, variant, { extraIndent: true});
                  };
                })
              );
            } else {
              const soleVariant = variants[0];
              let fields = collectAndMergeFields(soleVariant, this.context.options.mergeInFieldsFromFragmentSpreads);
              this.typeObject(fields, soleVariant);
            };
          });
        })
      });
    });
  }

  // TODO: Rename to something more appropriate
  private typeObject(fields: Field[], variant: Variant, options = {}) {
    this.objectTypeAnnotation(() => {
      fields.forEach((field) => {
        this.objectTypeProperty(field.name, () => {
          if (field.name === '__typename') {
            return variant.possibleTypes
              .map((type: GraphQLObjectType) => `"${type.name}"`)
              .join(' | ');
          } else {
            const value = this.helpers.typeNameFromGraphQLType(field.type, this._scopeStack, field);
            return value;
          }
        });
      });
    }, options);
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

}
