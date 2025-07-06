# Windows Setup Guide

## Quick Start for Windows

Since you're on Windows, here are the platform-specific instructions:

### 1. Install Dependencies
```cmd
npm install
```

### 2. Start the Application (Windows)
```cmd
# Option 1: Set environment variable and run
set NODE_ENV=development
npx tsx server/index.ts

# Option 2: Use cross-env (recommended)
npx cross-env NODE_ENV=development tsx server/index.ts
```

### 3. Alternative: Use PowerShell
```powershell
# PowerShell syntax
$env:NODE_ENV="development"
npx tsx server/index.ts
```

### 4. MongoDB Setup (Optional)
If you want persistent storage, set up MongoDB:

```cmd
# For local MongoDB
set MONGODB_URI=mongodb://localhost:27017/finance_tracker

# For MongoDB Atlas
set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finance_tracker
```

### 5. Production Build
```cmd
# Build
npm run build

# Start production (after build)
set NODE_ENV=production
node dist/index.js
```

## Troubleshooting

### Common Windows Issues:

1. **'NODE_ENV' is not recognized**
   - Solution: Use the commands above with `set NODE_ENV=development` or `npx cross-env`

2. **Port already in use**
   - Solution: Kill existing processes or change port in `server/index.ts`

3. **MongoDB connection issues**
   - Solution: Make sure MongoDB is running locally or use MongoDB Atlas

### Default Configuration
- **Port**: 5000
- **Storage**: In-memory (no MongoDB required)
- **Environment**: Development mode with hot reload

The application will automatically fall back to in-memory storage if MongoDB is not configured, so you can start using it immediately!