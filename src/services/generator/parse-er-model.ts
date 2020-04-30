import { drop, flatten, includes, lowerFirst } from 'lodash';

import {
  IFieldDefinition,
  IModelDefinition,
  IRelationComponent,
  ISingleErModel,
  ISingleErRelation,
} from './model-types';

const trim = (x: string) => x.trim();
const remove = (str: string) => (x: string) => x.replace(str, '');

function getDefinitionName(definition: Array<string>) {
  return definition[0].replace(':', '');
}

function getDefinitionLines(definition: Array<string>) {
  return drop(definition, 1).map(d => d.split(' ').map(remove(':')).map(trim));
}

function getFieldDefinition([visibility, name, type, dbType]: Array<string>): IFieldDefinition {
  const optional = name.endsWith('?');

  return { visibility, type: type || 'string', dbType, optional, name: name.replace('?', ''), modelName: '' };
}

function getModel(modelLines: Array<string>): IModelDefinition {
  const name = getDefinitionName(modelLines);
  const fields = getDefinitionLines(modelLines).map(getFieldDefinition);

  return { name, fields };
}

function getRelationParts(relation: string) {
  return relation
    .split('\n')
    .map(trim)
    .filter(x => !!x);
}

function getPartComponents(relationPart: string) {
  const parts = relationPart
    .split(/ through | has many | as | has one | = /g)
    .map(trim)
    .filter(x => x);

  if (!relationPart.includes(' through ')) {
    const [source, target, as, autoAssignKey] = parts;
    return { source, target, as, autoAssignKey };
  }

  const [source, target, through, as, autoAssignKey] = parts;
  return { source, target, through, as, autoAssignKey };
}

function getPartType(relationPart: string) {
  if (includes(relationPart, 'has many')) {
    return 'many';
  }
  if (includes(relationPart, 'has one')) {
    return 'one';
  }
  throw new Error(`invalid relation part ${relationPart}`);
}

function getRelationPart(relationPart: string): IRelationComponent {
  const { source, target, as, autoAssignKey, through } = getPartComponents(relationPart);
  const type = getPartType(relationPart);

  const optional = as.endsWith('?');

  return {
    source,
    target,
    type,
    optional,
    as: as.replace('?', ''),
    autoAssignKey,
    through,
  };
}

export interface IRelationDefinition {
  first: IRelationComponent;
  second: IRelationComponent;
}

function getRelation(relation: string): IRelationDefinition {
  const [first, second] = getRelationParts(relation).map(getRelationPart);

  return { first, second };
}

function createManyToManyRelation(first: IRelationComponent, second: IRelationComponent): Array<ISingleErRelation> {
  if (!first.through || !second.through) {
    throw new Error('Missing `through` for many to many relation');
  }

  if (first.through !== second.through) {
    throw new Error('Relation `through` must match');
  }

  const relationDefinition1: IRelationDefinition = {
    first: {
      source: first.source,
      target: first.through,
      as: first.as,
      autoAssignKey: first.autoAssignKey,
      optional: first.optional,
      type: 'many',
    },
    second: {
      source: first.through,
      target: first.source,
      as: lowerFirst(first.source),
      optional: false,
      type: 'one',
    },
  };

  const relationDefinition2: IRelationDefinition = {
    first: {
      source: second.source,
      target: second.through,
      as: second.as,
      autoAssignKey: second.autoAssignKey,
      optional: second.optional,
      type: 'many',
    },
    second: {
      source: second.through,
      target: second.source,
      as: lowerFirst(second.source),
      optional: false,
      type: 'one',
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return [...convertToSingleRelations(relationDefinition1), ...convertToSingleRelations(relationDefinition2)];
}

function convertToSingleRelations(relationDefinition: IRelationDefinition): Array<ISingleErRelation> {
  const { first, second } = relationDefinition;

  if (first.through || second.through) {
    return createManyToManyRelation(first, second);
  }

  const firstRelation: ISingleErRelation = {
    myName: first.as,
    myTypeName: first.source,
    otherName: second.as,
    otherTypeName: first.target,
    relationType: first.type,
    otherRelationType: second.type,
    optional: first.optional,
    isFirst: true,
    autoAssignKey: first.autoAssignKey,
  };

  const secondRelation: ISingleErRelation = {
    myName: second.as,
    myTypeName: second.source,
    otherName: first.as,
    otherTypeName: second.target,
    relationType: second.type,
    otherRelationType: first.type,
    optional: second.optional,
    isFirst: false,
    autoAssignKey: second.autoAssignKey,
  };

  return [firstRelation, secondRelation];
}

export function parseErModel(data: string) {
  const lines = data
    .split('\n')
    .filter(line => !line.startsWith('#'))
    .join('\n');
  const statements = lines
    .split('\n\n')
    .map(trim)
    .filter(x => x);
  const definitions = statements.filter(st => includes(st, ':'));

  const modelLines = definitions.map(d =>
    d
      .split('\n')
      .map(trim)
      .filter(x => x),
  );
  const relationsLines = statements
    .filter(st => !includes(st, ':'))
    .map(trim)
    .filter(x => x);

  const modelsDefinitions = modelLines.map(getModel);
  const relationsDefinitions = relationsLines.map(getRelation);
  const singleRelations = flatten(relationsDefinitions.map(convertToSingleRelations));

  const modelsNames = modelsDefinitions.map(d => d.name);
  for (const relation of singleRelations) {
    if (!modelsNames.includes(relation.myTypeName)) {
      throw new Error('Missing definition for model ' + relation.myTypeName);
    }
    if (!modelsNames.includes(relation.otherTypeName)) {
      throw new Error('Missing definition for model ' + relation.otherTypeName);
    }
  }

  return modelsDefinitions.map(
    (modelDefinition): ISingleErModel => {
      const modelSingleRelations = singleRelations.filter(r => r.myTypeName === modelDefinition.name);

      return {
        name: modelDefinition.name,
        fields: modelDefinition.fields.map(field => ({ ...field, modelName: modelDefinition.name })),
        relations: modelSingleRelations,
      };
    },
  );
}
