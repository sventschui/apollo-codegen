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
  [GraphQLString.name]: 'string',
  [GraphQLInt.name]: 'number',
  [GraphQLFloat.name]: 'number',
  [GraphQLBoolean.name]: 'boolean',
  [GraphQLID.name]: 'string'
};

export default class Helpers {
  constructor(public options: CompilerOptions) {}

  public typeNameFromGraphQLType(type: GraphQLType): string {
    if (type instanceof GraphQLNonNull) {
      return this.typeNameFromNullableGraphQLType(type.ofType);
    } else {
      return `?${this.typeNameFromNullableGraphQLType(type)}`;
    }
  }

  public typeNameFromNullableGraphQLType(type: GraphQLType): string {
    let typeName;

    if (!(type instanceof GraphQLNonNull)) {
      if (type instanceof GraphQLList) {
        typeName = `Array<${this.typeNameFromGraphQLType(type.ofType)}>`;
      } else if (type instanceof GraphQLScalarType) {
        typeName = builtInScalarMap[type.name]
      } else {
        typeName = type.name;
      }
    } else {
      throw new Error('`typeNameFromNullableGraphQLType does not accept GraphQLNonNull');
    }

    return typeName
  }

  // TODO: Fix any
  public typeNameFromScopeStack(scopeStack: string[]) {
    return scopeStack.join('_');
  }
}
