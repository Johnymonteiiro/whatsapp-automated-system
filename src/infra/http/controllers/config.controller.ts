import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentManagerService } from 'src/core/documents/document-manager.service';
import { DocumentDTO } from 'src/domain/dtos/document.dto';
import {
  ConfigDTO,
  ConfigDTOSchema,
  GeneralConfig,
  GeneralConfigDTOSchema,
} from 'src/infra/http/pipe/config-pipe';
import { ZodValidationPipe } from 'src/infra/http/pipe/zod-validation-pipe';
import {
  EnvironmentsZodType,
  EnvironmentsSchema,
} from 'src/infra/http/pipe/environments-pipe';
import { VectorStoreService } from 'src/infra/lib/qdrant/qdrant.service';
import { SupabaseService } from 'src/infra/lib/supabase/supabase.service';
import { LogService, RecentLogsTypes } from 'src/infra/logs/logs.service';
import { PrismaConfigService } from 'src/infra/repositories/prisma/config/prisma_config.service';
import { PrismaDocService } from 'src/infra/repositories/prisma/doc/prisma_doc.service';
import { PrismaEnvironmentsService } from 'src/infra/repositories/prisma/environments/prisma_env.service';
import { AssistantService } from 'src/core/assistent/assistent.service';

@Controller('configuration')
export class ConfigurationController {
  constructor(
    private readonly vectorStoreService: VectorStoreService,
    private readonly supabaseService: SupabaseService,
    private readonly logService: LogService,
    private readonly prismaConfigService: PrismaConfigService,
    private readonly prismaDocService: PrismaDocService,
    private readonly documentManagerService: DocumentManagerService,
    private readonly environmentsService: PrismaEnvironmentsService,
    private readonly assisatntService: AssistantService,
  ) {}

  @Get('/logs')
  async getLogs(): Promise<RecentLogsTypes[]> {
    return this.logService.getRecentLogs();
  }

  @Get('/assistant/init')
  async initAssistant() {
    await this.assisatntService.initAssistant();
  }

  @Post('/upload/document')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
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

  @Post('/documents/general')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(GeneralConfigDTOSchema))
  async create_general_config(
    @Body() { batch_size, relevant_doc_limit, score }: GeneralConfig,
  ) {
    try {
      this.prismaConfigService.createGeneralConfig({
        batch_size: Number(batch_size),
        relevant_doc_limit: Number(relevant_doc_limit),
        relevant_doc_threshold: Number(score),
      });
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Failing to processing the documents',
        HttpStatus.EXPECTATION_FAILED,
      );
    }
  }

  @Post('/documents/process')
  @HttpCode(HttpStatus.CREATED)
  async processing() {
    try {
      this.documentManagerService.startProcessing();
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Failing to processing the documents',
        HttpStatus.EXPECTATION_FAILED,
      );
    }
  }

  @Post('/ai')
  @HttpCode(HttpStatus.CREATED)
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

  @Post('/environments')
  @UsePipes(new ZodValidationPipe(EnvironmentsSchema))
  async create(
    @Body()
    { value, name }: EnvironmentsZodType,
  ) {
    try {
      this.environmentsService.create({
        value,
        name,
      });
    } catch (error) {
      console.log(error);
    }
  }
}
