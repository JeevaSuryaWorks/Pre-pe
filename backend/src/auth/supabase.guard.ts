import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import * as jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

const client = jwksClient({
  jwksUri: 'https://jwylhqnbjdsevwbsecjv.supabase.co/auth/v1/keys',
})

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err || !key) {
      return callback(err || new Error('Key not found'))
    }
    const signingKey = key.getPublicKey()
    callback(null, signingKey)
  })
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const authHeader = request.headers.authorization

    if (!authHeader) {
      throw new UnauthorizedException('No token')
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      throw new UnauthorizedException('Invalid token format')
    }

    return new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {}, (err, decoded: any) => {
        if (err) {
          return reject(new UnauthorizedException('Invalid token'))
        }

        // attach user
        request.user = {
          id: decoded.sub,
          email: decoded.email,
        }

        resolve(true)
      })
    })
  }
}
