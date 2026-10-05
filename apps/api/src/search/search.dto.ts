import { DocumentDto } from '../contracts/document-dto.js';
import { IsIn } from 'class-validator';
import type { SearchResultKind } from '@rawan/types';
import {
  PaginationQueryDto,
  optionalQuery,
  searchText,
} from '../query/query.dto.js';
export const SEARCH_KINDS = [
  'PROJECT',
  'BOOK',
  'CHAPTER',
  'SCENE',
  'CHARACTER',
  'PLACE',
  'FACTION',
  'ARTIFACT',
  'TIMELINE_EVENT',
  'PLOT',
  'PLOT_POINT',
  'NOTE',
] as const;
@DocumentDto()
export class SearchQueryDto extends PaginationQueryDto {
  @searchText() q!: string;
  @optionalQuery() @IsIn(SEARCH_KINDS) kind?: SearchResultKind;
}
