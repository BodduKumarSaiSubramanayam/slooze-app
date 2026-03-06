import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (user && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            country: user.country
        };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }

    async signup(signupInput: any) {
        const hashedPassword = await bcrypt.hash(signupInput.password, 10);
        const user = await this.prisma.user.create({
            data: {
                ...signupInput,
                password: hashedPassword,
            },
        });
        return this.login(user);
    }
}
