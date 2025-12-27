# MBA Dashboard Deployment Guide

Your production build is ready in the `build` folder! Here are the easiest ways to deploy it:

## 🚀 Quick Deployment Options

### Option 1: Netlify (Easiest - Recommended)

1. **Go to [netlify.com](https://www.netlify.com)** and sign up/login (free)

2. **Drag & Drop Method:**
   - Drag the entire `build` folder onto the Netlify dashboard
   - Your site will be live in seconds with a URL like `your-site-name.netlify.app`

3. **Or use Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   cd "C:\Users\Luke\Dashboard MBA"
   netlify deploy --prod --dir=build
   ```

**Benefits:** Free, automatic HTTPS, custom domain support, continuous deployment from Git

---

### Option 2: Vercel (Also Very Easy)

1. **Go to [vercel.com](https://vercel.com)** and sign up/login (free)

2. **Drag & Drop:**
   - Drag the `build` folder onto Vercel dashboard
   - Site goes live immediately

3. **Or use Vercel CLI:**
   ```bash
   npm install -g vercel
   cd "C:\Users\Luke\Dashboard MBA"
   vercel --prod
   ```

**Benefits:** Free, great performance, automatic HTTPS, easy Git integration

---

### Option 3: GitHub Pages

1. **Create a GitHub repository** (if you haven't already)

2. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Add to package.json:**
   ```json
   "homepage": "https://yourusername.github.io/mba-dashboard",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

**Benefits:** Free, integrated with GitHub, good for open source projects

---

### Option 4: Firebase Hosting

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase:**
   ```bash
   cd "C:\Users\Luke\Dashboard MBA"
   firebase init hosting
   ```
   - Select "build" as your public directory
   - Configure as single-page app: **Yes**
   - Don't overwrite index.html: **No**

3. **Deploy:**
   ```bash
   firebase deploy
   ```

**Benefits:** Free tier, fast CDN, easy custom domains

---

### Option 5: AWS S3 + CloudFront

1. **Create S3 bucket** in AWS Console
2. **Enable static website hosting**
3. **Upload build folder contents** to S3
4. **Set up CloudFront** for CDN (optional but recommended)

**Benefits:** Scalable, professional, but requires AWS account setup

---

## 📝 Important Notes

- **All data files are included** in the build folder (`build/data/*.csv`)
- **The app is configured** to work from the root path (`/`)
- **React Router** is set up for client-side routing

## 🔧 Testing Locally Before Deploying

You can test the production build locally:

```bash
npm install -g serve
cd "C:\Users\Luke\Dashboard MBA"
serve -s build
```

Then visit `http://localhost:3000` to preview your production build.

---

## 🎯 Recommended: Netlify or Vercel

For the easiest deployment experience, I recommend **Netlify** or **Vercel**. Both are:
- ✅ Free
- ✅ Easy drag-and-drop deployment
- ✅ Automatic HTTPS
- ✅ Fast CDN
- ✅ Custom domain support
- ✅ Continuous deployment from Git (optional)

Just drag your `build` folder onto their dashboard and you're live!

