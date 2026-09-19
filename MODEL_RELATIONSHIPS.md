# 📊 Database Models & Relationships

## Visual Model Relationship Diagram

```
┌─────────────┐
│    USER     │ (35 documents)
├─────────────┤
│ • name      │
│ • email     │──────┐
│ • password  │      │
│ • role      │      │
│ • phone     │      │
│ • wishlist[]│◄─────┼─────────────────┐
│ • address[] │      │                 │
│ • image     │      │                 │
└─────────────┘      │                 │
       ▲             │                 │
       │             │                 │
       └─────────────┼─────────────────┼──────────┐
                     │                 │          │
              ┌──────▼──────┐    ┌─────▼─────┐   │
              │  WISHLIST   │    │  PROFILE  │   │
              │   (Array)   │    │   (Image) │   │
              └─────────────┘    └───────────┘   │
                                                  │
                     ┌────────────────────────────┼─────────┐
                     │                            │         │
                ┌────▼────────┐            ┌──────▼──┐  ┌──▼────────┐
                │  CATEGORY   │            │ PRODUCT │  │  COUPON   │
                │(8 docs)     │            │(32 docs)│  │(10 docs)  │
                ├─────────────┤            ├─────────┤  ├───────────┤
                │ • name      │            │ • category◄─┤ • code    │
                │ • thumbnail ◄────────────┤ │          │ • users[] │◄──┐
                └─────────────┘            │ • title  │ • discount │   │
                                           │ • desc   │ • exp date │   │
                                           │ • images │           │   │
                                           │ • price  │           │   │
                                           │ • stock  │           │   │
                                           │ • rating │           │   │
                                           └──┬───────┘           │   │
                                              │                   │   │
                                         ┌────┴────────┐          │   │
                                         │             │          │   │
                                    ┌────▼─────┐  ┌───▼──────┐    │   │
                                    │  REVIEW   │  │   CART   │    │   │
                                    │(30 docs)  │  │(12 docs) │    │   │
                                    ├───────────┤  ├──────────┤    │   │
                                    │ • user◄───┼──┤ • user◄──┼────┤   │
                                    │ • product │  │ • items[]│    │   │
                                    │ • rating  │  │          │    │   │
                                    │ • desc    │  └──────────┘    │   │
                                    └───────────┘                   │   │
                                         ▲                          │   │
                                         │                          │   │
                                    ┌────┴─────────────────┐        │   │
                                    │      ORDER           │        │   │
                                    │   (25 documents)     │        │   │
                                    ├──────────────────────┤        │   │
                                    │ • user◄──────────────┼────────┘   │
                                    │ • items[] (product)  │            │
                                    │ • coupon code◄───────┼────────────┘
                                    │ • pricing            │
                                    │ • status             │
                                    │ • shipping address   │
                                    │ • payment method     │
                                    └──────────────────────┘
```

---

## Detailed Model Relationships

### 1. USER Model (35 documents)

**Primary Fields:**

- `_id` (ObjectId) - Primary key
- `name` (String) - User full name
- `email` (String) - Unique email
- `password` (String) - Hashed password
- `role` (String enum) - "admin" or "user"
- `phone` (String) - Egyptian format (01xxxxxxxxx)
- `image` (String) - Avatar URL

**References:**

- ✅ `wishlist` ARRAY of Product IDs (user-defined)
- ✅ Referenced BY Coupon.CouponUsers[]
- ✅ Referenced BY Cart.userID
- ✅ Referenced BY Order.userID
- ✅ Referenced BY Review.userID

**Constraints:**

- Admins: Cannot have wishlist, address, or phone
- Regular Users: Can have all fields

---

### 2. CATEGORY Model (8 documents)

**Primary Fields:**

- `_id` (ObjectId) - Primary key
- `name` (String) - Category name
- `thumbnail` (String) - Category image URL

**Categories Seeded:**

1. Watches
2. Rings
3. Necklaces
4. Bracelets
5. Earrings
6. Bags
7. Shoes
8. Belts

**References:**

- ✅ Referenced BY Product.categoryID

---

### 3. PRODUCT Model (32 documents)

**Primary Fields:**

- `_id` (ObjectId) - Primary key
- `title` (String) - Product name
- `description` (String) - Product description
- `thumbnail` (String) - Main image URL
- `images` (Array of Strings) - Additional images
- `stock` (Number) - Available quantity
- `price` (Number) - Product price
- `discount` (Number) - Discount percentage
- `material` (String) - Material type
- `color` (String) - Color variant
- `avgRating` (Number) - Average rating (1-5)
- `numberOfReviews` (Number) - Total reviews

**Foreign Keys:**

- ✅ `categoryID` → Category.\_id (REQUIRED)

**References:**

- ✅ Referenced BY Review.productID
- ✅ Referenced BY Cart.cartItems[].productId
- ✅ Referenced BY Order.orderItems[].productId
- ✅ Referenced BY User.wishlist[] (optional)

---

### 4. REVIEW Model (30 documents)

**Primary Fields:**

- `_id` (ObjectId) - Primary key
- `description` (String) - Review text
- `rating` (Number) - Rating 1-5 stars

**Foreign Keys:**

- ✅ `userID` → User.\_id
- ✅ `productID` → Product.\_id

