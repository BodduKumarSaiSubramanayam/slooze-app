import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RestaurantService {
    constructor(private prisma: PrismaService) { }

    async findAll(country?: string) {
        if (country) {
            return this.prisma.restaurant.findMany({
                where: { country },
                include: { menuItems: true },
            });
        }
        return this.prisma.restaurant.findMany({
            include: { menuItems: true },
        });
    }

    async findOne(id: string) {
        return this.prisma.restaurant.findUnique({
            where: { id },
            include: { menuItems: true },
        });
    }
}
