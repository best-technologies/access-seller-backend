import { Controller, Get, Param, Query, Put, UseGuards, Request, Body, ParseUUIDPipe } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PermissionsService } from './permissions.service';
import { JwtGuard } from '../../auth/guard';
import { GetCustomersDto, GetUserForEditDTO } from './dto/get-customers.dto';
import { EditUserDTO } from './dto/edit-user.dto';
import { CustomersDashboardResponseDto, UserDetailResponseDto } from './dto/customer-response.dto';
import { ApiResponse } from 'src/shared/helper-functions/response';

@Controller('admin/customers')
@UseGuards(JwtGuard)
export class CustomersController {
    constructor(
        private customersService: CustomersService,
        private permissionsService: PermissionsService
    ) {}

    @Get('dashboard')
    async getCustomersDashboard(@Query() query: GetCustomersDto, @Request() req): Promise<ApiResponse<CustomersDashboardResponseDto>> {
        return this.customersService.getCustomersDashboard(query, req.user.id);
    }

    @Get(':id')
    async getUserById(@Param('id') id: string): Promise<ApiResponse<UserDetailResponseDto>> {
        return this.customersService.getUserById(id);
    }

    @Get('edit/:id')
    async getUserForEdit(@Param('id') id: string): Promise<ApiResponse<any>> {
        const dto = new GetUserForEditDTO();
        dto.id = id;
        return this.customersService.getAUserForEdit(dto);
    }

    @Get('permissions/categorized')
    async getCategorizedPermissions(): Promise<ApiResponse<any>> {
        try {
            const categorizedPermissions = await this.permissionsService.getAllPermissionsFromDatabase();
            
            return new ApiResponse(
                true,
                "Categorized permissions retrieved successfully",
                {
                    categorizedPermissions,
                    categories: this.permissionsService.getAvailableCategories(),
                    totalPermissions: Object.values(categorizedPermissions).reduce((sum, permissions) => sum + permissions.length, 0)
                }
            );
        } catch (error) {
            return new ApiResponse(
                false,
                "Failed to retrieve categorized permissions",
                null
            );
        }
    }

    @Get('permissions/flat')
    async getFlatPermissions(): Promise<ApiResponse<any>> {
        try {
            const allPermissions = this.permissionsService.getAllPermissions();
            
            return new ApiResponse(
                true,
                "Flat permissions list retrieved successfully",
                {
                    permissions: allPermissions,
                    totalCount: allPermissions.length
                }
            );
        } catch (error) {
            return new ApiResponse(
                false,
                "Failed to retrieve flat permissions list",
                null
            );
        }
    }

    @Put('edit/:id')
    async editUser(
        @Param('id') id: string,
        @Body() editUserDto: EditUserDTO
    ): Promise<ApiResponse<any>> {
        return this.customersService.editUser(id, editUserDto);
    }
} 