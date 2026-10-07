# Public v1 route audit

All routes use the existing application prefix. Request/query DTOs are the validation source of truth. Private resources use ownership-scoped 404; nested references cannot cross projects. Delete responses have no body. There is no Author CRUD or public generic job polling API.

| Domain        | Method / path                                                                        | Access      | Body DTO                 | Query DTO             | Successful response            |
| ------------- | ------------------------------------------------------------------------------------ | ----------- | ------------------------ | --------------------- | ------------------------------ |
| AI            | POST /api/v1/projects/:projectId/ai/generations                                      | JWT + owner | CreateAiDto              | -                     | 202: AiGenerationSummary       |
| AI            | GET /api/v1/projects/:projectId/ai/generations                                       | JWT + owner | -                        | AiListDto             | 200: page AiGenerationSummary  |
| AI            | GET /api/v1/ai/generations/:id                                                       | JWT + owner | -                        | -                     | 200: AiGenerationDetail        |
| Health        | GET /api/v1/health                                                                   | Public      | -                        | -                     | 200: ApiHealth                 |
| Auth          | POST /api/v1/auth/register                                                           | Public      | RegisterDto              | -                     | 201: AuthResponse              |
| Auth          | POST /api/v1/auth/login                                                              | Public      | LoginDto                 | -                     | 200: AuthResponse              |
| Auth          | POST /api/v1/auth/google                                                             | Public      | GoogleLoginDto           | -                     | 200: AuthResponse              |
| Jobs          | GET /api/v1/health/queues                                                            | Public      | -                        | -                     | 200: ApiQueueReadiness         |
| Projects      | GET /api/v1/projects                                                                 | JWT + owner | -                        | ProjectQueryDto       | 200: page ApiProject           |
| Projects      | GET /api/v1/projects/:projectId                                                      | JWT + owner | -                        | -                     | 200: ApiProject                |
| Projects      | POST /api/v1/projects                                                                | JWT + owner | CreateProjectDto         | -                     | 201: ApiProject                |
| Projects      | PATCH /api/v1/projects/:projectId                                                    | JWT + owner | UpdateProjectDto         | -                     | 200: ApiProject                |
| Projects      | DELETE /api/v1/projects/:projectId                                                   | JWT + owner | -                        | -                     | 204: empty                     |
| Books         | GET /api/v1/projects/:projectId/books                                                | JWT + owner | -                        | PaginationQueryDto    | 200: array ApiBook             |
| Books         | GET /api/v1/projects/:projectId/books/:bookId                                        | JWT + owner | -                        | -                     | 200: ApiBook                   |
| Books         | POST /api/v1/projects/:projectId/books                                               | JWT + owner | CreateBookDto            | -                     | 201: ApiBook                   |
| Books         | PATCH /api/v1/projects/:projectId/books/:bookId                                      | JWT + owner | UpdateBookDto            | -                     | 200: ApiBook                   |
| Books         | DELETE /api/v1/projects/:projectId/books/:bookId                                     | JWT + owner | -                        | -                     | 204: empty                     |
| Chapters      | GET /api/v1/projects/:projectId/books/:bookId/chapters                               | JWT + owner | -                        | PaginationQueryDto    | 200: array ApiChapter          |
| Chapters      | GET /api/v1/projects/:projectId/books/:bookId/chapters/:chapterId                    | JWT + owner | -                        | -                     | 200: ApiChapter                |
| Chapters      | POST /api/v1/projects/:projectId/books/:bookId/chapters                              | JWT + owner | CreateChapterDto         | -                     | 201: ApiChapter                |
| Chapters      | PATCH /api/v1/projects/:projectId/books/:bookId/chapters/:chapterId                  | JWT + owner | UpdateChapterDto         | -                     | 200: ApiChapter                |
| Chapters      | DELETE /api/v1/projects/:projectId/books/:bookId/chapters/:chapterId                 | JWT + owner | -                        | -                     | 204: empty                     |
| Scenes        | GET /api/v1/projects/:projectId/books/:bookId/chapters/:chapterId/scenes             | JWT + owner | -                        | SceneQueryDto         | 200: page ApiSceneSummary      |
| Scenes        | GET /api/v1/projects/:projectId/books/:bookId/chapters/:chapterId/scenes/:sceneId    | JWT + owner | -                        | -                     | 200: ApiScene                  |
| Scenes        | POST /api/v1/projects/:projectId/books/:bookId/chapters/:chapterId/scenes            | JWT + owner | CreateSceneDto           | -                     | 201: ApiScene                  |
| Scenes        | PATCH /api/v1/projects/:projectId/books/:bookId/chapters/:chapterId/scenes/:sceneId  | JWT + owner | UpdateSceneDto           | -                     | 200: ApiScene                  |
| Scenes        | DELETE /api/v1/projects/:projectId/books/:bookId/chapters/:chapterId/scenes/:sceneId | JWT + owner | -                        | -                     | 204: empty                     |
| Media         | POST /api/v1/projects/:projectId/media                                               | JWT + owner | -                        | -                     | 201: ApiMedia                  |
| Media         | GET /api/v1/projects/:projectId/media                                                | JWT + owner | -                        | MediaQueryDto         | 200: page ApiMedia             |
| Media         | GET /api/v1/media/:id                                                                | JWT + owner | -                        | -                     | 200: ApiMedia                  |
| Media         | GET /api/v1/media/:id/content                                                        | JWT + owner | -                        | -                     | 200: binary                    |
| Media         | DELETE /api/v1/media/:id                                                             | JWT + owner | -                        | -                     | 204: empty                     |
| Media         | POST /api/v1/media/:id/attachments                                                   | JWT + owner | AttachMediaDto           | -                     | 201: ApiMediaAttachment        |
| Media         | GET /api/v1/media/:id/attachments                                                    | JWT + owner | -                        | PaginationQueryDto    | 200: page ApiMediaAttachment   |
| Media         | DELETE /api/v1/media/:mediaId/attachments/:id                                        | JWT + owner | -                        | -                     | 204: empty                     |
| Media         | GET /api/v1/projects/:projectId/media-attachments                                    | JWT + owner | -                        | MediaResourceQueryDto | 200: page ApiMediaAttachment   |
| Notes         | GET /api/v1/projects/:projectId/notes                                                | JWT + owner | -                        | NoteQueryDto          | 200: page ApiNoteSummary       |
| Notes         | POST /api/v1/projects/:projectId/notes                                               | JWT + owner | CreateNoteDto            | -                     | 201: ApiNote                   |
| Notes         | GET /api/v1/notes/:id                                                                | JWT + owner | -                        | -                     | 200: ApiNote                   |
| Notes         | PATCH /api/v1/notes/:id                                                              | JWT + owner | UpdateNoteDto            | -                     | 200: ApiNote                   |
| Notes         | DELETE /api/v1/notes/:id                                                             | JWT + owner | -                        | -                     | 204: empty                     |
| Tags          | GET /api/v1/projects/:projectId/tags                                                 | JWT + owner | -                        | TagQueryDto           | 200: page ApiTag               |
| Tags          | POST /api/v1/projects/:projectId/tags                                                | JWT + owner | CreateTagDto             | -                     | 201: ApiTag                    |
| Tags          | GET /api/v1/tags/:id                                                                 | JWT + owner | -                        | -                     | 200: ApiTag                    |
| Tags          | PATCH /api/v1/tags/:id                                                               | JWT + owner | UpdateTagDto             | -                     | 200: ApiTag                    |
| Tags          | DELETE /api/v1/tags/:id                                                              | JWT + owner | -                        | -                     | 204: empty                     |
| Tags          | POST /api/v1/tags/:tagId/assignments                                                 | JWT + owner | AssignTagDto             | -                     | 201: ApiTagAssignment          |
| Tags          | GET /api/v1/tags/:tagId/assignments                                                  | JWT + owner | -                        | TagAssignmentQueryDto | 200: page ApiTagAssignment     |
| Tags          | DELETE /api/v1/tags/:tagId/assignments/:id                                           | JWT + owner | -                        | -                     | 204: empty                     |
| Tags          | GET /api/v1/projects/:projectId/resource-tags                                        | JWT + owner | -                        | ResourceTagsQueryDto  | 200: page ApiTagAssignment     |
| Plots         | GET /api/v1/plots/:parentId/points                                                   | JWT + owner | -                        | PlotPointQueryDto     | 200: page ApiPlotPointSummary  |
| Plots         | POST /api/v1/plots/:parentId/points                                                  | JWT + owner | CreatePlotPointDto       | -                     | 201: ApiPlotPoint              |
| Plots         | GET /api/v1/plot-points/:id                                                          | JWT + owner | -                        | -                     | 200: ApiPlotPoint              |
| Plots         | PATCH /api/v1/plot-points/:id                                                        | JWT + owner | UpdatePlotPointDto       | -                     | 200: ApiPlotPoint              |
| Plots         | DELETE /api/v1/plot-points/:id                                                       | JWT + owner | -                        | -                     | 204: empty                     |
| Plots         | PATCH /api/v1/plots/:plotId/points/reorder                                           | JWT + owner | ReorderPlotPointsDto     | -                     | 200: array ApiPlotPointSummary |
| Plots         | POST /api/v1/plot-points/:pointId/scenes                                             | JWT + owner | AttachPlotPointSceneDto  | -                     | 201: ApiPlotPointScene         |
| Plots         | DELETE /api/v1/plot-points/:pointId/scenes/:id                                       | JWT + owner | -                        | -                     | 204: empty                     |
| Plots         | POST /api/v1/plot-points/:pointId/events                                             | JWT + owner | AttachPlotPointEventDto  | -                     | 201: ApiPlotPointEvent         |
| Plots         | DELETE /api/v1/plot-points/:pointId/events/:id                                       | JWT + owner | -                        | -                     | 204: empty                     |
| Plots         | POST /api/v1/plot-points/:pointId/entities                                           | JWT + owner | AttachPlotPointEntityDto | -                     | 201: ApiPlotPointEntity        |
| Plots         | DELETE /api/v1/plot-points/:pointId/entities/:id                                     | JWT + owner | -                        | -                     | 204: empty                     |
| Plots         | GET /api/v1/projects/:parentId/plots                                                 | JWT + owner | -                        | PlotPageQueryDto      | 200: page ApiPlotSummary       |
| Plots         | POST /api/v1/projects/:parentId/plots                                                | JWT + owner | CreatePlotDto            | -                     | 201: ApiPlot                   |
| Plots         | GET /api/v1/plots/:id                                                                | JWT + owner | -                        | -                     | 200: ApiPlot                   |
| Plots         | PATCH /api/v1/plots/:id                                                              | JWT + owner | UpdatePlotDto            | -                     | 200: ApiPlot                   |
| Plots         | DELETE /api/v1/plots/:id                                                             | JWT + owner | -                        | -                     | 204: empty                     |
| Relationships | GET /api/v1/projects/:projectId/relationships                                        | JWT + owner | -                        | RelationshipQueryDto  | 200: page ApiRelationship      |
| Relationships | POST /api/v1/projects/:projectId/relationships                                       | JWT + owner | CreateRelationshipDto    | -                     | 201: ApiRelationship           |
| Relationships | GET /api/v1/relationships/:id                                                        | JWT + owner | -                        | -                     | 200: ApiRelationship           |
| Relationships | PATCH /api/v1/relationships/:id                                                      | JWT + owner | UpdateRelationshipDto    | -                     | 200: ApiRelationship           |
| Relationships | DELETE /api/v1/relationships/:id                                                     | JWT + owner | -                        | -                     | 204: empty                     |
| Search        | GET /api/v1/projects/:projectId/search                                               | JWT + owner | -                        | SearchQueryDto        | 200: page ApiSearchResult      |
| Timelines     | GET /api/v1/timelines/:timelineId/eras                                               | JWT + owner | -                        | PaginationQueryDto    | 200: array ApiEra              |
| Timelines     | POST /api/v1/timelines/:timelineId/eras                                              | JWT + owner | CreateEraDto             | -                     | 201: ApiEra                    |
| Timelines     | GET /api/v1/eras/:id                                                                 | JWT + owner | -                        | -                     | 200: ApiEra                    |
| Timelines     | PATCH /api/v1/eras/:id                                                               | JWT + owner | UpdateEraDto             | -                     | 200: ApiEra                    |
| Timelines     | DELETE /api/v1/eras/:id                                                              | JWT + owner | -                        | -                     | 204: empty                     |
| Timelines     | GET /api/v1/timelines/:timelineId/events                                             | JWT + owner | -                        | EventQueryDto         | 200: page ApiEventSummary      |
| Timelines     | POST /api/v1/timelines/:timelineId/events                                            | JWT + owner | CreateEventDto           | -                     | 201: ApiTimelineEvent          |
| Timelines     | GET /api/v1/events/:id                                                               | JWT + owner | -                        | -                     | 200: ApiTimelineEvent          |
| Timelines     | PATCH /api/v1/events/:id                                                             | JWT + owner | UpdateEventDto           | -                     | 200: ApiTimelineEvent          |
| Timelines     | DELETE /api/v1/events/:id                                                            | JWT + owner | -                        | -                     | 204: empty                     |
| Timelines     | POST /api/v1/events/:id/entities                                                     | JWT + owner | AttachEventEntityDto     | -                     | 201: ApiEventEntity            |
| Timelines     | DELETE /api/v1/events/:eventId/entities/:id                                          | JWT + owner | -                        | -                     | 204: empty                     |
| Timelines     | GET /api/v1/projects/:projectId/timelines                                            | JWT + owner | -                        | PaginationQueryDto    | 200: array ApiTimeline         |
| Timelines     | POST /api/v1/projects/:projectId/timelines                                           | JWT + owner | CreateTimelineDto        | -                     | 201: ApiTimeline               |
| Timelines     | GET /api/v1/timelines/:id                                                            | JWT + owner | -                        | -                     | 200: ApiTimeline               |
| Timelines     | PATCH /api/v1/timelines/:id                                                          | JWT + owner | UpdateTimelineDto        | -                     | 200: ApiTimeline               |
| Timelines     | DELETE /api/v1/timelines/:id                                                         | JWT + owner | -                        | -                     | 204: empty                     |
| Users         | GET /api/v1/users                                                                    | JWT + ADMIN | -                        | PaginationQueryDto    | 200: array ApiUser             |
| Users         | GET /api/v1/users/me                                                                 | JWT + owner | -                        | -                     | 200: ApiUser                   |
| Users         | GET /api/v1/users/me/onboarding                                                      | JWT + self  | -                        | -                     | 200: OnboardingResponseDto     |
| Users         | PATCH /api/v1/users/me/onboarding                                                    | JWT + self  | UpdateOnboardingDto      | -                     | 200: OnboardingResponseDto     |
| Users         | GET /api/v1/users/:id                                                                | JWT + ADMIN | -                        | -                     | 200: ApiUser                   |
| Worldbuilding | GET /api/v1/projects/:projectId/artifacts                                            | JWT + owner | -                        | WorldQueryDto         | 200: page ApiArtifact          |
| Worldbuilding | POST /api/v1/projects/:projectId/artifacts                                           | JWT + owner | CreateArtifactDto        | -                     | 201: ApiArtifact               |
| Worldbuilding | GET /api/v1/artifacts/:id                                                            | JWT + owner | -                        | -                     | 200: ApiArtifact               |
| Worldbuilding | PATCH /api/v1/artifacts/:id                                                          | JWT + owner | UpdateArtifactDto        | -                     | 200: ApiArtifact               |
| Worldbuilding | DELETE /api/v1/artifacts/:id                                                         | JWT + owner | -                        | -                     | 204: empty                     |
| Worldbuilding | GET /api/v1/projects/:projectId/characters                                           | JWT + owner | -                        | WorldQueryDto         | 200: page ApiCharacter         |
| Worldbuilding | POST /api/v1/projects/:projectId/characters                                          | JWT + owner | CreateCharacterDto       | -                     | 201: ApiCharacter              |
| Worldbuilding | GET /api/v1/characters/:id                                                           | JWT + owner | -                        | -                     | 200: ApiCharacter              |
| Worldbuilding | PATCH /api/v1/characters/:id                                                         | JWT + owner | UpdateCharacterDto       | -                     | 200: ApiCharacter              |
| Worldbuilding | DELETE /api/v1/characters/:id                                                        | JWT + owner | -                        | -                     | 204: empty                     |
| Worldbuilding | GET /api/v1/projects/:projectId/factions                                             | JWT + owner | -                        | WorldQueryDto         | 200: page ApiFaction           |
| Worldbuilding | POST /api/v1/projects/:projectId/factions                                            | JWT + owner | CreateFactionDto         | -                     | 201: ApiFaction                |
| Worldbuilding | GET /api/v1/factions/:id                                                             | JWT + owner | -                        | -                     | 200: ApiFaction                |
| Worldbuilding | PATCH /api/v1/factions/:id                                                           | JWT + owner | UpdateFactionDto         | -                     | 200: ApiFaction                |
| Worldbuilding | DELETE /api/v1/factions/:id                                                          | JWT + owner | -                        | -                     | 204: empty                     |
| Worldbuilding | GET /api/v1/projects/:projectId/places                                               | JWT + owner | -                        | WorldQueryDto         | 200: page ApiPlace             |
| Worldbuilding | POST /api/v1/projects/:projectId/places                                              | JWT + owner | CreatePlaceDto           | -                     | 201: ApiPlace                  |
| Worldbuilding | GET /api/v1/places/:id                                                               | JWT + owner | -                        | -                     | 200: ApiPlace                  |
| Worldbuilding | PATCH /api/v1/places/:id                                                             | JWT + owner | UpdatePlaceDto           | -                     | 200: ApiPlace                  |
| Worldbuilding | DELETE /api/v1/places/:id                                                            | JWT + owner | -                        | -                     | 204: empty                     |
