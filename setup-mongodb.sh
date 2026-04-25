#!/bin/bash

# MongoDB Environment Setup Script for Linux/Mac

echo ""
echo "========================================"
echo "MongoDB Environment Setup"
echo "========================================"
echo ""
echo "Your MongoDB connection string template:"
echo "mongodb+srv://hosi:<db_password>@cluster0.bf8wacm.mongodb.net/glowsphere?retryWrites=true&w=majority"
echo ""
read -sp "Enter your MongoDB Atlas password: " MONGODB_PASSWORD
echo ""

if [ -z "$MONGODB_PASSWORD" ]; then
    echo ""
    echo "ERROR: Password cannot be empty!"
    exit 1
fi

# URL encode the password (basic encoding for common characters)
ENCODED_PASSWORD=$(printf '%s' "$MONGODB_PASSWORD" | jq -sRr @uri 2>/dev/null || echo "$MONGODB_PASSWORD")

# Create .env file in backend directory
cat > backend/.env << EOF
# MongoDB Configuration
MONGODB_URI=mongodb+srv://hosi:${ENCODED_PASSWORD}@cluster0.bf8wacm.mongodb.net/glowsphere?retryWrites=true&w=majority

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
EOF

echo ""
echo "========================================"
echo "Successfully created backend/.env file!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Test your connection: cd backend && npm run dev"
echo "2. For deployment, add MONGODB_URI to your platform's environment variables"
echo ""
echo "Security: The .env file is already in .gitignore and will NOT be committed to GitHub."
echo ""



