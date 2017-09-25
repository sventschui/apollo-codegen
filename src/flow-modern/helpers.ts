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

export class Helpers {
  constructor(public options: CompilerOptions) {}
0
  // Types
  public typeNameFromGraphQLType(name: any, type: GraphQLType, options?: { isNullable?: boolean }): string {
    let {
      isNullable
    } = Object.assign({
      isNullable: true
    }, options);

    // if (type instanceof GraphQLNonNull) {
    //   return this.typeNameFromGraphQLType(type.ofType, { isNullable });
    // } else if (isNullable === undefined) {
    //   isNullable = true;

    //   let typeName;
    //   if (type instanceof GraphQLList) {
    //     typeName = `Array<${this.typeNameFromGraphQLType(type.ofType)}>`;
    //   } else if (type instanceof GraphQLScalarType) {
    //     typeName = builtInScalarMap[type.name] || (
    //       this.options.passthroughCustomScalars
    //         ? this.options.customScalarsPrefix + type.name
    //         : 'any'
    //     );
    //   } else {
    //     typeName = type.name;
    //   }

    //   return isNullable ? `?${typeName}` : typeName;
    // }
    if (type instanceof GraphQLNonNull) {
      return this.typeNameFromGraphQLType(name, type.ofType, { isNullable: false }));
    }

    let typeName;
    if (type instanceof GraphQLList) {
      typeName = `Array<${this.typeNameFromGraphQLType(name, type.ofType)}>`;
    } else if (type instanceof GraphQLScalarType) {
      typeName = builtInScalarMap[type.name] || (this.options.passthroughCustomScalars ? context.customScalarsPrefix + type.name : 'any');
    } else {
      typeName = type.name;
    }

    const res = isNullable ? '?' + typeName : typeName;
    console.log(name, res);
    return res;
  }
}
