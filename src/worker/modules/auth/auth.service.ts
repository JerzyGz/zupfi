
import { Env } from '@/worker';
import * as jose from 'jose';

export class AuthService {
    private env: Env;
    constructor(env: Env) {
        this.env = env;
    }

    async generateTemporalToken({ clerkId }: { clerkId: string }) {
        const secret = new TextEncoder().encode(this.env.JWT_SECRET);
        const token = await new jose.SignJWT({ clerkId })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('5m')
            .sign(secret);
        console.log({ token })
        return token;

    }

    async verifyTemporalToken(token: string) {
        const secret = new TextEncoder().encode(this.env.JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret);
        console.log('verifyToken', payload);
        return payload;
    }
}