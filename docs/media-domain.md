# Part 10 — Media and file storage

Part 11 now adds scheduled stale cleanup through Redis/BullMQ. See [background jobs](background-jobs.md) for the current worker lifecycle; verification results below record Part 10.

Implemented and locally verified on 2026-10-05. Routes use `/api/v1` and require a Bearer JWT. PostgreSQL holds metadata and attachment identities; the storage provider holds file bytes.

## 1. Plan executed

Completed the requested phases in order:

0. Inspected the actual monorepo, ownership helpers, query infrastructure, schema, migrations, project deletion, tests, and empty frontend directories.
1. Analyzed upload safety, private downloads, attachment identity, storage independence, and failure compensation.
2. Planned a project-owned Media model, six typed attachment targets, streaming local storage, multipart staging, and durable cleanup.
3. Added models, composite foreign keys, checks, indexes, and an additive migration. Validated/generated Prisma and applied migrations in an isolated schema.
4. Implemented the provider interface and local adapter; checked paths, exclusive creation, streaming, and partial-write cleanup.
5. Implemented authenticated multipart uploads, metadata queries, and private streaming downloads. Tested the compiled API against PostgreSQL and real files.
6. Added generic attachment routes with explicit target validation and project isolation.
7. Added content/storage/security unit tests and real PostgreSQL/HTTP lifecycle tests. Updated existing test doubles for the new cleanup dependency.
8. Reviewed all fifteen requested security questions below and fixed the download stream error handler to avoid filesystem disclosure.
9. Ran root checks, HTTP tests, all eight database domain suites, Prisma migration verification, frozen installation, formatting, and test safety guards.
10. Recorded the API, setup, verified results, and operational limitations here. Frontend directories remain empty except `.gitkeep`.

## 2. Media architecture

`Media` represents one immutable stored object owned through Project → Author → User. It contains a generated ID, project ID, uploader identity for cleanup, provider/key, sanitized display filename, MIME type, measured byte count, SHA-256, and timestamps. API responses expose only ID, projectId, originalFilename, mimeType, sizeBytes, sha256, createdAt, and updatedAt.

Upload lifecycle: authorize the project before parsing → stage one bounded multipart file in a temporary directory → persist a cleanup intent → lock the owned project → validate and stream bytes into storage → create metadata and remove the intent in one transaction → remove staging files. Finalization has a 30-second database transaction timeout; local storage writes have a 25-second pipeline timeout. The project row lock starts after the network upload and prevents project deletion from racing storage finalization.

Files can exist without attachments. Removing their final attachment does not remove the Media object. No public URLs, base64 data columns, static media directories, or avatar URL fields were added.

## 3. Storage architecture

`StorageProvider` exposes an identifier plus `put(key, Readable)`, `read(key)` returning stream/byte count, and idempotent `delete(key)`. The implemented provider is `LocalStorageProvider`, injected through `STORAGE_PROVIDER`. Controllers and attachment services do not implement filesystem storage.

Local objects use UUID v4 keys without extensions. The adapter checks every key, resolves the configured root, rejects root/object symlinks, creates files exclusively with `wx`, streams with backpressure, closes handles, and removes partial writes. Root/file Unix modes request 0700/0600; Windows deployments must provision appropriate filesystem ACLs. The storage root and its ancestors must be controlled by the operator rather than untrusted local processes.

Default objects are in ignored `apps/api/.data/media`. This directory is not served publicly. Use a durable external directory or mounted volume in production and back it up with database metadata.

## 4. Database

Added `Media`, `MediaAttachment`, `MediaCleanup`, and the six-value `MediaResourceKind` enum. Media belongs to Project; attachments reference Media and Project plus their applicable Note/Character/Place/Faction/Artifact. PROJECT targets use projectId directly. Composite `(projectId, id)` foreign keys enforce same-project references, with cascades on resource, Media, and Project deletion.

Database checks enforce allowed MIME types, positive size capped at 100 MiB, safe bounded filenames, hexadecimal SHA-256, UUID v4 storage keys, slug roles, and exactly the target field corresponding to resourceKind. An expression unique index prevents attaching the same Media to the same resource twice, even with a different role.

