'use client';

import { gql, useQuery, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    ShoppingCart, Utensils, MapPin, LogOut, ClipboardList,
    Plus, Minus, CheckCircle2, Search, Star, Clock, Trash2, X, ChefHat,
    ChevronLeft, ChevronRight, TrendingUp
} from 'lucide-react';

const GET_RESTAURANTS = gql`
  query GetRestaurants {
    restaurants {
      id
      name
      country
      category
      menuItems {
        id
        name
        price
        category
      }
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

const RATE_MENU_ITEM = gql`
  mutation RateMenuItem($menuItemId: String!, $score: Int!) {
    rateMenuItem(input: { menuItemId: $menuItemId, score: $score }) {
      menuItemId
      averageRating
      totalRatings
      userRating
    }
  }
`;

const ME_QUERY = gql`
  query GetMe {
    me {
      id
      email
      name
      role
      country
      sloozeCoins
    }
  }
`;

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [cart, setCart] = useState<{ menuItemId: string; quantity: number; name: string; price: number; restaurant: string }[]>([]);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [successOrder, setSuccessOrder] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'menu' | 'cart'>('menu');
    // ratings: { [menuItemId]: { avg: number, total: number, userRating: number | null } }
    const [ratings, setRatings] = useState<Record<string, { avg: number; total: number; userRating: number | null }>>({});
    const [currentTrendingIdx, setCurrentTrendingIdx] = useState(0);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!storedUser || !token) {
            router.push('/');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [router]);

    const { data, loading, error } = useQuery<any>(GET_RESTAURANTS, { skip: !user });
    const { data: meData } = useQuery(ME_QUERY, {
        skip: !user,
        fetchPolicy: 'network-only'
    });

    useEffect(() => {
        if (error?.message.includes('Unauthorized')) {
            localStorage.clear();
            router.push('/');
        }
    }, [error, router]);

    const [createOrder, { loading: ordering }] = useMutation(CREATE_ORDER);
    const [rateMenuItem] = useMutation(RATE_MENU_ITEM);

    const handleRate = async (menuItemId: string, score: number) => {
        try {
            const { data } = await rateMenuItem({ variables: { menuItemId, score } });
            const r = data?.rateMenuItem;
            if (r) {
                setRatings(prev => ({
                    ...prev,
                    [menuItemId]: { avg: r.averageRating, total: r.totalRatings, userRating: r.userRating },
                }));
            }
        } catch (e) {
            // silently fail rating
        }
    };

    if (!user) return null;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0F4FF]">
                <div className="relative w-16 h-16 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
                </div>
                <p className="text-gray-500 font-semibold text-sm tracking-widest uppercase">Loading your menu...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F0F4FF] p-4 text-center">
                <div className="text-5xl mb-4">😕</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
                <p className="text-gray-500 mb-6">{error.message}</p>
                <button onClick={() => router.refresh()} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition">Try Again</button>
            </div>
        );
    }

    const restaurants = data?.restaurants || [];

    // Extract unique categories
    const categories: string[] = ['All', ...(Array.from(new Set(restaurants.map((r: any) => String(r.category || 'General')))) as string[])];

    // Filter by search query and category
    const filteredRestaurants = restaurants
        .filter((r: any) => selectedCategory === 'All' || (r.category || 'General') === selectedCategory)
        .map((r: any) => ({
            ...r,
            menuItems: r.menuItems.filter((item: any) =>
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                r.name.toLowerCase().includes(search.toLowerCase())
            ),
        }))
        .filter((r: any) => r.menuItems.length > 0);

    // Get Trending Items (Mock logic: top 3 items from filtered restaurants)
    const allItems = filteredRestaurants.flatMap((r: any) =>
        r.menuItems.map((item: any) => ({ ...item, restaurantName: r.name }))
    );
    const trendingItems = allItems.slice(0, 3); // For simplicity, take first 3 as trending

    const nextTrending = () => setCurrentTrendingIdx((currentTrendingIdx + 1) % trendingItems.length);
    const prevTrending = () => setCurrentTrendingIdx((currentTrendingIdx - 1 + trendingItems.length) % trendingItems.length);

    const handleSurpriseMe = () => {
        const starters: any[] = [];
        const mainCourses: any[] = [];
        const drinks: any[] = [];

        filteredRestaurants.forEach((r: any) => {
            r.menuItems.forEach((item: any) => {
                const cat = (item.category || '').toLowerCase();
                const itemData = { ...item, restaurant: r.name };
                if (cat.includes('starter') || cat.includes('appetizer')) starters.push(itemData);
                else if (cat.includes('drink') || cat.includes('beverage')) drinks.push(itemData);
                else mainCourses.push(itemData);
            });
        });

        const randomPick = (arr: any[]) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

        const picks = [randomPick(starters), randomPick(mainCourses), randomPick(drinks)].filter(Boolean);

        if (picks.length > 0) {
            setCart(prev => {
                const newCart = [...prev];
                picks.forEach(pick => {
                    if (pick) {
                        const existing = newCart.find(c => c.menuItemId === pick.id);
                        if (existing) {
                            existing.quantity += 1;
                        } else {
                            newCart.push({
                                menuItemId: pick.id,
                                quantity: 1,
                                name: pick.name,
                                price: pick.price,
                                restaurant: pick.restaurant
                            });
                        }
                    }
                });
                return newCart;
            });
            setActiveTab('cart');
        } else {
            alert('Not enough items to build a surprise meal!');
        }
    };

    const addToCart = (menuItem: any, restaurantName: string) => {
        setCart(prev => {
            const existing = prev.find(item => item.menuItemId === menuItem.id);
            if (existing) {
                return prev.map(item => item.menuItemId === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { menuItemId: menuItem.id, quantity: 1, name: menuItem.name, price: menuItem.price, restaurant: restaurantName }];
        });
    };

    const updateCartQuantity = (menuItemId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.menuItemId === menuItemId) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const removeFromCart = (menuItemId: string) => {
        setCart(prev => prev.filter(item => item.menuItemId !== menuItemId));
    };

    const placeOrder = async () => {
        if (cart.length === 0) return;
        try {
            const items = cart.map(({ menuItemId, quantity }) => ({ menuItemId, quantity }));
            const result = await createOrder({ variables: { items } });
            const orderId = result.data?.createOrder?.id?.slice(0, 8);
            setCart([]);
            setSuccessOrder(orderId);
            setTimeout(() => setSuccessOrder(null), 5000);
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to place order';
            if (errorMsg.includes('User not found')) {
                alert('Your session has expired or your account was reset. Please log in again.');
                localStorage.clear();
                router.push('/');
            } else {
                alert(errorMsg);
            }
        }
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to log out?')) {
            localStorage.clear();
            router.push('/');
        }
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    // Group cart items by restaurant
    const cartByRestaurant = cart.reduce((acc: any, item) => {
        if (!acc[item.restaurant]) acc[item.restaurant] = [];
        acc[item.restaurant].push(item);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-[#F0F4FF] flex flex-col font-sans">
            {/* Success Toast */}
            {successOrder && (
                <div className="fixed top-6 right-6 z-50 bg-white border border-green-200 rounded-2xl p-4 shadow-2xl shadow-green-100 flex items-center gap-4 animate-slide-in">
                    <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle2 className="text-green-600 w-6 h-6" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 text-sm">Order Placed! 🎉</p>
                        <p className="text-gray-500 text-xs">Order #{successOrder} is confirmed</p>
                    </div>
                    <button onClick={() => setSuccessOrder(null)} className="ml-2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <header className="bg-white sticky top-0 z-40 border-b border-gray-100 px-6 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => router.push('/dashboard')}>
                        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-md group-hover:scale-105 transition-transform">
                            <Utensils className="text-white w-5 h-5" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">SLOOZE</h1>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-sm mx-8 hidden md:block">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search dishes or restaurants..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/orders')}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 font-semibold transition py-2 px-3 rounded-xl hover:bg-indigo-50"
                        >
                            <ClipboardList className="w-4 h-4" />
                            <span className="hidden sm:inline">Orders</span>
                        </button>

                        {/* Cart icon for mobile */}
                        <button className="relative md:hidden p-2 rounded-xl border border-gray-200 bg-white" onClick={() => setActiveTab('cart')}>
                            <ShoppingCart className="w-5 h-5 text-gray-700" />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">{cartItemCount}</span>
                            )}
                        </button>

                        <div className="flex items-center gap-2 pl-2 border-l border-gray-100 ml-1">
                            <div className="flex flex-col items-end mr-2 hidden sm:flex">
                                <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 shadow-sm cursor-help" title="Slooze Coins earned from your purchases!">
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-inner flex items-center justify-center -ml-1">
                                        <span className="text-[9px] font-black text-amber-900 leading-none">S</span>
                                    </div>
                                    <span className="text-xs font-black text-amber-600">{meData?.me?.sloozeCoins ?? 0}</span>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                {user.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="hidden sm:block text-right">
                                <p className="text-xs font-bold text-gray-900 leading-none mb-0.5">{user.name}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{user.role} • {user.country}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition ml-1"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile search */}
            <div className="md:hidden px-4 pt-4 pb-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search dishes or restaurants..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
                    />
                </div>
            </div>

            <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-8 flex flex-col lg:flex-row gap-8 items-start">
                {/* Left: Restaurants */}
                <div className="flex-1 w-full">
                    <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">Discover Local Flavors</h2>
                            <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium mb-4">
                                <MapPin className="w-4 h-4 text-indigo-500" />
                                <span>Restaurants available in <span className="text-indigo-600 font-bold">{user.country}</span></span>
                            </div>
                            {/* Category Pills */}
                            <div className="flex flex-wrap gap-2">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${selectedCategory === category
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {search && (
                            <button onClick={() => setSearch('')} className="text-sm text-gray-500 hover:text-indigo-600 flex items-center gap-1 font-medium">
                                <X className="w-3 h-3" /> Clear search
                            </button>
                        )}
                    </div>

                    {/* Trending Carousel */}
                    {trendingItems.length > 0 && !search && (
                        <div className="mb-8 relative group">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Trending Near You</h2>
                            </div>

                            <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-xl h-48 md:h-64">
                                {trendingItems.map((item: any, idx: number) => (
                                    <div
                                        key={item.id}
                                        className={`absolute inset-0 transition-all duration-700 ease-in-out flex flex-col md:flex-row ${idx === currentTrendingIdx ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
                                            }`}
                                    >
                                        <div className="w-full md:w-1/2 h-full bg-gradient-to-br from-indigo-500 to-purple-600 p-8 flex flex-col justify-center text-white">
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 w-fit px-2 py-1 rounded-md mb-3">🔥 HOT SELLER</span>
                                            <h3 className="text-2xl md:text-3xl font-black mb-2 leading-tight">{item.name}</h3>
                                            <p className="text-indigo-100 font-bold mb-4 opacity-90">{item.restaurantName}</p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl font-black">${item.price.toFixed(2)}</span>
                                                <button
                                                    onClick={() => addToCart(item, item.restaurantName)}
                                                    className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-bold hover:bg-indigo-50 transition transform hover:scale-105"
                                                >
                                                    Add to Cart
                                                </button>
                                            </div>
                                        </div>
                                        <div className="hidden md:flex w-1/2 h-full bg-slate-50 relative items-center justify-center p-12">
                                            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/10" />
                                            <div className="w-48 h-48 rounded-full bg-indigo-100/50 flex items-center justify-center animate-pulse">
                                                <Utensils className="w-24 h-24 text-indigo-300 opacity-50" />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Carousel Controls */}
                                <button
                                    onClick={prevTrending}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg text-gray-700 transition opacity-0 group-hover:opacity-100 z-20"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={nextTrending}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg text-gray-700 transition opacity-0 group-hover:opacity-100 z-20"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>

                                {/* Dots */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                                    {(trendingItems as any[]).map((_, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentTrendingIdx(idx)}
                                            className={`w-2 h-2 rounded-full transition-all ${idx === currentTrendingIdx ? 'bg-white w-6' : 'bg-white/50'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fun Surprise Me Banner */}
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 mb-8 text-white flex flex-col md:flex-row items-center justify-between shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl mix-blend-overlay pointer-events-none" />
                        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-purple-400 opacity-20 rounded-full blur-2xl mix-blend-overlay pointer-events-none" />

                        <div className="mb-6 md:mb-0 relative z-10">
                            <h2 className="text-2xl md:text-3xl font-black mb-2 flex items-center gap-3">
                                <span className="text-3xl">🎲</span> Can't Decide?
                            </h2>
                            <p className="text-indigo-100 max-w-md font-medium">
                                Let us pick for you! Click the Surprise Me button and we'll curate a delicious random 3-course meal instantly.
                            </p>
                        </div>
                        <button
                            onClick={handleSurpriseMe}
                            className="relative z-10 bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 w-full md:w-auto justify-center group"
                        >
                            <ChefHat className="w-6 h-6 group-hover:-rotate-12 transition-transform" />
                            SURPRISE ME!
                        </button>
                    </div>

                    {filteredRestaurants.length === 0 ? (
                        <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
                            <div className="text-5xl mb-4">🔍</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No Results Found</h3>
                            <p className="text-gray-500">Try a different search term or browse all restaurants.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredRestaurants.map((restaurant: any) => (
                                <div key={restaurant.id} className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden flex flex-col hover:shadow-indigo-100 hover:border-indigo-100 transition-all group">
                                    {/* Restaurant Header */}
                                    <div className="p-5 bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex justify-between items-start border-b border-gray-50 relative">
                                        <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                                            {restaurant.category || 'General'}
                                        </span>
                                        <div>
                                            <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-indigo-600 transition pr-16">{restaurant.name}</h3>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <div className="flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Open Now</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-amber-500">
                                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                    <Star className="w-3 h-3 fill-amber-200 text-amber-200" />
                                                    <span className="text-[10px] text-gray-400 font-semibold ml-0.5">4.0</span>
                                                </div>
                                                <div className="flex items-center gap-0.5 text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="text-[10px] font-semibold">25-35 min</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-2.5 rounded-2xl shadow-md">
                                            <Utensils className="w-5 h-5 text-indigo-500" />
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="p-5 space-y-3 flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{restaurant.menuItems.length} items on the menu</p>

                                        {/* Group by Strategy */}
                                        {(() => {
                                            const grouped = restaurant.menuItems.reduce((acc: Record<string, any[]>, item: any) => {
                                                const cat = item.category || 'General';
                                                if (!acc[cat]) acc[cat] = [];
                                                acc[cat].push(item);
                                                return acc;
                                            }, {});

                                            return (Object.entries(grouped) as [string, any[]][]).map(([catName, items]) => (
                                                <div key={catName} className="mb-6 last:mb-0">
                                                    {/* Section Header */}
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 mb-3 border-b border-gray-100 pb-1">{catName}</h4>

                                                    <div className="space-y-3">
                                                        {items.map((item: any) => {
                                                            const cartItem = cart.find(c => c.menuItemId === item.id);
                                                            return (
                                                                <div key={item.id} className="flex justify-between items-start group/item hover:bg-gray-50 p-2.5 -mx-2.5 rounded-2xl transition">
                                                                    <div className="flex-1 mr-3">
                                                                        <p className="font-bold text-gray-900 group-hover/item:text-indigo-600 transition text-sm leading-tight">{item.name}</p>
                                                                        <p className="text-sm font-black text-emerald-600 mt-0.5">${item.price.toFixed(2)}</p>
                                                                        {/* Inline Star Rating */}
                                                                        <div className="flex items-center gap-0.5 mt-1.5">
                                                                            {[1, 2, 3, 4, 5].map(star => {
                                                                                const itemRating = ratings[item.id];
                                                                                const userRating = itemRating?.userRating;
                                                                                const isFilled = userRating ? star <= userRating : false;
                                                                                return (
                                                                                    <button
                                                                                        key={star}
                                                                                        onClick={() => handleRate(item.id, star)}
                                                                                        title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                                                                        className="group/star focus:outline-none transition-transform hover:scale-125 active:scale-110"
                                                                                    >
                                                                                        <Star className={`w-3 h-3 transition-colors ${isFilled ? 'fill-amber-400 text-amber-400' : 'text-gray-300 group-hover/star:text-amber-300'}`} />
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                            {ratings[item.id] && (
                                                                                <span className="text-[10px] text-gray-400 ml-1 font-semibold">
                                                                                    {ratings[item.id].avg.toFixed(1)} ({ratings[item.id].total})
                                                                                </span>
                                                                            )}
                                                                            {!ratings[item.id] && (
                                                                                <span className="text-[10px] text-gray-300 ml-1">Rate this item</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {cartItem ? (
                                                                        <div className="flex items-center bg-indigo-50 border border-indigo-100 rounded-xl overflow-hidden shadow-sm">
                                                                            <button
                                                                                onClick={() => updateCartQuantity(item.id, -1)}
                                                                                className="px-2 py-1.5 text-indigo-600 hover:bg-indigo-100 transition font-bold"
                                                                            >
                                                                                <Minus className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <span className="px-3 text-sm font-black text-indigo-700 min-w-[28px] text-center">{cartItem.quantity}</span>
                                                                            <button
                                                                                onClick={() => addToCart(item, restaurant.name)}
                                                                                className="px-2 py-1.5 text-indigo-600 hover:bg-indigo-100 transition font-bold"
                                                                            >
                                                                                <Plus className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => addToCart(item, restaurant.name)}
                                                                            className="bg-white hover:bg-indigo-600 border border-gray-200 hover:border-indigo-600 shadow-sm p-2 rounded-xl text-gray-400 hover:text-white transition-all active:scale-90 group-hover/item:shadow-md"
                                                                        >
                                                                            <Plus className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Cart */}
                <div className="lg:w-[380px] w-full lg:sticky lg:top-[88px] hidden lg:block">
                    <CartPanel
                        cart={cart}
                        cartByRestaurant={cartByRestaurant}
                        cartTotal={cartTotal}
                        cartItemCount={cartItemCount}
                        updateCartQuantity={updateCartQuantity}
                        removeFromCart={removeFromCart}
                        placeOrder={placeOrder}
                        ordering={ordering}
                        router={router}
                    />
                </div>
            </main>

            {/* Mobile floating cart button */}
            {cart.length > 0 && (
                <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <button
                        onClick={placeOrder}
                        disabled={ordering}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-indigo-400/40 flex items-center gap-3 hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        {ordering ? 'Placing Order...' : `Place Order • $${cartTotal.toFixed(2)}`}
                        <span className="bg-white/20 text-white text-xs font-black px-2 py-0.5 rounded-full">{cartItemCount}</span>
                    </button>
                </div>
            )}

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

function CartPanel({ cart, cartByRestaurant, cartTotal, cartItemCount, updateCartQuantity, removeFromCart, placeOrder, ordering, router }: any) {
    return (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Cart Header */}
            <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2.5">
                    <div className="bg-indigo-600 p-2 rounded-xl shadow-md">
                        <ShoppingCart className="text-white w-4 h-4" />
                    </div>
                    Your Order
                </h2>
                {cartItemCount > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-bold">{cartItemCount} items</span>
                )}
            </div>

            {cart.length === 0 ? (
                <div className="py-12 text-center px-5">
                    <div className="text-5xl mb-3">🛒</div>
                    <p className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-1">Your cart is empty</p>
                    <p className="text-gray-400 text-xs leading-relaxed">Add items from the menu to get started!</p>
                </div>
            ) : (
                <div className="p-5 space-y-5">
                    {/* Items grouped by restaurant */}
                    <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                        {Object.entries(cartByRestaurant).map(([restaurantName, items]: any) => (
                            <div key={restaurantName}>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">{restaurantName}</p>
                                {items.map((item: any) => (
                                    <div key={item.menuItemId} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                                        <div className="flex-1 mr-2">
                                            <p className="font-bold text-sm text-gray-900 leading-tight">{item.name}</p>
                                            <p className="text-xs text-gray-400">${item.price.toFixed(2)} each</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg overflow-hidden">
                                                <button onClick={() => updateCartQuantity(item.menuItemId, -1)} className="px-1.5 py-1 hover:bg-gray-100 transition text-gray-500">
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-7 text-center text-sm font-black text-gray-900">{item.quantity}</span>
                                                <button onClick={() => updateCartQuantity(item.menuItemId, 1)} className="px-1.5 py-1 hover:bg-gray-100 transition text-gray-500">
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <p className="font-black text-sm text-gray-900 w-14 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                                            <button onClick={() => removeFromCart(item.menuItemId)} className="text-gray-300 hover:text-red-400 transition">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="border-t border-gray-100 pt-4 space-y-2">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span><span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Delivery fee</span><span className="text-green-600 font-semibold">Free</span>
                        </div>
                        <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-100">
                            <span>Total</span>
                            <span className="text-indigo-600">${cartTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Checkout Button */}
                    <button
                        onClick={placeOrder}
                        disabled={ordering}
                        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-2xl font-black text-base tracking-tight hover:opacity-90 transition-all shadow-lg shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {ordering ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing Order...</>
                        ) : (
                            <><CheckCircle2 className="w-5 h-5" /> Place Order Now</>
                        )}
                    </button>

                    <button
                        onClick={() => router.push('/orders')}
                        className="w-full text-center text-xs text-gray-400 hover:text-indigo-500 font-semibold transition py-1"
                    >
                        View My Order History →
                    </button>
                </div>
            )}

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f8f8f8; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
}
