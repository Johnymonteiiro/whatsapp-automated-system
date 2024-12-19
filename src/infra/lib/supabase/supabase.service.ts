import { Injectable } from '@nestjs/common';
import { supabase } from './supabase';

export type UploadFileDTO = {
  contentType: string;
  filename: string;
  bucketName: string;
  file: Buffer;
};

@Injectable()
export class SupabaseService {
  constructor() {}
  async uploadFile({ bucketName, file, contentType, filename }: UploadFileDTO) {
    try {
      await supabase.storage
        .from(bucketName)
        .upload(filename, file, { upsert: true, contentType });
    } catch (error) {
      console.error(error);
    }
  }

  async downloadFile({ bucketName, doc_name }) {
    const { data } = await supabase.storage
      .from(bucketName)
      .getPublicUrl(doc_name);

    return data;
  }
}
