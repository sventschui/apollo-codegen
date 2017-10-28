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
  isCompositeType,
} from 'graphql';

import * as Inflector from 'inflected';

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

  public typeNameFromGraphQLType(type: GraphQLType, scopeStack: string[], field: Field): string {
    if (type instanceof GraphQLNonNull) {
      return this.typeNameFromNullableGraphQLType(type.ofType, scopeStack, field);
    } else {
      return `?${this.typeNameFromNullableGraphQLType(type, scopeStack, field)}`;
    }
  }

  public typeNameFromNullableGraphQLType(type: GraphQLType, scopeStack: string[], field: Field): string {
    let typeName;

    if (!(type instanceof GraphQLNonNull)) {
      if (type instanceof GraphQLList) {
        typeName = `Array<${this.typeNameFromGraphQLType(type.ofType, scopeStack, field)}>`;
      } else if (type instanceof GraphQLScalarType) {
        typeName = builtInScalarMap[type.name]
      } else {
        if (isCompositeType(type)) {
          typeName = this.typeNameForCompositeType(scopeStack, field.name);
        } else {
          typeName = type.name;
        }
      }
    } else {
      throw new Error('`typeNameFromNullableGraphQLType does not accept GraphQLNonNull');
    }

    return typeName;
  }

  // Generate names for composite types by de-pluralizing it is plural, so
  // { friends: Array<?Character> } becomes { friends: Array<?friend> }.
  // The scopeStack is used to provide a namespace since collisions are easily
  // possible with only field names.
  //
  // Example:
  // query HeroQuery { friends: { ... }}
  // would generate the name `HeroQuery_friend`
  //
  public typeNameForCompositeType(fieldName: string, scopeStack: string[]) {
    console.log(scopeStack);
    return [...scopeStack, Inflector.singularize(fieldName)].join('_');
  }
}
