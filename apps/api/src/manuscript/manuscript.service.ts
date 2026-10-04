import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@rawan/database';
import type { ApiProject, ApiBook, ApiChapter, ApiScene } from '@rawan/types';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateProjectDto,
  UpdateProjectDto,
  CreateBookDto,
  UpdateBookDto,
  CreateChapterDto,
  UpdateChapterDto,
  CreateSceneDto,
  UpdateSceneDto,
} from './manuscript.dto.js';

export interface ManuscriptIds {
  projectId?: string;
  bookId?: string;
  chapterId?: string;
}

function serialize<T extends { createdAt: Date; updatedAt: Date }>(record: T) {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

@Injectable()
export class ManuscriptService {
  constructor(private readonly prisma: PrismaService) {}

  private async persist<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2025', 'P2003'].includes(error.code)
      ) {
        throw new NotFoundException('Manuscript resource not found');
      }
      throw error;
    }
  }

  async listProjects(
    userId: string,
    _ids: ManuscriptIds,
  ): Promise<ApiProject[]> {
    const records = await this.prisma.project.findMany({
      where: { author: { userId } },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    });
    return records.map(serialize);
  }

  async getProject(
    userId: string,
    _ids: ManuscriptIds,
    id: string,
  ): Promise<ApiProject> {
    const record = await this.prisma.project.findFirst({
      where: {
        id,
        author: { userId },
      },
    });
    if (!record) throw new NotFoundException('Project not found');
    return serialize(record);
  }

  async createProject(
    userId: string,
    _ids: ManuscriptIds,
    dto: CreateProjectDto,
  ): Promise<ApiProject> {
    const author = await this.prisma.author.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!author)
      throw new ForbiddenException(
        'An author profile is required to create projects',
      );
    return this.persist(async () =>
      serialize(
        await this.prisma.project.create({
          data: {
            title: dto.title,
            description: dto.description,
            author: { connect: { id: author.id, userId } },
          },
        }),
      ),
    );
  }

  async updateProject(
    userId: string,
    _ids: ManuscriptIds,
    id: string,
    dto: UpdateProjectDto,
  ): Promise<ApiProject> {
    return this.persist(async () =>
      serialize(
        await this.prisma.project.update({
          where: {
            id,
            author: { userId },
          },
          data: dto,
        }),
      ),
    );
  }

  async deleteProject(
    userId: string,
    _ids: ManuscriptIds,
    id: string,
  ): Promise<void> {
    await this.persist(() =>
      this.prisma.project.delete({
        where: {
          id,
          author: { userId },
        },
      }),
    );
  }

  async listBooks(userId: string, ids: ManuscriptIds): Promise<ApiBook[]> {
    const parent = await this.prisma.project.findFirst({
      where: {
        id: ids.projectId,
        author: { userId },
      },
      select: { id: true },
    });
    if (!parent) throw new NotFoundException('Project not found');
    const records = await this.prisma.book.findMany({
      where: { projectId: ids.projectId, project: { author: { userId } } },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    return records.map(serialize);
  }

  async getBook(
    userId: string,
    ids: ManuscriptIds,
    id: string,
  ): Promise<ApiBook> {
    const record = await this.prisma.book.findFirst({
      where: {
        id,
        projectId: ids.projectId,
        project: { author: { userId } },
      },
    });
    if (!record) throw new NotFoundException('Book not found');
    return serialize(record);
  }

  async createBook(
    userId: string,
    ids: ManuscriptIds,
    dto: CreateBookDto,
  ): Promise<ApiBook> {
    return this.persist(async () =>
      serialize(
        await this.prisma.book.create({
          data: {
            title: dto.title,
            description: dto.description,
            position: dto.position,
            project: {
              connect: {
                id: ids.projectId,
                author: { userId },
              },
            },
          },
        }),
      ),
    );
  }

  async updateBook(
    userId: string,
    ids: ManuscriptIds,
    id: string,
    dto: UpdateBookDto,
  ): Promise<ApiBook> {
    return this.persist(async () =>
      serialize(
        await this.prisma.book.update({
          where: {
            id,
            projectId: ids.projectId,
            project: { author: { userId } },
          },
          data: dto,
        }),
      ),
    );
  }

  async deleteBook(
    userId: string,
    ids: ManuscriptIds,
    id: string,
  ): Promise<void> {
    await this.persist(() =>
      this.prisma.book.delete({
        where: {
          id,
          projectId: ids.projectId,
          project: { author: { userId } },
        },
      }),
    );
  }

  async listChapters(
    userId: string,
    ids: ManuscriptIds,
  ): Promise<ApiChapter[]> {
    const parent = await this.prisma.book.findFirst({
      where: {
        id: ids.bookId,
        projectId: ids.projectId,
        project: { author: { userId } },
      },
      select: { id: true },
    });
    if (!parent) throw new NotFoundException('Book not found');
    const records = await this.prisma.chapter.findMany({
      where: {
        bookId: ids.bookId,
        book: { projectId: ids.projectId, project: { author: { userId } } },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    return records.map(serialize);
  }

  async getChapter(
    userId: string,
    ids: ManuscriptIds,
    id: string,
  ): Promise<ApiChapter> {
    const record = await this.prisma.chapter.findFirst({
      where: {
        id,
        bookId: ids.bookId,
        book: {
          projectId: ids.projectId,
          project: { author: { userId } },
        },
      },
    });
    if (!record) throw new NotFoundException('Chapter not found');
    return serialize(record);
  }

  async createChapter(
    userId: string,
    ids: ManuscriptIds,
    dto: CreateChapterDto,
  ): Promise<ApiChapter> {
    return this.persist(async () =>
      serialize(
        await this.prisma.chapter.create({
          data: {
            title: dto.title,
            description: dto.description,
            position: dto.position,
            book: {
              connect: {
                id: ids.bookId,
                projectId: ids.projectId,
                project: { author: { userId } },
              },
            },
          },
        }),
      ),
    );
  }

  async updateChapter(
    userId: string,
    ids: ManuscriptIds,
    id: string,
    dto: UpdateChapterDto,
  ): Promise<ApiChapter> {
    return this.persist(async () =>
      serialize(
        await this.prisma.chapter.update({
          where: {
            id,
            bookId: ids.bookId,
            book: {
              projectId: ids.projectId,
              project: { author: { userId } },
            },
          },
          data: dto,
        }),
      ),
    );
  }

  async deleteChapter(
    userId: string,
    ids: ManuscriptIds,
    id: string,
  ): Promise<void> {
    await this.persist(() =>
      this.prisma.chapter.delete({
        where: {
          id,
          bookId: ids.bookId,
          book: {
            projectId: ids.projectId,
            project: { author: { userId } },
          },
        },
      }),
    );
  }

  async listScenes(userId: string, ids: ManuscriptIds): Promise<ApiScene[]> {
    const parent = await this.prisma.chapter.findFirst({
      where: {
        id: ids.chapterId,
        bookId: ids.bookId,
        book: {
          projectId: ids.projectId,
          project: { author: { userId } },
        },
      },
      select: { id: true },
    });
    if (!parent) throw new NotFoundException('Chapter not found');
    const records = await this.prisma.scene.findMany({
      where: {
        chapterId: ids.chapterId,
        chapter: {
          bookId: ids.bookId,
          book: { projectId: ids.projectId, project: { author: { userId } } },
        },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    return records.map(serialize);
  }

  async getScene(
    userId: string,
    ids: ManuscriptIds,
    id: string,
  ): Promise<ApiScene> {
    const record = await this.prisma.scene.findFirst({
      where: {
        id,
        chapterId: ids.chapterId,
        chapter: {
          bookId: ids.bookId,
          book: {
            projectId: ids.projectId,
            project: { author: { userId } },
          },
        },
      },
    });
    if (!record) throw new NotFoundException('Scene not found');
    return serialize(record);
  }

  async createScene(
    userId: string,
    ids: ManuscriptIds,
    dto: CreateSceneDto,
  ): Promise<ApiScene> {
    return this.persist(async () =>
      serialize(
        await this.prisma.scene.create({
          data: {
            title: dto.title,
            description: dto.description,
            position: dto.position,
            content: dto.content,
            chapter: {
              connect: {
                id: ids.chapterId,
                bookId: ids.bookId,
                book: {
                  projectId: ids.projectId,
                  project: { author: { userId } },
                },
              },
            },
          },
        }),
      ),
    );
  }

  async updateScene(
    userId: string,
    ids: ManuscriptIds,
    id: string,
    dto: UpdateSceneDto,
  ): Promise<ApiScene> {
    return this.persist(async () =>
      serialize(
        await this.prisma.scene.update({
          where: {
            id,
            chapterId: ids.chapterId,
            chapter: {
              bookId: ids.bookId,
              book: {
                projectId: ids.projectId,
                project: { author: { userId } },
              },
            },
          },
          data: dto,
        }),
      ),
    );
  }

  async deleteScene(
    userId: string,
    ids: ManuscriptIds,
    id: string,
  ): Promise<void> {
    await this.persist(() =>
      this.prisma.scene.delete({
        where: {
          id,
          chapterId: ids.chapterId,
          chapter: {
            bookId: ids.bookId,
            book: {
              projectId: ids.projectId,
              project: { author: { userId } },
            },
          },
        },
      }),
    );
  }
}
