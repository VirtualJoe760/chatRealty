# 🏗️ BACKEND ARCHITECTURE v1.0
**JPSRealtor.com Production System**
**Last Updated:** November 23, 2025
**Tech Stack:** Next.js 16.0.3 + MongoDB Atlas + Python Scripts

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [API Routes Architecture](#api-routes-architecture)
3. [Database Models](#database-models)
4. [MLS Ingestion Pipeline](#mls-ingestion-pipeline)
5. [Authentication System](#authentication-system)
6. [Chat System](#chat-system)
7. [User Tier System](#user-tier-system)
8. [External Integrations](#external-integrations)

---

## 🎯 SYSTEM OVERVIEW

### Technology Stack
```yaml
Framework: Next.js 16.0.3 (App Router)
Runtime: Node.js + Python 3.10
Database: MongoDB Atlas (DigitalOcean)
Auth: NextAuth.js v5
AI: Groq SDK (llama-3.1-70b-versatile)
Maps: MapLibre GL + Supercluster
MLS API: Spark API (GPS + CRMLS)
Image: Cloudinary
Email: Nodemailer + SMTP
```

### Application Structure

```
/root/website/jpsrealtor/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   ├── components/         # React Components
│   │   ├── contexts/           # React Contexts
│   │   └── utils/              # Frontend Utils
│   ├── lib/                    # Backend Libraries
│   ├── models/                 # MongoDB Mongoose Models
│   └── scripts/                # Python/TS Scripts
│       ├── mls/backend/        # MLS Ingestion
│       ├── subdivisions/       # Subdivision Pipeline
│       └── cities/             # City Data Pipeline
```

---

## 🔌 API ROUTES ARCHITECTURE

### Route Groups

#### 1. Authentication (/api/auth/)

```
GET/POST /api/auth/[...nextauth]     # NextAuth handler
POST      /api/auth/register         # User registration
POST      /api/auth/verify-email     # Email verification
GET       /api/auth/check-verification # Verify status
POST      /api/auth/resend-verification
GET       /api/auth/user             # Get current user
POST      /api/auth/2fa/enable       # Enable 2FA
POST      /api/auth/2fa/disable      # Disable 2FA
POST      /api/auth/2fa/send-code    # Send 2FA code
POST      /api/auth/2fa/verify-code  # Verify 2FA code
```

**Dependencies:**
- Models: User, VerificationToken, TwoFactorToken
- Libraries: bcryptjs, jsonwebtoken, nodemailer
- Auth: NextAuth with Credentials provider

**Flow:**
```
graph LR
    A[Client] --> B[/api/auth/register]
    B --> C[Create User + Hash Password]
    C --> D[Send Verification Email]
    D --> E[Store Verification Token]
    A --> F[/api/auth/verify-email]
    F --> G[Validate Token]
    G --> H[Set emailVerified]
```

---

#### 2. MLS Listings (/api/mls-listings/)

```
GET /api/mls-listings                      # Search listings (paginated)
GET /api/mls-listings/[slugAddress]        # Get single listing
GET /api/mls-listings/[slugAddress]/documents
GET /api/mls-listings/[slugAddress]/openhouses
GET /api/mls-listings/[slugAddress]/videos
GET /api/mls-listings/[slugAddress]/virtualtours
```

**Query Parameters:**
```typescript
{
  city?: string
  subdivision?: string
  minPrice?: number
  maxPrice?: number
  minBeds?: number
  minBaths?: number
  propertyType?: string[]
  standardStatus?: 'Active' | 'Pending' | 'Hold'
  page?: number
  limit?: number
  sort?: 'price' | 'date' | 'sqft'
}
```

**Dependencies:**
- Models: Listing, Photos, Documents, OpenHouses, Videos, VirtualTours
- Collections: listings, photos, gpsClosedListings, crmlsClosedListings

---

#### 3. Chat System (/api/chat/)

```
POST /api/chat/stream              # Main chat streaming endpoint
POST /api/chat/search-listings     # Function: search MLS
POST /api/chat/match-location      # Function: geocode location
POST /api/chat/research-community  # Function: community data
POST /api/chat/community-facts     # Get community facts
POST /api/chat/generate-title      # Generate chat title
GET  /api/chat/history             # Get user chat history
POST /api/chat/save                # Save chat session
POST /api/chat/log                 # Log chat message
POST /api/chat/goals               # Extract user goals
```

**Chat Streaming Architecture:**
```typescript
// Request
{
  messages: Array<{role: 'user'|'assistant', content: string}>,
  context?: 'homepage' | 'listing' | 'dashboard',
  listingData?: object,
  userLocation?: {city: string, region: string}
}

// Response (SSE Stream)
data: {"type": "text", "content": "Hello..."}
data: {"type": "function_call", "name": "search_listings", "args": {...}}
data: {"type": "function_result", "data": [...]}
data: {"type": "done"}
```

**Function Calling:**
```typescript
AVAILABLE_FUNCTIONS = [
  {
    name: "search_listings",
    description: "Search MLS for properties",
    parameters: {
      city?: string,
      minPrice?: number,
      maxPrice?: number,
      minBeds?: number,
      minBaths?: number,
      propertyTypes?: string[]
    }
  },
  {
    name: "match_location",
    description: "Geocode location to city/subdivision",
    parameters: {
      location: string
    }
  },
  {
    name: "research_community",
    description: "Get schools, demographics, amenities",
    parameters: {
      city: string,
      subdivision?: string
    }
  }
]
```

**Dependencies:**
- Model: ChatMessage, SavedChat, UserGoals
- Libraries: groq-sdk, ai (Vercel AI SDK)
- APIs: Groq (llama-3.1-70b), OpenCage (geocoding), Yelp (businesses)

---

#### 4. Cities & Subdivisions

```typescript
// Cities
GET /api/cities/[cityId]                # Get city details
GET /api/cities/[cityId]/listings       # City listings
GET /api/cities/[cityId]/subdivisions   # City subdivisions
GET /api/cities/[cityId]/schools        # City schools
GET /api/cities/[cityId]/stats          # City statistics
GET /api/cities/[cityId]/hoa            # HOA contacts
GET /api/cities/[cityId]/photos         # City photos

// Subdivisions
GET /api/subdivisions                   # All subdivisions
GET /api/subdivisions/[slug]            # Subdivision details
GET /api/subdivisions/[slug]/listings   # Subdivision listings
GET /api/subdivisions/[slug]/stats      # Subdivision stats
GET /api/subdivisions/[slug]/photos     # Subdivision photos
```

**Dependencies:**
- Models: Cities, Subdivisions
- Joins: Listings by city, subdivision fields

---

#### 5. User Management (/api/user/)

```
GET    /api/user/profile              # Get user profile
PUT    /api/user/profile              # Update profile
GET    /api/user/check-admin          # Check admin status
GET    /api/user/favorites            # Get favorite listings
POST   /api/user/favorites/[key]      # Add favorite
DELETE /api/user/favorites/[key]      # Remove favorite
GET    /api/user/favorite-communities # Get favorite cities/subdivisions
POST   /api/user/link-partner         # Link significant other
```

---

#### 6. AI Services (/api/ai/)

```
POST /api/ai/cma                # CMA (Comparative Market Analysis)
POST /api/ai/console            # AI console (internal)
POST /api/ai/runway             # Runway video generation
GET  /api/ai/runway/[id]        # Get Runway task status
```

**CMA Engine:**
```typescript
// Input
{
  address: string,
  sqft: number,
  beds: number,
  baths: number,
  yearBuilt: number,
  propertyType: string
}

// Process
1. Geocode address → lat/lon
2. Query MongoDB for comps within 1 mile
3. Filter: similar sqft (±30%), beds, baths, sold within 6 months
4. Calculate price per sqft
5. Generate AI-powered CMA report

// Output
{
  estimatedValue: number,
  pricePerSqft: number,
  comparables: Array<{
    address: string,
    soldPrice: number,
    soldDate: string,
    sqft: number,
    distance: number
  }>,
  aiAnalysis: string
}
```

---

#### 7. Admin & Analytics

```
GET /api/admin/analytics        # Admin dashboard data
POST /api/activity/search       # Track user searches
POST /api/activity/update-user-metrics # Update user engagement
```

---

#### 8. Swipes (Tinder-style)

```
GET  /api/swipes/batch          # Get batch of listings
POST /api/swipes/user           # Record swipe
GET  /api/swipes/exclude-keys   # Get already-swiped keys
```

**Swipe Logic:**
```typescript
// Batch Request
GET /api/swipes/batch?count=20&city=Palm+Springs

// Response
{
  listings: [...], // 20 active listings not yet swiped
  total: 150       // Total available in area
}

// Record Swipe
POST /api/swipes/user
{
  listingKey: "...",
  action: "like" | "dislike",
  listingData: {...} // Full listing object
}

// Updates User Model
likedListings: [{listingKey, listingData, swipedAt, subdivision, city}]
dislikedListings: [{listingKey, swipedAt, expiresAt}] // 30min TTL
```

---

## 📊 DATABASE MODELS

### Core Collections

#### 1. Users Collection

```typescript
{
  _id: ObjectId
  email: string (unique, indexed)
  emailVerified: Date | null
  password: string (bcrypt hashed)
  name?: string
  image?: string

  // Role-based Access
  roles: ["admin" | "endUser" | "vacationRentalHost" |
          "realEstateAgent" | "serviceProvider"]
  isAdmin: boolean

  // Profile
  phone?: string
  bio?: string
  birthday?: Date
  profileDescription?: string
  realEstateGoals?: string
  currentAddress?: string
  homeownerStatus?: "own" | "rent" | "other"
  significantOther?: ObjectId (ref: User)

  // Real Estate Agent
  licenseNumber?: string
  brokerageName?: string
  website?: string

  // Service Provider
  businessName?: string
  serviceCategory?: string
  serviceAreas?: string[]
  certifications?: string[]

  // Vacation Rental Host
  stripeAccountId?: string
  stripeOnboarded: boolean

  // Anonymous Tracking
  anonymousId?: string // Browser fingerprint

  // Liked/Disliked Listings
  likedListings: [{
    listingKey: string
    listingData: object
    swipedAt: Date
    subdivision?: string
    city?: string
    propertySubType?: string
  }]

  dislikedListings: [{
    listingKey: string
    listingData?: object
    swipedAt: Date
    expiresAt: Date // 30 minute TTL
  }]

  // Saved Searches
  savedSearches?: [{
    name: string
    criteria: object
    createdAt: Date
  }]

  // Favorite Communities
  favoriteCommunities?: [{
    name: string
    id: string
    type: 'city' | 'subdivision'
    cityId?: string
  }]

  // Swipe Analytics
  swipeAnalytics?: {
    totalLikes: number
    totalDislikes: number
    topSubdivisions: [{name: string, count: number}]
    topCities: [{name: string, count: number}]
    topPropertySubTypes: [{type: string, count: number}]
    lastUpdated: Date
  }

  // Activity Metrics (Admin)
  activityMetrics?: {
    totalSessions: number
    totalSearches: number
    totalListingsViewed: number
    totalFavorites: number
    lastActivityAt: Date
    engagementScore: number // 0-100
    lastSessionDuration?: number
  }

  // Subscription/Tier (Future)
  subscriptionTier?: "free" | "pro" | "ultimate" |
                     "investor1" | "investor2" | "investor3"
  subscriptionStatus?: "active" | "canceled" | "past_due"
  subscriptionEndsAt?: Date

  // Usage Tracking
  chatMessageCount?: number
  cmaRequestCount?: number
  monthlyResetDate?: Date

  createdAt: Date
  updatedAt: Date
}
```

**Indexes:**
```javascript
email: unique
anonymousId: indexed
"likedListings.listingKey": indexed
"activityMetrics.lastActivityAt": indexed
roles: indexed
```

---

#### 2. Listings Collection (GPS)

```typescript
{
  _id: ObjectId
  listingKey: string (unique, indexed) // Primary key from MLS
  mlsId: string
  standardStatus: "Active" | "Pending" | "Hold" | "ComingSoon" | "Closed"
  listPrice: number
  originalListPrice: number

  // Property Details
  propertyType: string // "A" (Residential), "B" (Lease), "C" (Income)
  propertySubType: string
  beds: number
  baths: number
  fullBaths: number
  halfBaths: number
  sqft: number
  yearBuilt: number
  stories: number
  garage: number
  pool: string

  // Location (camelCase)
  city: string (indexed)
  stateOrProvince: string
  postalCode: string
  subdivision: string (indexed)
  streetNumber: string
  streetDirPrefix: string
  streetName: string
  streetSuffix: string
  unitNumber: string

  // Coordinates
  latitude: number
  longitude: number

  // Financial
  hoaFee: number
  taxAnnualAmount: number

  // Land Info
  lotSizeAcres: number
  lotSizeSquareFeet: number
  landType: "Fee" | "Lease"
  landLeaseAmount: number
  landLeasePer: string
  landLeaseExpirationDate: string
  landLeaseYearsRemaining: number

  // Marketing
  publicRemarks: string
  privateRemarks: string

  // Dates
  listingContractDate: Date
  onMarketDate: Date
  closeDate: Date
  statusChangeTimestamp: Date
  modificationTimestamp: Date
  photoModificationTimestamp: Date

  // Agent Info
  listAgentFullName: string
  listAgentEmail: string
  listAgentDirectPhone: string
  listOfficeName: string

  // Flags
  virtualTourUrl: string
  videoUrl: string

  // Slug for URLs
  slug: string (indexed) // Format: address-city-listingKey

  // Related Data (populated via joins)
  photos: ObjectId[] (ref: Photos)
  documents: ObjectId[] (ref: Documents)
  openHouses: ObjectId[] (ref: OpenHouses)

  createdAt: Date
  updatedAt: Date
}
```

**Indexes:**
```javascript
listingKey: unique
slug: unique
city: indexed
subdivision: indexed
standardStatus: indexed
{latitude: 1, longitude: 1}: 2dsphere // Geospatial queries
{listPrice: 1, sqft: 1}: compound // Price/sqft searches
```

---

#### 3. CRMLS Listings Collection

Same schema as GPS Listings, stored in separate collection:
- Collection: `crmlsListings`
- MLS ID: 20200218121507636729000000

---

#### 4. Closed Listings Collections

```typescript
// gpsClosedListings
// crmlsClosedListings
{
  ...same schema as active listings...
  standardStatus: "Closed"
  closeDate: Date
  closePrice: number
}
```

**Purpose:** Historical data for CMA, market trends, and analytics

---

#### 5. Photos Collection

```typescript
{
  _id: ObjectId
  listingId: string (indexed)
  photoId: string (unique)

  // Multiple resolutions
  uriThumb: string
  uri300: string
  uri640: string
  uri800: string
  uri1024: string
  uri1280: string
  uri1600: string
  uri2048: string
  uriLarge: string

  primary: boolean
  caption: string
  modificationTimestamp: Date

  createdAt: Date
}
```

---

#### 6. Subdivisions Collection

```typescript
{
  _id: ObjectId
  name: string (indexed)
  slug: string (unique, indexed)
  city: string (indexed)
  county: string

  // Statistics
  totalListings: number
  activeListings: number
  medianPrice: number
  avgSqft: number
  avgYearBuilt: number

  // Description
  description: string
  amenities: string[]
  hoaRequired: boolean
  avgHoaFee: number

  // Photos
  photos: string[] // Cloudinary URLs

  // Schools
  nearbySchools: [{
    name: string
    type: "Elementary" | "Middle" | "High"
    rating: number
    distance: number
  }]

  // SEO
  metaTitle: string
  metaDescription: string

  createdAt: Date
  updatedAt: Date
}
```

---

#### 7. Cities Collection

```typescript
{
  _id: ObjectId
  name: string (indexed)
  cityId: string (unique, indexed)
  county: string
  state: string

  // Coordinates
  latitude: number
  longitude: number

  // Statistics
  population: number
  medianHomePrice: number
  medianIncome: number
  totalListings: number
  activeListings: number

  // Description
  description: string
  quickFacts: string[]

  // Amenities
  parks: number
  restaurants: number
  schools: number

  // Photos
  photos: string[]

  createdAt: Date
  updatedAt: Date
}
```

---

#### 8. ChatMessage Collection

```typescript
{
  _id: ObjectId
  userId: ObjectId (ref: User, indexed)
  sessionId: string (indexed)
  role: "user" | "assistant" | "system" | "function"
  content: string

  // Function Calling
  functionName?: string
  functionArgs?: object
  functionResult?: object

  // Context
  context?: "homepage" | "listing" | "dashboard"
  listingData?: object

  // Metadata
  model?: string // "llama-3.1-70b-versatile"
  tokensUsed?: number
  latency?: number

  createdAt: Date
}
```

---

#### 9. SavedChat Collection

```typescript
{
  _id: ObjectId
  userId: ObjectId (ref: User, indexed)
  sessionId: string (indexed)
  title: string
  messages: [{
    role: string
    content: string
    createdAt: Date
  }]

  // Metadata
  messageCount: number
  lastMessageAt: Date
  archived: boolean

  createdAt: Date
  updatedAt: Date
}
```

---

## 🔄 MLS INGESTION PIPELINE

### Architecture Overview

```
Spark API → fetch.py → flatten.py → seed.py → MongoDB
                                       ↓
                              cache_photos.py → Photos Collection
                                       ↓
                                  update.py → Status Monitoring
```

### Pipeline Scripts

**Location:** `/src/scripts/mls/backend/`

#### 1. main.py - Orchestrator

```python
# Runs both GPS and CRMLS pipelines sequentially
SCRIPT_PIPELINES = [
    ("CRMLS", CRMLS_DIR, [
        "fetch.py",
        "flatten.py",
        "seed.py",
        "cache_photos.py",
        "update.py"
    ]),
    ("GPS", GPS_DIR, [
        "fetch.py",
        "flatten.py",
        "seed.py",
        "cache_photos.py",
        "update.py"
    ])
]
```

**Execution:**
```bash
python3 /root/website/jpsrealtor/src/scripts/mls/backend/main.py
```

---

#### 2. fetch.py - Data Retrieval

```python
BASE_URL = "https://replication.sparkapi.com/v1/listings"
EXPANSIONS = ["Rooms", "Units", "OpenHouses", "VirtualTours"]
BATCH_SIZE = 500

# Filter Construction
mls_filter = f"MlsId Eq '{MLS_ID}'"
property_filter = "PropertyType Eq 'A' Or PropertyType Eq 'B' Or PropertyType Eq 'C'"
status_filter = "StandardStatus Eq 'Active'"

# Pagination using $skiptoken
while skip_token:
    listings = fetch_batch(skip_token)
    save_to_json(listings)
    skip_token = get_next_token(response)
```

**Output:** `raw_listings_*.json` files

**Rate Limiting:**
- 429 errors: Exponential backoff (3-9 seconds)
- Success: 0.3s throttle between requests

---

#### 3. flatten.py - Data Transformation

```python
def flatten_listing(raw: dict) -> dict:
    standard = raw['StandardFields']

    # Convert PascalCase → camelCase
    flat = {to_camel_case(k): v for k, v in standard.items()}

    # Derive land details
    flat.update(derive_land_details(standard))

    # Generate slug
    flat['slug'] = simple_slugify(
        f"{flat['streetNumber']}-{flat['streetName']}-"
        f"{flat['city']}-{flat['listingKey']}"
    )

    return flat
```

**Output:** `flat_listings_*.json` files

---

#### 4. seed.py - MongoDB Upsert

```python
operations = [
    UpdateOne(
        {"listingKey": listing["listingKey"]},
        {"$set": listing},
        upsert=True
    )
    for listing in batch
]

result = collection.bulk_write(operations, ordered=False)
print(f"Modified: {result.modified_count}, Upserted: {result.upserted_count}")
```

**Batch Size:** 500 listings per bulk_write

---

#### 5. cache_photos.py - Photo Caching

```python
# Skip Index System
skip_ids = load_skip_index()  # Listings with no photos or 403 errors

for listing in listings:
    if listing_id in skip_ids:
        continue

    photos = fetch_photos(listing_id)

    if not photos:
        mark_skipped(listing_id, "no_photos")
        continue

    primary_photo = photos[0]

    photo_doc = {
        "listingId": listing_id,
        "photoId": primary_photo["Id"],
        "uriThumb": primary_photo["UriThumb"],
        "uri300": primary_photo["Uri300"],
        "uri640": primary_photo["Uri640"],
        "uri800": primary_photo["Uri800"],
        "uri1024": primary_photo["Uri1024"],
        "uri1280": primary_photo["Uri1280"],
        "uri1600": primary_photo["Uri1600"],
        "uri2048": primary_photo["Uri2048"],
        "uriLarge": primary_photo["UriLarge"],
        "primary": True
    }

    photos_collection.update_one(
        {"listingId": listing_id},
        {"$set": photo_doc},
        upsert=True
    )
```

**Skip Index:** Prevents re-fetching photos that returned 403 or have no photos

---

#### 6. update.py - Status Monitoring

```python
# Monitor active listings for status changes
active_statuses = ["Active", "Pending", "Hold", "ComingSoon"]
listings = collection.find({"standardStatus": {"$in": active_statuses}})

for listing in listings:
    spark_status = fetch_listing_status(listing_key)

    if spark_status == "Closed":
        # Move to closed collection
        full_listing = collection.find_one({"listingKey": listing_key})
        full_listing["standardStatus"] = "Closed"
        full_listing.pop("_id", None)

        closed_collection.update_one(
            {"listingKey": listing_key},
            {"$set": full_listing},
            upsert=True
        )

        collection.delete_one({"listingKey": listing_key})
        print(f"🏠💰 {listing_key}: SOLD (moved to closed collection)")
```

**Throttling:**
- 5 concurrent workers
- 0.18s micro-throttle per request
- 60s rest after every 1000 listings

---

#### 7. historical_closed_sync.py - Backfill Closed Listings

```python
# One-time sync of last 5 years of closed listings
CUTOFF_DATE = datetime.now(UTC) - timedelta(days=5 * 365)
BATCH_SIZE = 500
BATCH_DELAY = 60  # seconds

# Filter: Only listings closed within 5 years
def is_within_5_years(listing):
    close_date = listing.get("closeDate") or listing.get("statusChangeTimestamp")
    return close_date >= CUTOFF_DATE

# Process GPS → CRMLS
for mls in [GPS, CRMLS]:
    sync_mls(mls_id, mls_name, closed_collection)
```

**Status:** Currently running (started Nov 22, 9:42 PM UTC)
**Progress:** 46 batches, 23,000 CRMLS listings fetched, 22,746 seeded

---

### Scheduling

#### Cron Jobs

```bash
# Daily active listings sync (GPS + CRMLS)
0 6,18 * * * cd /root/website/jpsrealtor/src/scripts/mls/backend && python3 main.py

# Historical closed sync (one-time, scheduled at 10 AM daily for monitoring)
0 10 * * * cd /root/website/jpsrealtor/src/scripts/mls/backend && python3 historical_closed_sync.py

# Status monitoring (every 12 hours)
0 */12 * * * cd /root/website/jpsrealtor/src/scripts/mls/backend && python3 update.py
```

---

## 🔐 AUTHENTICATION SYSTEM

### Current Implementation: NextAuth.js

#### Provider: Credentials

```typescript
// src/app/api/auth/[...nextauth]/route.ts
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {}
      },
      async authorize(credentials) {
        const user = await User.findOne({ email: credentials.email });

        if (!user || !user.emailVerified) {
          throw new Error("Email not verified");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          roles: user.roles,
          isAdmin: user.isAdmin
        };
      }
    })
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.roles = token.roles;
      session.user.isAdmin = token.isAdmin;
      return session;
    }
  },

  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-email"
  }
};
```

---

### Registration Flow

```typescript
// 1. User submits registration
POST /api/auth/register
{
  email: string
  password: string (min 8 chars)
  name: string
}

// 2. Server creates user + verification token
const hashedPassword = await bcrypt.hash(password, 10);
const user = await User.create({
  email,
  password: hashedPassword,
  name,
  emailVerified: null,
  roles: ["endUser"]
});

const verificationToken = crypto.randomBytes(32).toString("hex");
await VerificationToken.create({
  identifier: email,
  token: verificationToken,
  expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
});

// 3. Send verification email
await sendVerificationEmail(email, verificationToken);

// 4. User clicks link
GET /auth/verify-email?token=...

// 5. Verify token
POST /api/auth/verify-email
{
  token: string
}

// Server validates and updates user
const tokenDoc = await VerificationToken.findOne({ token });
if (!tokenDoc || tokenDoc.expires < Date.now()) {
  throw new Error("Token expired");
}

await User.updateOne(
  { email: tokenDoc.identifier },
  { emailVerified: new Date() }
);

await VerificationToken.deleteOne({ token });
```

---

### Two-Factor Authentication (2FA)

```typescript
// Enable 2FA
POST /api/auth/2fa/enable
{
  email: string
}

// Server generates 6-digit code
const code = Math.floor(100000 + Math.random() * 900000).toString();
await TwoFactorToken.create({
  identifier: email,
  token: code,
  expires: Date.now() + 10 * 60 * 1000 // 10 minutes
});

// Send code via email/SMS
await sendTwoFactorCode(email, code);

// Verify code
POST /api/auth/2fa/verify-code
{
  email: string
  code: string
}

// Server validates
const tokenDoc = await TwoFactorToken.findOne({
  identifier: email,
  token: code
});

if (!tokenDoc || tokenDoc.expires < Date.now()) {
  throw new Error("Invalid or expired code");
}

await User.updateOne({ email }, { twoFactorEnabled: true });
await TwoFactorToken.deleteOne({ identifier: email, token: code });
```

---

### Session Management

#### Client-Side:

```typescript
// src/app/contexts/AuthContext.tsx
import { useSession, signIn, signOut } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    signIn,
    signOut
  };
}
```

#### Server-Side:

```typescript
// In API routes
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  // ...
}
```

---

## 💬 CHAT SYSTEM

### Architecture Overview

```
User → Frontend Chat Widget → /api/chat/stream → Groq API
                                     ↓
                              Function Calling:
                              - search_listings
                              - match_location
                              - research_community
                                     ↓
                              MongoDB Query → Listings
                                     ↓
                              Stream Response → Frontend
```

---

### Chat Stream Endpoint

#### Request:

```typescript
POST /api/chat/stream
Content-Type: application/json

{
  messages: [
    { role: "user", content: "Find me a 3 bed house in Palm Springs under $500k" }
  ],
  context?: "homepage" | "listing" | "dashboard",
  listingData?: {...}, // If on listing page
  userLocation?: {
    city: "Palm Springs",
    region: "California"
  }
}
```

#### Response (Server-Sent Events):

```
data: {"type":"text","content":"I'll"}
data: {"type":"text","content":" help"}
data: {"type":"text","content":" you"}
data: {"type":"function_call","name":"search_listings","args":{"city":"Palm Springs","minBeds":3,"maxPrice":500000}}
data: {"type":"function_result","data":[...listings...]}
data: {"type":"text","content":"I found 12 properties..."}
data: {"type":"done"}
```

---

### System Prompt

#### Context-Aware Prompting:

```typescript
// src/lib/chat-utils.ts
export function buildSystemPrompt(
  context: "homepage" | "listing" | "dashboard",
  listingData?: any,
  userLocation?: {city?: string, region?: string},
  userData?: UserData
): string {
  let basePrompt = `
You are JPSRealtor's AI assistant, powered by Joseph Sardella's deep local knowledge of Southern California real estate, particularly the Coachella Valley.

Your expertise:
- Greater Palm Springs (Palm Springs, Palm Desert, Indian Wells, Rancho Mirage, La Quinta, Cathedral City, Indio, Coachella, Desert Hot Springs)
- Los Angeles, San Diego, Riverside, San Bernardino, Orange County
- HOAs, land leases, desert living, golf communities, vacation rentals

Your personality:
- Warm, approachable, knowledgeable
- Use natural language, avoid robotic responses
- Proactively ask clarifying questions
- Show genuine interest in user's goals

Available functions:
1. search_listings - Search MLS for properties
2. match_location - Geocode location to city/subdivision
3. research_community - Get schools, demographics, amenities

Always:
- Ask about budget, beds, baths, location preferences
- Explain HOA fees and land leases when relevant
- Recommend specific subdivisions/cities based on needs
- Offer to schedule showings or consultations
`;

  // Add location-specific greeting
  if (userLocation?.city) {
    basePrompt += `\nUser's location: ${userLocation.city}, ${userLocation.region}`;
  }

  // Add user personalization
  if (userData) {
    if (userData.name) {
      basePrompt += `\nUser's name: ${userData.name}`;
    }
    if (userData.realEstateGoals) {
      basePrompt += `\nUser's goals: ${userData.realEstateGoals}`;
    }
    if (userData.topCities?.length) {
      basePrompt += `\nUser has shown interest in: ${userData.topCities.map(c => c.name).join(", ")}`;
    }
  }

  // Context-specific prompts
  if (context === "listing" && listingData) {
    basePrompt += `\n\nUser is viewing this listing:\n`;
    basePrompt += `Address: ${listingData.streetNumber} ${listingData.streetName}, ${listingData.city}\n`;
    basePrompt += `Price: ${listingData.listPrice?.toLocaleString()}\n`;
    basePrompt += `Beds: ${listingData.beds} | Baths: ${listingData.baths} | Sqft: ${listingData.sqft}\n`;
    basePrompt += `\nAnswer questions about this property, suggest similar listings, or discuss the neighborhood.`;
  }

  if (context === "dashboard") {
    basePrompt += `\n\nUser is in their dashboard. Help them review favorites, saved searches, and preferences.`;
  }

  return basePrompt;
}
```

---

### Function Calling

#### Available Functions:

```typescript
// src/lib/ai-functions.ts
export const AVAILABLE_FUNCTIONS = [
  {
    type: "function",
    function: {
      name: "search_listings",
      description: "Search the MLS for properties matching criteria. Returns up to 20 results.",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "City name (e.g., 'Palm Springs', 'Palm Desert')"
          },
          subdivision: {
            type: "string",
            description: "Subdivision/community name"
          },
          minPrice: {
            type: "number",
            description: "Minimum listing price in dollars"
          },
          maxPrice: {
            type: "number",
            description: "Maximum listing price in dollars"
          },
          minBeds: {
            type: "number",
            description: "Minimum number of bedrooms"
          },
          minBaths: {
            type: "number",
            description: "Minimum number of bathrooms"
          },
          propertyTypes: {
            type: "array",
            items: { type: "string" },
            description: "Property types: ['Single Family', 'Condo', 'Townhouse']"
          },
          hasPool: {
            type: "boolean",
            description: "Property must have a pool"
          }
        }
      }
    }
  },

  {
    type: "function",
    function: {
      name: "match_location",
      description: "Convert a location description to a specific city or subdivision",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "Location description (e.g., 'near downtown Palm Springs', 'in the valley')"
          }
        },
        required: ["location"]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "research_community",
      description: "Get detailed information about a city or subdivision: schools, demographics, amenities, HOA info",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "City name"
          },
          subdivision: {
            type: "string",
            description: "Subdivision name (optional)"
          }
        },
        required: ["city"]
      }
    }
  }
];
```

---

### Function Execution:

```typescript
// src/app/api/chat/stream/route.ts
async function executeFunction(name: string, args: any) {
  switch (name) {
    case "search_listings":
      return await searchListings(args);

    case "match_location":
      return await matchLocation(args.location);

    case "research_community":
      return await researchCommunity(args);

    default:
      return { error: "Unknown function" };
  }
}

