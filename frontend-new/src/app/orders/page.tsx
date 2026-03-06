'use client';

import { gql, useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Utensils, LogOut, ShoppingBag, X, CheckCircle2, XCircle, Clock, Package, ChefHat, ArrowLeft, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GET_ORDERS = gql`
  query GetMyOrders {
    myOrders {
      id
      totalAmount
      status
      createdAt
      user {
        name
        email
      }
      items {
        id
        quantity
        menuItem {
          id
          name
          price
        }
      }
    }
  }
`;

const CANCEL_ORDER = gql`
  mutation CancelOrder($orderId: String!) {
    cancelOrder(orderId: $orderId) {
      id
      status
    }
  }
`;

const CREATE_ORDER = gql`
  mutation CreateOrder($items: [OrderItemInput!]!) {
    createOrder(input: { items: $items }) {
      id
      status
      totalAmount
    }
  }
`;

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
    PLACED: {
        icon: Package,
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        label: 'Order Placed',
    },
    PREPARING: {
        icon: ChefHat,
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        label: 'Preparing',
    },
    ON_THE_WAY: {
        icon: Clock,
        color: 'text-purple-700',
        bg: 'bg-purple-50',
        border: 'border-purple-100',
        label: 'On the Way',
    },
    DELIVERED: {
        icon: CheckCircle2,
        color: 'text-green-700',
        bg: 'bg-green-50',
        border: 'border-green-100',
        label: 'Delivered',
    },
    CANCELLED: {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-100',
        label: 'Cancelled',
    },
};

