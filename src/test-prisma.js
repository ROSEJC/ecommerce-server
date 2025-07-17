// test-prisma.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  console.log(products);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