// Search Listings Implementation
async function searchListings(params: {
  city?: string,
  subdivision?: string,
  minPrice?: number,
  maxPrice?: number,
  minBeds?: number,
  minBaths?: number,
  propertyTypes?: string[],
  hasPool?: boolean
}) {
  const query: any = {
    standardStatus: "Active"
  };

  if (params.city) query.city = new RegExp(params.city, "i");
  if (params.subdivision) query.subdivision = new RegExp(params.subdivision, "i");
  if (params.minPrice) query.listPrice = { $gte: params.minPrice };
  if (params.maxPrice) query.listPrice = { ...query.listPrice, $lte: params.maxPrice };
  if (params.minBeds) query.beds = { $gte: params.minBeds };
  if (params.minBaths) query.baths = { $gte: params.minBaths };
  if (params.propertyTypes) query.propertySubType = { $in: params.propertyTypes };
  if (params.hasPool) query.pool = { $ne: "None" };

  const listings = await Listing.find(query)
    .limit(20)
    .sort({ listPrice: 1 })
    .lean();

  // Attach primary photo
  for (const listing of listings) {
    const photo = await Photo.findOne({ listingId: listing.listingKey });
    if (photo) {
      listing.primaryPhoto = photo.uri800 || photo.uri640;
    }
  }

  return listings;
}
```

---

### Chat Logging

#### Message Logging:

```typescript
POST /api/chat/log
{
  userId: string,
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  functionName?: string,
  functionArgs?: object,
  functionResult?: object
}

