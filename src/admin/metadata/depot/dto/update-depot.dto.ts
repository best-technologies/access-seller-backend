import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreateDepotDto, DepotStatus } from './create-depot.dto';

export class UpdateDepotDto extends PartialType(CreateDepotDto) {
  @ApiProperty({ 
    description: 'State where the depot is located',
    example: 'Lagos',
    required: false 
  })
  state?: string;

  @ApiProperty({ 
    description: 'City where the depot is located',
    example: 'Victoria Island',
    required: false 
  })
  city?: string;

  @ApiProperty({ 
    description: 'Name of the depot officer',
    example: 'John Doe',
    required: false 
  })
  depot_officer_name?: string;

  @ApiProperty({ 
    description: 'Email of the depot officer',
    example: 'john.doe@example.com',
    required: false 
  })
  depot_officer_email?: string;

  @ApiProperty({ 
    description: 'Phone number of the depot officer',
    example: '+2348012345678',
    required: false 
  })
  depot_officer_phone?: string;

  @ApiProperty({ 
    description: 'House address of the depot officer',
    example: '123 Main Street, Victoria Island, Lagos',
    required: false 
  })
  depo_officer_house_address?: string;

  @ApiProperty({ 
    description: 'Additional description or notes about the depot',
    example: 'Main distribution center for Lagos region',
    required: false 
  })
  description?: string;

  @ApiProperty({ 
    description: 'Status of the depot',
    enum: DepotStatus,
    example: DepotStatus.ACTIVE,
    required: false 
  })
  status?: DepotStatus;
} 