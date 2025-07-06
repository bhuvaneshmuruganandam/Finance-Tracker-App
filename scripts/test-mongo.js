#!/usr/bin/env node

/**
 * MongoDB Connection Test Script
 * 
 * This script tests the MongoDB connection and performs basic operations
 * to ensure the database is working correctly with the finance tracker.
 * 
 * Usage:
 *   node scripts/test-mongo.js
 *   MONGODB_URI=mongodb://localhost:27017/finance_tracker node scripts/test-mongo.js
 */
import 'dotenv/config'; // or
import dotenv from 'dotenv';
dotenv.config();

const { MongoClient } = require('mongodb');

async function testMongoConnection() {
  const mongoUrl = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/finance-tracker-app';
  
  console.log('🔍 Testing MongoDB connection...');
  console.log('📍 Connection URL:', mongoUrl.replace(/\/\/.*@/, '//***:***@')); 
  
  let client;
  
  try {
    client = new MongoClient(mongoUrl);
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    
    const db = client.db();
    console.log('📊 Database name:', db.databaseName);
    
    // Test basic operations
    console.log('\n🧪 Testing basic operations...');
    
    // Test categories collection
    const categoriesCollection = db.collection('categories');
    const categoryCount = await categoriesCollection.countDocuments();
    console.log('📁 Categories collection - Documents:', categoryCount);
    
    // Insert a test category if none exist
    if (categoryCount === 0) {
      await categoriesCollection.insertOne({
        id: 1,
        name: 'Test Category',
        color: '#ff0000',
        icon: 'test'
      });
      console.log('➕ Inserted test category');
    }
    
    // Test transactions collection
    const transactionsCollection = db.collection('transactions');
    const transactionCount = await transactionsCollection.countDocuments();
    console.log('💰 Transactions collection - Documents:', transactionCount);
    
    // Test budgets collection
    const budgetsCollection = db.collection('budgets');
    const budgetCount = await budgetsCollection.countDocuments();
    console.log('📈 Budgets collection - Documents:', budgetCount);
    
    // Test users collection
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log('👥 Users collection - Documents:', userCount);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Available collections:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Test indexes
    console.log('\n🔍 Checking indexes...');
    const transactionIndexes = await transactionsCollection.listIndexes().toArray();
    console.log('📊 Transaction indexes:', transactionIndexes.length);
    
    console.log('\n✨ MongoDB test completed successfully!');
    console.log('🚀 Your finance tracker is ready to use with MongoDB');
    
  } catch (error) {
    console.error('❌ MongoDB connection test failed:');
    console.error('💥 Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Make sure MongoDB is running');
      console.log('   2. Check if the connection URL is correct');
      console.log('   3. Verify network connectivity');
    } else if (error.code === 8000) {
      console.log('\n💡 Authentication failed:');
      console.log('   1. Check username and password');
      console.log('   2. Verify database user permissions');
      console.log('   3. Ensure correct authentication database');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Run the test
testMongoConnection().catch(console.error);