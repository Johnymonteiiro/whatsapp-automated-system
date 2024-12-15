import {
  Body,
  Controller,
  FileTypeValidator,
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
import { RetrieveDataService } from 'src/core/assistent/retrieve_data.service';
import { MakeCreateConfigUseCase } from 'src/domain/use-cases/factory/create-config-factory';

@Controller('configuration')
export class ConfigurationController {
  constructor(
    private readonly vectorStoreService: VectorStoreService,
    private readonly retrieveDataService: RetrieveDataService,
  ) {}

  @Post('/upload/file')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'pdf' })],
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      console.log(file);
    } catch (error) {
      console.error(error);
    }
  }

  @Post('/create/document')
  async create(
    @Body()
    {
      chunk_overlap,
      chunk_size,
      collection_name,
      file_name,
      // limit,
    }: DocumentDTO,
  ) {
    const collection =
      await this.vectorStoreService.collectionExist(collection_name);
    if (collection) {
      throw new HttpException(
        'Collection name already exist',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.retrieveDataService.store({
      collection_name,
      file_name,
      chunk_overlap,
      chunk_size,
    });
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
