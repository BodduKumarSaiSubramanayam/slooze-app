import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { RestaurantResolver } from './restaurant.resolver';
import { PrismaModule } from '../prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [RestaurantService, RestaurantResolver],
    exports: [RestaurantService],
})
export class RestaurantModule { }
