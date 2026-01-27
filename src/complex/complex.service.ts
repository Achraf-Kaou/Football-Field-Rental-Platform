import { BadRequestException, ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateComplexDto } from './dto/create-complex.dto';
import { UpdateComplexDto } from './dto/update-complex.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { FindAllComplexDto } from './dto/find-all-complex.dto';

@Injectable()
export class ComplexService {
  constructor(
    private prisma: PrismaService,
  ) { }

  async create(createComplexDto: CreateComplexDto) {
    const existingComplex = await this.prisma.complex.findUnique({
      where: { email: createComplexDto.email },
    });

    if (existingComplex) {
      throw new ConflictException('Complex with this email already exists');
    }

    return this.prisma.complex.create({
      data: {
        name: createComplexDto.name,
        address: createComplexDto.address,
        description: createComplexDto.description || '',
        phone: createComplexDto.phone,
        email: createComplexDto.email,
        images: createComplexDto.images || [],
        tags: createComplexDto.tags || [],
        openAt: createComplexDto.openAt,
        closeAt: createComplexDto.closeAt,
        userId: createComplexDto.userId,
      },
    });
  }

  count(userId?: number) {
    return this.prisma.complex.count({
      where: {
        ...(userId && { userId }),
      },
    });
  }

  async findAll(filters: FindAllComplexDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      userId,
      sortedBy = 'createdAt',
      sortedDirection = 'desc',
    } = filters;

    let statusBool: boolean | undefined;
    if (status === 'true') statusBool = true;
    else if (status === 'false') statusBool = false;
    else statusBool = undefined;

    const complexes = await this.prisma.complex.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(userId && { userId }),
      },
      orderBy: {
        [sortedBy]: sortedDirection,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        fields: true,
      },
    });

    const now = new Date();

    const withStatus = complexes.map((c) => ({
      ...c,
      isOpen: this.isOpenNow(c.openAt, c.closeAt, now),
    }));

    // optional: apply status filter in memory
    const filtered = statusBool == null
      ? withStatus
      : withStatus.filter((c) => c.isOpen === statusBool);

    return filtered;
  }

  // complex.service.ts
  async findOne(id: number) {

    if (id == null || Number.isNaN(id)) {
      throw new BadRequestException('Invalid id');
    }

    const complex = await this.prisma.complex.findUnique({
      where: { id },
      include: {
        fields: true,
      },
    });

    if (!complex) {
      throw new NotFoundException(`Complex with ID ${id} not found`);
    }
    return complex;
  }


  async update(id: number, updateComplexDto: UpdateComplexDto) {
    const complex = await this.findOne(id);

    if (updateComplexDto.email && updateComplexDto.email !== complex.email) {
      const existingComplex = await this.prisma.complex.findUnique({
        where: { email: updateComplexDto.email },
      });

      if (existingComplex) {
        throw new ConflictException('Complex with this email already exists');
      }
    }

    return this.prisma.complex.update({
      where: { id },
      data: { ...updateComplexDto },
    });
  }

  async remove(id: number): Promise<void> {
    // Vérifiez si le complexe existe
    const complex = await this.findOne(id);
    if (!complex) {
      throw new Error(`The complex with ID ${id} does not exist`);
    }

    // Supprimez tous les champs associés à ce complexe (cascade)
    await this.prisma.field.deleteMany({
      where: { complexId: id },
    });

    // Supprimez le complexe
    await this.prisma.complex.delete({
      where: { id },
    });
  }

  isOpenNow(openAt: string, closeAt: string, now: Date = new Date()): boolean {
    const [openH, openM] = openAt.split(':').map(Number);
    const [closeH, closeM] = closeAt.split(':').map(Number);

    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const minutesOpen = openH * 60 + openM;
    const minutesClose = closeH * 60 + closeM;

    if (minutesOpen <= minutesClose) {
      // normal case: 08:00–18:00
      return minutesNow >= minutesOpen && minutesNow < minutesClose;
    } else {
      // spans midnight: 20:00–02:00
      return minutesNow >= minutesOpen || minutesNow < minutesClose;
    }
  }

}
