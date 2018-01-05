"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const t = require("@babel/types");
const builtInScalarMap = {
    [graphql_1.GraphQLString.name]: t.TSStringKeyword(),
    [graphql_1.GraphQLInt.name]: t.TSNumberKeyword(),
    [graphql_1.GraphQLFloat.name]: t.TSNumberKeyword(),
    [graphql_1.GraphQLBoolean.name]: t.TSBooleanKeyword(),
    [graphql_1.GraphQLID.name]: t.TSStringKeyword(),
};
function createTypeFromGraphQLTypeFunction(compilerOptions) {
    return function typeFromGraphQLType(graphQLType, { nullable = true, replaceObjectTypeIdentifierWith } = {
            nullable: true
        }) {
        if (graphQLType instanceof graphql_1.GraphQLNonNull) {
            return typeFromGraphQLType(graphQLType.ofType, { nullable: false, replaceObjectTypeIdentifierWith });
        }
        if (graphQLType instanceof graphql_1.GraphQLList) {
            const elementType = typeFromGraphQLType(graphQLType.ofType, { replaceObjectTypeIdentifierWith, nullable: true });
            const type = t.TSArrayType(t.isTSUnionType(elementType) ? t.TSParenthesizedType(elementType) : elementType);
            if (nullable) {
                return t.TSUnionType([type, t.TSNullKeyword()]);
            }
            else {
                return type;
            }
        }
        let type;
        if (graphQLType instanceof graphql_1.GraphQLScalarType) {
            const builtIn = builtInScalarMap[graphQLType.name];
            if (builtIn) {
                type = builtIn;
            }
            else {
                if (compilerOptions.passthroughCustomScalars) {
                    type = t.TSAnyKeyword();
                }
                else {
                    type = t.TSTypeReference(t.identifier(graphQLType.name));
                }
            }
        }
        else {
            type = t.TSTypeReference(replaceObjectTypeIdentifierWith ? replaceObjectTypeIdentifierWith : t.identifier(graphQLType.name));
        }
        if (nullable) {
            return t.TSUnionType([type, t.TSNullKeyword()]);
        }
        else {
            return type;
        }
    };
}
exports.createTypeFromGraphQLTypeFunction = createTypeFromGraphQLTypeFunction;
//# sourceMappingURL=helpers.js.map