Indexes cover project/creation-time Media pages, Media attachments, project/kind attachments, all five concrete target IDs, and owner/project cleanup batches. Media storage keys and cleanup storage keys are unique. MediaCleanup intentionally has no cascading foreign key: it must survive deletion of the owning hierarchy. A BEFORE DELETE Media trigger enqueues cleanup records, including during direct SQL and User/Author/Project cascades.

Migration: `20261005060000_media`. Historical migrations were preserved.

## 5. Upload security and review

Allowed types: JPEG, PNG, WebP, PDF, and UTF-8 plain text. HTML, SVG, executables, archives, video, audio, and other MIME types are rejected. The parser accepts exactly one `file`, zero ordinary fields, one part, and bounded headers/names. Both multipart parsing and streamed byte accounting enforce the configured size. Empty files fail validation; two uploads with the same display name receive independent keys.

Display filenames strip path prefixes, control/format characters, lone surrogates, and leading/trailing dots/spaces, normalize Unicode, and truncate to 180 code points. Client filenames never determine physical paths. SHA-256 covers the actual stored bytes. Signature detection inspects at most 4,100 initial bytes with a one-second detector timeout. UTF-8 text is validated throughout the stream. Signature checks are best effort, not full image/PDF structural validation or malware scanning.

| Security question                            | Reviewed result                                                                                                                                                       |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Can filenames escape storage?             | No filename is used as a path; the provider accepts only UUID v4 keys. Traversal cases tested.                                                                        |
| 2. Can users choose keys?                    | Keys/provider/uploader are server-generated. Multipart metadata fields and unknown DTO properties are rejected.                                                       |
| 3. Can Author A read B's files?              | Every Media lookup includes live owner scope; metadata/content/list authorization tested.                                                                             |
| 4. Can projects cross-reference files?       | Target resolution plus composite foreign keys reject even same-author cross-project attachment.                                                                       |
| 5. Can disallowed files upload?              | MIME allowlist and signature agreement enforced. Text validation and attachment download headers provide additional protection; malware scanning remains future work. |
| 6. Can huge files bypass limits?             | Multipart and independent streaming limits; exact boundary and oversized HTTP cases tested.                                                                           |
| 7. Is the entire file buffered?              | Multipart stages on disk; validation buffers an initial chunk/prefix, then storage and downloads stream with backpressure.                                            |
| 8. Can filesystem paths leak?                | Explicit public DTOs, generic storage errors, and a safe stream error handler hide paths.                                                                             |
| 9. Can filenames inject headers?             | Safe ASCII fallback plus encoded RFC 5987 filename; CR/LF injection tested.                                                                                           |
| 10. Can DB deletion leave objects?           | API deletion drains durable intents synchronously; storage failures return 503. Raw SQL/process crashes leave tracked work for operator reconciliation.               |
| 11. Can failed DB writes leave objects?      | Upload intents survive rollback; compensation deletes objects. Failed compensation retains the intent for reconciliation, tested with actual stored bytes.            |
| 12. Can resource deletion leave attachments? | Foreign-key cascades remove attachments for all five concrete targets. Media remains until explicit Media/project deletion.                                           |
| 13. Are lists bounded?                       | Shared default limit 50, maximum 100, bounded offset, stable sorts, and nextOffset contract.                                                                          |
| 14. Is configuration validated?              | Only local driver, dedicated non-root path, explicit absolute production path, integer size 1–104857600. Invalid configurations tested.                               |
| 15. Are storage errors safe?                 | Missing content returns 404; operational/storage failures return generic 503. Cleanup failure remains visible and retryable.                                          |

Downloads require owner authorization, use `Content-Disposition: attachment`, correct MIME/length, `Cache-Control: private, no-store`, and existing Helmet `nosniff`. No anonymous serving or signed URLs.

## 6. API

| Method | Route                                    | Behavior                                                              |
| ------ | ---------------------------------------- | --------------------------------------------------------------------- |
| POST   | `/projects/:projectId/media`             | Multipart `file`; returns public Media, 201.                          |
| GET    | `/projects/:projectId/media`             | Paged public Media summaries.                                         |
| GET    | `/media/:id`                             | Public metadata for the owner.                                        |
| GET    | `/media/:id/content`                     | Authenticated attachment download stream.                             |
| DELETE | `/media/:id`                             | Deletes metadata/attachments and object, 204; cleanup failure is 503. |
| POST   | `/media/:id/attachments`                 | Attach to a validated resource, 201.                                  |
| GET    | `/media/:id/attachments`                 | Paged attachments for one file.                                       |
| DELETE | `/media/:mediaId/attachments/:id`        | Remove only that attachment, 204.                                     |
| GET    | `/projects/:projectId/media-attachments` | Paged attachments for required resourceKind/resourceId.               |