// Stored in ChatMessage collection
await ChatMessage.create({
  userId: new ObjectId(userId),
  sessionId,
  role,
  content,
  functionName,
  functionArgs,
  functionResult,
  model: "llama-3.1-70b-versatile",
  createdAt: new Date()
});
```

---

### Goal Extraction

#### Automatic Goal Detection:

```typescript
POST /api/chat/goals
{
  userId: string,
  message: string
}

// AI extracts structured goals from user messages
const goals = await extractGoals(message);

// Example output:
{
  minBudget: 400000,
  maxBudget: 600000,
  minBeds: 3,
  preferredCities: ["Palm Springs", "Palm Desert"],
  mustHave: ["pool", "garage"],
  timeline: "6 months"
}

// Stored in UserGoals collection
await UserGoals.updateOne(
  { userId: new ObjectId(userId) },
  { $set: { ...goals, updatedAt: new Date() } },
  { upsert: true }
);
```

---

### Saved Chats

#### Save Chat Session:

```typescript
POST /api/chat/save
{
  userId: string,
  sessionId: string,
  title?: string
}

// Fetch all messages for session
const messages = await ChatMessage.find({
  userId: new ObjectId(userId),
  sessionId
}).sort({ createdAt: 1 });

// Generate title if not provided
let title = providedTitle;
if (!title && messages.length > 0) {
  title = await generateChatTitle(messages);
}

