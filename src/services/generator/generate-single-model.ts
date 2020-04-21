/* eslint-disable @typescript-eslint/no-use-before-define */
import { kebabCase, lowerFirst, sortedUniq } from 'lodash';

import { generateEnumsImports, generateField } from './generate-base';
import { IGeneratorContext } from './generator-context';
import { asLastArgument, stringifyClean } from './helpers/stringify-clean';
import { ISingleErModel, ISingleErRelation } from './model-types';

export function generateTypeImport(type: string) {
  return `import { ${type} } from '../../${kebabCase(type)}/models/${type}';`;
}

export function generateOneToOneOwnerDeclarations(relations: Array<ISingleErRelation>) {
  const nullableRelations: Array<ISingleErRelation> = relations.map(r => ({ ...r, optional: true }));

  return nullableRelations
    .map(
      r =>
        `  @ORM.OneToOne(() => ${r.otherTypeName}, (${lowerFirst(r.otherTypeName)}) => ${lowerFirst(r.otherTypeName)}.${
          r.otherName
        })
  public ${getRelationName(r)}: Promise<${getRelationOtherTypeName(r)}>;
`,
    )
    .join('\n');
}

export function generateOneToOneSecondaryDeclarations(relations: Array<ISingleErRelation>) {
  if (relations.length === 0) {
    return '';
  }

  return relations
    .map(r => {
      return `  @ORM.OneToOne(() => ${r.otherTypeName}, (${lowerFirst(r.otherTypeName)}) => ${lowerFirst(
        r.otherTypeName,
      )}.${r.otherName} ${generateRelationArgs(r)})
  @ORM.JoinColumn()
  public ${getRelationName(r)}: Promise<${getRelationOtherTypeName(r)}>;
`;
    })
    .join('\n\n');
}

export function generateOneToManyDeclarations(relations: Array<ISingleErRelation>) {
  if (relations.length === 0) {
    return '';
  }

  return relations
    .map(
      r =>
        `  @ORM.OneToMany(() => ${r.otherTypeName}, (${lowerFirst(r.otherTypeName)}) => ${lowerFirst(
          r.otherTypeName,
        )}.${r.otherName})
  public ${r.myName}: Promise<Array<${r.otherTypeName}>>;`,
    )
    .join('\n\n');
}

export function generateRelationArgs(relation: ISingleErRelation) {
  const relationsArgs = stringifyClean({
    nullable: relation.optional,
    onDelete: relation.optional ? 'SET NULL' : 'CASCADE',
  });

  return asLastArgument(relationsArgs);
}

export function getRelationName(r: ISingleErRelation) {
  return r.myName;
}

export function getRelationOtherTypeName(r: ISingleErRelation) {
  if (r.optional) {
    return `${r.otherTypeName} | undefined | null`;
  } else {
    return r.otherTypeName;
  }
}

export function generateManyToOneDeclarations(relations: Array<ISingleErRelation>) {
  if (relations.length === 0) {
    return '';
  }

  return relations
    .map(
      r =>
        `
@ORM.Index()
@ORM.ManyToOne(() => ${r.otherTypeName}, (${lowerFirst(r.otherTypeName)}) => ${lowerFirst(r.otherTypeName)}.${
          r.otherName
        } ${generateRelationArgs(r)})
  public ${getRelationName(r)}: Promise<${getRelationOtherTypeName(r)}>;`,
    )
    .join('\n\n');
}

export function generateTypesImports(types: Array<string>) {
  return types.map(generateTypeImport).join('\n');
}

export function generateSingleModel(model: ISingleErModel, ctx: IGeneratorContext) {
  const name = model.name;
  const types = sortedUniq(model.relations.map(r => r.otherTypeName));

  const oneToManyRelations = model.relations.filter(r => r.relationType === 'many' && r.otherRelationType === 'one');
  const manyToOneRelations = model.relations.filter(r => r.relationType === 'one' && r.otherRelationType === 'many');
  const oneToOneOwnerRelations = model.relations.filter(
    r => r.relationType === 'one' && r.otherRelationType === 'one' && r.isFirst,
  );
  const oneToOneSecondaryRelations = model.relations.filter(
    r => r.relationType === 'one' && r.otherRelationType === 'one' && !r.isFirst,
  );

  const dbFields = model.fields.filter(f => f.visibility === '+' || f.visibility === '-');

  return `import * as ORM from 'typeorm';

${generateTypesImports(types.filter(type => type !== model.name))}
${generateEnumsImports(model.fields)}

// <keep-imports>
// </keep-imports>

// <keep-decorators>
// </keep-decorators>
@ORM.Entity()
export class ${name} {
  @ORM.PrimaryGeneratedColumn()
  id: number;

${dbFields.map(generateField(ctx)).join('\n\n')}

${generateManyToOneDeclarations(manyToOneRelations)}

${generateOneToManyDeclarations(oneToManyRelations)}


${generateOneToOneOwnerDeclarations(oneToOneOwnerRelations)}
${generateOneToOneSecondaryDeclarations(oneToOneSecondaryRelations)}

  @ORM.CreateDateColumn()
  createdAt: Date;

  @ORM.UpdateDateColumn()
  updatedAt: Date;

  // <keep-methods>
  // </keep-methods>
}
`;
}