Media list supports `limit`, `offset`, `q` (literal filename substring, 2–200 characters), `mimeType`, `sort=createdAt|originalFilename|sizeBytes`, and `order=asc|desc`. Default sort is createdAt descending with ID tie-breaking. Attachment lists use ID ascending and shared pagination. Page responses are `{ items, nextOffset }`; no total-count query.

Attachment request example:

```json
{
  "resourceKind": "CHARACTER",
  "resourceId": "character-id",
  "role": "portrait"
}
```

Attachment response includes `id`, public `media`, `{ kind, id }` resource, role, and createdAt. Missing authentication is 401; inaccessible resources are 404; invalid input is 400; oversize is 413; duplicate attachment is 409.

## 7. Attachments

Supported kinds: PROJECT, NOTE, CHARACTER, PLACE, FACTION, ARTIFACT. Roles are optional, default `attachment`, with a lowercase slug up to 50 characters; examples include portrait, reference, symbol. There is no rigid role enum or position ordering requirement.

One Media can attach to multiple resources in its project. Detaching or deleting a resource keeps the underlying file. Deleting Media cascades its attachments. Deleting Project cascades metadata and attachments and invokes storage cleanup. Scenes/events/plot points are not attachment targets in this phase.

## 8. Ownership

Existing JWT authentication supplies the user identity. Upload preauthorization runs before multipart staging; services recheck ownership and upload/attach finalization locks the Project row. Lookups, deletes, attachment operations, and lists include ownership scope. Metadata is never accepted as ownership proof. Cross-author requests and same-author cross-project targets are tested. Project ownership transfer is not exposed by the existing API; future transfer support must account for cleanup ownership.

## 9. Failure handling

Storage write or database finalization failure compensates by deleting the generated object and its durable intent. Database rollback leaves the preexisting intent available. Delete triggers guarantee that metadata removal never loses the storage cleanup identity. Missing objects can be deleted idempotently. Download size mismatch is a generic 503; missing object is 404.

Media deletion retry uses the same ID. Project deletion retry uses the same project ID even after its database row has disappeared, provided cleanup work belongs to that user. Each project cleanup call drains at most 100 records and returns 503 if more remain. Client retries are expected to continue draining larger batches.

For crash leftovers, failed upload compensation, or direct SQL/User cascades, an operator runs:

```sh
pnpm --filter @rawan/api media:cleanup --confirm
```

This boots the API context without an HTTP listener and deletes at most 100 pending objects older than one hour. Repeat for full batches. Provider failures keep records and produce a nonzero exit. It is explicit maintenance, not an HTTP admin route, queue, scheduler, or Redis/BullMQ worker. Without `--confirm`, it refuses to delete anything.

Request staging is cleaned on normal completion and parser/handler failure. A process kill can leave an OS temporary `rawan-upload-*` staging directory; operators should remove stale staging directories according to their host's temporary-file policy. Durable intents protect objects in managed storage, not these temporary network-upload buffers.

## 10. Configuration

