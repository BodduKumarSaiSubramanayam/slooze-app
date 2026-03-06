'use client';

import { gql, useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, Package, ChefHat, Clock, CheckCircle2, User, ChevronDown } from 'lucide-react';

const GET_ALL_ORDERS = gql`
  query GetAllOrders {
    getAllOrders {
      id
      totalAmount
      status
      createdAt
      user {
        name
        email
        country
      }
      items {
        id
        quantity
        menuItem {
          name
          price
        }
      }
    }
  }
`;

const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: String!, $status: String!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      id
      status
    }
  }
`;

const STATUS_OPTIONS = ['PLACED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'];

export default function AdminPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const { data, loading, error, refetch } = useQuery(GET_ALL_ORDERS, {
        pollInterval: 10000, // Refresh every 10 seconds
        onError: (err) => {
            if (err.message.includes('Forbidden') || err.message.includes('permission')) {
                router.push('/dashboard');
            }
        }
    });

    const [updateStatus, { loading: updating }] = useMutation(UPDATE_ORDER_STATUS, {
        onCompleted: () => refetch()
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'ADMIN' && parsedUser.role !== 'MANAGER') {
            router.push('/dashboard');
        } else {
            setUser(parsedUser);
        }
    }, [router]);

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        if (!newStatus) return;
        try {
            await updateStatus({ variables: { orderId, status: newStatus } });
        } catch (err: any) {
            alert(err.message || 'Error updating status');
        }
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
        }
    };

    if (!user) return null;

    const orders = data?.getAllOrders || [];

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <header className="bg-white border-b border-indigo-100 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <span className="text-white font-black text-2xl tracking-tighter">S</span>
                        </div>
                        <div>
                            <h1 className="font-black tracking-tight text-2xl text-gray-900 leading-none">SLOOZE</h1>
                            <p className="text-sm font-bold text-indigo-600">{user.role} DASHBOARD</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl transition"
                        >
                            Customer View
                        </button>
                        <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition group"
                            >
                                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Live Orders</h2>
                        <p className="text-gray-500 font-medium">Manage and update customer orders across the platform.</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-bold text-gray-600">Auto-refreshing</span>
                    </div>
                </div>

                {loading && !data && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                        <p className="text-gray-400 text-sm font-semibold">Loading system orders...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center text-red-600">
                        <p className="font-semibold mb-2">Failed to load orders</p>
                        <p className="text-sm text-red-400">{error.message}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {orders.map((order: any) => {
                        const itemCount = order.items.reduce((a: number, i: any) => a + i.quantity, 0);
                        const d = new Date(Number(order.createdAt) || order.createdAt);
                        const time = isNaN(d.getTime()) ? 'Unknown Time' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                            <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between hover:shadow-md transition">

                                <div className="flex items-start gap-5 flex-1">
                                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-indigo-600">
                                        <Package className="w-6 h-6" />
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-end gap-3">
                                            <p className="font-black text-lg text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</p>
                                            <p className="text-sm font-bold text-gray-400">{time}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                            <User className="w-4 h-4 text-gray-400" />
                                            {order.user?.name} · {order.user?.email}
                                        </div>
                                        <p className="text-sm text-gray-500 pt-1 border-t border-gray-50 mt-2">
                                            <span className="font-bold text-gray-700">{itemCount} items:</span> {order.items.map((i: any) => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col md:items-end gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                    <p className="font-black text-2xl text-indigo-600">${order.totalAmount.toFixed(2)}</p>

                                    <div className="relative">
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                            disabled={updating}
                                            className={`appearance-none pl-4 pr-10 py-2.5 rounded-xl font-bold text-sm border focus:outline-none focus:ring-2 disabled:opacity-50 transition ${order.status === 'DELIVERED' ? 'bg-green-50 border-green-200 text-green-700 focus:ring-green-500' :
                                                    order.status === 'CANCELLED' ? 'bg-red-50 border-red-200 text-red-700 focus:ring-red-500' :
                                                        order.status === 'PLACED' ? 'bg-blue-50 border-blue-200 text-blue-700 focus:ring-blue-500' :
                                                            'bg-amber-50 border-amber-200 text-amber-700 focus:ring-amber-500'
                                                }`}
                                        >
                                            {STATUS_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                    </div>
                                </div>

                            </div>
                        );
                    })}

                    {orders.length === 0 && !loading && !error && (
                        <div className="text-center py-20 text-gray-500 font-medium">
                            No orders found in the system right now.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