export default function OrdersPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!storedUser || !token) {
            router.push('/');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [router]);

    const { data, loading, error, refetch } = useQuery(GET_ORDERS, {
        skip: !user,
        fetchPolicy: 'cache-and-network'
    });
    const [cancelOrder, { loading: cancelling }] = useMutation(CANCEL_ORDER, {
        onCompleted: (d) => {
            refetch();
            setCancelSuccess('Order cancelled successfully.');
            setTimeout(() => setCancelSuccess(null), 4000);
        },
    });
    const [createOrder, { loading: ordering }] = useMutation(CREATE_ORDER, {
        refetchQueries: [{ query: GET_ORDERS }],
        onCompleted: () => {
            alert('Reorder successful! Your new order has been placed.');
            router.refresh();
        },
        onError: (err) => {
            alert(err.message || 'Failed to place reorder. Please try again.');
        }
    });

    if (!user) return null;

    const orders = data?.myOrders || [];
    const canCancel = user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'MEMBER';

    const handleCancel = async (orderId: string) => {
        if (!canCancel) return;
        if (confirm('Are you sure you want to cancel this order?')) {
            try {
                await cancelOrder({ variables: { orderId } });
            } catch (err: any) {
                alert(err.message || 'Error cancelling order');
            }
        }
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to log out?')) {
            localStorage.clear();
            router.push('/');
        }
    };

    const handleReorder = async (order: any) => {
        if (ordering) return;
        if (confirm('Are you sure you want to re-order these exact items?')) {
            const itemsToReorder = order.items.map((item: any) => ({
                menuItemId: item.menuItem.id, // Need to make sure query fetches this if missing
                quantity: item.quantity
            }));

            try {
                await createOrder({ variables: { items: itemsToReorder } });
            } catch (err) {
                console.error("Reorder error:", err);
            }
        }
    };

    const formatDate = (dateStr: string | number) => {
        if (!dateStr) return '';
        const d = new Date(
            !isNaN(Number(dateStr)) && !isNaN(parseFloat(String(dateStr)))
                ? Number(dateStr)
                : dateStr
        );
        if (isNaN(d.getTime())) return 'Invalid Date';
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const downloadReceipt = (order: any) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(24);
        doc.setTextColor(79, 70, 229); // Indigo 600
        doc.text('SLOOZE', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Food Delivery Receipt', 105, 28, { align: 'center' });

        // Order Details
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Order ID: #${order.id.slice(0, 8).toUpperCase()}`, 14, 45);
        doc.text(`Date: ${formatDate(order.createdAt)}`, 14, 52);
        doc.text(`Customer: ${order.user?.name || user.name}`, 14, 59);
        doc.text(`Status: ${order.status}`, 14, 66);

        // Items Table
        const tableData = order.items.map((item: any) => [
            item.menuItem.name,
            item.quantity.toString(),
            `$${item.menuItem.price.toFixed(2)}`,
            `$${(item.menuItem.price * item.quantity).toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: 75,
            head: [['Item Name', 'Qty', 'Unit Price', 'Total']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
        });

        // Totals
        const finalY = (doc as any).lastAutoTable.finalY || 100;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Delivery Fee: Free', 14, finalY + 10);
        doc.text(`Total Amount: $${order.totalAmount.toFixed(2)}`, 14, finalY + 18);

        // Footer
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150);
        doc.text('Thank you for ordering with Slooze!', 105, finalY + 40, { align: 'center' });

        doc.save(`Slooze-Receipt-${order.id.slice(0, 8)}.pdf`);
    };

    return (
        <div className="min-h-screen bg-[#F0F4FF] font-sans">
            {/* Cancel Toast */}
            {cancelSuccess && (
                <div className="fixed top-6 right-6 z-50 bg-white border border-red-100 rounded-2xl p-4 shadow-2xl shadow-red-50 flex items-center gap-4 animate-slide-in">
                    <div className="bg-red-100 p-2 rounded-full">
                        <XCircle className="text-red-500 w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 text-sm">Order Cancelled</p>
                        <p className="text-gray-500 text-xs">Your order has been removed.</p>
                    </div>
                    <button onClick={() => setCancelSuccess(null)} className="ml-2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <header className="bg-white sticky top-0 z-40 border-b border-gray-100 px-6 py-4 shadow-sm">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.push('/dashboard')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-indigo-600 transition">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
                            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-md">
                                <Utensils className="text-white w-4 h-4" />
                            </div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight">SLOOZE</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right">
                            <p className="text-xs font-bold text-gray-900">{user.name}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{user.role} • {user.country}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-indigo-100 p-2.5 rounded-2xl">
                        <ShoppingBag className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-gray-900">My Orders</h2>
                        <p className="text-sm text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
                    </div>
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                        <p className="text-gray-400 text-sm font-semibold">Loading your orders...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center text-red-600">
                        <p className="font-semibold mb-2">Failed to load orders</p>
                        <p className="text-sm text-red-400">{error.message}</p>
                    </div>
                )}

                {!loading && !error && orders.length === 0 && (
                    <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
                        <p className="text-gray-500 mb-6">Looks like you haven't placed any orders yet. Start exploring!</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-200"
                        >
                            Browse Restaurants
                        </button>
                    </div>
                )}

                <div className="space-y-4">
                    {orders.map((order: any) => {
                        const status = order.status || 'PLACED';
                        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['PLACED'];
                        const StatusIcon = cfg.icon;
                        const isExpanded = expandedOrderId === order.id;
                        const itemCount = order.items.reduce((a: number, i: any) => a + i.quantity, 0);

                        return (
                            <div key={order.id} className={`bg-white rounded-3xl border ${cfg.border} shadow-sm overflow-hidden transition-all`}>
                                {/* Order Header */}
                                <div
                                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition"
                                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-2xl ${cfg.bg}`}>
                                            <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="font-black text-gray-900 text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                {itemCount} item{itemCount !== 1 ? 's' : ''} • {formatDate(order.createdAt)}
                                            </p>
                                            {user.role === 'ADMIN' && (
                                                <p className="text-[10px] text-gray-400 mt-0.5">Placed by {order.user?.name}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <p className="font-black text-lg text-indigo-600">${order.totalAmount.toFixed(2)}</p>
                                        <div className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-gray-50 px-5 pb-5 pt-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Order Items</p>
                                        <ul className="space-y-2 mb-5">
                                            {order.items.map((item: any) => (
                                                <li key={item.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black flex items-center justify-center">{item.quantity}x</span>
                                                        <span className="font-semibold text-sm text-gray-800">{item.menuItem.name}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-600">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-500">
                                                <span className="font-semibold">Total: </span>
                                                <span className="font-black text-indigo-600">${order.totalAmount.toFixed(2)}</span>
                                                <span className="ml-2 text-emerald-500 font-semibold text-xs">+ Free Delivery</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleReorder(order); }}
                                                    disabled={ordering}
                                                    className="flex items-center gap-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-xl font-bold transition disabled:opacity-50"
                                                >
                                                    <Package className="w-4 h-4" />
                                                    {ordering ? 'Reordering...' : 'Reorder'}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); downloadReceipt(order); }}
                                                    className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl font-bold transition"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Receipt
                                                </button>
                                                {order.status !== 'CANCELLED' && canCancel && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleCancel(order.id); }}
                                                        disabled={cancelling}
                                                        className="flex items-center gap-2 text-sm text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl font-bold transition disabled:opacity-50"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                        {cancelling ? 'Cancelling...' : 'Cancel Order'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; }
                @keyframes slide-in {
                    from { opacity: 0; transform: translateX(50px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-slide-in { animation: slide-in 0.3s ease-out; }
            `}</style>
        </div>
    );
}
