import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderInput } from './order.models';

@Injectable()
export class OrderService {
    constructor(private prisma: PrismaService) { }

    async createOrder(userId: string, input: CreateOrderInput) {
        // Calculate total amounts and check restaurant countries
        let totalAmount = 0;
        const restaurantCountries = new Set<string>();

        for (const item of input.items) {
            const menuItem = await this.prisma.menuItem.findUnique({
                where: { id: item.menuItemId },
                include: { restaurant: true },
            });

            if (!menuItem) {
                throw new NotFoundException(`MenuItem ${item.menuItemId} not found`);
            }

            if (menuItem.restaurant) {
                restaurantCountries.add(menuItem.restaurant.country);
            }

            totalAmount += menuItem.price * item.quantity;
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        if (user.country !== 'GLOBAL') {
            for (const country of restaurantCountries) {
                if (country !== user.country) {
                    throw new ForbiddenException(`You can only order from restaurants in your country (${user.country})`);
                }
            }
        }

        const earnedCoins = Math.floor(totalAmount * 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { sloozeCoins: { increment: earnedCoins } }
        });

        return this.prisma.order.create({
            data: {
                userId,
                status: 'PLACED',
                totalAmount,
                items: {
                    create: input.items.map(item => ({
                        menuItemId: item.menuItemId,
                        quantity: item.quantity,
                    })),
                },
            },
            include: {
                items: {
                    include: {
                        menuItem: true
                    }
                }
            }
        });
    }

    async getMyOrders(userId: string) {
        return this.prisma.order.findMany({
            where: { userId },
            include: {
                user: true,
                items: {
                    include: {
                        menuItem: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async cancelOrder(orderId: string, userId: string, role: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const currentUser = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser) throw new NotFoundException('User not found');

        if (currentUser.role !== 'ADMIN' && order.userId !== userId) {
            // Check if manager is in the same country as the order's restaurant
            const firstItem = await this.prisma.orderItem.findFirst({
                where: { orderId: order.id },
                include: { menuItem: { include: { restaurant: true } } }
            });
            const restaurantCountry = firstItem?.menuItem?.restaurant?.country;

            if (currentUser.country !== 'GLOBAL' && currentUser.country !== restaurantCountry) {
                throw new ForbiddenException(`You can only cancel orders for restaurants in your country (${currentUser.country})`);
            }
        }

        return this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'CANCELLED' },
            include: {
                items: {
                    include: {
                        menuItem: true
                    }
                }
            }
        });
    }

    async getAllOrders(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // ADMIN sees everything, MANAGER sees only orders from their country
        if (user.role === 'ADMIN') {
            return this.prisma.order.findMany({
                include: { user: true, items: { include: { menuItem: true } } },
                orderBy: { createdAt: 'desc' }
            });
        }

        if (user.role === 'MANAGER') {
            return this.prisma.order.findMany({
                where: { user: { country: user.country } },
                include: { user: true, items: { include: { menuItem: true } } },
                orderBy: { createdAt: 'desc' }
            });
        }

        throw new ForbiddenException('You do not have permission to view all orders');
    }

    async updateOrderStatus(orderId: string, status: string, userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        if (user.role === 'MEMBER') {
            throw new ForbiddenException('Members cannot update order status');
        }

        // Managers can only update orders from their country
        if (user.role === 'MANAGER') {
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
                include: { user: true }
            });

            if (!order || order.user?.country !== user.country) {
                throw new ForbiddenException('You can only update orders from your country');
            }
        }

        return this.prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: {
                user: true,
                items: {
                    include: {
                        menuItem: true
                    }
                }
            }
        });
    }
}
