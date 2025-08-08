import { ApiProperty } from '@nestjs/swagger';
import { DepotStatus } from './create-depot.dto';

export class DepotResponseDto {
  @ApiProperty({ 
    description: 'Unique identifier for the depot',
    example: 'clx1234567890abcdef' 
  })
  id: string;

  @ApiProperty({ 
    description: 'ID of the store that owns this depot',
    example: 'clx1234567890abcdef' 
  })
  storeId: string;

  @ApiProperty({ 
    description: 'State where the depot is located',
    example: 'Lagos' 
  })
  state: string;

  @ApiProperty({ 
    description: 'City where the depot is located',
    example: 'Victoria Island' 
  })
  city: string;

  @ApiProperty({ 
    description: 'Name of the depot officer',
    example: 'John Doe' 
  })
  depot_officer_name: string;

  @ApiProperty({ 
    description: 'Email of the depot officer',
    example: 'john.doe@example.com' 
  })
  depot_officer_email: string;

  @ApiProperty({ 
    description: 'Phone number of the depot officer',
    example: '+2348012345678' 
  })
  depot_officer_phone: string;

  @ApiProperty({ 
    description: 'House address of the depot officer',
    example: '123 Main Street, Victoria Island, Lagos' 
  })
  depo_officer_house_address: string;

  @ApiProperty({ 
    description: 'Additional description or notes about the depot',
    example: 'Main distribution center for Lagos region',
    required: false 
  })
  description?: string;

  @ApiProperty({ 
    description: 'Status of the depot',
    enum: DepotStatus,
    example: DepotStatus.ACTIVE 
  })
  status: DepotStatus;

  @ApiProperty({ 
    description: 'Date when the depot was created',
    example: '2024-01-15T10:30:00.000Z' 
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Date when the depot was last updated',
    example: '2024-01-15T10:30:00.000Z' 
  })
  updatedAt: Date;
} 