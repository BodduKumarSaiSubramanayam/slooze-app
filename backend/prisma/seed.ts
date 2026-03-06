import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashPassword = async (password: string) => await bcrypt.hash(password, 10);

  // Users
  const users = await Promise.all([
    // Admin
    prisma.user.upsert({
      where: { email: 'nick@slooze.xyz' },
      update: {},
      create: {
        email: 'nick@slooze.xyz',
        name: 'Nick Fury',
        password: await hashPassword('password123'),
        role: 'ADMIN',
        country: 'AMERICA', // Admin can be anywhere
      },
    }),
    // Managers
    prisma.user.upsert({
      where: { email: 'marvel@slooze.xyz' },
      update: {},
      create: {
        email: 'marvel@slooze.xyz',
        name: 'Captain Marvel',
        password: await hashPassword('password123'),
        role: 'MANAGER',
        country: 'INDIA',
      },
    }),
    prisma.user.upsert({
      where: { email: 'america@slooze.xyz' },
      update: {},
      create: {
        email: 'america@slooze.xyz',
        name: 'Captain America',
        password: await hashPassword('password123'),
        role: 'MANAGER',
        country: 'AMERICA',
      },
    }),
    // Members
    prisma.user.upsert({
      where: { email: 'thanos@slooze.xyz' },
      update: {},
      create: {
        email: 'thanos@slooze.xyz',
        name: 'Thanos',
        password: await hashPassword('password123'),
        role: 'MEMBER',
        country: 'INDIA',
      },
    }),
    prisma.user.upsert({
      where: { email: 'thor@slooze.xyz' },
      update: {},
      create: {
        email: 'thor@slooze.xyz',
        name: 'Thor',
        password: await hashPassword('password123'),
        role: 'MEMBER',
        country: 'INDIA',
      },
    }),
    prisma.user.upsert({
      where: { email: 'travis@slooze.xyz' },
      update: {},
      create: {
        email: 'travis@slooze.xyz',
        name: 'Travis',
        password: await hashPassword('password123'),
        role: 'MEMBER',
        country: 'AMERICA',
      },
    }),
  ]);

  // Restaurants and Menu Items
  const restaurantsData = [
    // INDIA RESTAURANTS
    {
      name: 'Biryani Blues',
      country: 'INDIA',
      category: 'Indian',
      menuItems: [
        { name: 'Chicken 65', price: 6.99, category: 'Starters' },
        { name: 'Chilli Paneer Dry', price: 5.99, category: 'Starters' },
        { name: 'Mirchi Ka Salan', price: 3.99, category: 'Sides' },
        { name: 'Hyderabadi Chicken Dum Biryani', price: 12.99, category: 'Main Course' },
        { name: 'Paneer 65 Biryani', price: 10.49, category: 'Main Course' },
        { name: 'Mutton Keema Biryani', price: 15.99, category: 'Main Course' },
        { name: 'Double Ka Meetha', price: 4.99, category: 'Desserts' },
        { name: 'Gulab Jamun (2 pcs)', price: 4.49, category: 'Desserts' },
        { name: 'Mineral Water (1L)', price: 1.49, category: 'Cool Drinks' },
        { name: 'Thums Up (330ml)', price: 1.99, category: 'Cool Drinks' },
        { name: 'Sprite (330ml)', price: 1.99, category: 'Cool Drinks' },
      ],
    },
    {
      name: 'Delhi Heights',
      country: 'INDIA',
      category: 'Indian',
      menuItems: [
        { name: 'Paneer Tikka', price: 7.99, category: 'Starters' },
        { name: 'Hara Bhara Kebab', price: 6.49, category: 'Starters' },
        { name: 'Butter Chicken Masala', price: 14.99, category: 'Main Course' },
        { name: 'Dal Makhani', price: 11.49, category: 'Main Course' },
        { name: 'Kadai Paneer', price: 12.99, category: 'Main Course' },
        { name: 'Garlic Naan', price: 2.99, category: 'Breads' },
        { name: 'Tandoori Roti', price: 1.99, category: 'Breads' },
        { name: 'Sweet Lassi', price: 3.49, category: 'Beverages' },
        { name: 'Masala Chai', price: 2.49, category: 'Beverages' },
        { name: 'Mineral Water (1L)', price: 1.49, category: 'Cool Drinks' },
        { name: 'Diet Coke (330ml)', price: 1.99, category: 'Cool Drinks' },
        { name: 'Fresh Lime Soda', price: 2.49, category: 'Cool Drinks' },
      ],
    },
    {
      name: 'Oven Story Pizza',
      country: 'INDIA',
      category: 'Pizza',
      menuItems: [
        { name: 'Double Cheese Margherita', price: 8.99 },
        { name: 'Chicken Tikka Pizza', price: 11.49 },
        { name: 'Fiery Veg Pizza', price: 9.99 },
        { name: 'Garlic Breadsticks', price: 3.49 },
        { name: 'Choco Mousse', price: 2.99 },
      ],
    },
    {
      name: 'Naturals Ice Cream',
      country: 'INDIA',
      category: 'Desserts',
      menuItems: [
        { name: 'Tender Coconut Scoop', price: 3.99 },
        { name: 'Sitaphal Scoop', price: 4.49 },
        { name: 'Mango Ice Cream Tub', price: 12.99 },
        { name: 'Roasted Almond Scoop', price: 4.99 },
      ],
    },

    // AMERICA RESTAURANTS
    {
      name: 'Burger King',
      country: 'AMERICA',
      category: 'Fast Food',
      menuItems: [
        { name: 'Whopper Meal', price: 8.99 },
        { name: 'Bacon King Sandwich', price: 7.49 },
        { name: 'Spicy Chicken Fries', price: 4.29 },
        { name: 'Large Onion Rings', price: 3.49 },
        { name: 'Oreo Shake', price: 3.99 },
      ],
    },
    {
      name: "Joe's Pizza",
      country: 'AMERICA',
      category: 'Pizza',
      menuItems: [
        { name: 'Classic Cheese Slice', price: 3.50 },
        { name: 'Pepperoni Slice', price: 4.00 },
        { name: 'Whole Margherita Pie', price: 24.00 },
        { name: 'Garlic Knots (6 pcs)', price: 5.00 },
        { name: 'New York Cheesecake', price: 6.50 },
      ],
    },
    {
      name: 'Sweetgreen',
      country: 'AMERICA',
      category: 'Healthy',
      menuItems: [
        { name: 'Harvest Bowl', price: 13.95 },
        { name: 'Guacamole Greens', price: 12.95 },
        { name: 'Kale Caesar Salad', price: 11.95 },
        { name: 'Crispy Rice Bowl', price: 14.95 },
        { name: 'Hibiscus Tea', price: 3.50 },
      ],
    },
    {
      name: 'Dunkin Donuts',
      country: 'AMERICA',
      category: 'Desserts',
      menuItems: [
        { name: 'Glazed Donut', price: 1.50 },
        { name: 'Boston Kreme', price: 1.75 },
        { name: 'Half Dozen Assorted', price: 8.99 },
        { name: 'Large Iced Coffee', price: 3.99 },
        { name: 'Munchkins (10 pcs)', price: 3.49 },
      ],
    },
  ];

  await prisma.rating.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.restaurant.deleteMany({});

  for (const r of restaurantsData) {
    await prisma.restaurant.create({
      data: {
        name: r.name,
        country: r.country,
        category: r.category,
        menuItems: {
          create: r.menuItems,
        },
      },
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
