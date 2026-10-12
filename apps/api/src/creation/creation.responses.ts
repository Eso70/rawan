import { ApiProperty } from '@nestjs/swagger';
import {
  CanvasEdgeDto,
  CanvasNodeDto,
  CitationDto,
  DocumentBlockDto,
  MapDto,
  PinDto,
  PreferenceValuesDto,
  RegionDto,
  ResearchDto,
  SavedViewDto,
  TitleDto,
} from './creation.dto.js';
export class DocumentBlockResponse extends DocumentBlockDto {
  @ApiProperty() declare id: string;
  @ApiProperty() sectionId!: string;
  @ApiProperty() position!: number;
}
export class DocumentSectionResponse extends TitleDto {
  @ApiProperty() declare id: string;
  @ApiProperty() documentId!: string;
  @ApiProperty() position!: number;
  @ApiProperty({ type: () => [DocumentBlockResponse] })
  blocks!: DocumentBlockResponse[];
}
export class DocumentResponse extends TitleDto {
  @ApiProperty() declare id: string;
  @ApiProperty() workId!: string;
  @ApiProperty() revision!: number;
  @ApiProperty({ type: () => [DocumentSectionResponse], required: false })
  sections!: DocumentSectionResponse[];
}
export class ResearchResponse extends ResearchDto {
  @ApiProperty() declare id: string;
  @ApiProperty() projectId!: string;
}
export class CitationResponse extends CitationDto {
  @ApiProperty() declare id: string;
  @ApiProperty() sourceId!: string;
}
export class PreferenceResponse {
  @ApiProperty() declare id: string;
  @ApiProperty() scope!: string;
  @ApiProperty() contextId!: string;
  @ApiProperty() revision!: number;
  @ApiProperty({ type: () => PreferenceValuesDto })
  values!: PreferenceValuesDto;
}
export class EffectivePreferenceResponse {
  @ApiProperty() scope!: string;
  @ApiProperty() contextId!: string;
  @ApiProperty({ type: () => PreferenceValuesDto })
  values!: PreferenceValuesDto;
}
export class SavedViewResponse extends SavedViewDto {
  @ApiProperty() declare id: string;
  @ApiProperty() projectId!: string;
}
export class PinResponse extends PinDto {
  @ApiProperty() declare id: string;
  @ApiProperty() mapId!: string;
}
export class RegionResponse extends RegionDto {
  @ApiProperty() declare id: string;
  @ApiProperty() mapId!: string;
}
export class MapResponse extends MapDto {
  @ApiProperty() declare id: string;
  @ApiProperty() projectId!: string;
  @ApiProperty() revision!: number;
  @ApiProperty({ type: () => [PinResponse], required: false })
  pins!: PinResponse[];
  @ApiProperty({ type: () => [RegionResponse], required: false })
  regions!: RegionResponse[];
}
export class EdgeResponse extends CanvasEdgeDto {
  @ApiProperty() declare id: string;
  @ApiProperty() canvasId!: string;
}
export class NodeResponse extends CanvasNodeDto {
  @ApiProperty() declare id: string;
  @ApiProperty() canvasId!: string;
  @ApiProperty({ type: () => [EdgeResponse], required: false })
  outgoing!: EdgeResponse[];
}
export class CanvasResponse extends TitleDto {
  @ApiProperty() declare id: string;
  @ApiProperty() projectId!: string;
  @ApiProperty() revision!: number;
  @ApiProperty({ type: () => [NodeResponse], required: false })
  nodes!: NodeResponse[];
}
