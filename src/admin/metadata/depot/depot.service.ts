import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDepotDto, DepotStatus } from './dto/create-depot.dto';
import { UpdateDepotDto } from './dto/update-depot.dto';
import { DepotResponseDto } from './dto/depot-response.dto';
import * as colors from 'colors';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';

@Injectable()
export class DepotService {
  private readonly logger = new Logger(DepotService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDepotDto: CreateDepotDto, user: any) {
    this.logger.log(colors.cyan(`🏢 Creating new depot for user: ${user.email}`));

    const existingUserStore = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        store_id: true,
      },
    });

    if (!existingUserStore) {
      this.logger.error(colors.red(`❌ User ${user.email} does not have an associated store`));
      throw new BadRequestException('User does not have an associated store');
    }

    try {
      // Get the store ID from the authenticated user
      const storeId = existingUserStore.store_id;
      
      if (!storeId) {
        this.logger.error(colors.red(`❌ User ${user.email} does not have an associated store`));
        throw new BadRequestException('User does not have an associated store');
      }

      // Verify the store exists
      const store = await this.prisma.store.findUnique({
        where: { id: storeId },
      });

      if (!store) {
        this.logger.error(colors.red(`❌ Store with ID ${storeId} not found`));
        throw new NotFoundException(`Store with ID ${storeId} not found`);
      }

      // Normalize input data
      const normalizedData = {
        ...createDepotDto,
        state: createDepotDto.state?.trim().toLowerCase(),
        city: createDepotDto.city?.trim().toLowerCase(),
        depot_officer_name: createDepotDto.depot_officer_name?.trim(),
        depot_officer_email: createDepotDto.depot_officer_email?.trim().toLowerCase(),
        depot_officer_phone: createDepotDto.depot_officer_phone?.trim(),
        depo_officer_house_address: createDepotDto.depo_officer_house_address?.trim(),
        description: createDepotDto.description?.trim(),
      };

      // Check if depot already exists
      const existingDepot = await this.prisma.depot.findFirst({
        where: {
          storeId,
          depot_officer_email: normalizedData.depot_officer_email,
        },
      });

      if (existingDepot) {
        this.logger.error(colors.red(`❌ Depot with officer email ${normalizedData.depot_officer_email} already exists`));
        throw new BadRequestException('Depot with this officer email already exists');
      }

      this.logger.log(colors.yellow(`📋 Creating depot with data: ${JSON.stringify({
        storeId,
        state: normalizedData.state,
        city: normalizedData.city,
        officer_name: normalizedData.depot_officer_name
      })}`));

      const depot = await this.prisma.depot.create({
        data: {
          ...normalizedData,
          storeId,
        },
        include: {
          store: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(colors.blue(`✅ Depot created successfully with ID: ${depot.id}`));
      return ResponseHelper.success(
        "Depot created successfully",
        this.mapToResponseDto(depot)
      );
    } catch (error) {
      this.logger.error(colors.red(`❌ Error creating depot: ${error.message}`));
      throw error;
    }
  }

  async findAll() {
    this.logger.log(colors.cyan('📋 Fetching all depots'));
    
    try {
      const depots = await this.prisma.depot.findMany({
        include: {
          store: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        where: {
          status: DepotStatus.ACTIVE, // Only return active depots
        },
        orderBy: [
          { state: 'asc' },
          { city: 'asc' },
        ],
      });

      this.logger.log(colors.green(`✅ Found ${depots.length} depots`));
      return ResponseHelper.success(
        "Depots fetched successfully",
        depots.map(depot => this.mapToResponseDto(depot))
      );
    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching depots: ${error.message}`));
      throw error;
    }
  }

  async findOne(id: string, user: any) {
    this.logger.log(colors.cyan(`🔍 Fetching depot with ID: ${id} for user: ${user.email}`));
    
    try {
      const storeId = user.store_id;
      
      if (!storeId) {
        this.logger.error(colors.red(`❌ User ${user.email} does not have an associated store`));
        throw new BadRequestException('User does not have an associated store');
      }

      const depot = await this.prisma.depot.findFirst({
        where: { 
          id,
          storeId, // Ensure user can only access their own depots
        },
        include: {
          store: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      });

      if (!depot) {
        this.logger.warn(colors.yellow(`⚠️ Depot with ID ${id} not found for store ${storeId}`));
        throw new NotFoundException(`Depot with ID ${id} not found`);
      }

      this.logger.log(colors.green(`✅ Depot found: ${depot.id}`));
      return ResponseHelper.success(
        "Depot fetched successfully",
        this.mapToResponseDto(depot)
      );
    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching depot ${id}: ${error.message}`));
      throw error;
    }
  }

  async update(id: string, updateDepotDto: UpdateDepotDto, user: any) {
    this.logger.log(colors.cyan(`🔄 Updating depot with ID: ${id} for user: ${user.email}`));
    
    try {

      // Check if depot exists and belongs to the user's store
      const existingDepot = await this.prisma.depot.findFirst({
        where: { 
          id
        },
      });

      if (!existingDepot) {
        this.logger.warn(colors.yellow(`⚠️ Depot with ID ${id} not found`));
        throw new NotFoundException(`Depot with ID ${id} not found`);
      }

      // Normalize input data for update
      const normalizedUpdateData = {
        ...updateDepotDto,
        ...(updateDepotDto.state && { state: updateDepotDto.state.trim().toLowerCase() }),
        ...(updateDepotDto.city && { city: updateDepotDto.city.trim().toLowerCase() }),
        ...(updateDepotDto.depot_officer_name && { depot_officer_name: updateDepotDto.depot_officer_name.trim() }),
        ...(updateDepotDto.depot_officer_email && { depot_officer_email: updateDepotDto.depot_officer_email.trim().toLowerCase() }),
        ...(updateDepotDto.depot_officer_phone && { depot_officer_phone: updateDepotDto.depot_officer_phone.trim() }),
        ...(updateDepotDto.depo_officer_house_address && { depo_officer_house_address: updateDepotDto.depo_officer_house_address.trim() }),
        ...(updateDepotDto.description && { description: updateDepotDto.description.trim() }),
      };

      this.logger.log(colors.yellow(`📋 Updating depot with data: ${JSON.stringify(normalizedUpdateData)}`));

      const updatedDepot = await this.prisma.depot.update({
        where: { id },
        data: normalizedUpdateData,
        include: {
          store: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(colors.green(`✅ Depot updated successfully: ${updatedDepot.id}`));
      return ResponseHelper.success(
        "Depot updated successfully",
        this.mapToResponseDto(updatedDepot)
      );
    } catch (error) {
      this.logger.error(colors.red(`❌ Error updating depot ${id}: ${error.message}`));
      throw error;
    }
  }

  async remove(id: string, user: any) {
    this.logger.log(colors.cyan(`🗑️ Deleting depot with ID: ${id} for user: ${user.email}`));
    
    try {
      

      // Check if depot exists and belongs to the user's store
      const depot = await this.prisma.depot.findFirst({
        where: { 
          id
        },
      });

      if (!depot) {
        this.logger.warn(colors.yellow(`⚠️ Depot with ID ${id} not found`));
        throw new NotFoundException(`Depot with ID ${id} not found`);
      }

      await this.prisma.depot.delete({
        where: { id },
      });

      this.logger.log(colors.green(`✅ Depot deleted successfully: ${id}`));
      return ResponseHelper.success(
        "Depot deleted successfully",
        null
      );
    } catch (error) {
      this.logger.error(colors.red(`❌ Error deleting depot ${id}: ${error.message}`));
      throw error;
    }
  }

  private mapToResponseDto(depot: any): DepotResponseDto {
    return {
      id: depot.id,
      storeId: depot.storeId,
      state: depot.state,
      city: depot.city,
      depot_officer_name: depot.depot_officer_name,
      depot_officer_email: depot.depot_officer_email,
      depot_officer_phone: depot.depot_officer_phone,
      depo_officer_house_address: depot.depo_officer_house_address,
      description: depot.description,
      status: depot.status,
      createdAt: depot.createdAt,
      updatedAt: depot.updatedAt,
    };
  }
}
