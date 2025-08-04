const fs = require("fs");
const csv = require("csv-parser");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");

async function main() {
  const updates = [];

  fs.createReadStream(path.join(__dirname, "earbus.csv"))
    .pipe(csv())
    .on("data", (row) => {
      updates.push(row);
    })
    .on("end", async () => {
      console.log(`Found ${updates.length} records. Starting update...`);

      for (const record of updates) {
        const name = record.name.trim();
        const link = record.link.trim();

        try {
          const updated = await prisma.product.updateMany({
            where: { name },
            data: { image: link },
          });

          if (updated.count > 0) {
            console.log(`✅ Updated "${name}" with image.`);
          } else {
            console.warn(`⚠️  No product found with name "${name}".`);
          }
        } catch (err) {
          console.error(`Error updating "${name}":`, err);
        }
      }

      console.log("Update completed!");
      await prisma.$disconnect();
    });
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
});
