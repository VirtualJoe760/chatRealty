# ChatRealty Restructuring Plan

**Date**: 2025-01-23
**Goal**: Consolidate CMS into ChatRealty, make jpsrealtor first agent instance

---

## Current Structure

```
chatRealty/                  # Empty template (just docs)
jpsrealtor/                  # Frontend (will become Agent #1)
jpsrealtor-cms/              # CMS (will move to ChatRealty)
```

---

## Target Structure

```
chatRealty/                  # Platform repository
├── cms/                     # PayloadCMS (shared by all agents)
│   ├── src/
│   │   └── collections/     # Users, Cities, Neighborhoods, etc.
│   ├── payload.config.ts
│   ├── package.json
│   └── .env.example
│
├── frontend-template/       # Next.js template (for new agents)
│   ├── src/
│   ├── package.json
│   └── .env.example
│
├── memory-files/            # Platform documentation
│   ├── MASTER_SYSTEM_ARCHITECTURE.md
│   └── ... (all docs)
│
└── README.md               # Platform overview

jpsrealtor/                  # Agent instance #1
├── src/                     # Next.js frontend
├── .env.local              # Points to chatRealty CMS
│   NEXT_CMS_URL=https://cms.chatrealty.io
│   TENANT_ID=jpsrealtor
├── config/
│   ├── branding.json       # JPS branding
│   └── mls-config.json     # JPS MLS keys
└── README.md               # Agent-specific docs
```

---

## Migration Steps

### Phase 1: Move CMS to ChatRealty ✅

1. **Copy jpsrealtor-cms → chatRealty/cms**
   ```bash
   cp -r jpsrealtor-cms/* chatRealty/cms/
   ```

2. **Update CMS configuration for multi-tenant**
   - Add `tenantId` field to Users collection
   - Update CORS to allow agent domains
   - Configure for chatrealty.io domain

3. **Initialize ChatRealty GitHub repo**
   ```bash
   cd chatRealty
   git init
   git remote add origin https://github.com/VirtualJoe760/chatRealty.git
   git add .
   git commit -m "Initial ChatRealty platform with shared CMS"
   git push -u origin main
   ```

---

### Phase 2: Update jpsrealtor to Use ChatRealty CMS ✅

1. **Update environment variables**
   ```bash
   # jpsrealtor/.env.local
   NEXT_CMS_URL=https://cms.chatrealty.io  # or http://localhost:3002 for dev
   TENANT_ID=jpsrealtor
   ```

2. **Update API calls to include tenant context**
   ```typescript
   // Add tenant header to all CMS requests
   headers: {
     'x-tenant-id': 'jpsrealtor'
   }
   ```

3. **Remove CMS-specific code from jpsrealtor**
   - jpsrealtor becomes frontend-only
   - All backend logic in ChatRealty CMS

---

### Phase 3: Create Frontend Template in ChatRealty ✅

1. **Copy jpsrealtor → chatRealty/frontend-template**
   ```bash
   cp -r jpsrealtor/* chatRealty/frontend-template/
   ```

2. **Remove agent-specific configs**
   - Remove .env.local (create .env.example)
   - Remove branding assets (create placeholders)
   - Remove MLS configs (create templates)

3. **Add template variables**
   ```typescript
   // frontend-template/config/agent.template.ts
   export const agentConfig = {
     tenantId: '{{AGENT_ID}}',
     agentName: '{{AGENT_NAME}}',
     domain: '{{AGENT_DOMAIN}}',
     // ... templated values
   };
   ```

---

### Phase 4: Documentation Sync Setup ✅

1. **Create GitHub Action in ChatRealty**
   - Auto-sync memory-files/ to jpsrealtor
   - Trigger on docs changes

2. **Create manual sync script**
   ```bash
   # chatRealty/scripts/sync-docs.sh
   cp -r memory-files/* ../jpsrealtor/docs/platform/
   ```

---

## Deployment Architecture

### Development

```
ChatRealty CMS:     http://localhost:3002
jpsrealtor Frontend: http://localhost:3000 (points to localhost:3002)
```

### Production

```
ChatRealty CMS:     https://cms.chatrealty.io
jpsrealtor Frontend: https://jpsrealtor.com (points to cms.chatrealty.io)
agent2 Frontend:     https://agent2.com (points to cms.chatrealty.io)
```

---

## Database Schema Updates

### Add Tenant Support

**Users collection**:
```typescript
{
  _id: ObjectId,
  tenantId: "jpsrealtor",  // ← NEW FIELD
  email: string,
  role: string,
  // ...
}
```

**Queries always filter by tenantId**:
```typescript
const users = await User.find({ tenantId: 'jpsrealtor' });
```

**Shared collections** (no tenantId):
- `listings` (GPS MLS - shared across all agents)
- `crmlsListings` (CRMLS - shared across all agents)
- `cities` (shared)
- `neighborhoods` (shared)

**Tenant-scoped collections** (have tenantId):
- `users`
- `chatMessages`
- `contacts`
- `swipeReviewSessions`

---

## Environment Variables

### ChatRealty CMS (.env)
```bash
MONGODB_URI=mongodb+srv://...
PAYLOAD_SECRET=...
NEXT_CMS_URL=https://cms.chatrealty.io
NODE_ENV=production

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...

# OAuth (shared by all agents)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
```

### jpsrealtor Frontend (.env.local)
```bash
# Platform
NEXT_CMS_URL=https://cms.chatrealty.io
TENANT_ID=jpsrealtor

# Agent-specific
NEXT_PUBLIC_AGENT_NAME="JPS Realtor"
NEXT_PUBLIC_AGENT_DOMAIN=jpsrealtor.com

# MLS
SPARK_API_KEY=...
GPS_MLS_KEY=...

# AI
GROQ_API_KEY=...

# CDN
CLOUDINARY_CLOUD_NAME=...
```

---

## Benefits of This Structure

✅ **Single CMS** - One PayloadCMS instance for all agents
✅ **Multi-tenant ready** - tenantId field isolates data
✅ **Shared infrastructure** - Agents share backend costs
✅ **Easy agent provisioning** - Fork frontend-template, set tenantId
✅ **Centralized updates** - Update CMS once, all agents benefit
✅ **Clear separation** - Platform (ChatRealty) vs Agents (jpsrealtor, etc.)

---

## Next Steps

1. ✅ Copy CMS to chatRealty/cms/
2. ✅ Add tenantId to collections
3. ✅ Initialize ChatRealty GitHub repo
4. ✅ Update jpsrealtor to point to ChatRealty CMS
5. ✅ Create frontend-template in ChatRealty
6. ✅ Set up GitHub Actions for doc sync
7. ✅ Deploy ChatRealty CMS to production (cms.chatrealty.io)
8. ✅ Update jpsrealtor deployment to use new CMS URL

---

**Status**: Ready to execute
**Estimated Time**: 2-3 hours
**Risk Level**: Medium (requires deployment coordination)
