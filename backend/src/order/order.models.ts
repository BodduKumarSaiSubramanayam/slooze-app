import { Field, ObjectType, InputType, Float, Int } from '@nestjs/graphql';
import { User } from '../auth/auth.models';
import { MenuItem } from '../restaurant/restaurant.models';

@ObjectType()
export class OrderItem {
    @Field()
    id: string;

    @Field()
    orderId: string;

    @Field()
    menuItemId: string;

    @Field(() => MenuItem)
    menuItem: MenuItem;

    @Field(() => Int)
    quantity: number;
}

@ObjectType()
export class Order {
    @Field()
    id: string;

    @Field()
    userId: string;

    @Field(() => User, { nullable: true })
    user?: User;

    @Field()
    status: string; // PENDING, PLACED, CANCELLED

    @Field(() => Float)
    totalAmount: number;

    @Field({ nullable: true })
    createdAt?: string;

    @Field(() => [OrderItem], { nullable: true })
    items?: OrderItem[];
}

@InputType()
export class OrderItemInput {
    @Field()
    menuItemId: string;

    @Field(() => Int)
    quantity: number;
}

@InputType()
export class CreateOrderInput {
    @Field(() => [OrderItemInput])
    items: OrderItemInput[];
}