// Save chat
await SavedChat.create({
  userId: new ObjectId(userId),
  sessionId,
  title,
  messages: messages.map(m => ({
    role: m.role,
    content: m.content,
    createdAt: m.createdAt
  })),
  messageCount: messages.length,
  lastMessageAt: messages[messages.length - 1].createdAt
});
```

---

## 👤 USER TIER SYSTEM

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         ROLE SYSTEM                             │
└─────────────────────────────────────────────────────────────────┘

TOP LEVEL (Full System Access)
├── Superadmin (Me)
│   └── Full database access, analytics, user management

TEAM MEMBERS (Internal Staff)
├── Admin
│   ├── User management
│   ├── Content moderation
│   ├── Analytics dashboards
│   └── MLS data oversight

AGENTS (Real Estate Professionals)
├── Real Estate Agent
│   ├── Client management
│   ├── Listing creation/editing
│   ├── CMA generation (unlimited)
│   ├── Lead tracking
│   └── Commission splits

USERS (Public)
├── End User
│   ├── Browse listings
│   ├── Swipe/favorite properties
│   ├── Chat with AI (tier-limited)
│   ├── Save searches
│   └── Request showings

SERVICE PROVIDERS (Third-party professionals)
├── Service Provider
│   ├── Title companies
│   ├── Mortgage lenders
│   ├── Escrow officers
│   ├── Contractors
│   └── Developers

VACATION RENTAL HOSTS
└── Vacation Rental Host
    ├── Property listing
    ├── Booking management
    └── Stripe integration
```