---

### 5. COUPON Model (10 documents)

**Primary Fields:**

- `_id` (ObjectId) - Primary key
- `CouponCode` (String) - Unique code (SAVE01-SAVE10)
- `CouponPercentage` (Number) - Discount 5-50%
- `expirationDate` (Date) - Expiry timestamp
- `maxUsageLimit` (Number) - Max uses allowed
- `isActive` (Boolean) - Active status

**Array References:**

- ✅ `CouponUsers[]` → Array of User IDs

---

### 6. CART Model (12 documents)

**Primary Fields:**

- `_id` (ObjectId) - Primary key

**Foreign Keys:**

- ✅ `userID` → User.\_id (REQUIRED)

**Array Items:**

- ✅ `cartItems[]`:
  - `productId` → Product.\_id (REQUIRED)
  - `quantity` (Number) - Item quantity

---

### 7. ORDER Model (25 documents)

**Primary Fields:**

- `_id` (ObjectId) - Primary key
- `totalPriceBeforeDiscount` (Number) - Original price
- `totalPriceAfterDiscount` (Number) - After coupons
- `totalPrice` (Number) - Final with shipping
- `shippingPrice` (Number) - Shipping cost (50 EGP)
- `couponCode` (String) - Applied coupon
- `shippingAddress` (String) - Delivery address
- `phone` (String) - Customer phone
- `paymentMethod` (String enum) - "cash" or "online"
- `orderStatus` (String enum) - "paid", "waiting", "cancelled"
- `shippingStatus` (String enum) - "pending", "prepared", "shipped", "cancelled"
- `transactionId` (String) - Payment transaction ID

**Foreign Keys:**

- ✅ `userID` → User.\_id (REQUIRED)

**Array Items:**

- ✅ `orderItems[]`:
  - `productId` → Product.\_id (REQUIRED)
  - `quantity` (Number) - Quantity ordered

---

## Data Distribution

```
User (35)
├── Admin Users (2)
│   └── No wishlist, no address, no phone
│
└── Regular Users (33)
    ├── Some with wishlist ✓
    ├── All with address ✓
    └── Some with phone ✓

Category (8)
└── Each has products

Product (32)
├── Distributed across 8 categories
│   └── 4 products per category average
├── Each has thumbnail + images
├── Price: 500-5500 EGP
├── Stock: 10-110 units
└── Each can have reviews

Review (30)
├── Linked to products
├── Linked to users
└── Distributed reviews across products

Coupon (10)
├── SAVE01 (5%), SAVE02 (10%), ... SAVE10 (50%)
├── Multiple users per coupon
└── All active and future-dated

Cart (12)
├── 1 cart per user (sample)
├── 3 items per cart average
└── Items reference products

Order (25)
├── Distributed across users
├── 1-3 items per order
├── Mix of payment methods
├── Various order statuses
└── Some with coupon codes
```

---

## Image URLs Used

### All Unsplash CDN URLs:

```
https://images.unsplash.com/photo-XXXXXXXXXXXXXX?w=500&h=500&fit=crop
```

**Tested & Working URLs:**

- Product thumbnails: 10 different URLs
- Category thumbnails: 8 different URLs
- User avatars: Gravatar service (i.pravatar.cc)

---

## Data Generation Rules

### User Generation:

- First 2 users: Admin role
- Users 3-35: Regular user role
- Email: userN@bubbli.com format
- Phone: Egyptian format (201xxxxxxxxx)
- Image: Gravatar URLs (i.pravatar.cc)

### Product Generation:

- 32 products total
- Distributed across 8 categories (round-robin assignment)
- Unique titles: "Product N - Premium Item"
- Random stock, price, discount
- Each has thumbnail + 3 additional images
- Colors: Black, White, Gold, Silver, Rose Gold
- Materials: Gold, Silver, Platinum, Diamond, Leather

### Review Generation:

- 30 reviews total
- Distributed across users and products
- Ratings: 1-5 stars (random)
- Linked to active users and products

### Coupon Generation:

- 10 coupons: SAVE01 to SAVE10
- Discounts: 5%, 10%, 15%, ..., 50%
- Each coupon: First 5 users linked
- Expiration: 365 days from now
- Max usage: 100 per coupon

### Order Generation:

- 25 orders total
- Random users assigned
- 1-3 items per order
- Order status: "paid", "waiting", "cancelled" (mixed)
- Shipping status: "pending", "prepared", "shipped", "cancelled"
- Payment: 50/50 cash vs online
- 30% of orders have coupon codes applied

---

## Verification Queries

### Check Category Products:

```javascript
db.products.find({ categoryID: ObjectId("...") }).count();
```

### Check User Wishlists:

```javascript
db.users.find({ wishlist: { $ne: [] } }).count();
```

### Check Product Reviews:

```javascript
db.reviews.aggregate([
  {
    $group: {
      _id: "$productID",
      reviewCount: { $sum: 1 },
    },
  },
]);
```

### Check Order Totals:

```javascript
db.orders.aggregate([
  {
    $group: {
      _id: null,
      totalRevenue: { $sum: "$totalPrice" },
      avgOrderValue: { $avg: "$totalPrice" },
    },
  },
]);
```

---

**All relationships are properly established and ready for production use! ✅**
