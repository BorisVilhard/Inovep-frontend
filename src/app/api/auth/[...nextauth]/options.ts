import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import axios from 'axios';

export const options: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: {
          label: 'Username:',
          type: 'text',
          placeholder: 'your-cool-username',
        },
        password: {
          label: 'Password:',
          type: 'password',
          placeholder: 'your-awesome-password',
        },
      },
      async authorize(credentials) {
        try {
          const res = await axios.post('http://localhost:3500/auth', {
            user: credentials?.username,
            pwd: credentials?.password,
          });
          if (res.status === 200) {
            return {
              id: res.data.refreshToken,
              name: res.data.username,
              password: res.data.refreshToken,
            };
          } else {
            console.error(`Failed to log in with status: ${res.status}`);
            return null;
          }
        } catch (error) {
          console.error('Login error:', error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
};
