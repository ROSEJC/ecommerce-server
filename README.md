# Ecommerce App Server

This is the backend server for the Ecommerce web application. It uses Node.js, Express, Prisma ORM, and PostgreSQL.

## Features

- REST API for products, favorites, reviews, and more
- Authentication and authorization
- Prisma ORM for database access
- CSV-based product data import
- Admin endpoints for product management

## Project Structure

```
.env
package.json
prisma/
  schema.prisma
  migrations/
  TrueWirelessEarbuds.csv
  earbus.csv
  seed.js
  updateImage.js
src/
  index.js
  config/
    prisma.js
  controllers/
  middleware/
  routes/
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL

### Setup

1. **Clone the repository**

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Configure environment variables**

   Edit [.env](.env) with your database credentials:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ecommerce_web"
   ```

4. **Setup the database**

   - Run Prisma migrations:
     ```sh
     npx prisma migrate deploy
     ```
   - (Optional) Seed the database:
     ```sh
     node prisma/seed.js
     ```

5. **Start the server**
   ```sh
   npm start
   ```

## Scripts

- `npm start` — Start the server
- `npx prisma migrate deploy` — Apply database migrations
- `node prisma/seed.js` — Seed initial data

## API Endpoints

- `/api/products` — Product listing and details
- `/api/favorites` — User favorites management
- `/api/reviews` — Product reviews
- `/api/admin` — Admin product management

See the [src/routes](src/routes) folder for more details.


