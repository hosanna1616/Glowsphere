@echo off
REM MongoDB Environment Setup Script for Windows

echo.
echo ========================================
echo MongoDB Environment Setup
echo ========================================
echo.
echo Your MongoDB connection string template:
echo mongodb+srv://hosi:^<db_password^>@cluster0.bf8wacm.mongodb.net/glowsphere?retryWrites=true^&w=majority
echo.
set /p MONGODB_PASSWORD="Enter your MongoDB Atlas password: "

if "%MONGODB_PASSWORD%"=="" (
    echo.
    echo ERROR: Password cannot be empty!
    pause
    exit /b 1
)

REM Create .env file in backend directory
(
echo # MongoDB Configuration
echo MONGODB_URI=mongodb+srv://hosi:%MONGODB_PASSWORD%@cluster0.bf8wacm.mongodb.net/glowsphere?retryWrites=true^&w=majority
echo.
echo # Node.js Environment
echo NODE_ENV=development
echo PORT=5000
echo HOST=0.0.0.0
echo.
echo # JWT Configuration
echo JWT_SECRET=glowsphere_jwt_secret_key_2023
echo.
echo # Cloudinary Configuration ^(Optional - app works without it^)
echo CLOUDINARY_CLOUD_NAME=
echo CLOUDINARY_API_KEY=
echo CLOUDINARY_API_SECRET=
) > backend\.env

echo.
echo ========================================
echo Successfully created backend\.env file!
echo ========================================
echo.
echo Next steps:
echo 1. Test your connection: cd backend ^&^& npm run dev
echo 2. For deployment, add MONGODB_URI to your platform's environment variables
echo.
echo Security: The .env file is already in .gitignore and will NOT be committed to GitHub.
echo.
pause



