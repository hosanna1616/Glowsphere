# Cloudinary Setup Guide

## What is Cloudinary?

Cloudinary is a cloud-based image and video management service. It's used to store and serve media files (images, videos, PDFs) for your GlowSphere app.

## Important Note

**Cloudinary is OPTIONAL!** The app will work without it - files will be stored locally. However, Cloudinary provides:
- Better file management
- CDN delivery (faster loading)
- Image optimization
- Video processing

## Getting Cloudinary Credentials

### Step 1: Sign Up for Cloudinary (Free)

1. **Go to Cloudinary website:**
   - Visit: https://cloudinary.com/users/register/free
   - Or go to: https://cloudinary.com and click "Sign Up for Free"

2. **Create an account:**
   - Enter your email address
   - Create a password
   - Click "Create Account"
   - Verify your email if required

### Step 2: Get Your Credentials

Once logged in:

1. **Go to Dashboard:**
   - After signing up, you'll be taken to your dashboard
   - Or click "Dashboard" in the top menu

2. **Find Your Credentials:**
   - On the dashboard, you'll see a section called **"Account Details"** or **"Product Environment Credentials"**
   - Look for these values:
     - **Cloud Name** (e.g., `dxyz123abc`)
     - **API Key** (e.g., `123456789012345`)
     - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

3. **Copy Your Credentials:**
   - Click the "Show" or "Reveal" button next to API Secret to see it
   - Copy all three values

### Step 3: Add Credentials to Your App

#### For Development (docker-compose.yml)

Create or edit a `.env` file in the project root:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

#### For Production (docker-compose.prod.yml)

Add to your `.env` file in the project root:

```env
MONGO_USERNAME=admin
MONGO_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

#### For Backend (if running without Docker)

Create a `.env` file in the `backend` folder:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/glowsphere
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

## Visual Guide to Finding Credentials

### Option 1: Dashboard View
```
Dashboard → Account Details
├── Cloud Name: dxyz123abc
├── API Key: 123456789012345
└── API Secret: [Click "Show" to reveal]
```

### Option 2: Settings View
1. Click your account name (top right)
2. Select "Settings" or "Account Settings"
3. Go to "Security" or "API Keys" tab
4. You'll see all your credentials there

## Free Tier Limits

Cloudinary's free tier includes:
- ✅ 25 GB storage
- ✅ 25 GB monthly bandwidth
- ✅ Image and video transformations
- ✅ CDN delivery
- ✅ Perfect for development and small projects

## Security Best Practices

1. **Never commit `.env` files to Git:**
   - Make sure `.env` is in your `.gitignore`
   - Never share your API Secret publicly

2. **Use different credentials for development and production:**
   - Create separate Cloudinary accounts or use environment-specific settings

3. **Rotate secrets regularly:**
   - Change your API Secret periodically for security

## Testing Your Cloudinary Setup

After adding credentials, test if it works:

1. Start your backend server
2. Try uploading an image or video through the app
3. Check Cloudinary dashboard → Media Library
4. You should see your uploaded files there

## Troubleshooting

### "Invalid API credentials"
- Double-check you copied all three values correctly
- Make sure there are no extra spaces
- Verify you're using the correct account's credentials

### "Upload failed"
- Check your Cloudinary account limits (free tier has limits)
- Verify your API Secret is correct (it's case-sensitive)
- Check backend logs for specific error messages

### "Can't find credentials in dashboard"
- Make sure you're logged into the correct account
- Try refreshing the dashboard page
- Check if you're on the free tier (some features may differ)

## Alternative: Skip Cloudinary

If you don't want to use Cloudinary right now:

1. **Leave the values empty in `.env`:**
   ```env
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   ```

2. **The app will use local file storage instead**
   - Files will be stored in `backend/uploads/` folder
   - This works fine for development
   - You can add Cloudinary later

## Quick Reference

| Credential | Where to Find | Example |
|------------|---------------|---------|
| **Cloud Name** | Dashboard → Account Details | `dxyz123abc` |
| **API Key** | Dashboard → Account Details | `123456789012345` |
| **API Secret** | Dashboard → Account Details (click "Show") | `abcdefghijklmnopqrstuvwxyz123456` |

## Need Help?

- Cloudinary Documentation: https://cloudinary.com/documentation
- Cloudinary Support: https://support.cloudinary.com
- Cloudinary Community: https://community.cloudinary.com