---

### Subscription Tiers

```typescript
SUBSCRIPTION_TIERS = {
  // Free Users
  free: {
    name: "Free",
    price: 0,
    chatMessages: 10, // per month
    cmaRequests: 0,
    savedSearches: 3,
    favoriteListings: 50,
    features: [
      "Browse active listings",
      "Swipe properties",
      "Basic chat (10 messages/month)",
      "Save 3 searches",
      "Email alerts"
    ]
  },

  // Subscription Tiers
  pro: {
    name: "Pro",
    price: 10, // per month
    chatMessages: 100,
    cmaRequests: 0,
    savedSearches: 10,
    favoriteListings: 200,
    features: [
      "All Free features",
      "100 chat messages/month",
      "Advanced search filters",
      "10 saved searches",
      "Priority support"
    ]
  },

  ultimate: {
    name: "Ultimate",
    price: 20, // per month
    chatMessages: -1, // unlimited
    cmaRequests: 0,
    savedSearches: -1, // unlimited
    favoriteListings: -1, // unlimited
    features: [
      "All Pro features",
      "Unlimited chat messages",
      "Unlimited saved searches",
      "SMS alerts",
      "Exclusive market insights"
    ]
  },

  // Investor Tiers
  investor1: {
    name: "Investor Tier 1",
    price: 99, // per month
    chatMessages: -1,
    cmaRequests: 10, // per month
    savedSearches: -1,
    favoriteListings: -1,
    features: [
      "All Ultimate features",
      "10 CMA reports/month",
      "Investment property analytics",
      "ROI calculators",
      "Cash flow projections"
    ]
  },

  investor2: {
    name: "Investor Tier 2",
    price: 299,
    chatMessages: -1,
    cmaRequests: 50,
    savedSearches: -1,
    favoriteListings: -1,
    features: [
      "All Investor 1 features",
      "50 CMA reports/month",
      "Portfolio tracking",
      "Multi-property comparison",
      "1-on-1 investment consultation"
    ]
  },

  investor3: {
    name: "Investor Tier 3",
    price: 799,
    chatMessages: -1,
    cmaRequests: -1, // unlimited
    savedSearches: -1,
    favoriteListings: -1,
    features: [
      "All Investor 2 features",
      "Unlimited CMA reports",
      "Dedicated account manager",
      "API access to MLS data",
      "Custom investment reports",
      "White-label portal option"
    ]
  }
};
```

