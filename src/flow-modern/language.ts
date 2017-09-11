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
      if (isAbstractType(getNamedType(property.typeName))) {
        console.log(property)
      }
    });
  }
  /*
export function propertyDeclarations(generator, properties, isInput) {
  if (!properties) return;
  properties.forEach(property => {
    if (isAbstractType(getNamedType(property.type || property.fieldType))) {
      const propertySets = getPossibleTypeNames(generator, property)
        .map(type => {
          const inlineFragment = property.inlineFragments.find(inlineFragment => {
            return inlineFragment.typeCondition.toString() == type
          });

          if (inlineFragment) {
            const fields = inlineFragment.fields.map(field => {
              if (field.fieldName === '__typename') {
                return {
                  ...field,
                  typeName: `"${inlineFragment.typeCondition}"`,
                  type: { name: `"${inlineFragment.typeCondition}"` }
                }
              } else {
                return field;
              }
            });

            return propertiesFromFields(generator, fields);
          } else {
            const fields = property.fields.map(field => {
              if (field.fieldName === '__typename') {
                return {
                  ...field,
                  typeName: `"${type}"`,
                  type: { name: `"${type}"` }
                }
              } else {
                return field;
              }
            });

            return propertiesFromFields(generator, fields);
          }
        });

      propertySetsDeclaration(generator, property, propertySets);
    } else {
      if (property.fields && property.fields.length > 0
        || property.inlineFragments && property.inlineFragments.length > 0
        || property.fragmentSpreads && property.fragmentSpreads.length > 0
      ) {
        propertyDeclaration(generator, property, () => {
          const properties = propertiesFromFields(generator.context, property.fields);
          propertyDeclarations(generator, properties, isInput);
        });
      } else {
        propertyDeclaration(generator, {...property, isInput});
      }
    }
  });
}
*/
}
