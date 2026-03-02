import { PrismaClient, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@kitchenasty.com' },
    update: {},
    create: {
      email: 'admin@kitchenasty.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  // Create a customer
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customer = await prisma.customer.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: customerPassword,
      name: 'John Doe',
      phone: '(555) 987-6543',
    },
  });

  // Create allergens
  const allergens = await Promise.all(
    ['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Shellfish', 'Fish', 'Sesame'].map(
      (name) => prisma.allergen.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  // Create customer group
  const regularGroup = await prisma.customerGroup.upsert({
    where: { name: 'Regular' },
    update: {},
    create: { name: 'Regular' },
  });

  // Create location
  const location = await prisma.location.upsert({
    where: { slug: 'downtown' },
    update: {},
    create: {
      name: 'Saffron & Sage Downtown',
      slug: 'downtown',
      description: 'Our flagship location in the heart of downtown San Francisco — seasonal Mediterranean cuisine in a warm, inviting setting',
      phone: '(555) 123-4567',
      email: 'downtown@saffronandsage.com',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
      lat: 37.7749,
      lng: -122.4194,
      deliveryEnabled: true,
      pickupEnabled: true,
      minOrderDelivery: 15,
      minOrderPickup: 0,
      deliveryLeadTime: 35,
      pickupLeadTime: 15,
    },
  });

  // Operating hours (Mon-Sun, 10am-10pm)
  for (let day = 0; day <= 6; day++) {
    await prisma.operatingHour.upsert({
      where: { locationId_dayOfWeek: { locationId: location.id, dayOfWeek: day } },
      update: {},
      create: {
        locationId: location.id,
        dayOfWeek: day,
        openTime: '10:00',
        closeTime: '22:00',
        isClosed: false,
      },
    });
  }

  // Delivery zones
  await prisma.deliveryZone.create({
    data: {
      locationId: location.id,
      name: 'Zone 1 - Nearby',
      charge: 3.99,
      minOrder: 15,
      isActive: true,
    },
  });

  await prisma.deliveryZone.create({
    data: {
      locationId: location.id,
      name: 'Zone 2 - Extended',
      charge: 6.99,
      minOrder: 25,
      isActive: true,
    },
  });

  // Mealtimes
  const lunch = await prisma.mealtime.create({
    data: {
      name: 'Lunch',
      startTime: '11:00',
      endTime: '15:00',
      days: [1, 2, 3, 4, 5],
      locationId: location.id,
    },
  });

  const dinner = await prisma.mealtime.create({
    data: {
      name: 'Dinner',
      startTime: '17:00',
      endTime: '22:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      locationId: location.id,
    },
  });

  // Categories
  const appetizers = await prisma.category.upsert({
    where: { slug: 'appetizers' },
    update: {},
    create: { name: 'Mezze & Starters', slug: 'appetizers', sortOrder: 1, locationId: location.id },
  });

  const mains = await prisma.category.upsert({
    where: { slug: 'main-courses' },
    update: {},
    create: { name: 'Mains', slug: 'main-courses', sortOrder: 2, locationId: location.id },
  });

  const pizzas = await prisma.category.upsert({
    where: { slug: 'pizzas' },
    update: {},
    create: { name: 'Flatbreads & Pizza', slug: 'pizzas', sortOrder: 3, locationId: location.id },
  });

  const desserts = await prisma.category.upsert({
    where: { slug: 'desserts' },
    update: {},
    create: { name: 'Sweets', slug: 'desserts', sortOrder: 4, locationId: location.id },
  });

  const drinks = await prisma.category.upsert({
    where: { slug: 'drinks' },
    update: {},
    create: { name: 'Beverages', slug: 'drinks', sortOrder: 5, locationId: location.id },
  });

  // Menu items with options
  const bruschetta = await prisma.menuItem.upsert({
    where: { slug: 'bruschetta' },
    update: {},
    create: {
      name: 'Bruschetta',
      slug: 'bruschetta',
      description: 'Wood-fired sourdough topped with heirloom tomatoes, roasted garlic, fresh basil, and a drizzle of aged balsamic',
      price: 8.99,
      image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&h=400&fit=crop',
      categoryId: appetizers.id,
      locationId: location.id,
      sortOrder: 1,
    },
  });

  const caesarSalad = await prisma.menuItem.upsert({
    where: { slug: 'caesar-salad' },
    update: {},
    create: {
      name: 'Caesar Salad',
      slug: 'caesar-salad',
      description: 'Crisp romaine hearts tossed in house-made Caesar dressing with garlic croutons, shaved Parmigiano-Reggiano, and anchovy breadcrumbs',
      price: 10.99,
      image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&h=400&fit=crop',
      categoryId: appetizers.id,
      locationId: location.id,
      sortOrder: 2,
    },
  });

  // Caesar salad size option
  const sizeOption = await prisma.menuOption.create({
    data: {
      menuItemId: caesarSalad.id,
      name: 'Size',
      displayType: 'RADIO',
      isRequired: true,
      values: {
        create: [
          { name: 'Regular', priceModifier: 0, isDefault: true, sortOrder: 1 },
          { name: 'Large', priceModifier: 3.00, sortOrder: 2 },
        ],
      },
    },
  });

  // Caesar salad add-ons
  await prisma.menuOption.create({
    data: {
      menuItemId: caesarSalad.id,
      name: 'Add Protein',
      displayType: 'CHECKBOX',
      isRequired: false,
      maxSelect: 3,
      values: {
        create: [
          { name: 'Grilled Chicken', priceModifier: 4.00, sortOrder: 1 },
          { name: 'Shrimp', priceModifier: 6.00, sortOrder: 2 },
          { name: 'Salmon', priceModifier: 7.00, sortOrder: 3 },
        ],
      },
    },
  });

  const hummusTrio = await prisma.menuItem.upsert({
    where: { slug: 'hummus-trio' },
    update: {},
    create: {
      name: 'Hummus Trio',
      slug: 'hummus-trio',
      description: 'Classic, roasted red pepper, and herb-infused hummus served with warm pita bread and marinated olives',
      price: 12.99,
      image: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&h=400&fit=crop',
      categoryId: appetizers.id,
      locationId: location.id,
      sortOrder: 3,
    },
  });

  const grilledSalmon = await prisma.menuItem.upsert({
    where: { slug: 'grilled-salmon' },
    update: {},
    create: {
      name: 'Grilled Salmon',
      slug: 'grilled-salmon',
      description: 'Wild-caught salmon fillet glazed with saffron-lemon butter, served over herbed couscous with charred broccolini',
      price: 22.99,
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop',
      categoryId: mains.id,
      locationId: location.id,
      sortOrder: 1,
    },
  });

  const lambKofta = await prisma.menuItem.upsert({
    where: { slug: 'lamb-kofta' },
    update: {},
    create: {
      name: 'Lamb Kofta',
      slug: 'lamb-kofta',
      description: 'Spiced lamb kofta skewers grilled over charcoal, served with tzatziki, pickled onions, and saffron rice',
      price: 19.99,
      image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&h=400&fit=crop',
      categoryId: mains.id,
      locationId: location.id,
      sortOrder: 2,
    },
  });

  const shawarmaBowl = await prisma.menuItem.upsert({
    where: { slug: 'chicken-shawarma-bowl' },
    update: {},
    create: {
      name: 'Chicken Shawarma Bowl',
      slug: 'chicken-shawarma-bowl',
      description: 'Slow-roasted shawarma chicken over turmeric rice with tahini sauce, pickled turnips, and a fresh herb salad',
      price: 17.99,
      image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&h=400&fit=crop',
      categoryId: mains.id,
      locationId: location.id,
      sortOrder: 3,
    },
  });

  const margherita = await prisma.menuItem.upsert({
    where: { slug: 'margherita-pizza' },
    update: {},
    create: {
      name: 'Margherita Pizza',
      slug: 'margherita-pizza',
      description: 'San Marzano tomato sauce, buffalo mozzarella, fresh basil, and extra-virgin olive oil on our house-made dough',
      price: 14.99,
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop',
      categoryId: pizzas.id,
      locationId: location.id,
      sortOrder: 1,
    },
  });

  const zaatarFlatbread = await prisma.menuItem.upsert({
    where: { slug: 'zaatar-flatbread' },
    update: {},
    create: {
      name: "Za'atar Flatbread",
      slug: 'zaatar-flatbread',
      description: "Crispy flatbread brushed with olive oil and topped with za'atar, cherry tomatoes, labneh, and a squeeze of lemon",
      price: 13.99,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
      categoryId: pizzas.id,
      locationId: location.id,
      sortOrder: 2,
    },
  });

  // Pizza size option
  await prisma.menuOption.create({
    data: {
      menuItemId: margherita.id,
      name: 'Size',
      displayType: 'RADIO',
      isRequired: true,
      values: {
        create: [
          { name: '10" Small', priceModifier: 0, isDefault: true, sortOrder: 1 },
          { name: '12" Medium', priceModifier: 3.00, sortOrder: 2 },
          { name: '14" Large', priceModifier: 6.00, sortOrder: 3 },
        ],
      },
    },
  });

  // Pizza extra toppings
  await prisma.menuOption.create({
    data: {
      menuItemId: margherita.id,
      name: 'Extra Toppings',
      displayType: 'CHECKBOX',
      isRequired: false,
      maxSelect: 5,
      values: {
        create: [
          { name: 'Mushrooms', priceModifier: 1.50, sortOrder: 1 },
          { name: 'Olives', priceModifier: 1.50, sortOrder: 2 },
          { name: 'Peppers', priceModifier: 1.50, sortOrder: 3 },
          { name: 'Pepperoni', priceModifier: 2.00, sortOrder: 4 },
          { name: 'Extra Cheese', priceModifier: 2.00, sortOrder: 5 },
        ],
      },
    },
  });

  const tiramisu = await prisma.menuItem.upsert({
    where: { slug: 'tiramisu' },
    update: {},
    create: {
      name: 'Tiramisu',
      slug: 'tiramisu',
      description: 'Layers of espresso-soaked savoiardi and whipped mascarpone dusted with Valrhona cocoa',
      price: 9.99,
      image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop',
      categoryId: desserts.id,
      locationId: location.id,
      sortOrder: 1,
    },
  });

  const baklava = await prisma.menuItem.upsert({
    where: { slug: 'baklava' },
    update: {},
    create: {
      name: 'Baklava',
      slug: 'baklava',
      description: 'Flaky phyllo pastry layered with pistachios and walnuts, soaked in rose-water honey syrup',
      price: 8.99,
      image: 'https://images.unsplash.com/photo-1598110750624-207050c4f28c?w=600&h=400&fit=crop',
      categoryId: desserts.id,
      locationId: location.id,
      sortOrder: 2,
    },
  });

  const lemonade = await prisma.menuItem.upsert({
    where: { slug: 'fresh-lemonade' },
    update: {},
    create: {
      name: 'Fresh Lemonade',
      slug: 'fresh-lemonade',
      description: 'House-squeezed lemonade with fresh mint and a hint of orange blossom water',
      price: 4.99,
      image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&h=400&fit=crop',
      categoryId: drinks.id,
      locationId: location.id,
      sortOrder: 1,
    },
  });

  const turkishCoffee = await prisma.menuItem.upsert({
    where: { slug: 'turkish-coffee' },
    update: {},
    create: {
      name: 'Turkish Coffee',
      slug: 'turkish-coffee',
      description: 'Traditional slow-brewed Turkish coffee with cardamom, served with a piece of Turkish delight',
      price: 5.99,
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop',
      categoryId: drinks.id,
      locationId: location.id,
      sortOrder: 2,
    },
  });

  // Allergen associations
  const allergenMap = Object.fromEntries(allergens.map(a => [a.name, a.id]));
  await prisma.menuItemAllergen.createMany({
    data: [
      { menuItemId: bruschetta.id, allergenId: allergenMap['Gluten'] },
      { menuItemId: caesarSalad.id, allergenId: allergenMap['Dairy'] },
      { menuItemId: caesarSalad.id, allergenId: allergenMap['Eggs'] },
      { menuItemId: hummusTrio.id, allergenId: allergenMap['Sesame'] },
      { menuItemId: hummusTrio.id, allergenId: allergenMap['Gluten'] },
      { menuItemId: grilledSalmon.id, allergenId: allergenMap['Fish'] },
      { menuItemId: lambKofta.id, allergenId: allergenMap['Dairy'] },
      { menuItemId: lambKofta.id, allergenId: allergenMap['Gluten'] },
      { menuItemId: shawarmaBowl.id, allergenId: allergenMap['Sesame'] },
      { menuItemId: shawarmaBowl.id, allergenId: allergenMap['Dairy'] },
      { menuItemId: margherita.id, allergenId: allergenMap['Gluten'] },
      { menuItemId: margherita.id, allergenId: allergenMap['Dairy'] },
      { menuItemId: zaatarFlatbread.id, allergenId: allergenMap['Gluten'] },
      { menuItemId: zaatarFlatbread.id, allergenId: allergenMap['Dairy'] },
      { menuItemId: zaatarFlatbread.id, allergenId: allergenMap['Sesame'] },
      { menuItemId: tiramisu.id, allergenId: allergenMap['Gluten'] },
      { menuItemId: tiramisu.id, allergenId: allergenMap['Dairy'] },
      { menuItemId: tiramisu.id, allergenId: allergenMap['Eggs'] },
      { menuItemId: baklava.id, allergenId: allergenMap['Gluten'] },
      { menuItemId: baklava.id, allergenId: allergenMap['Nuts'] },
    ],
    skipDuplicates: true,
  });

  // Mealtime associations
  await prisma.menuItemMealtime.createMany({
    data: [
      { menuItemId: bruschetta.id, mealtimeId: lunch.id },
      { menuItemId: bruschetta.id, mealtimeId: dinner.id },
      { menuItemId: caesarSalad.id, mealtimeId: lunch.id },
      { menuItemId: caesarSalad.id, mealtimeId: dinner.id },
      { menuItemId: hummusTrio.id, mealtimeId: lunch.id },
      { menuItemId: hummusTrio.id, mealtimeId: dinner.id },
      { menuItemId: grilledSalmon.id, mealtimeId: dinner.id },
      { menuItemId: lambKofta.id, mealtimeId: dinner.id },
      { menuItemId: shawarmaBowl.id, mealtimeId: lunch.id },
      { menuItemId: shawarmaBowl.id, mealtimeId: dinner.id },
      { menuItemId: margherita.id, mealtimeId: lunch.id },
      { menuItemId: margherita.id, mealtimeId: dinner.id },
      { menuItemId: zaatarFlatbread.id, mealtimeId: lunch.id },
      { menuItemId: zaatarFlatbread.id, mealtimeId: dinner.id },
      { menuItemId: tiramisu.id, mealtimeId: lunch.id },
      { menuItemId: tiramisu.id, mealtimeId: dinner.id },
      { menuItemId: baklava.id, mealtimeId: lunch.id },
      { menuItemId: baklava.id, mealtimeId: dinner.id },
      { menuItemId: lemonade.id, mealtimeId: lunch.id },
      { menuItemId: lemonade.id, mealtimeId: dinner.id },
      { menuItemId: turkishCoffee.id, mealtimeId: lunch.id },
      { menuItemId: turkishCoffee.id, mealtimeId: dinner.id },
    ],
    skipDuplicates: true,
  });

  // Tables
  for (let i = 1; i <= 10; i++) {
    await prisma.table.upsert({
      where: { locationId_name: { locationId: location.id, name: `Table ${i}` } },
      update: {},
      create: {
        locationId: location.id,
        name: `Table ${i}`,
        capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
      },
    });
  }

  // Coupons
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: 10,
      minOrder: 20,
      maxDiscount: 15,
      usageLimit: 1000,
      perCustomer: 1,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FREEDELIVERY' },
    update: {},
    create: {
      code: 'FREEDELIVERY',
      type: 'FREE_DELIVERY',
      value: 0,
      minOrder: 30,
      usageLimit: 500,
      perCustomer: 3,
      isActive: true,
    },
  });

  // Sample orders
  const orderStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'PICKED_UP'];
  const orderTypes = ['DELIVERY', 'PICKUP'] as const;
  for (let i = 0; i < 15; i++) {
    const status = orderStatuses[i % orderStatuses.length];
    const orderType = orderTypes[i % 2];
    const daysAgo = Math.floor(i / 2);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(10 + (i % 12), (i * 17) % 60);

    await prisma.order.create({
      data: {
        orderNumber: `KA-SEED-${String(i + 1).padStart(3, '0')}`,
        customerId: customer.id,
        locationId: location.id,
        orderType,
        status,
        subtotal: 20 + i * 5,
        tax: (20 + i * 5) * 0.08,
        deliveryFee: orderType === 'DELIVERY' ? 4.99 : 0,
        total: (20 + i * 5) * 1.08 + (orderType === 'DELIVERY' ? 4.99 : 0),
        createdAt,
        items: {
          create: [
            {
              menuItemId: margherita.id,
              name: 'Margherita Pizza',
              quantity: 1 + (i % 3),
              unitPrice: 14.99,
              subtotal: 14.99 * (1 + (i % 3)),
            },
            ...(i % 2 === 0 ? [{
              menuItemId: lemonade.id,
              name: 'Fresh Lemonade',
              quantity: 2,
              unitPrice: 4.99,
              subtotal: 9.98,
            }] : []),
          ],
        },
      },
    });
  }

  // Sample reviews
  await prisma.review.createMany({
    data: [
      { customerId: customer.id, locationId: location.id, orderId: undefined, rating: 5, comment: 'Excellent food and fast delivery!', isApproved: true },
      { customerId: customer.id, locationId: location.id, orderId: undefined, rating: 4, comment: 'Great pizza, will order again.', isApproved: true },
      { customerId: customer.id, locationId: location.id, orderId: undefined, rating: 5, comment: 'Best restaurant in town!', isApproved: false },
    ],
    skipDuplicates: true,
  });

  // Sample reservation
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await prisma.reservation.create({
    data: {
      customerId: customer.id,
      locationId: location.id,
      date: tomorrow,
      time: '19:00',
      partySize: 4,
      status: 'PENDING',
    },
  });

  // Site settings
  await prisma.siteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      siteName: 'Saffron & Sage',
      siteTitle: 'Saffron & Sage — Modern Mediterranean Dining',
      storefrontTemplate: 'elegant',
      colorPrimary: '#d97706',
      colorSecondary: '#65a30d',
      darkMode: 'light',
      heroSection: {
        title: 'Modern Mediterranean, Rooted in Tradition',
        subtitle: 'Seasonal ingredients, bold flavors, and the warmth of the Mediterranean — brought to your table or your door.',
        backgroundImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&h=900&fit=crop',
        ctaPrimaryText: 'Explore Our Menu',
        ctaPrimaryLink: '/menu',
        ctaSecondaryText: 'Reserve a Table',
        ctaSecondaryLink: '/reservations',
      },
      featuresSection: [
        { icon: '🌿', title: 'Farm-to-Table', description: 'We partner with local farms for the freshest seasonal ingredients' },
        { icon: '🍂', title: 'Seasonal Specials', description: 'Our menu evolves with the seasons — there\'s always something new to discover' },
        { icon: '🚗', title: 'Dine In or Deliver', description: 'Enjoy our cuisine at the restaurant or have it delivered straight to your door' },
      ],
      ctaSection: {
        title: 'Ready to Experience Saffron & Sage?',
        description: 'Join us for an unforgettable Mediterranean dining experience — reserve a table or order online today.',
        buttonText: 'Order Now',
        buttonLink: '/menu',
      },
    },
  });

  // Legal pages
  await prisma.legalPage.upsert({
    where: { slug: 'privacy-policy' },
    update: {},
    create: {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      content: `# Privacy Policy

We value your privacy. This policy explains how KitchenAsty collects, uses, and protects your personal information.

## Information We Collect

- **Account information**: name, email address, phone number
- **Order information**: delivery addresses, order history, payment details
- **Usage data**: cookies, browsing behavior, device information

## How We Use Your Information

We use your information to process orders, improve our services, and communicate with you about promotions and updates.

## Your Rights

You have the right to access, correct, or delete your personal data at any time by contacting us.

## Contact

If you have questions about this policy, please email us at privacy@kitchenasty.com.`,
    },
  });

  await prisma.legalPage.upsert({
    where: { slug: 'impressum' },
    update: {},
    create: {
      slug: 'impressum',
      title: 'Impressum',
      content: `# Impressum

## Company Information

**KitchenAsty**
123 Main Street
San Francisco, CA 94102
United States

**Email:** info@kitchenasty.com
**Phone:** (555) 123-4567

## Responsible for Content

KitchenAsty Management Team`,
    },
  });

  // Cookie categories
  const cookieCategories = [
    { name: 'essential', label: 'Essential Cookies', description: 'Required for the website to function properly. These cannot be disabled.', isRequired: true, sortOrder: 0 },
    { name: 'analytics', label: 'Analytics Cookies', description: 'Help us understand how visitors interact with our website.', isRequired: false, sortOrder: 1 },
    { name: 'marketing', label: 'Marketing Cookies', description: 'Used to deliver personalized advertisements and track campaigns.', isRequired: false, sortOrder: 2 },
  ];

  for (const cat of cookieCategories) {
    await prisma.cookieCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log('Seed completed successfully!');
  console.log('');
  console.log('Admin login: admin@kitchenasty.com / admin123');
  console.log('Customer login: customer@example.com / customer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