---

### Tier Gating Implementation

#### Chat Message Limits:

```typescript
// src/app/api/chat/stream/route.ts
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = await User.findById(session.user.id);

  // Check tier limits
  const tier = SUBSCRIPTION_TIERS[user.subscriptionTier || "free"];

  if (tier.chatMessages !== -1) { // Not unlimited
    // Check monthly usage
    const currentMonth = new Date().getMonth();
    const resetDate = user.monthlyResetDate?.getMonth();

    if (resetDate !== currentMonth) {
      // Reset counter
      await User.updateOne(
        { _id: user._id },
        {
          chatMessageCount: 0,
          monthlyResetDate: new Date()
        }
      );
      user.chatMessageCount = 0;
    }

    if (user.chatMessageCount >= tier.chatMessages) {
      return Response.json({
        error: "Monthly chat limit reached",
        limit: tier.chatMessages,
        upgrade: true
      }, { status: 429 });
    }
  }

  // Process chat...

  // Increment usage
  await User.updateOne(
    { _id: user._id },
    { $inc: { chatMessageCount: 1 } }
  );
}
```

---

#### CMA Request Limits:

```typescript
// src/app/api/ai/cma/route.ts
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = await User.findById(session.user.id);

  const tier = SUBSCRIPTION_TIERS[user.subscriptionTier || "free"];

  if (tier.cmaRequests === 0) {
    return Response.json({
      error: "CMA reports require Investor tier subscription",
      upgrade: true,
      minTier: "investor1"
    }, { status: 403 });
  }

  if (tier.cmaRequests !== -1) {
    const currentMonth = new Date().getMonth();
    const resetDate = user.monthlyResetDate?.getMonth();

    if (resetDate !== currentMonth) {
      await User.updateOne(
        { _id: user._id },
        {
          cmaRequestCount: 0,
          monthlyResetDate: new Date()
        }
      );
      user.cmaRequestCount = 0;
    }

    if (user.cmaRequestCount >= tier.cmaRequests) {
      return Response.json({
        error: "Monthly CMA limit reached",
        limit: tier.cmaRequests,
        current: user.cmaRequestCount,
        upgrade: true
      }, { status: 429 });
    }
  }

  // Generate CMA...

  // Increment usage
  await User.updateOne(
    { _id: user._id },
    { $inc: { cmaRequestCount: 1 } }
  );
}
```

