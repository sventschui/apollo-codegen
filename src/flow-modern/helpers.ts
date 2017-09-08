import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLString,
  GraphQLType,
} from 'graphql';

import { CompilerOptions, Argument } from '../compiler';

const builtInScalarMap = {
  [GraphQLString.name]: 'String',
  [GraphQLInt.name]: 'Int',
  [GraphQLFloat.name]: 'Double',
  [GraphQLBoolean.name]: 'Bool',
  [GraphQLID.name]: 'GraphQLID'
};

export class Helpers {
  constructor(public options: CompilerOptions) {}

  // Types
  public typeNameFromGraphQLType(type: GraphQLType, options?: { isOptional?: boolean }): string {
    let {
      isOptional
    } = Object.assign({
      isOptional: true
    }, options);

    if (type instanceof GraphQLNonNull) {
      return this.typeNameFromGraphQLType(type.ofType, { isOptional });
    } else if (isOptional === undefined) {
      isOptional = true;

      let typeName;
      if (type instanceof GraphQLList) {
        typeName = `Array<${this.typeNameFromGraphQLType(type.ofType)}>`;
      } else if (type instanceof GraphQLScalarType) {
        typeName = builtInScalarMap[type.name] || (
          this.options.passthroughCustomScalars
            ? this.options.customScalarsPrefix + type.name
            : 'any'
        );
      } else {
        typeName = type.name;
      }

      return isOptional ? `?${typeName}` : typeName;
    }
  }
}
