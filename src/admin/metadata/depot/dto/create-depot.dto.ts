import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DepotStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

export class CreateDepotDto {
  @ApiProperty({ 
    description: 'State where the depot is located',
    example: 'Lagos',
    required: true 
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ 
    description: 'City where the depot is located',
    example: 'Victoria Island',
    required: true 
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ 
    description: 'Name of the depot officer',
    example: 'John Doe',
    required: true 
  })
  @IsString()
  @IsNotEmpty()
  depot_officer_name: string;

  @ApiProperty({ 
    description: 'Email of the depot officer',
    example: 'john.doe@example.com',
    required: true 
  })
  @IsString()
  @IsNotEmpty()
  depot_officer_email: string;

  @ApiProperty({ 
    description: 'Phone number of the depot officer',
    example: '+2348012345678',
    required: true 
  })
  @IsString()
  @IsNotEmpty()
  depot_officer_phone: string;

  @ApiProperty({ 
    description: 'House address of the depot officer',
    example: '123 Main Street, Victoria Island, Lagos',
    required: true 
  })
  @IsString()
  @IsNotEmpty()
  depo_officer_house_address: string;

  @ApiProperty({ 
    description: 'Additional description or notes about the depot',
    example: 'Main distribution center for Lagos region',
    required: false 
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    description: 'Status of the depot',
    enum: DepotStatus,
    example: DepotStatus.ACTIVE,
    default: DepotStatus.ACTIVE,
    required: false 
  })
  @IsEnum(DepotStatus)
  @IsOptional()
  status?: DepotStatus = DepotStatus.ACTIVE;
} 