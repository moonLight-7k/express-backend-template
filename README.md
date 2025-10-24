# TEFL Mobile App Backend

A Node.js backend service built with Express and Firebase.

## Tech Stack

- **Node.js** with **TypeScript**
- **Express.js** for API routes
- **Firebase** for authentication and database

## Project Structure

```
├── src/                      # Source code
│   ├── server.ts             # Entry point
│   ├── config/               # Configuration files
│   ├── controller/           # API route controllers
│   ├── db/                   # Database operations
│   ├── middleware/           # Express middleware
│   ├── router/               # API routes
│   ├── service/              # External service integrations
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── __test__/                 # API test scripts
└── docs/                     # Documentation
```

## Getting Started

1. **Install dependencies:**

   ```
   pnpm install
   ```

2. **Set up Firebase:**
   - Place your Firebase service account JSON file in the root directory
   - Configure Firebase in `src/config/firebase.ts`

3. **Development mode:**

   ```
   pnpm dev
   ```

4. **Build for production:**

   ```
   pnpm build:prod
   ```

5. **Start production server:**
   ```
   pnpm start
   ```
