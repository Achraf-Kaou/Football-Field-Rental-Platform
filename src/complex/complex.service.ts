import { ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateComplexDto } from './dto/create-complex.dto';
import { UpdateComplexDto } from './dto/update-complex.dto';
import { PrismaService } from '../prisma.service';
import { FindAllComplexDto } from './dto/find-all-complex.dto';

@Injectable()
export class ComplexService {
  constructor(private prisma: PrismaService) { }
  
  async create(createComplexDto: CreateComplexDto): Promise<CreateComplexDto> {
    const existingComplex: CreateComplexDto | null = await this.prisma.complex.findUnique({
      where: {
        email: createComplexDto.email,
      },
    });
    if (existingComplex) {
      throw new ConflictException('Complex with this email already exists');
    }

    return this.prisma.complex.create({
      data: {
        name: createComplexDto.name,
        address: createComplexDto.address,
        description: createComplexDto.description,
        phone: createComplexDto.phone,
        email: createComplexDto.email,
      },
    });
  }

  findAll(filters: FindAllComplexDto): Promise<CreateComplexDto[]> {
    const {
      page = 1,
      limit = 10,
      search,
      sortedBy = 'createdAt',
      sortedDirection = 'desc',
    } = filters
    return this.prisma.complex.findMany({
      where: {
        ...(search && {
          OR: [
            {name: { contains: search, mode: 'insensitive' }},
            {address: { contains: search, mode: 'insensitive' }},
            {description: { contains: search, mode: 'insensitive' }},
          ],
        }),
      },
      orderBy: {
        [sortedBy]: sortedDirection,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: number): Promise<CreateComplexDto> {
    const complex = await this.prisma.complex.findUnique({
      where: {
        id,
      },
    });
    if (!complex){
      throw new NotFoundException(`Complex with ID ${id} not found`);
    }
    return complex;
  }

  async update(id: number, updateComplexDto: UpdateComplexDto) {
    const complex = await this.prisma.complex.findUnique({
      where: {
        id,
      },
    });
    if (!complex){
      throw new NotFoundException(`Complex with ID ${id} not found`);
    }

    if (updateComplexDto.email && updateComplexDto.email !== complex.email) {
      const existingComplex = await this.prisma.complex.findUnique({
        where: {
          email: updateComplexDto.email,
        },
      });
      if (existingComplex) {
        throw new ConflictException('Complex with this email already exists');
      }
    }
    
    return this.prisma.complex.update({
      where: {
        id,
      },
      data: {
        ...updateComplexDto,
      },
    });
  }

  async remove(id: number): Promise<HttpStatus> {
    const complex = this.prisma.complex.findUnique({
      where: {
        id,
      },
    });
    if (!complex){
      throw new NotFoundException(`Complex with ID ${id} not found`);
    }

    await this.prisma.complex.delete({
      where: {
        id,
      },
    })
    return HttpStatus.NO_CONTENT;
  }
}
