import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { FindAllFieldsDto } from './dto/find-all-fields.dto';
import { Field } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class FieldService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createFieldDto: CreateFieldDto): Promise<Field> {
    const complex = await this.prisma.complex.findUnique({
      where: { id: createFieldDto.complexId },
    });

    if (!complex) {
      throw new NotFoundException(
        `Complex with ID ${createFieldDto.complexId} not found`,
      );
    }

    const existingField = await this.prisma.field.findFirst({
      where: {
        name: createFieldDto.name,
        complexId: createFieldDto.complexId,
      },
    });

    if (existingField) {
      throw new ConflictException(
        'Field with this name already exists in this complex',
      );
    }

    return this.prisma.field.create({
      data: {
        name: createFieldDto.name,
        description: createFieldDto.description,
        type: createFieldDto.type,
        surface: createFieldDto.surface,
        price: createFieldDto.price,
        status: createFieldDto.status,
        availability: createFieldDto.availability
          ? (createFieldDto.availability as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        images: createFieldDto.images || [],
        complexId: createFieldDto.complexId,
      },
    });
  }

  async findAll(filters: FindAllFieldsDto): Promise<Field[]> {
    const {
      page = 1,
      limit = 10,
      search,
      sortedBy = 'createdAt',
      sortedDirection = 'desc',
      complexId,
      status,
      type,
    } = filters;

    return this.prisma.field.findMany({
      where: {
        ...(complexId && { complexId }),
        ...(status && { status }),
        ...(type && { type }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            {
              complex: {
                address: { contains: search, mode: 'insensitive' }
              }
            }
          ],
        }),
      },
      orderBy: {
        [sortedBy]: sortedDirection,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        complex: true,
      },
    });
  }

  async findOne(id: number): Promise<Field> {
    const field = await this.prisma.field.findUnique({
      where: { id },
      include: {
        complex: true,
        bookings: true,
      },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${id} not found`);
    }

    return field;
  }

  async update(id: number, updateFieldDto: UpdateFieldDto): Promise<Field> {
    const field = await this.prisma.field.findUnique({
      where: { id },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${id} not found`);
    }

    if (updateFieldDto.complexId && updateFieldDto.complexId !== field.complexId) {
      const complex = await this.prisma.complex.findUnique({
        where: { id: updateFieldDto.complexId },
      });

      if (!complex) {
        throw new NotFoundException(
          `Complex with ID ${updateFieldDto.complexId} not found`,
        );
      }
    }

    if (
      (updateFieldDto.name && updateFieldDto.name !== field.name) ||
      (updateFieldDto.complexId && updateFieldDto.complexId !== field.complexId)
    ) {
      const existingField = await this.prisma.field.findFirst({
        where: {
          name: updateFieldDto.name ?? field.name,
          complexId: updateFieldDto.complexId ?? field.complexId,
          NOT: { id },
        },
      });

      if (existingField) {
        throw new ConflictException(
          'Field with this name already exists in this complex',
        );
      }
    }

    return this.prisma.field.update({
      where: { id },
      data: {
        ...updateFieldDto,
        availability: toJsonValue(updateFieldDto.availability),
      },
    });
  }

  async remove(id: number): Promise<{ message: string; statusCode: number }> {
    const field = await this.prisma.field.findUnique({
      where: { id },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${id} not found`);
    }

    await this.prisma.field.delete({
      where: { id },
    });

    return {
      message: `Field with ID ${id} successfully deleted`,
      statusCode: HttpStatus.NO_CONTENT,
    };
  }

  async countAll(id?: number): Promise<number> {
    return this.prisma.field.count({
      where: {
        ...(id && { complexId: id }),
      },
    });
  }
}

function toJsonValue<T>(value: T | undefined): Prisma.InputJsonValue | undefined | typeof Prisma.JsonNull {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return Prisma.JsonNull;
  }
  return value as unknown as Prisma.InputJsonValue;
}
