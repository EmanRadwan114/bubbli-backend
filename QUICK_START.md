# 🚀 Quick Recovery Execution Guide

## ⚡ 3-Step Recovery Process

### Step 1️⃣: Update Environment Variables

Edit your `.env` file with your AWS MongoDB connection string:

```bash
# Windows PowerShell or Command Prompt
notepad .env

# macOS/Linux
nano .env
```

Add/Update this line:

```
MONGODB_CONNECTION_URL=mongodb+srv://username:password@your-cluster.mongodb.net/bubbli?retryWrites=true&w=majority
```

### Step 2️⃣: Run the Seed Script

```bash
npm run seed
```

**Expected Output:**

```
✅ Database connected successfully
📌 Connected to: mongodb+srv://...
🗑️ Clearing existing data...
✅ Database cleared
📁 Seeding categories...
✅ Created 8 categories
👥 Seeding users...
✅ Created 35 users
⏱️ Seeding products...
✅ Created 32 products
⭐ Seeding reviews...
✅ Created 30 reviews
🎟️ Seeding coupons...
✅ Created 10 coupons
🛒 Seeding carts...
✅ Created 12 carts
📦 Seeding orders...
✅ Created 25 orders

========================================
🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!
========================================
```

### Step 3️⃣: Verify the Recovery

```bash
npm run verify
```

**This will check:**

- ✅ All collection counts
- ✅ Product → Category relationships
- ✅ Review → User & Product relationships
- ✅ Cart → User & Product relationships
- ✅ Order → User & Product relationships
- ✅ Coupon → User relationships
- ✅ Image URLs validity
- ✅ Admin role restrictions

---

## ▶️ Start Your Application

### Development Mode:

```bash
npm run dev
```

### Production Mode:

```bash
npm start
```

---

## 📋 Available Commands

| Command          | Purpose                           |
| ---------------- | --------------------------------- |
| `npm run seed`   | Populate database with seed data  |
| `npm run verify` | Verify all relationships and data |
| `npm run dev`    | Start with nodemon (auto-restart) |
| `npm start`      | Start normally                    |
| `npm test`       | Run tests                         |

---

## 🔐 Sample Test Credentials

### Admin Accounts:

```
Email: user1@bubbli.com
Password: hashed_password_123

Email: user2@bubbli.com
Password: hashed_password_123
```

### Regular User Accounts:

```
Email: user3@bubbli.com to user35@bubbli.com
Password: hashed_password_123
```

---

## 🎟️ Test Coupon Codes

```
SAVE01 - 5% discount
SAVE02 - 10% discount
SAVE03 - 15% discount
SAVE04 - 20% discount
SAVE05 - 25% discount
SAVE06 - 30% discount
SAVE07 - 35% discount
SAVE08 - 40% discount
SAVE09 - 45% discount
SAVE10 - 50% discount
```

---

## 🧪 Test with cURL

### Get all products:

```bash
curl http://localhost:5000/api/products
```

### Get all categories:

```bash
curl http://localhost:5000/api/categories
```

### Get user details (if authenticated):

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/users/profile
```

---

## ⚠️ Troubleshooting

| Issue                    | Solution                                                  |
| ------------------------ | --------------------------------------------------------- |
| `Connection refused`     | Check MongoDB is running and connection string is correct |
| `Port already in use`    | Change port in app.js or kill other process               |
| `Cannot find module`     | Run `npm install` to install dependencies                 |
| `Image URLs not loading` | Check firewall allows Unsplash CDN access                 |
| `Seed script hangs`      | Check internet connection and MongoDB accessibility       |

---

## 📊 Data Summary

| Collection | Documents | Status |
| ---------- | --------- | ------ |
| Users      | 35        | ✅     |
| Categories | 8         | ✅     |
| Products   | 32        | ✅     |
| Reviews    | 30        | ✅     |
| Coupons    | 10        | ✅     |
| Carts      | 12        | ✅     |
| Orders     | 25        | ✅     |
| **TOTAL**  | **152**   | **✅** |

---

## 🎯 Next Steps

1. Run `npm run seed` to populate the database
2. Run `npm run verify` to confirm everything is connected correctly
3. Start your app with `npm run dev` or `npm start`
4. Test endpoints with Postman or cURL
5. Check MongoDB Atlas for visual confirmation

---

**Recovery Status**: ✅ Ready to deploy!
