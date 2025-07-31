import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { PermissionsService } from './permissions.service';

@Module({
    imports: [],
    controllers: [CustomersController],
    providers: [CustomersService, PermissionsService],
    exports: [CustomersService, PermissionsService]
})
export class CustomersModule {} 