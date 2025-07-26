const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const brands = await prisma.product.groupBy({
    by: ['manufracture'],
    where: {
    manufacturer: {
      not: null,
    },
  },
  })
}