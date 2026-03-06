import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePaymentMethodInput } from './payment.models';

@Injectable()
export class PaymentService {
    constructor(private prisma: PrismaService) { }

    async createPaymentMethod(userId: string, input: CreatePaymentMethodInput) {
        return this.prisma.paymentMethod.create({
            data: {
                userId,
                type: input.type,
                details: input.details,
            },
            include: { user: true }
        });
    }

    async getMyPaymentMethods(userId: string) {
        return this.prisma.paymentMethod.findMany({
            where: { userId },
            include: { user: true }
        });
    }
}
