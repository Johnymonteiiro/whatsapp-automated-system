export class DocumentDTO {
  collection_name: string;
  file_name: string;
  chunk_size: number;
  limit?: number;
  chunk_overlap: number;
}
