import { ApiProperty } from '@nestjs/swagger';
import type * as Public from '@rawan/types';

/** Explicit HTTP response models implement shared contracts; no Prisma entities are registered. */
export class AuthResponseDto implements Public.AuthResponse {
  @ApiProperty({ type: 'string', required: true })
  accessToken!: Public.AuthResponse['accessToken'];
  @ApiProperty({ type: 'string', enum: ['Bearer'], required: true })
  tokenType!: Public.AuthResponse['tokenType'];
  @ApiProperty({ type: 'integer', required: true })
  expiresIn!: Public.AuthResponse['expiresIn'];
  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      role: { type: 'string', enum: ['ADMIN', 'AUTHOR'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
    additionalProperties: false,
  })
  user!: Public.AuthResponse['user'];
}

export class ApiUserDto implements Public.ApiUser {
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiUser['id'];
  @ApiProperty({ type: 'string', required: true })
  name!: Public.ApiUser['name'];
  @ApiProperty({ type: 'string', required: true })
  email!: Public.ApiUser['email'];
  @ApiProperty({ type: 'string', enum: ['ADMIN', 'AUTHOR'], required: true })
  role!: Public.ApiUser['role'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiUser['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiUser['updatedAt'];
}

export class ApiProjectDto implements Public.ApiProject {
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiProject['id'];
  @ApiProperty({ type: 'string', required: true })
  authorId!: Public.ApiProject['authorId'];
  @ApiProperty({ type: 'string', required: true })
  title!: Public.ApiProject['title'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  description!: Public.ApiProject['description'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiProject['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiProject['updatedAt'];
}

export class ApiBookDto implements Public.ApiBook {
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiBook['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiBook['projectId'];
  @ApiProperty({ type: 'string', required: true })
  title!: Public.ApiBook['title'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  description!: Public.ApiBook['description'];
  @ApiProperty({ type: 'integer', required: true })
  position!: Public.ApiBook['position'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiBook['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiBook['updatedAt'];
}

export class ApiChapterDto implements Public.ApiChapter {
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiChapter['id'];
  @ApiProperty({ type: 'string', required: true })
  bookId!: Public.ApiChapter['bookId'];
  @ApiProperty({ type: 'string', required: true })
  title!: Public.ApiChapter['title'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  description!: Public.ApiChapter['description'];
  @ApiProperty({ type: 'integer', required: true })
  position!: Public.ApiChapter['position'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiChapter['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiChapter['updatedAt'];
}

export class ApiSceneDto implements Public.ApiScene {
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiScene['id'];
  @ApiProperty({ type: 'string', required: true })
  chapterId!: Public.ApiScene['chapterId'];
  @ApiProperty({ type: 'string', required: true })
  title!: Public.ApiScene['title'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  description!: Public.ApiScene['description'];
  @ApiProperty({ type: 'integer', required: true })
  position!: Public.ApiScene['position'];
  @ApiProperty({ type: 'string', required: true })
  content!: Public.ApiScene['content'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiScene['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiScene['updatedAt'];
}

export class ApiSceneSummaryDto implements Public.ApiSceneSummary {
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiSceneSummary['id'];
  @ApiProperty({ type: 'string', required: true })
  chapterId!: Public.ApiSceneSummary['chapterId'];
  @ApiProperty({ type: 'string', required: true })
  title!: Public.ApiSceneSummary['title'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  description!: Public.ApiSceneSummary['description'];
  @ApiProperty({ type: 'integer', required: true })
  position!: Public.ApiSceneSummary['position'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiSceneSummary['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiSceneSummary['updatedAt'];
}

export class ApiCharacterDto implements Public.ApiCharacter {
  @ApiProperty({ type: 'string', nullable: true, required: true })
  role!: Public.ApiCharacter['role'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  status!: Public.ApiCharacter['status'];
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiCharacter['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiCharacter['projectId'];
  @ApiProperty({ type: 'string', required: true })
  name!: Public.ApiCharacter['name'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  summary!: Public.ApiCharacter['summary'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  description!: Public.ApiCharacter['description'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiCharacter['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiCharacter['updatedAt'];
}

export class ApiPlaceDto implements Public.ApiPlace {
  @ApiProperty({ type: 'string', nullable: true, required: true })
  type!: Public.ApiPlace['type'];
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiPlace['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiPlace['projectId'];
  @ApiProperty({ type: 'string', required: true })
  name!: Public.ApiPlace['name'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  summary!: Public.ApiPlace['summary'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  description!: Public.ApiPlace['description'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiPlace['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiPlace['updatedAt'];
}

export class ApiFactionDto implements Public.ApiFaction {
  @ApiProperty({ type: 'string', nullable: true, required: true })
  type!: Public.ApiFaction['type'];
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiFaction['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiFaction['projectId'];
  @ApiProperty({ type: 'string', required: true })
  name!: Public.ApiFaction['name'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  summary!: Public.ApiFaction['summary'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  description!: Public.ApiFaction['description'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiFaction['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiFaction['updatedAt'];
}

export class ApiArtifactDto implements Public.ApiArtifact {
  @ApiProperty({ type: 'string', nullable: true, required: true })
  type!: Public.ApiArtifact['type'];
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiArtifact['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiArtifact['projectId'];
  @ApiProperty({ type: 'string', required: true })
  name!: Public.ApiArtifact['name'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  summary!: Public.ApiArtifact['summary'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  description!: Public.ApiArtifact['description'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiArtifact['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiArtifact['updatedAt'];
}

export class ApiRelationshipDto implements Public.ApiRelationship {
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiRelationship['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiRelationship['projectId'];
  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string' },
      kind: {
        type: 'string',
        enum: ['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'],
      },
      name: { type: 'string' },
    },
    required: ['id', 'kind', 'name'],
    additionalProperties: false,
  })
  source!: Public.ApiRelationship['source'];
  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string' },
      kind: {
        type: 'string',
        enum: ['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'],
      },
      name: { type: 'string' },
    },
    required: ['id', 'kind', 'name'],
    additionalProperties: false,
  })
  target!: Public.ApiRelationship['target'];
  @ApiProperty({ type: 'string', required: true })
  typeKey!: Public.ApiRelationship['typeKey'];
  @ApiProperty({ type: 'string', required: true })
  label!: Public.ApiRelationship['label'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  description!: Public.ApiRelationship['description'];
  @ApiProperty({
    type: 'string',
    enum: ['DIRECTIONAL', 'SYMMETRIC'],
    required: true,
  })
  direction!: Public.ApiRelationship['direction'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiRelationship['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiRelationship['updatedAt'];
}

export class ApiTimelineDto implements Public.ApiTimeline {
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiTimeline['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiTimeline['projectId'];
  @ApiProperty({ type: 'string', required: true })
  name!: Public.ApiTimeline['name'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  description!: Public.ApiTimeline['description'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiTimeline['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiTimeline['updatedAt'];
}

export class ApiEraDto implements Public.ApiEra {
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiEra['id'];
  @ApiProperty({ type: 'string', required: true })
  timelineId!: Public.ApiEra['timelineId'];
  @ApiProperty({ type: 'string', required: true })
  name!: Public.ApiEra['name'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  description!: Public.ApiEra['description'];
  @ApiProperty({ type: 'integer', required: true })
  position!: Public.ApiEra['position'];
  @ApiProperty({
    type: 'string',
    description: 'Exact fictional chronology decimal string, not a timestamp.',
    nullable: true,
    required: true,
  })
  start!: Public.ApiEra['start'];
  @ApiProperty({
    type: 'string',
    description: 'Exact fictional chronology decimal string, not a timestamp.',
    nullable: true,
    required: true,
  })
  end!: Public.ApiEra['end'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiEra['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiEra['updatedAt'];
}

export class ApiEventEntityDto implements Public.ApiEventEntity {
  @ApiProperty({ type: 'string', required: true })
  associationId!: Public.ApiEventEntity['associationId'];
  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string' },
      kind: {
        type: 'string',
        enum: ['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'],
      },
      name: { type: 'string' },
    },
    required: ['id', 'kind', 'name'],
    additionalProperties: false,
  })
  entity!: Public.ApiEventEntity['entity'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  role!: Public.ApiEventEntity['role'];
}

export class ApiEventSummaryDto implements Public.ApiEventSummary {
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiEventSummary['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiEventSummary['projectId'];
  @ApiProperty({ type: 'string', required: true })
  timelineId!: Public.ApiEventSummary['timelineId'];
  @ApiProperty({ type: 'string', required: true })
  title!: Public.ApiEventSummary['title'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  summary!: Public.ApiEventSummary['summary'];
  @ApiProperty({
    type: 'string',
    description: 'Exact fictional chronology decimal string, not a timestamp.',
    required: true,
  })
  start!: Public.ApiEventSummary['start'];
  @ApiProperty({
    type: 'string',
    description: 'Exact fictional chronology decimal string, not a timestamp.',
    nullable: true,
    required: true,
  })
  end!: Public.ApiEventSummary['end'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  dateLabel!: Public.ApiEventSummary['dateLabel'];
  @ApiProperty({ type: 'integer', required: true })
  position!: Public.ApiEventSummary['position'];
  @ApiProperty({
    type: 'object',
    properties: { id: { type: 'string' }, name: { type: 'string' } },
    required: ['id', 'name'],
    additionalProperties: false,
    nullable: true,
  })
  era!: Public.ApiEventSummary['era'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiEventSummary['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiEventSummary['updatedAt'];
}

export class ApiTimelineEventDto implements Public.ApiTimelineEvent {
  @ApiProperty({ type: 'string', nullable: true, required: true })
  description!: Public.ApiTimelineEvent['description'];
  @ApiProperty({
    type: 'array',
    maxItems: 1000,
    items: {
      type: 'object',
      properties: {
        associationId: { type: 'string' },
        entity: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            kind: {
              type: 'string',
              enum: ['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'],
            },
            name: { type: 'string' },
          },
          required: ['id', 'kind', 'name'],
          additionalProperties: false,
        },
        role: { type: 'string', nullable: true },
      },
      required: ['associationId', 'entity', 'role'],
      additionalProperties: false,
    },
    required: true,
  })
  entities!: Public.ApiTimelineEvent['entities'];
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiTimelineEvent['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiTimelineEvent['projectId'];
  @ApiProperty({ type: 'string', required: true })
  timelineId!: Public.ApiTimelineEvent['timelineId'];
  @ApiProperty({ type: 'string', required: true })
  title!: Public.ApiTimelineEvent['title'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  summary!: Public.ApiTimelineEvent['summary'];
  @ApiProperty({
    type: 'string',
    description: 'Exact fictional chronology decimal string, not a timestamp.',
    required: true,
  })
  start!: Public.ApiTimelineEvent['start'];
  @ApiProperty({
    type: 'string',
    description: 'Exact fictional chronology decimal string, not a timestamp.',
    nullable: true,
    required: true,
  })
  end!: Public.ApiTimelineEvent['end'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  dateLabel!: Public.ApiTimelineEvent['dateLabel'];
  @ApiProperty({ type: 'integer', required: true })
  position!: Public.ApiTimelineEvent['position'];
  @ApiProperty({
    type: 'object',
    properties: { id: { type: 'string' }, name: { type: 'string' } },
    required: ['id', 'name'],
    additionalProperties: false,
    nullable: true,
  })
  era!: Public.ApiTimelineEvent['era'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiTimelineEvent['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiTimelineEvent['updatedAt'];
}

export class ApiPlotSummaryDto implements Public.ApiPlotSummary {
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiPlotSummary['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiPlotSummary['projectId'];
  @ApiProperty({ type: 'string', required: true })
  title!: Public.ApiPlotSummary['title'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  category!: Public.ApiPlotSummary['category'];
  @ApiProperty({ type: 'integer', required: true })
  position!: Public.ApiPlotSummary['position'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiPlotSummary['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiPlotSummary['updatedAt'];
}

export class ApiPlotDto implements Public.ApiPlot {
  @ApiProperty({ type: 'string', nullable: true, required: true })
  description!: Public.ApiPlot['description'];
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiPlot['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiPlot['projectId'];
  @ApiProperty({ type: 'string', required: true })
  title!: Public.ApiPlot['title'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  category!: Public.ApiPlot['category'];
  @ApiProperty({ type: 'integer', required: true })
  position!: Public.ApiPlot['position'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiPlot['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiPlot['updatedAt'];
}

export class ApiPlotPointSummaryDto implements Public.ApiPlotPointSummary {
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiPlotPointSummary['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiPlotPointSummary['projectId'];
  @ApiProperty({ type: 'string', required: true })
  plotId!: Public.ApiPlotPointSummary['plotId'];
  @ApiProperty({ type: 'string', required: true })
  title!: Public.ApiPlotPointSummary['title'];
  @ApiProperty({ type: 'integer', required: true })
  position!: Public.ApiPlotPointSummary['position'];
  @ApiProperty({
    type: 'string',
    enum: ['PLANNED', 'IN_PROGRESS', 'RESOLVED'],
    required: true,
  })
  status!: Public.ApiPlotPointSummary['status'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiPlotPointSummary['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiPlotPointSummary['updatedAt'];
}

export class ApiPlotPointDto implements Public.ApiPlotPoint {
  @ApiProperty({ type: 'string', nullable: true, required: true })
  description!: Public.ApiPlotPoint['description'];
  @ApiProperty({
    type: 'array',
    maxItems: 1000,
    items: {
      type: 'object',
      properties: {
        associationId: { type: 'string' },
        scene: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            chapter: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                book: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                  },
                  required: ['id', 'title'],
                  additionalProperties: false,
                },
              },
              required: ['id', 'title', 'book'],
              additionalProperties: false,
            },
          },
          required: ['id', 'title', 'chapter'],
          additionalProperties: false,
        },
      },
      required: ['associationId', 'scene'],
      additionalProperties: false,
    },
    required: true,
  })
  scenes!: Public.ApiPlotPoint['scenes'];
  @ApiProperty({
    type: 'array',
    maxItems: 1000,
    items: {
      type: 'object',
      properties: {
        associationId: { type: 'string' },
        event: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            timelineId: { type: 'string' },
            start: {
              type: 'string',
              description:
                'Exact fictional chronology decimal string, not a timestamp.',
            },
            end: {
              type: 'string',
              description:
                'Exact fictional chronology decimal string, not a timestamp.',
              nullable: true,
            },
            dateLabel: { type: 'string', nullable: true },
          },
          required: ['id', 'title', 'timelineId', 'start', 'end', 'dateLabel'],
          additionalProperties: false,
        },
      },
      required: ['associationId', 'event'],
      additionalProperties: false,
    },
    required: true,
  })
  events!: Public.ApiPlotPoint['events'];
  @ApiProperty({
    type: 'array',
    maxItems: 1000,
    items: {
      type: 'object',
      properties: {
        associationId: { type: 'string' },
        entity: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            kind: {
              type: 'string',
              enum: ['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'],
            },
            name: { type: 'string' },
          },
          required: ['id', 'kind', 'name'],
          additionalProperties: false,
        },
        role: { type: 'string', nullable: true },
      },
      required: ['associationId', 'entity', 'role'],
      additionalProperties: false,
    },
    required: true,
  })
  entities!: Public.ApiPlotPoint['entities'];
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiPlotPoint['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiPlotPoint['projectId'];
  @ApiProperty({ type: 'string', required: true })
  plotId!: Public.ApiPlotPoint['plotId'];
  @ApiProperty({ type: 'string', required: true })
  title!: Public.ApiPlotPoint['title'];
  @ApiProperty({ type: 'integer', required: true })
  position!: Public.ApiPlotPoint['position'];
  @ApiProperty({
    type: 'string',
    enum: ['PLANNED', 'IN_PROGRESS', 'RESOLVED'],
    required: true,
  })
  status!: Public.ApiPlotPoint['status'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiPlotPoint['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiPlotPoint['updatedAt'];
}

export class ApiPlotPointSceneDto implements Public.ApiPlotPointScene {
  @ApiProperty({ type: 'string', required: true })
  associationId!: Public.ApiPlotPointScene['associationId'];
  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      chapter: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          book: {
            type: 'object',
            properties: { id: { type: 'string' }, title: { type: 'string' } },
            required: ['id', 'title'],
            additionalProperties: false,
          },
        },
        required: ['id', 'title', 'book'],
        additionalProperties: false,
      },
    },
    required: ['id', 'title', 'chapter'],
    additionalProperties: false,
  })
  scene!: Public.ApiPlotPointScene['scene'];
}

export class ApiPlotPointEventDto implements Public.ApiPlotPointEvent {
  @ApiProperty({ type: 'string', required: true })
  associationId!: Public.ApiPlotPointEvent['associationId'];
  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      timelineId: { type: 'string' },
      start: {
        type: 'string',
        description:
          'Exact fictional chronology decimal string, not a timestamp.',
      },
      end: {
        type: 'string',
        description:
          'Exact fictional chronology decimal string, not a timestamp.',
        nullable: true,
      },
      dateLabel: { type: 'string', nullable: true },
    },
    required: ['id', 'title', 'timelineId', 'start', 'end', 'dateLabel'],
    additionalProperties: false,
  })
  event!: Public.ApiPlotPointEvent['event'];
}

export class ApiPlotPointEntityDto implements Public.ApiPlotPointEntity {
  @ApiProperty({ type: 'string', required: true })
  associationId!: Public.ApiPlotPointEntity['associationId'];
  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string' },
      kind: {
        type: 'string',
        enum: ['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT'],
      },
      name: { type: 'string' },
    },
    required: ['id', 'kind', 'name'],
    additionalProperties: false,
  })
  entity!: Public.ApiPlotPointEntity['entity'];
  @ApiProperty({ type: 'string', nullable: true, required: true })
  role!: Public.ApiPlotPointEntity['role'];
}

export class ApiNoteDto implements Public.ApiNote {
  @ApiProperty({ type: 'string', required: true })
  content!: Public.ApiNote['content'];
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiNote['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiNote['projectId'];
  @ApiProperty({ type: 'string', required: true })
  title!: Public.ApiNote['title'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiNote['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiNote['updatedAt'];
}

export class ApiNoteSummaryDto implements Public.ApiNoteSummary {
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiNoteSummary['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiNoteSummary['projectId'];
  @ApiProperty({ type: 'string', required: true })
  title!: Public.ApiNoteSummary['title'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiNoteSummary['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiNoteSummary['updatedAt'];
}

export class ApiTagDto implements Public.ApiTag {
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiTag['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiTag['projectId'];
  @ApiProperty({ type: 'string', required: true })
  name!: Public.ApiTag['name'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiTag['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiTag['updatedAt'];
}

export class ApiTagAssignmentDto implements Public.ApiTagAssignment {
  @ApiProperty({ type: 'string', required: true })
  assignmentId!: Public.ApiTagAssignment['assignmentId'];
  @ApiProperty({
    type: 'object',
    properties: { id: { type: 'string' }, name: { type: 'string' } },
    required: ['id', 'name'],
    additionalProperties: false,
  })
  tag!: Public.ApiTagAssignment['tag'];
  @ApiProperty({
    type: 'object',
    properties: {
      kind: {
        type: 'string',
        enum: [
          'CHARACTER',
          'PLACE',
          'FACTION',
          'ARTIFACT',
          'NOTE',
          'SCENE',
          'TIMELINE_EVENT',
          'PLOT_POINT',
        ],
      },
      id: { type: 'string' },
      label: { type: 'string' },
    },
    required: ['kind', 'id', 'label'],
    additionalProperties: false,
  })
  resource!: Public.ApiTagAssignment['resource'];
}

export class ApiMediaDto implements Public.ApiMedia {
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiMedia['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiMedia['projectId'];
  @ApiProperty({ type: 'string', required: true })
  originalFilename!: Public.ApiMedia['originalFilename'];
  @ApiProperty({ type: 'string', required: true })
  mimeType!: Public.ApiMedia['mimeType'];
  @ApiProperty({ type: 'integer', required: true })
  sizeBytes!: Public.ApiMedia['sizeBytes'];
  @ApiProperty({ type: 'string', required: true })
  sha256!: Public.ApiMedia['sha256'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiMedia['createdAt'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiMedia['updatedAt'];
}

export class ApiMediaAttachmentDto implements Public.ApiMediaAttachment {
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiMediaAttachment['id'];
  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string' },
      projectId: { type: 'string' },
      originalFilename: { type: 'string' },
      mimeType: { type: 'string' },
      sizeBytes: { type: 'integer' },
      sha256: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    required: [
      'id',
      'projectId',
      'originalFilename',
      'mimeType',
      'sizeBytes',
      'sha256',
      'createdAt',
      'updatedAt',
    ],
    additionalProperties: false,
  })
  media!: Public.ApiMediaAttachment['media'];
  @ApiProperty({
    type: 'object',
    properties: {
      kind: {
        type: 'string',
        enum: ['CHARACTER', 'PLACE', 'FACTION', 'ARTIFACT', 'NOTE', 'PROJECT'],
      },
      id: { type: 'string' },
    },
    required: ['kind', 'id'],
    additionalProperties: false,
  })
  resource!: Public.ApiMediaAttachment['resource'];
  @ApiProperty({ type: 'string', required: true })
  role!: Public.ApiMediaAttachment['role'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.ApiMediaAttachment['createdAt'];
}

export class ApiSearchResultDto implements Public.ApiSearchResult {
  @ApiProperty({
    type: 'string',
    enum: [
      'CHARACTER',
      'PLACE',
      'FACTION',
      'ARTIFACT',
      'NOTE',
      'SCENE',
      'TIMELINE_EVENT',
      'PLOT_POINT',
      'PROJECT',
      'BOOK',
      'CHAPTER',
      'PLOT',
    ],
    required: true,
  })
  kind!: Public.ApiSearchResult['kind'];
  @ApiProperty({ type: 'string', required: true })
  id!: Public.ApiSearchResult['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.ApiSearchResult['projectId'];
  @ApiProperty({ type: 'string', required: true })
  title!: Public.ApiSearchResult['title'];
  @ApiProperty({ type: 'string', required: true })
  snippet!: Public.ApiSearchResult['snippet'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  updatedAt!: Public.ApiSearchResult['updatedAt'];
}

export class AiGenerationSummaryDto implements Public.AiGenerationSummary {
  @ApiProperty({ type: 'string', format: 'uuid', required: true })
  id!: Public.AiGenerationSummary['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.AiGenerationSummary['projectId'];
  @ApiProperty({
    type: 'string',
    enum: ['BRAINSTORM', 'SUMMARIZE', 'REWRITE'],
    required: true,
  })
  task!: Public.AiGenerationSummary['task'];
  @ApiProperty({
    type: 'string',
    enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'],
    required: true,
  })
  status!: Public.AiGenerationSummary['status'];
  @ApiProperty({ type: 'string', required: true })
  provider!: Public.AiGenerationSummary['provider'];
  @ApiProperty({ type: 'string', required: true })
  model!: Public.AiGenerationSummary['model'];
  @ApiProperty({ type: 'string', required: true })
  promptVersion!: Public.AiGenerationSummary['promptVersion'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.AiGenerationSummary['createdAt'];
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    nullable: true,
    required: true,
  })
  startedAt!: Public.AiGenerationSummary['startedAt'];
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    nullable: true,
    required: true,
  })
  completedAt!: Public.AiGenerationSummary['completedAt'];
}

export class AiGenerationDetailDto implements Public.AiGenerationDetail {
  @ApiProperty({
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['text'] },
      text: { type: 'string', maxLength: 12000 },
      proposal: { type: 'boolean', enum: [true] },
      contextTruncated: { type: 'boolean' },
    },
    required: ['type', 'text', 'proposal', 'contextTruncated'],
    additionalProperties: false,
    nullable: true,
  })
  result!: Public.AiGenerationDetail['result'];
  @ApiProperty({
    type: 'object',
    properties: {
      inputTokens: { type: 'integer', nullable: true },
      outputTokens: { type: 'integer', nullable: true },
      estimatedCost: { type: 'string', nullable: true, enum: [null] },
    },
    required: ['inputTokens', 'outputTokens', 'estimatedCost'],
    additionalProperties: false,
  })
  usage!: Public.AiGenerationDetail['usage'];
  @ApiProperty({
    type: 'object',
    properties: { code: { type: 'string' }, message: { type: 'string' } },
    required: ['code', 'message'],
    additionalProperties: false,
    nullable: true,
  })
  error!: Public.AiGenerationDetail['error'];
  @ApiProperty({ type: 'string', format: 'uuid', required: true })
  id!: Public.AiGenerationDetail['id'];
  @ApiProperty({ type: 'string', required: true })
  projectId!: Public.AiGenerationDetail['projectId'];
  @ApiProperty({
    type: 'string',
    enum: ['BRAINSTORM', 'SUMMARIZE', 'REWRITE'],
    required: true,
  })
  task!: Public.AiGenerationDetail['task'];
  @ApiProperty({
    type: 'string',
    enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'],
    required: true,
  })
  status!: Public.AiGenerationDetail['status'];
  @ApiProperty({ type: 'string', required: true })
  provider!: Public.AiGenerationDetail['provider'];
  @ApiProperty({ type: 'string', required: true })
  model!: Public.AiGenerationDetail['model'];
  @ApiProperty({ type: 'string', required: true })
  promptVersion!: Public.AiGenerationDetail['promptVersion'];
  @ApiProperty({ type: 'string', format: 'date-time', required: true })
  createdAt!: Public.AiGenerationDetail['createdAt'];
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    nullable: true,
    required: true,
  })
  startedAt!: Public.AiGenerationDetail['startedAt'];
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    nullable: true,
    required: true,
  })
  completedAt!: Public.AiGenerationDetail['completedAt'];
}

export class ApiErrorDto implements Public.ApiError {
  @ApiProperty({ type: 'integer', required: true })
  statusCode!: Public.ApiError['statusCode'];
  @ApiProperty({
    type: 'string',
    enum: [
      'VALIDATION_ERROR',
      'BAD_REQUEST',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'CONFLICT',
      'PAYLOAD_TOO_LARGE',
      'UNSUPPORTED_MEDIA_TYPE',
      'RATE_LIMITED',
      'SERVICE_UNAVAILABLE',
      'INTERNAL_ERROR',
    ],
    required: true,
  })
  code!: Public.ApiError['code'];
  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    required: true,
  })
  message!: Public.ApiError['message'];
  @ApiProperty({ type: 'string', required: true })
  error!: Public.ApiError['error'];
  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        field: { type: 'string' },
        messages: { type: 'array', items: { type: 'string' } },
      },
      required: ['field', 'messages'],
      additionalProperties: false,
    },
    required: false,
  })
  details?: Public.ApiError['details'];
}

export class ApiValidationDetailDto implements Public.ApiValidationDetail {
  @ApiProperty({ type: 'string', required: true })
  field!: Public.ApiValidationDetail['field'];
  @ApiProperty({ type: 'array', items: { type: 'string' }, required: true })
  messages!: Public.ApiValidationDetail['messages'];
}

export class ApiHealthDto implements Public.ApiHealth {
  @ApiProperty({ type: 'string', enum: ['ok'], required: true })
  status!: Public.ApiHealth['status'];
  @ApiProperty({ type: 'string', enum: ['rawan-api'], required: true })
  service!: Public.ApiHealth['service'];
}

export class ApiQueueReadinessDto implements Public.ApiQueueReadiness {
  @ApiProperty({ type: 'boolean' }) enabled!: boolean;
  @ApiProperty({ type: 'string', enum: ['ready', 'disabled'], required: true })
  status!: Public.ApiQueueReadiness['status'];
}
