import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { OrderService } from './order.service';
import { Order, CreateOrderInput } from './order.models';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Resolver(() => Order)
export class OrderResolver {
    constructor(private readonly orderService: OrderService) { }

    @Mutation(() => Order)
    @UseGuards(GqlAuthGuard)
    createOrder(
        @Args('input') input: CreateOrderInput,
        @CurrentUser() user: any,
    ) {
        return this.orderService.createOrder(user.userId || user.id, input);
    }

    @Query(() => [Order])
    @UseGuards(GqlAuthGuard)
    myOrders(@CurrentUser() user: any) {
        return this.orderService.getMyOrders(user.userId || user.id);
    }

    @Mutation(() => Order)
    @UseGuards(GqlAuthGuard)
    cancelOrder(
        @Args('orderId') orderId: string,
        @CurrentUser() user: any,
    ) {
        return this.orderService.cancelOrder(orderId, user.userId || user.id, user.role);
    }

    @Query(() => [Order])
    @UseGuards(GqlAuthGuard)
    getAllOrders(@CurrentUser() user: any) {
        return this.orderService.getAllOrders(user.userId || user.id);
    }

    @Mutation(() => Order)
    @UseGuards(GqlAuthGuard)
    updateOrderStatus(
        @Args('orderId') orderId: string,
        @Args('status') status: string,
        @CurrentUser() user: any,
    ) {
        return this.orderService.updateOrderStatus(orderId, status, user.userId || user.id);
    }
}
