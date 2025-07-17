const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const products = [
  {
    name: "iPhone 15 Pro",
    description: "Flagship smartphone của Apple với chip A17 Bionic.",
    price: 999,
    image: "https://example.com/iphone15pro.jpg",
    categoryId: 1
  },
  {
    name: "MacBook Air M2",
    description: "Laptop mỏng nhẹ chạy chip Apple M2.",
    price: 1199,
    image: "https://example.com/macbookairm2.jpg",
    categoryId: 1
  },
  {
    name: "AirPods Pro 2",
    description: "Tai nghe không dây chống ồn của Apple.",
    price: 249,
    image: "https://example.com/airpodspro2.jpg",
    categoryId: 1
  },
  {
    name: "Samsung Galaxy S24",
    description: "Điện thoại flagship của Samsung.",
    price: 899,
    image: "https://example.com/galaxys24.jpg",
    categoryId: 1
  },
  {
    name: "Sony WH-1000XM5",
    description: "Tai nghe chống ồn hàng đầu của Sony.",
    price: 379,
    image: "https://example.com/sonywh1000xm5.jpg",
    categoryId: 1
  },
  {
    name: "Asus ROG Strix",
    description: "Laptop gaming hiệu năng cao.",
    price: 1499,
    image: "https://example.com/asusrogstrix.jpg",
    categoryId: 1
  },
  {
    name: "Kindle Paperwhite",
    description: "Máy đọc sách của Amazon.",
    price: 139,
    image: "https://example.com/kindlepaperwhite.jpg",
    categoryId: 2
  },
  {
    name: "The Pragmatic Programmer",
    description: "Sách lập trình nổi tiếng.",
    price: 39,
    image: "https://example.com/pragmaticprogrammer.jpg",
    categoryId: 2
  },
  {
    name: "T-Shirt Nam Basic",
    description: "Áo thun nam chất liệu cotton.",
    price: 19,
    image: "https://example.com/tshirtbasic.jpg",
    categoryId: 3
  },
  {
    name: "Áo Hoodie Nữ",
    description: "Áo hoodie nữ phong cách Hàn Quốc.",
    price: 29,
    image: "https://example.com/hoodiewomen.jpg",
    categoryId: 3
  }
];
const categories = [
  { name: "Electronics" },
  { name: "Books" },
  { name: "Clothing" }
];
const users = [
  {
    name: "Nguyễn Văn A",
    email: "a@example.com",
    password: "password123",
    role: "USER"
  },
  {
    name: "Trần Thị B",
    email: "b@example.com",
    password: "password123",
    role: "USER"
  },
  {
    name: "Lê Văn C",
    email: "c@example.com",
    password: "password123",
    role: "ADMIN"
  },
  {
    name: "Phạm Thị D",
    email: "d@example.com",
    password: "password123",
    role: "USER"
  },
  {
    name: "Đỗ Văn E",
    email: "e@example.com",
    password: "password123",
    role: "USER"
  }
];

async function main() {
  for (const category of categories) {
    await prisma.category.create({ data: category });
  }

  for (const user of users) {
    await prisma.user.create({ data: user });
  }

  for (const product of products) {
    await prisma.product.create({ data: product });
  }
}

main()
  .then(() => {
    console.log('✅ Dữ liệu seed thành công!');
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error('❌ Lỗi khi seed:', e);
    return prisma.$disconnect();
  });
