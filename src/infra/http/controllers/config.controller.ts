import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpException,
  HttpStatus,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentDTO } from 'src/domain/dtos/document.dto';
import { VectorStoreService } from 'src/infra/lib/qdrant.service';
import { ZodValidationPipe } from 'src/domain/pipe/zod-validation-pipe';
import { ConfigDTO, ConfigDTOSchema } from 'src/domain/pipe/config-pipe';
import { MakeCreateConfigUseCase } from 'src/domain/use-cases/config-use-case/factory/create-config-factory';
import { SupabaseService } from 'src/infra/lib/supabase/supabase.service';
import { MakeCreateDocUseCase } from 'src/domain/use-cases/doc-use-case/factory/create-config-factory';
import { LogEntry, LogService } from 'src/infra/logs/logs.service';
import { AssistantCoreService } from 'src/core/assistent/assistent-core.service';

@Controller('configuration')
export class ConfigurationController {
  constructor(
    private readonly vectorStoreService: VectorStoreService,
    private readonly supabaseService: SupabaseService,
    private readonly logService: LogService,
    private readonly assistantCoreService: AssistantCoreService,
  ) {}

  @Post('/upload/document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndCreate(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'pdf' })],
      }),
    )
    file: Express.Multer.File,
    @Body() documentData: DocumentDTO,
  ) {
    const {
      chunk_overlap,
      chunk_size,
      collection_name,
      doc_name,
      limit = 3,
    } = documentData;

    try {
      await this.supabaseService.uploadFile({
        file: file.buffer,
        filename: file.originalname,
        contentType: file.mimetype,
        bucketName: 'documents',
      });

      const createDocument = MakeCreateDocUseCase();
      const collection =
        await this.vectorStoreService.collectionExist(collection_name);
      if (collection) {
        throw new HttpException(
          'Collection name already exists',
          HttpStatus.BAD_REQUEST,
        );
      }

      const { publicUrl } = await this.supabaseService.downloadFile({
        doc_name: file.originalname,
        bucketName: 'documents',
      });

      this.assistantCoreService.getRelevantDocLimit(limit);

      await createDocument.execute({
        collection_name,
        chunk_overlap: Number(chunk_overlap),
        chunk_size: Number(chunk_size),
        limit: Number(limit),
        doc_name,
        doc_link: publicUrl,
      });
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Error processing request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/logs')
  async getLogs(): Promise<LogEntry[]> {
    return this.logService.getLogs();
  }

  @Post('/ai')
  @UsePipes(new ZodValidationPipe(ConfigDTOSchema))
  async sendMessage(
    @Body()
    {
      embedding_model,
      gpt_model,
      max_tokens,
      prompt_template,
      temperature,
    }: ConfigDTO,
  ) {
    const createConfigUseCase = MakeCreateConfigUseCase();
    await createConfigUseCase.execute({
      embedding_model,
      gpt_model,
      max_tokens,
      prompt_template,
      temperature,
    });
  }
}
