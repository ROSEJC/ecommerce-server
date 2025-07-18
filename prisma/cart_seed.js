const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const carts = [
  {
    userId: 1,
    items: [
      { productId: 1, quantity: 2 }, // iPhone 15 Pro
      { productId: 2, quantity: 1 }  // MacBook Air M2
    ]
  },
  {
    userId: 2,
    items: [
      { productId: 4, quantity: 1 }, // Galaxy S24
      { productId: 5, quantity: 1 }  // Sony WH-1000XM5
    ]
  },
  {
    userId: 3,
    items: [
      { productId: 8, quantity: 2 }, // The Pragmatic Programmer
      { productId: 10, quantity: 1 } // Áo Hoodie Nữ
    ]
  }
];
async function main() {
  for (const cart of carts) {
    const createdCart = await prisma.cart.create({
      data: {
        userId: cart.userId,
        items: {
          create: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        }
      }
    });
    console.log(`Created cart for user ${cart.userId}`);
  }
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });