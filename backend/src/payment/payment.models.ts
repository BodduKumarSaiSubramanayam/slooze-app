import { Field, ObjectType, InputType } from '@nestjs/graphql';

@ObjectType()
export class PaymentMethod {
    @Field()
    id: string;

    @Field()
    userId: string;

    @Field()
    type: string;

    @Field()
    details: string;
}

@InputType()
export class CreatePaymentMethodInput {
    @Field()
    type: string;

    @Field()
    details: string;
}
