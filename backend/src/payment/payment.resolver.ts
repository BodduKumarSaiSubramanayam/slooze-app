import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { PaymentService } from './payment.service';
import { PaymentMethod, CreatePaymentMethodInput } from './payment.models';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Resolver(() => PaymentMethod)
export class PaymentResolver {
    constructor(private readonly paymentService: PaymentService) { }

    @Mutation(() => PaymentMethod)
    @UseGuards(GqlAuthGuard)
    async addPaymentMethod(
        @Args('input') input: CreatePaymentMethodInput,
        @CurrentUser() user: any,
    ) {
        if (user.role === 'MANAGER' && user.country === 'INDIA') {
            throw new Error('Managers in INDIA are not allowed to edit payment methods.');
        }
        return this.paymentService.createPaymentMethod(user.userId || user.id, input);
    }

    @Query(() => [PaymentMethod])
    @UseGuards(GqlAuthGuard)
    myPaymentMethods(@CurrentUser() user: any) {
        return this.paymentService.getMyPaymentMethods(user.userId || user.id);
    }
}
