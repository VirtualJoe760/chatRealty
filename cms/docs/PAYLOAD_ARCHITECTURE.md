# 🎯 PAYLOADCMS ARCHITECTURE v1.0
**Migration Plan & Implementation Guide**
**Target:** Replace NextAuth.js with Payload CMS as Auth + Admin Backbone
**Timeline:** Phased migration approach

---

## 📋 TABLE OF CONTENTS

1. [Migration Overview](#migration-overview)
2. [Payload Configuration](#payload-configuration)
3. [Collections Architecture](#collections-architecture)
4. [Access Control Rules](#access-control-rules)
5. [Hooks & Lifecycle](#hooks--lifecycle)
6. [Admin UI Customization](#admin-ui-customization)
7. [Frontend Integration](#frontend-integration)
8. [Migration Steps](#migration-steps)

---

## 🎯 MIGRATION OVERVIEW

### Why Payload CMS?

**Current Pain Points:**
- NextAuth.js limited to authentication only
- No built-in admin UI for user management
- Manual role/tier enforcement in every API route
- Subscription logic scattered across codebase
- No centralized audit logging
- Team member management requires custom code

**Payload CMS Benefits:**
```yaml
✅ Built-in Authentication: JWT-based, secure, battle-tested
✅ Admin Panel: Out-of-the-box UI for all collections
✅ Role-Based Access Control: Field-level permissions
✅ Hooks System: Before/after operations for business logic
✅ TypeScript Native: Type-safe collections and queries
✅ MongoDB Integration: Seamless with existing database
✅ API Auto-Generation: REST + GraphQL endpoints
✅ Media Management: Cloudinary integration built-in
✅ Audit Logging: Automatic tracking of all changes
```

---

### Current Payload Setup

**Location:** `/var/www/payload/current/`

**Existing Collections:**
- Users          # Basic user collection (needs expansion)
- Media          # File uploads
- BlogPosts      # Content management
- Cities         # City data
- Neighborhoods  # Subdivision data
- Schools        # School information
- Contacts       # Contact form submissions

**Issue:** Payload is currently separate from the Next.js app and has admin panel errors (config destructuring bug).

---

### Migration Strategy

**Phase 1: Foundation (Week 1-2)**
- ✅ Fix Payload admin panel errors
- ✅ Extend Users collection with all existing fields
- ✅ Add Subscriptions collection
- ✅ Add Teams collection
- ✅ Add Agents collection
- ✅ Add ServiceProviders collection
- ✅ Configure access control rules

**Phase 2: Integration (Week 3-4)**
- Move Payload into Next.js monorepo
- Replace NextAuth with Payload auth
- Update all API routes to use Payload auth
- Migrate existing users to Payload
- Update frontend AuthProvider

**Phase 3: Enhanced Features (Week 5-6)**
- ChatSessions collection + usage tracking
- CMARequests collection + tier enforcement
- AuditLogs collection
- WebsiteForks collection (ChatRealty.io network)
- Custom admin dashboards per role

**Phase 4: Deployment (Week 7-8)**
- Test all auth flows
- Migrate production data
- Deploy to VPS
- Monitor for issues
- Document new workflows

---

## ⚙️ PAYLOAD CONFIGURATION

**File:** `payload.config.ts`

```typescript
import { buildConfig } from 'payload/config'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cloudinaryPlugin } from '@payloadcms/plugin-cloud-storage/cloudinary'

// Collections
import Users from './collections/Users'
import Teams from './collections/Teams'
import Agents from './collections/Agents'
import ServiceProviders from './collections/ServiceProviders'
import Subscriptions from './collections/Subscriptions'
import Billing from './collections/Billing'
import MLSListings from './collections/MLSListings'
import ChatSessions from './collections/ChatSessions'
import CMARequests from './collections/CMARequests'
import SavedSearches from './collections/SavedSearches'
import AuditLogs from './collections/AuditLogs'
import WebsiteForks from './collections/WebsiteForks'
import Media from './collections/Media'

// Globals
import Branding from './globals/Branding'
import IDXSettings from './globals/IDXSettings'
import ChatRealtySettings from './globals/ChatRealtySettings'
import InvestorTierLimits from './globals/InvestorTierLimits'

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',

  // Admin Configuration
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- JPSRealtor CMS',
      favicon: '/favicon.ico',
      ogImage: '/og-image.jpg',
    },
    components: {
      // Custom dashboard per role
      views: {
        Dashboard: {
          Component: '@/admin/components/Dashboard',
          path: '/admin/dashboard'
        }
      }
    }
  },

  // Database
  db: mongooseAdapter({
    url: process.env.MONGODB_URI!,
  }),

  // Editor
  editor: lexicalEditor({}),

  // Collections
  collections: [
    Users,
    Teams,
    Agents,
    ServiceProviders,
    Subscriptions,
    Billing,
    MLSListings,
    ChatSessions,
    CMARequests,
    SavedSearches,
    AuditLogs,
    WebsiteForks,
    Media,
  ],

  // Globals
  globals: [
    Branding,
    IDXSettings,
    ChatRealtySettings,
    InvestorTierLimits,
  ],

  // TypeScript
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },

  // GraphQL
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },

  // Plugins
  plugins: [
    cloudinaryPlugin({
      collections: {
        media: {
          adapter: cloudinaryAdapter({
            cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
            apiKey: process.env.CLOUDINARY_API_KEY!,
            apiSecret: process.env.CLOUDINARY_SECRET!,
          }),
        },
      },
    }),
  ],

  // CORS
  cors: [
    'http://localhost:3000',
    'https://jpsrealtor.com',
    'https://www.jpsrealtor.com',
  ],

  // CSRF Protection
  csrf: [
    'http://localhost:3000',
    'https://jpsrealtor.com',
    'https://www.jpsrealtor.com',
  ],

  // Rate Limiting
  rateLimit: {
    max: 1000,
    window: 15 * 60 * 1000, // 15 minutes
  },
})
```

---

## 📦 COLLECTIONS ARCHITECTURE

### 1. Users Collection

**File:** `src/collections/Users.ts`

```typescript
import { CollectionConfig } from 'payload/types'

const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 7200, // 2 hours
    verify: true, // Email verification required
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // 10 minutes
    useAPIKey: true, // For programmatic access
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.COOKIE_DOMAIN,
    }
  },

  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'roles', 'subscriptionTier', 'createdAt'],
    group: 'User Management',
  },

  access: {
    // Only admins can read all users
    read: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      // Users can only read their own profile
      return {
        id: { equals: user?.id }
      }
    },

    // Anyone can create (registration)
    create: () => true,

    // Users can update their own profile, admins can update anyone
    update: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      return {
        id: { equals: user?.id }
      }
    },

    // Only admins can delete
    delete: ({ req: { user } }) => user?.roles?.includes('admin'),
  },

  fields: [
    // === BASIC INFO ===
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },

    // === ROLES ===
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['endUser'],
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'End User', value: 'endUser' },
        { label: 'Real Estate Agent', value: 'realEstateAgent' },
        { label: 'Service Provider', value: 'serviceProvider' },
        { label: 'Vacation Rental Host', value: 'vacationRentalHost' },
      ],
      access: {
        // Only admins can modify roles
        update: ({ req: { user } }) => user?.roles?.includes('admin'),
      }
    },

    // === PROFILE ===
    {
      name: 'profile',
      type: 'group',
      fields: [
        {
          name: 'phone',
          type: 'text',
        },
        {
          name: 'bio',
          type: 'textarea',
          maxLength: 500,
        },
        {
          name: 'birthday',
          type: 'date',
        },
        {
          name: 'profileDescription',
          type: 'textarea',
          maxLength: 1000,
          admin: {
            description: 'Who you are and what you love',
          }
        },
        {
          name: 'realEstateGoals',
          type: 'textarea',
          maxLength: 1000,
          admin: {
            description: 'Your real estate goals and preferences',
          }
        },
        {
          name: 'currentAddress',
          type: 'text',
        },
        {
          name: 'homeownerStatus',
          type: 'select',
          options: [
            { label: 'Own', value: 'own' },
            { label: 'Rent', value: 'rent' },
            { label: 'Other', value: 'other' },
          ]
        },
        {
          name: 'significantOther',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            description: 'Link to partner account',
          }
        },
      ]
    },

    // === REAL ESTATE AGENT ===
    {
      name: 'agentInfo',
      type: 'group',
      admin: {
        condition: (data) => data.roles?.includes('realEstateAgent'),
      },
      fields: [
        {
          name: 'licenseNumber',
          type: 'text',
          required: true,
        },
        {
          name: 'brokerageName',
          type: 'text',
          required: true,
        },
        {
          name: 'website',
          type: 'text',
        },
        {
          name: 'team',
          type: 'relationship',
          relationTo: 'teams',
        },
      ]
    },

    // === SERVICE PROVIDER ===
    {
      name: 'providerInfo',
      type: 'group',
      admin: {
        condition: (data) => data.roles?.includes('serviceProvider'),
      },
      fields: [
        {
          name: 'businessName',
          type: 'text',
          required: true,
        },
        {
          name: 'serviceCategory',
          type: 'select',
          options: [
            { label: 'Title Company', value: 'title' },
            { label: 'Mortgage Lender', value: 'mortgage' },
            { label: 'Escrow Officer', value: 'escrow' },
            { label: 'Contractor', value: 'contractor' },
            { label: 'Plumber', value: 'plumber' },
            { label: 'Electrician', value: 'electrician' },
            { label: 'HVAC', value: 'hvac' },
            { label: 'Landscaper', value: 'landscaper' },
            { label: 'Developer', value: 'developer' },
          ]
        },
        {
          name: 'serviceAreas',
          type: 'array',
          fields: [
            {
              name: 'city',
              type: 'text',
            }
          ]
        },
        {
          name: 'certifications',
          type: 'array',
          fields: [
            {
              name: 'certification',
              type: 'text',
            }
          ]
        },
      ]
    },

    // === VACATION RENTAL HOST ===
    {
      name: 'hostInfo',
      type: 'group',
      admin: {
        condition: (data) => data.roles?.includes('vacationRentalHost'),
      },
      fields: [
        {
          name: 'stripeAccountId',
          type: 'text',
          admin: {
            readOnly: true,
          }
        },
        {
          name: 'stripeOnboarded',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            readOnly: true,
          }
        },
      ]
    },

    // === SUBSCRIPTION ===
    {
      name: 'subscription',
      type: 'group',
      fields: [
        {
          name: 'tier',
          type: 'select',
          defaultValue: 'free',
          options: [
            { label: 'Free', value: 'free' },
            { label: 'Pro ($10/mo)', value: 'pro' },
            { label: 'Ultimate ($20/mo)', value: 'ultimate' },
            { label: 'Investor Tier 1 ($99/mo)', value: 'investor1' },
            { label: 'Investor Tier 2 ($299/mo)', value: 'investor2' },
            { label: 'Investor Tier 3 ($799/mo)', value: 'investor3' },
          ],
          index: true,
        },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'active',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Canceled', value: 'canceled' },
            { label: 'Past Due', value: 'past_due' },
            { label: 'Trialing', value: 'trialing' },
          ]
        },
        {
          name: 'subscriptionEndsAt',
          type: 'date',
        },
        {
          name: 'stripeCustomerId',
          type: 'text',
          admin: {
            readOnly: true,
          }
        },
        {
          name: 'stripeSubscriptionId',
          type: 'text',
          admin: {
            readOnly: true,
          }
        },
      ]
    },

    // === USAGE TRACKING ===
    {
      name: 'usage',
      type: 'group',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'chatMessageCount',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'cmaRequestCount',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'monthlyResetDate',
          type: 'date',
        },
      ]
    },

    // === ACTIVITY METRICS ===
    {
      name: 'activityMetrics',
      type: 'group',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'totalSessions',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'totalSearches',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'totalListingsViewed',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'totalFavorites',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'lastActivityAt',
          type: 'date',
        },
        {
          name: 'engagementScore',
          type: 'number',
          min: 0,
          max: 100,
          defaultValue: 0,
        },
      ]
    },

    // === SWIPE ANALYTICS ===
    {
      name: 'swipeAnalytics',
      type: 'group',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'totalLikes',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'totalDislikes',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'topSubdivisions',
          type: 'array',
          fields: [
            {
              name: 'name',
              type: 'text',
            },
            {
              name: 'count',
              type: 'number',
            }
          ]
        },
        {
          name: 'topCities',
          type: 'array',
          fields: [
            {
              name: 'name',
              type: 'text',
            },
            {
              name: 'count',
              type: 'number',
            }
          ]
        },
      ]
    },

    // === LIKED/DISLIKED LISTINGS ===
    {
      name: 'likedListings',
      type: 'array',
      fields: [
        {
          name: 'listingKey',
          type: 'text',
          required: true,
        },
        {
          name: 'listingData',
          type: 'json',
        },
        {
          name: 'swipedAt',
          type: 'date',
          required: true,
        },
        {
          name: 'subdivision',
          type: 'text',
        },
        {
          name: 'city',
          type: 'text',
        },
      ]
    },
    {
      name: 'dislikedListings',
      type: 'array',
      fields: [
        {
          name: 'listingKey',
          type: 'text',
          required: true,
        },
        {
          name: 'swipedAt',
          type: 'date',
          required: true,
        },
        {
          name: 'expiresAt',
          type: 'date',
          required: true,
        },
      ]
    },

    // === FAVORITE COMMUNITIES ===
    {
      name: 'favoriteCommunities',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'id',
          type: 'text',
          required: true,
        },
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'City', value: 'city' },
            { label: 'Subdivision', value: 'subdivision' },
          ]
        },
        {
          name: 'cityId',
          type: 'text',
        },
      ]
    },

    // === ANONYMOUS TRACKING ===
    {
      name: 'anonymousId',
      type: 'text',
      admin: {
        description: 'Browser fingerprint for pre-login tracking',
      }
    },
  ],

  // === HOOKS ===
  hooks: {
    beforeChange: [
      // Reset monthly usage counters
      async ({ data, operation }) => {
        if (operation === 'update') {
          const now = new Date()
          const resetDate = data.usage?.monthlyResetDate

          if (!resetDate || resetDate.getMonth() !== now.getMonth()) {
            data.usage = {
              ...data.usage,
              chatMessageCount: 0,
              cmaRequestCount: 0,
              monthlyResetDate: now,
            }
          }
        }
        return data
      },

      // Enforce tier limits before incrementing usage
      async ({ data, operation, req }) => {
        if (operation === 'update' && req.context?.incrementChatUsage) {
          const limits = await req.payload.findGlobal({
            slug: 'investorTierLimits',
          })

          const tier = data.subscription?.tier || 'free'
          const tierLimits = limits[tier]

          if (tierLimits?.chatMessages !== -1) {
            if (data.usage.chatMessageCount >= tierLimits.chatMessages) {
              throw new Error('Monthly chat limit reached')
            }
          }
        }
        return data
      },
    ],

    afterLogin: [
      // Generate JWT for frontend
      async ({ user, req }) => {
        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            roles: user.roles,
          },
          process.env.JWT_SECRET!,
          { expiresIn: '7d' }
        )

        req.user.token = token
        return user
      },

      // Log login activity
      async ({ user, req }) => {
        await req.payload.create({
          collection: 'audit-logs',
          data: {
            user: user.id,
            action: 'login',
            timestamp: new Date(),
            ipAddress: req.ip,
          }
        })
      },
    ],
  },

  // === TIMESTAMPS ===
  timestamps: true,
}

export default Users
```

---

### 2. Teams Collection

```typescript
import { CollectionConfig } from 'payload/types'

const Teams: CollectionConfig = {
  slug: 'teams',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'owner', 'memberCount', 'createdAt'],
    group: 'User Management',
  },

  access: {
    // Teams can only be read by owner or members
    read: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      return {
        or: [
          { owner: { equals: user?.id } },
          { 'members.user': { equals: user?.id } },
        ]
      }
    },

    create: ({ req: { user } }) => user?.roles?.includes('realEstateAgent'),

    update: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      return {
        owner: { equals: user?.id }
      }
    },

    delete: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      return {
        owner: { equals: user?.id }
      }
    },
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
    },
    {
      name: 'members',
      type: 'array',
      fields: [
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
        {
          name: 'role',
          type: 'select',
          options: [
            { label: 'Team Lead', value: 'lead' },
            { label: 'Agent', value: 'agent' },
            { label: 'Assistant', value: 'assistant' },
          ]
        },
        {
          name: 'joinedAt',
          type: 'date',
          required: true,
        },
      ]
    },
    {
      name: 'memberCount',
      type: 'number',
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ data }) => {
            data.memberCount = data.members?.length || 0
            return data
          }
        ]
      }
    },
    {
      name: 'brokerageName',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'website',
      type: 'text',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
  ],

  timestamps: true,
}

export default Teams
```

---

### 3. ChatSessions Collection

```typescript
import { CollectionConfig } from 'payload/types'

const ChatSessions: CollectionConfig = {
  slug: 'chat-sessions',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'user', 'messageCount', 'lastMessageAt'],
    group: 'Chat System',
  },

  access: {
    read: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      return {
        user: { equals: user?.id }
      }
    },
    create: () => true,
    update: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      return {
        user: { equals: user?.id }
      }
    },
    delete: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      return {
        user: { equals: user?.id }
      }
    },
  },

  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'sessionId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'messages',
      type: 'array',
      fields: [
        {
          name: 'role',
          type: 'select',
          options: ['user', 'assistant', 'system', 'function'],
          required: true,
        },
        {
          name: 'content',
          type: 'textarea',
          required: true,
        },
        {
          name: 'functionName',
          type: 'text',
        },
        {
          name: 'functionArgs',
          type: 'json',
        },
        {
          name: 'functionResult',
          type: 'json',
        },
        {
          name: 'createdAt',
          type: 'date',
          required: true,
        },
      ]
    },
    {
      name: 'messageCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      }
    },
    {
      name: 'lastMessageAt',
      type: 'date',
    },
    {
      name: 'archived',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'context',
      type: 'select',
      options: ['homepage', 'listing', 'dashboard'],
    },
    {
      name: 'listingData',
      type: 'json',
    },
  ],

  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data.messages) {
          data.messageCount = data.messages.length
          if (data.messages.length > 0) {
            data.lastMessageAt = data.messages[data.messages.length - 1].createdAt
          }
        }
        return data
      }
    ],

    afterChange: [
      // Increment user's chat usage
      async ({ doc, req, operation }) => {
        if (operation === 'create') {
          const userMessages = doc.messages.filter(m => m.role === 'user')

          await req.payload.update({
            collection: 'users',
            id: doc.user,
            data: {
              usage: {
                chatMessageCount: { $inc: userMessages.length }
              }
            }
          })
        }
      }
    ]
  },

  timestamps: true,
}

export default ChatSessions
```

---

### 4. CMARequests Collection

```typescript
import { CollectionConfig } from 'payload/types'

const CMARequests: CollectionConfig = {
  slug: 'cma-requests',
  admin: {
    useAsTitle: 'address',
    defaultColumns: ['address', 'user', 'estimatedValue', 'createdAt'],
    group: 'Investor Tools',
  },

  access: {
    read: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      if (user?.roles?.includes('realEstateAgent')) return true
      return {
        user: { equals: user?.id }
      }
    },

    create: ({ req: { user } }) => {
      // Only investors and agents can create CMAs
      const tier = user?.subscription?.tier
      return ['investor1', 'investor2', 'investor3'].includes(tier) ||
             user?.roles?.includes('realEstateAgent')
    },

    update: ({ req: { user } }) => user?.roles?.includes('admin'),
    delete: ({ req: { user } }) => user?.roles?.includes('admin'),
  },

  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'address',
      type: 'text',
      required: true,
    },
    {
      name: 'propertyDetails',
      type: 'group',
      fields: [
        {
          name: 'sqft',
          type: 'number',
          required: true,
        },
        {
          name: 'beds',
          type: 'number',
          required: true,
        },
        {
          name: 'baths',
          type: 'number',
          required: true,
        },
        {
          name: 'yearBuilt',
          type: 'number',
        },
        {
          name: 'propertyType',
          type: 'text',
        },
      ]
    },
    {
      name: 'coordinates',
      type: 'group',
      fields: [
        {
          name: 'latitude',
          type: 'number',
        },
        {
          name: 'longitude',
          type: 'number',
        },
      ]
    },
    {
      name: 'estimatedValue',
      type: 'number',
      required: true,
    },
    {
      name: 'pricePerSqft',
      type: 'number',
    },
    {
      name: 'comparables',
      type: 'array',
      fields: [
        {
          name: 'address',
          type: 'text',
        },
        {
          name: 'soldPrice',
          type: 'number',
        },
        {
          name: 'soldDate',
          type: 'date',
        },
        {
          name: 'sqft',
          type: 'number',
        },
        {
          name: 'beds',
          type: 'number',
        },
        {
          name: 'baths',
          type: 'number',
        },
        {
          name: 'distance',
          type: 'number',
          admin: {
            description: 'Distance in miles',
          }
        },
      ]
    },
    {
      name: 'aiAnalysis',
      type: 'textarea',
    },
    {
      name: 'reportGenerated',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'reportUrl',
      type: 'text',
    },
  ],

  hooks: {
    beforeChange: [
      // Enforce tier limits
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          const user = await req.payload.findByID({
            collection: 'users',
            id: req.user.id,
          })

          const limits = await req.payload.findGlobal({
            slug: 'investorTierLimits',
          })

          const tier = user.subscription?.tier || 'free'
          const tierLimits = limits[tier]

          if (tierLimits?.cmaRequests !== -1) {
            const now = new Date()
            const resetDate = user.usage?.monthlyResetDate

            let currentCount = user.usage?.cmaRequestCount || 0

            if (!resetDate || resetDate.getMonth() !== now.getMonth()) {
              currentCount = 0
            }

            if (currentCount >= tierLimits.cmaRequests) {
              throw new Error(`Monthly CMA limit reached (${tierLimits.cmaRequests} requests)`)
            }
          }
        }
        return data
      }
    ],

    afterChange: [
      // Increment user's CMA usage
      async ({ doc, req, operation }) => {
        if (operation === 'create') {
          await req.payload.update({
            collection: 'users',
            id: doc.user,
            data: {
              'usage.cmaRequestCount': { $inc: 1 }
            }
          })
        }
      }
    ]
  },

  timestamps: true,
}

export default CMARequests
```

---

### 5. WebsiteForks Collection (ChatRealty.io Network)

```typescript
import { CollectionConfig } from 'payload/types'

const WebsiteForks: CollectionConfig = {
  slug: 'website-forks',
  admin: {
    useAsTitle: 'domainName',
    defaultColumns: ['domainName', 'agent', 'status', 'createdAt'],
    group: 'ChatRealty Network',
  },

  access: {
    read: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      if (user?.roles?.includes('realEstateAgent')) {
        return {
          agent: { equals: user?.id }
        }
      }
      return false
    },

    create: ({ req: { user } }) => user?.roles?.includes('realEstateAgent'),

    update: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      return {
        agent: { equals: user?.id }
      }
    },

    delete: ({ req: { user } }) => user?.roles?.includes('admin'),
  },

  fields: [
    {
      name: 'agent',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      filterOptions: ({ data }) => {
        return {
          roles: { contains: 'realEstateAgent' }
        }
      }
    },
    {
      name: 'domainName',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'e.g., johndoe.chatrealty.io',
      }
    },
    {
      name: 'customDomain',
      type: 'text',
      admin: {
        description: 'Optional custom domain (e.g., johndoe.com)',
      }
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending Setup', value: 'pending' },
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Canceled', value: 'canceled' },
      ]
    },
    {
      name: 'branding',
      type: 'group',
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'primaryColor',
          type: 'text',
          defaultValue: '#0066CC',
        },
        {
          name: 'secondaryColor',
          type: 'text',
          defaultValue: '#FF6600',
        },
        {
          name: 'heroImage',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'tagline',
          type: 'text',
        },
      ]
    },
    {
      name: 'idxSettings',
      type: 'group',
      fields: [
        {
          name: 'mlsSource',
          type: 'select',
          options: [
            { label: 'GPS', value: 'gps' },
            { label: 'CRMLS', value: 'crmls' },
            { label: 'Both', value: 'both' },
          ],
          defaultValue: 'both',
        },
        {
          name: 'defaultCity',
          type: 'text',
        },
        {
          name: 'featuredSubdivisions',
          type: 'array',
          fields: [
            {
              name: 'subdivision',
              type: 'text',
            }
          ]
        },
      ]
    },
    {
      name: 'analytics',
      type: 'group',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'totalVisits',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'totalLeads',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'lastVisitAt',
          type: 'date',
        },
      ]
    },
    {
      name: 'deploymentUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Vercel deployment URL',
      }
    },
  ],

  hooks: {
    afterChange: [
      // Trigger Vercel deployment
      async ({ doc, operation }) => {
        if (operation === 'create' || operation === 'update') {
          // TODO: Trigger Vercel API to deploy new fork
          // await triggerVercelDeploy(doc.domainName, doc.agent, doc.branding)
        }
      }
    ]
  },

  timestamps: true,
}

export default WebsiteForks
```

---

### 6. AuditLogs Collection

```typescript
import { CollectionConfig } from 'payload/types'

const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['user', 'action', 'collection', 'timestamp'],
    group: 'System',
  },

  access: {
    read: ({ req: { user } }) => user?.roles?.includes('admin'),
    create: () => true, // System can create
    update: () => false, // Never update
    delete: ({ req: { user } }) => user?.roles?.includes('admin'),
  },

  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      index: true,
    },
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        'login',
        'logout',
        'create',
        'update',
        'delete',
        'read',
        'search',
        'chat',
        'cma',
      ],
      index: true,
    },
    {
      name: 'collection',
      type: 'text',
      index: true,
    },
    {
      name: 'documentId',
      type: 'text',
    },
    {
      name: 'changes',
      type: 'json',
    },
    {
      name: 'ipAddress',
      type: 'text',
    },
    {
      name: 'userAgent',
      type: 'text',
    },
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      index: true,
    },
  ],

  timestamps: false, // Using custom timestamp field
}

export default AuditLogs
```

---

## 🔐 ACCESS CONTROL RULES

### Field-Level Access

```typescript
// Example: Only admins can see billing info
{
  name: 'stripeCustomerId',
  type: 'text',
  access: {
    read: ({ req: { user } }) => user?.roles?.includes('admin'),
    update: ({ req: { user } }) => user?.roles?.includes('admin'),
  }
}

// Example: Users can only see their own data
{
  name: 'likedListings',
  type: 'array',
  access: {
    read: ({ req: { user }, doc }) => {
      if (user?.roles?.includes('admin')) return true
      return doc.id === user?.id
    }
  }
}
```

---

### Collection-Level Access

```typescript
// Admin-only collections
access: {
  read: ({ req: { user } }) => user?.roles?.includes('admin'),
  create: ({ req: { user } }) => user?.roles?.includes('admin'),
  update: ({ req: { user } }) => user?.roles?.includes('admin'),
  delete: ({ req: { user } }) => user?.roles?.includes('admin'),
}

// User-scoped collections
access: {
  read: ({ req: { user } }) => {
    if (user?.roles?.includes('admin')) return true
    return {
      user: { equals: user?.id }
    }
  }
}

// Role-based creation
access: {
  create: ({ req: { user } }) => {
    return user?.roles?.includes('realEstateAgent') ||
           user?.roles?.includes('admin')
  }
}
```

---

## 🪝 HOOKS & LIFECYCLE

### Available Hooks

```typescript
hooks: {
  // Collection hooks
  beforeOperation,  // Before any operation
  beforeValidate,   // Before validation
  beforeChange,     // Before create/update
  afterChange,      // After create/update
  beforeRead,       // Before read
  afterRead,        // After read
  beforeDelete,     // Before delete
  afterDelete,      // After delete

  // Auth hooks (Users collection only)
  beforeLogin,      // Before login attempt
  afterLogin,       // After successful login
  afterLogout,      // After logout
  afterForgotPassword,

  // Field hooks
  beforeValidate,   // Field-level validation
  afterRead,        // Transform field on read
}
```

---

### Usage Tracking Hook

```typescript
// Auto-increment chat usage
hooks: {
  beforeChange: [
    async ({ data, req, operation }) => {
      if (operation === 'create' && req.context?.trackChatUsage) {
        const user = await req.payload.findByID({
          collection: 'users',
          id: data.user,
        })

        // Check limits
        const tier = user.subscription?.tier || 'free'
        const limits = await req.payload.findGlobal({ slug: 'investorTierLimits' })

        if (limits[tier].chatMessages !== -1) {
          if (user.usage.chatMessageCount >= limits[tier].chatMessages) {
            throw new PayloadError('Chat limit reached')
          }
        }

        // Increment
        await req.payload.update({
          collection: 'users',
          id: data.user,
          data: {
            'usage.chatMessageCount': user.usage.chatMessageCount + 1
          }
        })
      }
      return data
    }
  ]
}
```

---

## 🎨 ADMIN UI CUSTOMIZATION

### Custom Dashboard

**File:** `src/admin/components/Dashboard.tsx`

```typescript
import React from 'react'
import { Banner, Gutter } from 'payload/components/elements'
import { useAuth } from 'payload/components/utilities'

export const Dashboard: React.FC = () => {
  const { user } = useAuth()

  if (user?.roles?.includes('admin')) {
    return <AdminDashboard />
  }

  if (user?.roles?.includes('realEstateAgent')) {
    return <AgentDashboard />
  }

  return <UserDashboard />
}

const AdminDashboard = () => (
  <Gutter>
    <h1>Admin Dashboard</h1>
    <div className="dashboard-grid">
      <StatCard title="Total Users" value="500" />
      <StatCard title="Active Agents" value="25" />
      <StatCard title="Total Listings" value="42,001" />
      <StatCard title="Chat Sessions Today" value="150" />
    </div>
    <RecentActivity />
    <SystemHealth />
  </Gutter>
)

const AgentDashboard = () => (
  <Gutter>
    <h1>Agent Dashboard</h1>
    <div className="dashboard-grid">
      <StatCard title="My Clients" value="12" />
      <StatCard title="Active Listings" value="8" />
      <StatCard title="Pending Sales" value="3" />
      <StatCard title="This Month Revenue" value="$45,000" />
    </div>
    <LeadList />
    <UpcomingShowings />
  </Gutter>
)
```

---

### Custom Navigation

```typescript
admin: {
  components: {
    Nav: '@/admin/components/Nav'
  }
}

// Custom Nav component
export const Nav = () => {
  const { user } = useAuth()

  return (
    <nav>
      {user?.roles?.includes('admin') && (
        <>
          <NavGroup label="User Management">
            <NavLink href="/admin/collections/users">Users</NavLink>
            <NavLink href="/admin/collections/teams">Teams</NavLink>
            <NavLink href="/admin/collections/agents">Agents</NavLink>
          </NavGroup>

          <NavGroup label="System">
            <NavLink href="/admin/collections/audit-logs">Audit Logs</NavLink>
            <NavLink href="/admin/globals/investor-tier-limits">Tier Limits</NavLink>
          </NavGroup>
        </>
      )}

      {user?.roles?.includes('realEstateAgent') && (
        <NavGroup label="My Business">
          <NavLink href="/admin/collections/chat-sessions">Client Chats</NavLink>
          <NavLink href="/admin/collections/cma-requests">CMA Reports</NavLink>
          <NavLink href="/admin/collections/website-forks">My Website</NavLink>
        </NavGroup>
      )}
    </nav>
  )
}
```

---

## 🔗 FRONTEND INTEGRATION

### Step 1: Replace NextAuth with Payload Auth

#### **Current (NextAuth):**

```typescript
// src/app/contexts/AuthContext.tsx
import { useSession, signIn, signOut } from "next-auth/react"

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    signIn,
    signOut
  }
}
```

#### **New (Payload):**

```typescript
// src/app/contexts/PayloadAuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@/payload-types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function PayloadAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/payload/users/me', {
        credentials: 'include', // Important for cookies
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/payload/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Login failed')
      }

      const data = await res.json()
      setUser(data.user)

      // Store JWT in localStorage for API calls
      if (data.token) {
        localStorage.setItem('payload-token', data.token)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/payload/users/logout', {
        method: 'POST',
        credentials: 'include',
      })

      setUser(null)
      localStorage.removeItem('payload-token')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      signIn,
      signOut,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function usePayloadAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('usePayloadAuth must be used within PayloadAuthProvider')
  }
  return context
}
```

---

### Step 2: Update API Client

```typescript
// src/lib/api-client.ts
export class PayloadAPI {
  private baseUrl = '/api/payload'

  private getHeaders() {
    const token = localStorage.getItem('payload-token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(),
      credentials: 'include',
    })

    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`)
    }

    return res.json()
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`)
    }

    return res.json()
  }

  async update<T>(collection: string, id: string, data: any): Promise<T> {
    return this.post(`/${collection}/${id}`, data)
  }

  // Specific methods
  async getUser(id: string) {
    return this.get(`/users/${id}`)
  }

  async getChatSessions(userId: string) {
    return this.get(`/chat-sessions?where[user][equals]=${userId}`)
  }

  async incrementChatUsage(userId: string) {
    return this.post(`/users/${userId}`, {
      'usage.chatMessageCount': { $inc: 1 }
    })
  }

  async checkChatLimit(userId: string): Promise<boolean> {
    const user = await this.getUser(userId)
    const limits = await this.get('/globals/investor-tier-limits')

    const tier = user.subscription?.tier || 'free'
    const tierLimits = limits[tier]

    if (tierLimits.chatMessages === -1) return true // Unlimited

    return user.usage.chatMessageCount < tierLimits.chatMessages
  }
}

export const payloadAPI = new PayloadAPI()
```

---

## 📋 MIGRATION STEPS

### Phase 1: Preparation (Week 1)

**Day 1-2: Fix Payload Admin Panel**

```bash
# Fix the config destructuring bug
cd /var/www/payload/current
npm install
npx payload generate:importmap
npm run build
pm2 restart payload
```

**Day 3-4: Extend Collections**

```bash
# Create new collection files
touch src/collections/Teams.ts
touch src/collections/ChatSessions.ts
touch src/collections/CMARequests.ts
touch src/collections/WebsiteForks.ts
touch src/collections/AuditLogs.ts

# Update Users collection with all fields
# Add access control rules
# Add hooks
```

**Day 5-7: Testing**

```bash
# Test Payload admin panel
# Test auth flows
# Test collection CRUD operations
# Test access control
```

---

### Phase 2: Integration (Week 2-3)

**Day 1-3: Move Payload to Next.js Monorepo**

```bash
# Copy Payload config to Next.js project
cp -r /var/www/payload/current/src/collections /root/website/jpsrealtor/src/payload/collections
cp /var/www/payload/current/payload.config.ts /root/website/jpsrealtor/payload.config.ts

# Update next.config.js
# Add Payload to Next.js build
```

**Day 4-7: Replace NextAuth**

```bash
# Create PayloadAuthProvider
# Update all API routes
# Update frontend components
# Test auth flows
```

**Day 8-10: Data Migration**

```bash
# Export users from MongoDB
# Transform to Payload schema
# Import via Payload API
# Verify data integrity
```

---

## 🎯 GLOBALS (Site-Wide Settings)

### InvestorTierLimits Global

```typescript
import { GlobalConfig } from 'payload/types'

const InvestorTierLimits: GlobalConfig = {
  slug: 'investor-tier-limits',
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.roles?.includes('admin'),
  },
  fields: [
    {
      name: 'free',
      type: 'group',
      fields: [
        { name: 'chatMessages', type: 'number', defaultValue: 10 },
        { name: 'cmaRequests', type: 'number', defaultValue: 0 },
        { name: 'savedSearches', type: 'number', defaultValue: 3 },
      ]
    },
    {
      name: 'pro',
      type: 'group',
      fields: [
        { name: 'chatMessages', type: 'number', defaultValue: 100 },
        { name: 'cmaRequests', type: 'number', defaultValue: 0 },
        { name: 'savedSearches', type: 'number', defaultValue: 10 },
      ]
    },
    {
      name: 'ultimate',
      type: 'group',
      fields: [
        { name: 'chatMessages', type: 'number', defaultValue: -1 }, // -1 = unlimited
        { name: 'cmaRequests', type: 'number', defaultValue: 0 },
        { name: 'savedSearches', type: 'number', defaultValue: -1 },
      ]
    },
    {
      name: 'investor1',
      type: 'group',
      fields: [
        { name: 'chatMessages', type: 'number', defaultValue: -1 },
        { name: 'cmaRequests', type: 'number', defaultValue: 10 },
        { name: 'savedSearches', type: 'number', defaultValue: -1 },
      ]
    },
    {
      name: 'investor2',
      type: 'group',
      fields: [
        { name: 'chatMessages', type: 'number', defaultValue: -1 },
        { name: 'cmaRequests', type: 'number', defaultValue: 50 },
        { name: 'savedSearches', type: 'number', defaultValue: -1 },
      ]
    },
    {
      name: 'investor3',
      type: 'group',
      fields: [
        { name: 'chatMessages', type: 'number', defaultValue: -1 },
        { name: 'cmaRequests', type: 'number', defaultValue: -1 },
        { name: 'savedSearches', type: 'number', defaultValue: -1 },
      ]
    },
  ]
}

export default InvestorTierLimits
```

---

### ChatRealtySettings Global

```typescript
import { GlobalConfig } from 'payload/types'

const ChatRealtySettings: GlobalConfig = {
  slug: 'chat-realty-settings',
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.roles?.includes('admin'),
  },
  fields: [
    {
      name: 'networkEnabled',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Enable ChatRealty.io agent fork network',
      }
    },
    {
      name: 'baseDomain',
      type: 'text',
      defaultValue: 'chatrealty.io',
    },
    {
      name: 'vercelIntegration',
      type: 'group',
      fields: [
        {
          name: 'apiToken',
          type: 'text',
          admin: {
            description: 'Vercel API token for deployments',
          }
        },
        {
          name: 'projectId',
          type: 'text',
        },
        {
          name: 'teamId',
          type: 'text',
        },
      ]
    },
    {
      name: 'pricing',
      type: 'group',
      fields: [
        {
          name: 'monthlyFee',
          type: 'number',
          defaultValue: 99,
          admin: {
            description: 'Monthly fee for agent website fork',
          }
        },
        {
          name: 'setupFee',
          type: 'number',
          defaultValue: 0,
        },
      ]
    },
  ]
}

export default ChatRealtySettings
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment

- ✅ Fix Payload admin panel errors
- ✅ Extend Users collection with all fields
- ✅ Create all new collections (Teams, ChatSessions, CMARequests, etc.)
- ✅ Add access control rules
- ✅ Add hooks for usage tracking
- ✅ Create custom admin dashboard
- ✅ Test all auth flows
- ✅ Test tier limit enforcement
- ✅ Test collection CRUD operations

### Migration

- ✅ Export existing users from MongoDB
- ✅ Transform user data to Payload schema
- ✅ Import users via Payload API
- ✅ Verify all users migrated correctly
- ✅ Test login with migrated accounts
- ✅ Verify liked listings, favorites, etc. preserved

### Post-Migration

- ✅ Update all API routes to use Payload auth
- ✅ Replace AuthProvider in frontend
- ✅ Update all components using useAuth
- ✅ Update chat widget
- ✅ Update protected routes
- ✅ Test entire user flow (signup → chat → CMA → favorites)
- ✅ Monitor error logs
- ✅ Document new admin workflows

---

## 📊 BENEFITS SUMMARY

### Developer Experience

- ✅ Type-safe collections with auto-generated TypeScript
- ✅ No manual auth logic in every route
- ✅ Automatic API generation (REST + GraphQL)
- ✅ Built-in validation and error handling
- ✅ Hooks system for business logic
- ✅ Plugin ecosystem (Cloudinary, Search, SEO, etc.)

### Admin Experience

- ✅ Beautiful admin UI out of the box
- ✅ Role-based dashboards
- ✅ User management without code
- ✅ Audit logs for compliance
- ✅ Bulk operations
- ✅ Advanced filtering and search

### User Experience

- ✅ Secure, battle-tested authentication
- ✅ Better performance (optimized queries)
- ✅ Consistent tier enforcement
- ✅ Usage tracking built-in
- ✅ Faster feature development

---

**Document Version:** 1.0
**Last Updated:** November 23, 2025
**Maintained By:** JPSRealtor Development Team
**Contact:** [email protected]
