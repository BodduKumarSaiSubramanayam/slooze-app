'use client';

import { gql, useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const GET_PAYMENT_METHODS = gql`
  query GetMyPaymentMethods {
    myPaymentMethods {
      id
      type
      details
    }
  }
`;

const ADD_PAYMENT_METHOD = gql`
  mutation CreatePaymentMethod($type: String!, $details: String!) {
    createPaymentMethod(input: { type: $type, details: $details }) {
      id
      type
      details
    }
  }
`;

export default function PaymentsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [type, setType] = useState('CREDIT_CARD');
    const [details, setDetails] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!storedUser || !token) {
            router.push('/');
        } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            // Re-BAC: Only Manager (INDIA) is restricted from managing payment methods.
            if (parsedUser.role === 'MANAGER' && parsedUser.country === 'INDIA') {
                alert('Unauthorized. Managers in India are not permitted to manage payment methods.');
                router.push('/dashboard');
            }
        }
    }, [router]);

    const { data, loading, error, refetch } = useQuery<any>(GET_PAYMENT_METHODS, {
        skip: !user || (user.role === 'MANAGER' && user.country === 'INDIA')
    });
    const [addPayment, { loading: adding }] = useMutation(ADD_PAYMENT_METHOD, {
        onCompleted: () => {
            refetch();
            setDetails('');
        }
    });

    if (!user || (user.role === 'MANAGER' && user.country === 'INDIA')) return null; // Ensure rendering stops
    if (loading) return <div className="p-8 text-center text-gray-500">Loading payment methods...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;

    const methods = data?.myPaymentMethods || [];

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addPayment({ variables: { type, details } });
            alert('Payment method added');
        } catch (err: any) {
            alert(err.message || 'Error adding payment method');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-indigo-600 cursor-pointer" onClick={() => router.push('/dashboard')}>Slooze Dashboard</h1>
                    <p className="text-xs font-semibold text-gray-400">Admin Control Panel</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => router.push('/orders')} className="text-sm text-gray-600 hover:text-indigo-600 font-medium">Orders</button>
                    <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-600 hover:text-indigo-600 font-medium">Dashboard</button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6 flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Payment Methods</h2>
                    {methods.length === 0 ? (
                        <p className="bg-white p-6 rounded-xl border italic text-gray-500">No payment methods found.</p>
                    ) : (
                        <ul className="space-y-4">
                            {methods.map((pm: any) => (
                                <li key={pm.id} className="bg-white p-5 rounded-xl border shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{pm.type.replace('_', ' ')}</p>
                                            <p className="text-sm text-gray-500 font-mono mt-1">{pm.details}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="w-full md:w-96 bg-white p-6 rounded-2xl shadow-lg border self-start">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">Add New Method</h3>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="CREDIT_CARD">Credit Card</option>
                                <option value="UPI">UPI</option>
                                <option value="PAYPAL">PayPal</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Details (Mock)</label>
                            <input
                                type="text"
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                placeholder="**** **** **** 1234"
                                className="w-full p-3 border rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={adding}
                            className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700 transition"
                        >
                            {adding ? 'Adding...' : 'Save Payment Method'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
