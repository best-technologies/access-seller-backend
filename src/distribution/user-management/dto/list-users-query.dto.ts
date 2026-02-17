import { IsIn, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ListUsersQueryDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsIn(['active', 'suspended', 'inactive'])
  status?: string;

  @IsOptional()
  @IsString()
  fromCreatedAt?: string;

  @IsOptional()
  @IsString()
  toCreatedAt?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'email' | 'first_name' | 'last_name' | 'role' | 'status';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
