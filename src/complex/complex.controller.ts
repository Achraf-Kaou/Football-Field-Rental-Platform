import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  HttpStatus, Query, UseInterceptors, UploadedFiles,
  BadRequestException
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { ComplexService } from './complex.service';
import { CreateComplexDto } from './dto/create-complex.dto';
import { UpdateComplexDto } from './dto/update-complex.dto';
import { FindAllComplexDto } from './dto/find-all-complex.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('Complex')
@Controller('complex')
export class ComplexController {
  constructor(
    private readonly complexService: ComplexService,
    private readonly cloudinaryService: CloudinaryService
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new complex' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Complex successfully created', type: CreateComplexDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  create(@Body() createComplexDto: CreateComplexDto) {
    console.log(createComplexDto);
    return this.complexService.create(createComplexDto);
  }

  @Post('upload-images')
  @ApiOperation({ summary: 'Upload images for complex' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Images uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  })
  @UseInterceptors(FilesInterceptor('images', 10, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB per file
    },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        return callback(
          new BadRequestException('Only image files (jpg, jpeg, png, webp) are allowed!'),
          false
        );
      }
      callback(null, true);
    },
  }))
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadPromises = files.map(file =>
      this.cloudinaryService.uploadImage(file, 'takwirti/complexes')
    );

    const results = await Promise.all(uploadPromises);

    return {
      urls: results.map(result => result.secure_url),
      publicIds: results.map(result => result.public_id),
    };
  }

  @Post(':id/upload-images')
  @ApiOperation({ summary: 'Upload and attach images to existing complex' })
  @ApiParam({ name: 'id', description: 'Complex ID', type: Number })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10, {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        return callback(
          new BadRequestException('Only image files are allowed!'),
          false
        );
      }
      callback(null, true);
    },
  }))
  async uploadAndAttachImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadPromises = files.map(file =>
      this.cloudinaryService.uploadImage(file, `takwirti/complexes/${id}`)
    );

    const results = await Promise.all(uploadPromises);
    const imageUrls = results.map(result => result.secure_url);

    // Update complex with new images
    return this.complexService.addImages(+id, imageUrls);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get total number of complexes' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Total number of complexes retrieved successfully' })
  count() {
    return this.complexService.count();
  }

  @Get()
  @ApiOperation({ summary: 'Get all complexes' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of complexes retrieved successfully' })
  findAll(@Query() filters: FindAllComplexDto) {
    console.log('filters =', filters);
    return this.complexService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complex by ID' })
  @ApiParam({ name: 'id', description: 'Complex ID', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Complex retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Complex not found' })
  findOne(@Param('id') id: string) {
    return this.complexService.findOne(Number(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update complex' })
  @ApiParam({ name: 'id', description: 'Complex ID', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Complex updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Complex not found' })
  update(@Param('id') id: string, @Body() updateComplexDto: UpdateComplexDto) {
    return this.complexService.update(+id, updateComplexDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete complex' })
  @ApiParam({ name: 'id', description: 'Complex ID', type: Number })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Complex deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Complex not found' })
  remove(@Param('id') id: string) {
    return this.complexService.remove(+id);
  }

  @Delete(':id/image')
  @ApiOperation({ summary: 'Delete image from complex' })
  @ApiParam({ name: 'id', description: 'Complex ID', type: Number })
  async deleteImage(
    @Param('id') id: string,
    @Body('imageUrl') imageUrl: string
  ) {
    return this.complexService.removeImage(+id, imageUrl);
  }


}