---

#### Dashboard Redirects:

```typescript
// src/app/dashboard/page.tsx
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = await User.findById(session.user.id);

  // Role-based dashboard routing
  if (user.roles.includes("admin")) {
    return <AdminDashboard user={user} />;
  }

  if (user.roles.includes("realEstateAgent")) {
    return <AgentDashboard user={user} />;
  }

  if (user.roles.includes("serviceProvider")) {
    return <ProviderDashboard user={user} />;
  }

  if (user.roles.includes("vacationRentalHost")) {
    return <HostDashboard user={user} />;
  }

  // Default: End User Dashboard
  return <UserDashboard user={user} />;
}
```

---

## 🔗 EXTERNAL INTEGRATIONS

### Spark API (MLS Data)

- **Provider:** Spark API
- **Endpoint:** `https://replication.sparkapi.com/v1/listings`
- **Auth:** OAuth 2.0 Bearer Token
- **Rate Limit:** ~3-5 requests/second
- **Batch Size:** 500 listings per request
- **Expansions:** Rooms, Units, OpenHouses, VirtualTours

---

### Groq (AI Chat)

- **Provider:** Groq
- **Model:** llama-3.1-70b-versatile
- **API:** groq-sdk v0.35.0
- **Context Window:** 128k tokens
- **Streaming:** Yes (Server-Sent Events)
- **Function Calling:** Yes

