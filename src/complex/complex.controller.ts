import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ComplexService } from './complex.service';
import { CreateComplexDto } from './dto/create-complex.dto';
import { UpdateComplexDto } from './dto/update-complex.dto';
import { FindAllComplexDto } from './dto/find-all-complex.dto';

@Controller('complex')
export class ComplexController {
  constructor(private readonly complexService: ComplexService) {}

  @Post()
  create(@Body() createComplexDto: CreateComplexDto) {
    return this.complexService.create(createComplexDto);
  }

  @Get()
  findAll(filters: FindAllComplexDto) {
    return this.complexService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.complexService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateComplexDto: UpdateComplexDto) {
    return this.complexService.update(+id, updateComplexDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.complexService.remove(+id);
  }
}
