#!/usr/bin/env node

/**
 * MongoDB Environment Setup Script
 * This script helps you set up your .env file with your MongoDB connection string
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔧 MongoDB Environment Setup\n');
console.log('Your MongoDB connection string:');
console.log('mongodb+srv://hosi:<db_password>@cluster0.bf8wacm.mongodb.net/glowsphere?retryWrites=true&w=majority\n');

rl.question('Enter your MongoDB Atlas password: ', (password) => {
  if (!password || password.trim() === '') {
    console.log('\n❌ Password cannot be empty. Please run the script again.');
    rl.close();
    return;
  }

  // Escape special characters in password for URL
  const escapedPassword = encodeURIComponent(password.trim());
  
  const connectionString = `mongodb+srv://hosi:${escapedPassword}@cluster0.bf8wacm.mongodb.net/glowsphere?retryWrites=true&w=majority`;

  const envContent = `# MongoDB Configuration
MONGODB_URI=${connectionString}

# Node.js Environment
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

# JWT Configuration
JWT_SECRET=glowsphere_jwt_secret_key_2023

# Cloudinary Configuration (Optional - app works without it)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
`;

  const envPath = path.join(__dirname, 'backend', '.env');
  
  try {
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('\n✅ Successfully created backend/.env file!');
    console.log('\n📝 Next steps:');
    console.log('1. Test your connection: cd backend && npm run dev');
    console.log('2. For deployment, add MONGODB_URI to your platform\'s environment variables');
    console.log('\n🔒 Security: The .env file is already in .gitignore and will NOT be committed to GitHub.\n');
  } catch (error) {
    console.error('\n❌ Error creating .env file:', error.message);
  }
  
  rl.close();
});