---

### Cloudinary (Images)

- **Provider:** Cloudinary
- **Upload:** /api/uploadImage
- **Transformations:** Auto-optimize, WebP, Lazy load
- **Storage:** Cloud-based CDN
- **Usage:** User profile photos, property images

---

### OpenCage (Geocoding)

- **Provider:** OpenCage
- **Endpoint:** `https://api.opencagedata.com/geocode/v1/json`
- **Usage:** Convert addresses to lat/lon for map display
- **Rate Limit:** 2500 requests/day (free tier)

---

### Yelp Fusion (Local Businesses)

- **Provider:** Yelp Fusion API
- **Endpoint:** `https://api.yelp.com/v3/businesses/search`
- **Usage:** Fetch nearby restaurants, parks, amenities
- **Rate Limit:** 5000 calls/day

---

### Nodemailer (Email)

- **Provider:** SMTP (Gmail)
- **Service:** Nodemailer
- **Usage:**
  - Email verification
  - Password reset
  - 2FA codes
  - Contact form submissions
  - Lead notifications

---

### MapLibre GL (Maps)

- **Provider:** MapTiler
- **Library:** maplibre-gl v5.5.0
- **Clustering:** Supercluster
- **Tiles:** Vector tiles (Protobuf)
- **Layers:**
  - Listings (clustered markers)
  - Subdivisions (boundaries)
  - Schools (icons)

---

### MongoDB Atlas (Database)

- **Provider:** DigitalOcean MongoDB
- **Cluster:** jpsrealtor-mongodb-911080c1
- **Database:** admin
- **Connection:** mongodb+srv://...
- **Collections:** 23 total
- **Storage:** ~50GB (with closed listings)
- **Indexes:** 15+ for performance

---

## 📊 PERFORMANCE METRICS

### Current Stats

```
Total Listings: 42,001
  - GPS Active: 11,592
  - CRMLS Active: 20,406
  - GPS Closed: 11,592
  - CRMLS Closed: 30,409

Total Photos: ~40,000
Total Users: ~500
Total Chat Sessions: ~2,000
Total API Calls/Day: ~10,000
```

**Average Response Times:**
- Listing Search: 150ms
- Chat Response: 2-4s
- Map Tile Load: 100ms
- CMA Generation: 5-8s

---

## 🛠️ MAINTENANCE & MONITORING

### Logs

```bash
# MLS Sync Logs
/var/log/mls-sync/historical-closed-sync.log
/root/website/jpsrealtor/local-logs/historical-sync/*.jsonl

# Application Logs
/root/website/jpsrealtor/src/logs/

# PM2 Logs (if using PM2)
~/.pm2/logs/
```

### Health Checks

```bash
# Check MongoDB connection
mongosh "$MONGODB_URI" --eval "db.stats()"

# Check active listings count
mongosh "$MONGODB_URI" --eval "db.listings.countDocuments({standardStatus: 'Active'})"

# Check API health
curl https://jpsrealtor.com/api/health
```

---

## 🚨 KNOWN ISSUES & LIMITATIONS

1. **Payload CMS Admin Panel:** Config destructuring error in Next.js 15.2.3 (see Step 37 summary)
2. **Historical Sync:** Currently running, 50% complete for CRMLS (23,000/50,000 listings)
3. **Rate Limiting:** Spark API occasionally returns 429 errors during bulk syncs
4. **Photo Caching:** Some listings return 403 errors (handled via skip index)
5. **Subscription System:** Not yet fully implemented (tier checks in place, billing integration pending)

---

**Document Version:** 1.0
**Last Updated:** November 23, 2025
**Maintained By:** JPSRealtor Development Team
**Contact:** [email protected]
