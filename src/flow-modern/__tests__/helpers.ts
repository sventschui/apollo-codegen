import {
  GraphQLNonNull,
  GraphQLString,
  GraphQLInt,
  GraphQLList
} from 'graphql';

import Helpers from '../helpers';

const helpers = new Helpers({});

describe('flow-modern helpers', () => {
  describe('typeNameFromGraphQLType', () => {
    test('handle GraphQLString', () => {
      const typeName = helpers.typeNameFromGraphQLType(GraphQLInt)
      expect(typeName).toBe('?number')
    })

    test('handles GraphQLNonNull', () => {
      const typeName = helpers.typeNameFromGraphQLType(new GraphQLNonNull(GraphQLString))
      expect(typeName).toBe('string')
    })

    test('handles GraphQLList(GraphQLString))', () => {
      const typeName = helpers.typeNameFromGraphQLType(new GraphQLList(GraphQLString))
      expect(typeName).toBe('?Array<?string>')
    })

    test('handles GraphQLNonNull(GraphQLList(GraphQLString))', () => {
      const typeName = helpers.typeNameFromGraphQLType(new GraphQLNonNull(new GraphQLList(GraphQLString)))
      expect(typeName).toBe('Array<?string>')
    })

    test('handles GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))', () => {
      const typeName = helpers.typeNameFromGraphQLType(
        new GraphQLNonNull(
          new GraphQLList(
            new GraphQLNonNull(GraphQLString)
          )
        )
      )
      expect(typeName).toBe('Array<string>')
    })
  })
})