| Variable               | Default / validation                                                                                                                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MEDIA_STORAGE_DRIVER` | `local`; other values currently fail startup.                                                                                                                                                                                                       |
| `MEDIA_LOCAL_PATH`     | `.data/media`, resolved relative to `apps/api` in source and compiled execution. Dedicated directory required; volume root, API root, source/build/dependency/git directories rejected. Production requires an explicitly configured absolute path. |
| `MEDIA_MAX_FILE_SIZE`  | `10485760` bytes (10 MiB), integer 1–104857600 (100 MiB).                                                                                                                                                                                           |

Existing `.env` credentials were preserved. The example was updated. Database tests additionally require explicit `TEST_DATABASE_URL`, refuse production, create random schemas, and use separate random temporary storage roots with checked cleanup boundaries.

## 11. Tests

- 239 unit tests passed across 14 files. Media-specific coverage: 11 local storage tests, 18 content/name tests, 16 DTO/header/attachment-kind/durable-cleanup tests; environment coverage increased to 26 tests.
- Existing compiled-application HTTP/e2e suite: 146 tests passed across eight files.
- New real Media PostgreSQL/HTTP suite: 108 requests passed, using the compiled application, real multipart requests, Prisma transactions, all ten migrations, and actual temporary files. Covers uploads, exact/oversize limits, missing/empty/multiple files, malformed multipart, disallowed/mismatched MIME, unknown fields, duplicate filenames, SHA-256/public metadata, private download bytes/headers, 401/404, list validation, all six attachments, duplicate conflict, foreign/same-author project isolation, SQL constraint rejections, detach/resource/Media/Project/User cascades, missing content, database/storage failures, failed compensation recovery, delete retry, operator reconciliation, and concurrent upload/project deletion.
- Manuscript, worldbuilding, relationships, timeline, plot, organization, and search PostgreSQL regression suites all passed with the new migration present.
- Production refusal, missing explicit test URL refusal, and cleanup CLI confirmation guard passed.

Run `pnpm --filter @rawan/api test:media:database` with a test PostgreSQL connection permitting CREATE SCHEMA. Tests never use the configured media root or delete real uploaded files.

## 12. Prisma

Format, validate, generate, and database build passed. Prisma CLI deployed all ten migrations into a disposable schema and confirmed up-to-date status; raw PostgreSQL domain suites also applied all migration SQL independently. The new Media migration was then deployed to the existing local database without reset; all ten migrations are up to date.

On another checkout/database: `pnpm db:deploy`, then `pnpm db:generate`. Generation alone does not migrate a database.

## 13. Code quality

Root lint passed with zero errors/warnings; root typecheck, unit tests, build, and HTTP/e2e passed. Frozen-lockfile installation passed. Repository formatting and whitespace checks passed. Frontend directories contain only `.gitkeep`. No tests were disabled, no historical migrations edited, and no commits/pushes made.

## 14. Dependencies

Added direct API runtime dependencies `multer@2.4.0` for bounded multipart disk staging and `file-type@22.1.1` for bounded signature detection. Both versions were already present transitively. Added `@types/multer@^2.3.0` for compile-time upload types. No frontend, cloud SDK, queue, AI, image-processing, or antivirus dependency was installed.

## 15. Future frontend contract

Send one FormData `file` with a Bearer JWT; let the browser generate the multipart Content-Type/boundary. Store the returned Media ID. List project Media using page/filter parameters; fetch `/media/:id/content` with Authorization and save the returned bytes using the metadata filename. An ordinary image URL cannot carry this Bearer token, so a future frontend can fetch authorized bytes and create a temporary object URL. Release that URL when done.

Attach using resourceKind/resourceId and an optional role. List resource attachments using the project attachment endpoint. Detach with the attachment ID; delete a file with the Media ID. Treat 503 cleanup responses as retryable. No frontend implementation was added.

## 16. Future object storage

A future S3/R2/MinIO adapter implements the same streamed put/read/delete contract and replaces the provider registration/configuration. Domain services, attachment validation, controllers, response types, and schema are vendor independent. Keep private buckets and opaque server keys, safe error handling, timeouts, and idempotent cleanup semantics.

The current deployment selects one active provider and rejects stored records belonging to another provider. Moving a deployment requires copying objects and updating provider metadata; serving several historical providers concurrently would require a provider registry/resolver. Signed direct uploads need an explicit intent/finalize validation flow later, rather than trusting client-reported sizes/types. AI-generated outputs can later use ordinary Media records; no AI-specific model exists.

## 17. Remaining issues

No known blocker or failing check remains for this phase. This is a private backend foundation, not a claim of complete production upload hardening. Future work includes malware scanning/quarantine, full image/document validation, per-user quotas, rate/concurrency limits, reverse-proxy upload timeout/body limits, stale staging cleanup, structured operational metrics, and scheduled cleanup once a worker system is deliberately introduced. No automatic background reconciliation is implemented now: operators must run maintenance after crashes/direct SQL deletion/failed compensation.

Local storage needs a persistent volume and appropriate host permissions/backups. Mixed-provider routing, signed direct uploads, range downloads, thumbnails, and attachment ordering remain future additions. SHA-256 is recorded at upload; downloads check size, not a fresh checksum of every byte.

Existing PostgreSQL regression suites emit pg's concurrent-client-query deprecation warning; they pass. That warning predates this phase and does not occur in the new Media suite. No Redis/BullMQ, AI, or frontend work was started.
