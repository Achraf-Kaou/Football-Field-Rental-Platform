import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FieldService } from './field.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { FindAllFieldsDto } from './dto/find-all-fields.dto';
import { Role } from '@prisma/client';

@ApiTags('Fields')
@Controller('fields')
export class FieldController {
  constructor(private readonly fieldService: FieldService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new field' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Field successfully created',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Field with this name already exists in this complex',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Complex not found',
  })
  create(@Body() createFieldDto: CreateFieldDto) {
    return this.fieldService.create(createFieldDto);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get total count of fields' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Total count of fields retrieved successfully',
  })
  countAll(@Query('complexId') id?: number) {
    if (id) {
      return this.fieldService.countAll(id);
    }
    return this.fieldService.countAll();
  }

  @Get()
  @ApiOperation({ summary: 'Get all fields with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of fields retrieved successfully',
  })
  findAll(@Query() filters: FindAllFieldsDto) {
    return this.fieldService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a field by ID' })
  @ApiParam({ name: 'id', description: 'Field ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Field retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Field not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fieldService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a field' })
  @ApiParam({ name: 'id', description: 'Field ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Field successfully updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Field not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Field with this name already exists in this complex',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFieldDto: UpdateFieldDto,
  ) {
    return this.fieldService.update(id, updateFieldDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a field' })
  @ApiParam({ name: 'id', description: 'Field ID', type: Number })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Field successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Field not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fieldService.remove(id);
  }
}
