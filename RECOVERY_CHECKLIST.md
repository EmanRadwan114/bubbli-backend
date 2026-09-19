# ✅ MongoDB Recovery Checklist

## Pre-Recovery Checklist

- [ ] **MongoDB Connection String Ready**
  - [ ] Cluster is running in AWS (Bahrain region: me-south-1)
  - [ ] Connection string copied and ready
  - [ ] Username and password verified
  - [ ] Connection string format: `mongodb+srv://username:password@cluster.mongodb.net/bubbli?retryWrites=true&w=majority`

- [ ] **Environment Setup Complete**
  - [ ] `.env` file exists in project root
  - [ ] `MONGODB_CONNECTION_URL` added to `.env`
  - [ ] Node.js installed (v14 or higher)
  - [ ] npm installed and working

- [ ] **Dependencies Checked**
  - [ ] Run `npm install` if any dependencies missing
  - [ ] All models in `db/models/` are readable
  - [ ] No import errors in existing code

---

## Recovery Execution Checklist

- [ ] **Step 1: Seed the Database**
  - [ ] Terminal open in project root directory
  - [ ] Run command: `npm run seed`
  - [ ] Wait for completion (usually 5-30 seconds)
  - [ ] See "🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!" message
  - [ ] No errors in console output

- [ ] **Step 2: Verify Data Integrity**
  - [ ] Run command: `npm run verify`
  - [ ] All relationship counts displayed correctly
  - [ ] ✅ marks shown for each verification
  - [ ] Sample documents displayed with proper relationships
  - [ ] Image URLs verified (starts with https://images.unsplash.com)

- [ ] **Step 3: Check MongoDB Atlas/Compass**
  - [ ] Open MongoDB Atlas console
  - [ ] Select Bubbli database
  - [ ] Verify 7 collections exist:
    - [ ] users (35 documents)
    - [ ] categories (8 documents)
    - [ ] products (32 documents)
    - [ ] reviews (30 documents)
    - [ ] coupons (10 documents)
    - [ ] carts (12 documents)
    - [ ] orders (25 documents)

---

## Data Validation Checklist

- [ ] **Users Collection**
  - [ ] 2 admin users (role: "admin")
  - [ ] 33 regular users (role: "user")
  - [ ] All have email addresses (user1@bubbli.com - user35@bubbli.com)
  - [ ] Admin users have no wishlist, address, or phone
  - [ ] Sample user image URLs are loading

- [ ] **Categories Collection**
  - [ ] 8 categories exist
  - [ ] Each has name and thumbnail
  - [ ] All thumbnail URLs start with https://images.unsplash.com
  - [ ] Categories: Watches, Rings, Necklaces, Bracelets, Earrings, Bags, Shoes, Belts

- [ ] **Products Collection**
  - [ ] 32 products exist
  - [ ] Each product has categoryID (references a Category)
  - [ ] Each has thumbnail and images array
  - [ ] All image URLs are valid (https://images.unsplash.com)
  - [ ] Price, stock, and discount values are populated
  - [ ] avgRating and numberOfReviews are set

- [ ] **Reviews Collection**
  - [ ] 30 reviews exist
  - [ ] Each review has:
    - [ ] userID (references a User)
    - [ ] productID (references a Product)
    - [ ] description text
    - [ ] rating (1-5 stars)

- [ ] **Coupons Collection**
  - [ ] 10 coupons exist
  - [ ] Coupon codes: SAVE01 through SAVE10
  - [ ] Each has discount percentage (5-50%)
  - [ ] Expiration dates are in the future
  - [ ] CouponUsers array populated with some user IDs

- [ ] **Carts Collection**
  - [ ] 12 carts exist
  - [ ] Each cart has userID (references a User)
  - [ ] Each cartItem has productId (references a Product)
  - [ ] Each cartItem has quantity > 0

- [ ] **Orders Collection**
  - [ ] 25 orders exist
  - [ ] Each order has userID (references a User)
  - [ ] orderItems contain productId references
  - [ ] Prices calculated correctly:
    - [ ] totalPriceBeforeDiscount
    - [ ] totalPriceAfterDiscount
    - [ ] totalPrice includes shipping
  - [ ] paymentMethod is either "cash" or "online"
  - [ ] orderStatus is "paid", "waiting", or "cancelled"
  - [ ] shippingStatus is valid

---

## Post-Recovery Checklist

- [ ] **Application Startup**
  - [ ] Run `npm run dev` or `npm start`
  - [ ] No errors in console
  - [ ] Server listening on correct port

- [ ] **API Endpoint Testing**
  - [ ] GET /api/products returns 32 products
  - [ ] GET /api/categories returns 8 categories
  - [ ] GET /api/users returns user list (if public endpoint)
  - [ ] Product endpoints return valid image URLs
  - [ ] Category endpoints return valid image URLs

- [ ] **Relationship Testing (if API has join endpoints)**
  - [ ] Product details include category information
  - [ ] Orders include user and product details
  - [ ] Reviews include user and product information
  - [ ] Carts display product information

- [ ] **Admin Functionality**
  - [ ] Admin users can't modify wishlist (if protected)
  - [ ] Admin users can't update address/phone (if protected)
  - [ ] Admin dashboard loads correctly

---

## Troubleshooting Checklist

If any step fails:

- [ ] **Connection Issues**
  - [ ] Test connection string manually
  - [ ] Verify AWS security group allows your IP
  - [ ] Check MongoDB cluster is "Running" status
  - [ ] Verify credentials are correct

- [ ] **Seed Script Errors**
  - [ ] Delete `.env` and recreate (check formatting)
  - [ ] Ensure internet connection is stable
  - [ ] Try running seed script again
  - [ ] Check MongoDB disk space

- [ ] **Verify Script Errors**
  - [ ] All seed operations completed successfully
  - [ ] Run seed script again before verify
  - [ ] Check MongoDB is still accessible

- [ ] **Image Loading Issues**
  - [ ] Check firewall blocks Unsplash CDN
  - [ ] Test image URLs directly in browser
  - [ ] Check CORS configuration if needed

- [ ] **Port Issues**
  - [ ] Find what's using the port: `lsof -i :5000` (macOS/Linux)
  - [ ] Or use netstat on Windows: `netstat -ano | findstr :5000`
  - [ ] Kill process or change port in code

---

## Success Criteria ✅

Your MongoDB recovery is successful when:

- ✅ All 152 documents are in the database
- ✅ All relationships are properly established
- ✅ Image URLs are valid and loading
- ✅ Admin restrictions are enforced
- ✅ Application starts without errors
- ✅ API endpoints return data correctly
- ✅ No console warnings or errors

---

## Recovery Completion Time Estimate

| Step                 | Time         |
| -------------------- | ------------ |
| Seed Database        | 5-30 seconds |
| Verify Relationships | 5-15 seconds |
| Check MongoDB Atlas  | 1-2 minutes  |
| Total Time           | ~10 minutes  |

---

## Documentation Files Created

- ✅ `seed.js` - Seeding script
- ✅ `verify.js` - Verification script
- ✅ `RECOVERY_GUIDE.md` - Comprehensive guide
- ✅ `QUICK_START.md` - Quick start guide
- ✅ `RECOVERY_CHECKLIST.md` - This file

---

**Last Updated**: April 2026  
**Region**: AWS Bahrain (me-south-1)  
**Status**: Ready for deployment
