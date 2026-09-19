# 🔄 MongoDB Recovery Guide - Bubbli Backend

## Overview

This guide will help you recover your MongoDB database with seed data for all collections.

---

## 📊 Database Recovery Summary

### Collections to be restored:

- **Users**: 35 documents (2 admins + 33 regular users)
- **Categories**: 8 categories (Watches, Rings, Necklaces, Bracelets, Earrings, Bags, Shoes, Belts)
- **Products**: 32 products (all with valid category references)
- **Reviews**: 30 reviews (linked to users and products)
- **Coupons**: 10 coupons (with discount codes: SAVE01 - SAVE10)
- **Carts**: 12 shopping carts (with multiple items per cart)
- **Orders**: 25 orders (all with proper relationships and pricing)

**Total**: ~152 documents across 7 collections

---

## ✅ Image URLs Validation

All image URLs use **Unsplash** (production-ready CDN):

- ✅ Direct CDN URLs with parameters (w=500, h=500, fit=crop)
- ✅ HTTPS secure connections
- ✅ Tested and working image URLs
- ✅ Applied to all products and categories

**Example URLs**:

```
https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop
https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&h=500&fit=crop
```

---

## 🚀 Recovery Steps

### Step 1: Ensure Environment Configuration

Update your `.env` file with your AWS MongoDB connection string:

```env
MONGODB_CONNECTION_URL=mongodb+srv://username:password@cluster.mongodb.net/bubbli?retryWrites=true&w=majority
```

**For AWS Region (South - Bahrain)**:

- Region: **me-south-1**
- Endpoint: Your cluster details from AWS MongoDB

### Step 2: Install Dependencies (if needed)

```bash
npm install
```

### Step 3: Run the Seed Script

```bash
npm run seed
```

**Expected Output**:

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
📊 Summary:
   - Users: 35
   - Categories: 8
   - Products: 32
   - Reviews: 30
   - Coupons: 10
   - Carts: 12
   - Orders: 25
========================================
```

---

## 🔗 Database Relationships

### User Model

- References: Wishlist (Product), Address array, Role-based validation
- Admin users: **No** wishlist, address, or phone number
- Regular users: Can have wishlist and addresses

### Product Model

- **Category Reference**: `categoryID` → Category.\_id
- Images: thumbnail + array of images
- Stock, Price, Discount, Ratings tracked

### Review Model

- **User Reference**: `userID` → User.\_id
- **Product Reference**: `productID` → Product.\_id
- Rating: 1-5 stars

### Cart Model

- **User Reference**: `userID` → User.\_id
- **Product References**: cartItems[].productId → Product.\_id

### Order Model

- **User Reference**: `userID` → User.\_id
- **Product References**: orderItems[].productId → Product.\_id
- Pricing calculated with discount and shipping

### Coupon Model

- **User References**: CouponUsers[] → User.\_id array
- Discount percentage with expiration date

---

## 🧪 Testing Recovery

### 1. Verify Data in MongoDB Compass/Atlas

```bash
# View all users
db.users.find().pretty()

# View all products with category
db.products.find().pretty()

# Verify relationships
db.products.aggregate([
  {
    $lookup: {
      from: "categories",
      localField: "categoryID",
      foreignField: "_id",
      as: "category"
    }
  }
]).pretty()
```

### 2. Test API Endpoints

```bash
# Get all products (should return 32)
curl http://localhost:5000/api/products

# Get all categories (should return 8)
curl http://localhost:5000/api/categories

# Get user orders
curl http://localhost:5000/api/orders -H "Authorization: Bearer TOKEN"
```

---

## 🛠️ Troubleshooting

### Issue: Connection Failed

**Solution**:

- Verify MongoDB connection string in `.env`
- Check AWS security groups allow your IP
- Ensure cluster is running in AWS

### Issue: Port Already in Use

**Solution**:

```bash
# Use development mode if available
npm run dev
```

### Issue: Seed Script Hangs

**Solution**:

- Check internet connection (for image URLs)
- Verify MongoDB is accessible
- Check disk space on MongoDB instance

### Issue: Image URLs Not Loading

**Solution**:

- All URLs are from Unsplash (tested working)
- Check firewall blocks external CDN
- Inspect browser console for CORS issues

---

## 📱 Sample Test Users

Use these credentials to test your application:

**Admin Users**:

- Email: `user1@bubbli.com` | Password: `hashed_password_123`
- Email: `user2@bubbli.com` | Password: `hashed_password_123`

**Regular Users**:

- Email: `user3@bubbli.com` to `user35@bubbli.com`
- Password: `hashed_password_123`

---

## 💰 Sample Coupon Codes

Use these for testing discount functionality:

- `SAVE01` - 5% off
- `SAVE02` - 10% off
- `SAVE03` - 15% off
- `SAVE04` - 20% off
- `SAVE05` - 25% off
- `SAVE06` - 30% off
- `SAVE07` - 35% off
- `SAVE08` - 40% off
- `SAVE09` - 45% off
- `SAVE10` - 50% off

---

## 🔄 Running on Schedule

To automate backup and recovery:

```bash
# Create a cron job (Linux/Mac)
0 2 * * * cd /path/to/bubbli-backend && npm run seed

# Windows Task Scheduler
# Task: Run npm run seed every day at 2 AM
```

---

## 📝 Notes

- All passwords are hashed (placeholder: `hashed_password_123`)
- In production, use bcrypt to hash passwords
- Phone numbers follow Egyptian format (201xxxxxxxxx)
- Orders include both cash and online payment methods
- Shipping status ranges from pending to shipped
- All timestamps auto-generated at creation

---

## ✨ Model Connections Verified

```
User
├── wishlist → [Product._id]
└── Orders related via userID

Category
└── Products reference categoryID

Product
├── categoryID → Category._id
├── Images: thumbnail + array
└── Reviews reference productID

Review
├── userID → User._id
└── productID → Product._id

Cart
├── userID → User._id
└── cartItems → [Product._id]

Order
├── userID → User._id
├── orderItems → [Product._id]
└── couponCode → Coupon.CouponCode

Coupon
└── CouponUsers → [User._id]
```

---

## 🆘 Support

If you encounter issues:

1. Check MongoDB logs: `cat /var/log/mongodb/mongod.log`
2. Verify network connectivity to AWS
3. Ensure all required npm packages are installed
4. Check Node.js version compatibility (v14+)

---

**Last Updated**: April 2026  
**Database**: MongoDB Atlas (AWS South Region - Bahrain)
