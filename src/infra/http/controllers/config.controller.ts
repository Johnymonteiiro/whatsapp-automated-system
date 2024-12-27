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
import { ConfigDTO, ConfigDTOSchema } from 'src/infra/http/pipe/config-pipe';
import { ZodValidationPipe } from 'src/infra/http/pipe/zod-validation-pipe';
import { VectorStoreService } from 'src/infra/lib/qdrant/qdrant.service';
import { SupabaseService } from 'src/infra/lib/supabase/supabase.service';
import { LogEntry, LogService } from 'src/infra/logs/logs.service';
import { PrismaConfigService } from 'src/infra/repositories/prisma/config/prisma_config.service';
import { PrismaDocService } from 'src/infra/repositories/prisma/doc/prisma_doc.service';

@Controller('configuration')
export class ConfigurationController {
  constructor(
    private readonly vectorStoreService: VectorStoreService,
    private readonly supabaseService: SupabaseService,
    private readonly logService: LogService,
    private readonly prismaConfigService: PrismaConfigService,
    private readonly prismaDocService: PrismaDocService,
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
    const { chunk_overlap, chunk_size, collection_name, doc_name } =
      documentData;

    try {
      await this.supabaseService.uploadFile({
        file: file.buffer,
        filename: file.originalname,
        contentType: file.mimetype,
        bucketName: 'documents',
      });
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

      await this.prismaDocService.create({
        collection_name,
        chunk_overlap: Number(chunk_overlap),
        chunk_size: Number(chunk_size),
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
    await this.prismaConfigService.create({
      embedding_model,
      gpt_model,
      max_tokens,
      prompt_template,
      temperature,
    });
  }
}
