# MongoDB Setup Guide

This application supports both in-memory storage and MongoDB for persistent data storage. Follow this guide to set up MongoDB connectivity.

## Option 1: Local MongoDB

### Install MongoDB locally:

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Windows:**
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

### Set environment variable:
```bash
export MONGODB_URI="mongodb://localhost:27017/finance_tracker"
```

## Option 2: MongoDB Atlas (Cloud)

1. **Create a free MongoDB Atlas account:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account
   - Create a new project

2. **Create a cluster:**
   - Click "Create a New Cluster"
   - Choose the free tier (M0 Sandbox)
   - Select your preferred region
   - Click "Create Cluster"

3. **Setup database access:**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Create a username and password
   - Set privileges to "Read and write to any database"

4. **Setup network access:**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0) for development
   - For production, add your specific IP addresses

5. **Get connection string:**
   - Go to "Clusters" and click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `finance_tracker`

### Set environment variable:
```bash
export MONGODB_URI="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/finance_tracker?retryWrites=true&w=majority"
```

## Option 3: Docker MongoDB

Run MongoDB in a Docker container:

```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -e MONGO_INITDB_DATABASE=finance_tracker \
  mongo:latest
```

### Set environment variable:
```bash
export MONGODB_URI="mongodb://admin:password@localhost:27017/finance_tracker?authSource=admin"
```

## Environment Configuration

Create a `.env` file in your project root:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/finance_tracker

# Alternative environment variable name
MONGO_URL=mongodb://localhost:27017/finance_tracker

# Development/Production mode
NODE_ENV=development
```

## Verifying Connection

When you start the application with MongoDB configured, you should see:

```
Using MongoDB storage
Connected to MongoDB
Server running on port 5000
MongoDB connection established
```

Without MongoDB configured:
```
Using in-memory storage (no MongoDB URI provided)
Server running on port 5000
Using in-memory storage - add MONGODB_URI for persistent storage
```

## Database Structure

The application automatically creates the following collections:

- **categories**: Expense/income categories
- **transactions**: Financial transactions
- **budgets**: Monthly budget limits
- **users**: User accounts (for future authentication)

Default categories are automatically seeded on first run:
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Income
- Healthcare
- Education

## Production Considerations

1. **Security:**
   - Use strong passwords for database users
   - Restrict network access to specific IP addresses
   - Enable authentication for local MongoDB instances

2. **Performance:**
   - Indexes are automatically created for optimal query performance
   - Consider enabling MongoDB sharding for high-traffic applications

3. **Backup:**
   - Set up regular backups for production data
   - MongoDB Atlas provides automatic backups
   - For local instances, use `mongodump` for backups

4. **Monitoring:**
   - Monitor database connections and performance
   - Set up alerts for connection failures
   - Use MongoDB Compass for database visualization

## Troubleshooting

**Connection refused:**
- Ensure MongoDB service is running
- Check firewall settings
- Verify connection string format

**Authentication failed:**
- Verify username and password
- Check database user permissions
- Ensure proper authentication database

**Network timeout:**
- Check network connectivity
- Verify IP whitelist in MongoDB Atlas
- Check DNS resolution for Atlas clusters

## Data Migration

To migrate from in-memory to MongoDB storage:

1. Export existing data (if any) using the CSV export feature
2. Set up MongoDB connection
3. Restart the application
4. Manually re-enter data or import via API calls

The application will automatically detect the storage type based on the presence of `MONGODB_URI` or `MONGO_URL` environment variables.