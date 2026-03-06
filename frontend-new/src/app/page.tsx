'use client';

import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(loginInput: { email: $email, password: $password }) {
      access_token
      user {
        id
        email
        name
        role
        country
      }
    }
  }
`;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [login, { loading }] = useMutation<any>(LOGIN_MUTATION);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const { data } = await login({ variables: { email, password } });
      if (data?.login?.access_token) {
        localStorage.setItem('token', data.login.access_token);
        localStorage.setItem('user', JSON.stringify(data.login.user));
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    }
  };

  const autofill = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-indigo-600">Slooze</h1>
        <p className="text-gray-500 text-center mb-8">Role-Based Food Ordering</p>

        {errorMsg && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{errorMsg}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          New to Slooze?{' '}
          <Link href="/auth/signup" className="text-indigo-600 font-semibold hover:underline">
            Create an account
          </Link>
        </p>

        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 text-center">Quick Test Accounts</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button onClick={() => autofill('nick@slooze.xyz', 'password123')} className="p-2 border rounded hover:bg-gray-50 transition text-left">
              <span className="font-bold block text-indigo-600">Admin</span> nick@slooze.xyz
            </button>
            <button onClick={() => autofill('marvel@slooze.xyz', 'password123')} className="p-2 border rounded hover:bg-gray-50 transition text-left">
              <span className="font-bold block text-blue-600">Mgr (IN)</span> marvel@slooze.xyz
            </button>
            <button onClick={() => autofill('america@slooze.xyz', 'password123')} className="p-2 border rounded hover:bg-gray-50 transition text-left">
              <span className="font-bold block text-blue-600">Mgr (US)</span> america@slooze...
            </button>
            <button onClick={() => autofill('thanos@slooze.xyz', 'password123')} className="p-2 border rounded hover:bg-gray-50 transition text-left">
              <span className="font-bold block text-green-600">Mem (IN)</span> thanos@slooze.xyz
            </button>
            <button onClick={() => autofill('travis@slooze.xyz', 'password123')} className="p-2 border rounded hover:bg-gray-50 transition text-left">
              <span className="font-bold block text-green-600">Mem (US)</span> travis@slooze.xyz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
