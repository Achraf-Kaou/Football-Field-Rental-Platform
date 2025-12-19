import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ComplexService } from './complex.service';
import { CreateComplexDto } from './dto/create-complex.dto';
import { UpdateComplexDto } from './dto/update-complex.dto';
import { FindAllComplexDto } from './dto/find-all-complex.dto';
import { Role } from '@prisma/client';

@ApiTags('Complex')
@Controller('complex')
export class ComplexController {
  constructor(private readonly complexService: ComplexService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new complex' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Complex successfully created', type: CreateComplexDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  create(@Body() createComplexDto: CreateComplexDto) {
    return this.complexService.create(createComplexDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all complexes' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of complexes retrieved successfully' })
  findAll(filters: FindAllComplexDto) {
    return this.complexService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get complex by ID' })
  @ApiParam({ name: 'id', description: 'Complex ID', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Complex retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Complex not found' })
  findOne(@Param('id') id: string) {
    return this.complexService.findOne(+id);
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
}
