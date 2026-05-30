import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { UserDto } from './dto/user.dto';
import { Role } from '@prisma/client';
import { SearchUsersDto } from './dto/search-users.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user account with the provided information. Email must be unique and password will be hashed before storage.'
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: CreateUserDto
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data'
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by name or email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of users matching search criteria',
  })
  search(@Query() searchDto: SearchUsersDto) {
    return this.usersService.searchUsers(searchDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves a paginated list of users with optional filtering by role, search term, and sorting options.'
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
    type: [UserDto]
  })
  findAll(@Query() filters: FindAllUsersDto) {
    return this.usersService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a single user by their unique identifier.'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'User ID',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'User found and returned successfully',
    type: UserDto
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates user information. If email is changed, it must be unique. Password will be hashed if provided.'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'User ID',
    example: 1
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserDto
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  @ApiResponse({
    status: 409,
    description: 'Email already in use by another user'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data'
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Permanently deletes a user from the system.'
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'User ID',
    example: 1
  })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
