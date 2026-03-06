import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderResolver } from './order.resolver';
import { PrismaModule } from '../prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [OrderService, OrderResolver],
    exports: [OrderService],
})
export class OrderModule { }
