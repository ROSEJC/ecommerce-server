const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function parseBool(val) {
  return val.toLowerCase() === 'yes' || val === '1';
}

function parseIntSafe(val) {
  if (!val) return null;
  const num = parseInt(val.replace(/[^\d]/g, '')); // loại bỏ ký tự "h", "ms"
  return isNaN(num) ? null : num;
}

function parseArray(val) {
  if (!val) return [];
  return val.split(',').map((s) => s.trim());
}
function cleanKeys(obj) {
  const cleaned = {};
  for (const key in obj) {
    const cleanedKey = key.trim().replace(/^"+|"+$/g, ''); // bỏ dấu ngoặc kép đầu/cuối
    cleaned[cleanedKey] = obj[key];
  }
  return cleaned;
}
async function importProducts() {
  const results = [];
      
  fs.createReadStream(path.join(__dirname, './TrueWirelessEarbuds.csv'))
    .pipe(csv())
    .on('data', (data) => {
    data = cleanKeys(data);
      results.push({
        name: data['Title']||"Unnamed",
        description: data['Description'],
        price: parseFloat(data['Price']) || 0,
        image: 'placeholder.jpg',
        categoryId: 1,

        quantity: 10, // gán số lượng mặc định

        modelName: data['Title'],
        shape: data['Shape'],
        controls: data['Controls'],
        features: parseArray(data['Features']),
        eartip: data['Eartip'],
        batteryBuds: parseIntSafe(data['Battery life, buds only']),
        batteryCase: parseIntSafe(data['Battery life, incl. case']),
        chargePort: data['Charging port'],
        wingtips: parseBool(data['Wingtips']),
        releaseYear: parseIntSafe(data['Release year']),
        waterResistance: data['Water & dust resistance'],
        supportedCodecs: parseArray(data['Supported codecs']),
        minLatencyMs: parseIntSafe(data['Minimum latency']),
        manufacturer: data['Company'],
      });
    })
    .on('end', async () => {
      try {
        for (const product of results) {
          await prisma.product.create({ data: product });
        }

        console.log('✅ Nhập dữ liệu thành công!');
      } catch (err) {
        console.error('❌ Lỗi khi import:', err);
      } finally {
        await prisma.$disconnect();
      }
    });
}

importProducts();
