import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { FindAllBookingDto } from './dto/find-all-booking.dto';
import { Booking } from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createBookingDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createBookingDto.userId} not found`,
      );
    }

    // Verify field exists
    const field = await this.prisma.field.findUnique({
      where: { id: createBookingDto.fieldId },
    });

    if (!field) {
      throw new NotFoundException(
        `Field with ID ${createBookingDto.fieldId} not found`,
      );
    }

    // Validate dates
    const startAt = new Date(createBookingDto.startAt);
    const endAt = new Date(createBookingDto.endAt);

    if (endAt <= startAt) {
      throw new BadRequestException('End time must be after start time');
    }

    if (startAt < new Date()) {
      throw new BadRequestException('Cannot book in the past');
    }

    // Check for overlapping bookings on the same field
    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        fieldId: createBookingDto.fieldId,
        status: {
          in: ['pending', 'confirmed'],
        },
        OR: [
          {
            AND: [
              { startAt: { lte: startAt } },
              { endAt: { gt: startAt } },
            ],
          },
          {
            AND: [
              { startAt: { lt: endAt } },
              { endAt: { gte: endAt } },
            ],
          },
          {
            AND: [
              { startAt: { gte: startAt } },
              { endAt: { lte: endAt } },
            ],
          },
        ],
      },
    });

    if (overlappingBooking) {
      throw new ConflictException(
        'This field is already booked for the selected time slot',
      );
    }

    return this.prisma.booking.create({
      data: {
        userId: createBookingDto.userId,
        fieldId: createBookingDto.fieldId,
        startAt: startAt,
        endAt: endAt,
        status: createBookingDto.status,
      },
      include: {
        user: true,
        field: true,
      },
    });
  }

  async findAll(filters: FindAllBookingDto): Promise<Booking[]> {
    const {
      page = 1,
      limit = 10,
      sortedBy = 'createdAt',
      sortedDirection = 'desc',
      userId,
      fieldId,
      status,
      startDate,
      endDate,
    } = filters;

    return this.prisma.booking.findMany({
      where: {
        ...(userId && { userId }),
        ...(fieldId && { fieldId }),
        ...(status && { status }),
        ...(startDate && { startAt: { gte: new Date(startDate) } }),
        ...(endDate && { endAt: { lte: new Date(endDate) } }),
      },
      orderBy: {
        [sortedBy]: sortedDirection,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        field: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
          },
        },
      },
    });
  }

  async findOne(id: number): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        field: {
          include: {
            complex: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async update(id: number, updateBookingDto: UpdateBookingDto): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Verify new user exists if userId is being updated
    if (updateBookingDto.userId && updateBookingDto.userId !== booking.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: updateBookingDto.userId },
      });

      if (!user) {
        throw new NotFoundException(
          `User with ID ${updateBookingDto.userId} not found`,
        );
      }
    }

    // Verify new field exists if fieldId is being updated
    if (updateBookingDto.fieldId && updateBookingDto.fieldId !== booking.fieldId) {
      const field = await this.prisma.field.findUnique({
        where: { id: updateBookingDto.fieldId },
      });

      if (!field) {
        throw new NotFoundException(
          `Field with ID ${updateBookingDto.fieldId} not found`,
        );
      }
    }

    // Validate dates if being updated
    if (updateBookingDto.startAt || updateBookingDto.endAt) {
      const startAt = updateBookingDto.startAt
        ? new Date(updateBookingDto.startAt)
        : booking.startAt;
      const endAt = updateBookingDto.endAt
        ? new Date(updateBookingDto.endAt)
        : booking.endAt;

      if (endAt <= startAt) {
        throw new BadRequestException('End time must be after start time');
      }

      // Check for overlapping bookings
      const overlappingBooking = await this.prisma.booking.findFirst({
        where: {
          id: { not: id },
          fieldId: updateBookingDto.fieldId ?? booking.fieldId,
          status: {
            in: ['pending', 'confirmed'],
          },
          OR: [
            {
              AND: [
                { startAt: { lte: startAt } },
                { endAt: { gt: startAt } },
              ],
            },
            {
              AND: [
                { startAt: { lt: endAt } },
                { endAt: { gte: endAt } },
              ],
            },
            {
              AND: [
                { startAt: { gte: startAt } },
                { endAt: { lte: endAt } },
              ],
            },
          ],
        },
      });

      if (overlappingBooking) {
        throw new ConflictException(
          'This field is already booked for the selected time slot',
        );
      }
    }

    return this.prisma.booking.update({
      where: { id },
      data: {
        ...updateBookingDto,
        ...(updateBookingDto.startAt && {
          startAt: new Date(updateBookingDto.startAt),
        }),
        ...(updateBookingDto.endAt && {
          endAt: new Date(updateBookingDto.endAt),
        }),
      },
      include: {
        user: true,
        field: true,
      },
    });
  }

  async remove(id: number): Promise<{ message: string; statusCode: number }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    await this.prisma.booking.delete({
      where: { id },
    });

    return {
      message: `Booking with ID ${id} successfully deleted`,
      statusCode: HttpStatus.NO_CONTENT,
    };
  }

  async cancelBooking(id: number): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      throw new BadRequestException(
        `Cannot cancel a booking that is ${booking.status}`,
      );
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        user: true,
        field: true,
      },
    });
  }
}
