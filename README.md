# ChatRealty Platform

**Multi-Tenant Real Estate SaaS Platform**

ChatRealty is the master platform powering branded real estate websites for agents across the network.

---

## Repository Structure

```
chatRealty/
├── cms/                     # Shared PayloadCMS backend (all agents use this)
├── frontend-template/       # Next.js template for new agents (coming soon)
├── memory-files/            # Platform documentation (synced to agent repos)
├── .github/workflows/       # CI/CD automation
└── scripts/                 # Utility scripts
```

---

## Platform Architecture

**Multi-Tenant Model**:
- **One shared CMS** (PayloadCMS) serves all agents
- **Tenant isolation** via `tenantId` field in database
- **Agent frontends** are separate deployments pointing to shared CMS
- **Shared infrastructure** reduces costs and maintenance

```
┌─────────────────────────────────────────────┐
│         ChatRealty Platform (this repo)     │
│  ┌────────────────────────────────────────┐ │
│  │  PayloadCMS (Shared Backend)           │ │
│  │  - User Management                     │ │
│  │  - Content Management                  │ │
│  │  - Multi-tenant Auth                   │ │
│  │  URL: cms.chatrealty.io                │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
              ↓           ↓           ↓
    ┌─────────────┐ ┌──────────┐ ┌──────────┐
    │ jpsrealtor  │ │ agent2   │ │ agent3   │
    │ (Agent #1)  │ │(Agent #2)│ │(Agent #3)│
    │ Frontend    │ │ Frontend │ │ Frontend │
    └─────────────┘ └──────────┘ └──────────┘
```

---

## Current Agents

1. **jpsrealtor.com** - Joseph Sardella (Agent #1)
   - Repo: [VirtualJoe760/jpsrealtor](https://github.com/VirtualJoe760/jpsrealtor)
   - Tenant ID: `jpsrealtor`

---

## Technology Stack

### Backend (CMS)
- **PayloadCMS** 3.64.0
- **MongoDB** 6.x (shared database)
- **Node.js** 20.x
- **Deployment**: DigitalOcean VPS

### Frontend Template
- **Next.js** 16.0.3
- **React** 19.0.0
- **TypeScript** 5.7.2
- **Deployment**: Vercel

### External Services
- **Groq AI** (llama-3.1-70b-versatile) - Conversational search
- **Spark API** - MLS data integration
- **Cloudinary** - Image CDN
- **MongoDB Atlas** - Database hosting

---

## Development Setup

### Prerequisites
- Node.js 20.x
- npm or yarn
- MongoDB connection (Atlas)

### CMS Development

```bash
# Navigate to CMS
cd cms

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start dev server
npm run dev
# CMS runs on http://localhost:3002
# Admin panel: http://localhost:3002/admin
```

### Environment Variables (.env)

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatrealty

# PayloadCMS
PAYLOAD_SECRET=your_32_character_secret
NEXT_CMS_URL=http://localhost:3002

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@chatrealty.io

# OAuth (shared by all agents)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

---

## Documentation

All platform documentation is in `memory-files/`:

- **[MASTER_SYSTEM_ARCHITECTURE.md](memory-files/MASTER_SYSTEM_ARCHITECTURE.md)** - Complete system overview
- **[FRONTEND_ARCHITECTURE.md](memory-files/FRONTEND_ARCHITECTURE.md)** - Frontend deep dive
- **[BACKEND_ARCHITECTURE.md](memory-files/BACKEND_ARCHITECTURE.md)** - PayloadCMS backend
- **[AUTH_ARCHITECTURE.md](memory-files/AUTH_ARCHITECTURE.md)** - Authentication flows
- **[DATABASE_ARCHITECTURE.md](memory-files/DATABASE_ARCHITECTURE.md)** - MongoDB schema
- **[MULTI_TENANT_ARCHITECTURE.md](memory-files/MULTI_TENANT_ARCHITECTURE.md)** - Multi-tenant strategy
- **[DEVELOPER_ONBOARDING.md](memory-files/DEVELOPER_ONBOARDING.md)** - Getting started guide

**Documentation Sync**: Changes to `memory-files/` automatically sync to agent repos via GitHub Actions.

---

## Adding a New Agent

### Option 1: Via Platform (Future)
1. Agent signs up at chatrealty.io
2. Selects branding, uploads MLS keys
3. Platform provisions frontend instance
4. Agent gets custom domain

### Option 2: Manual Setup (Current)
1. Fork frontend-template (coming soon)
2. Configure tenant ID and branding
3. Set environment variables
4. Deploy to Vercel
5. Point to shared CMS (cms.chatrealty.io)

---

## Database Schema

### Multi-Tenant Collections (have `tenantId`)
- `users` - User accounts per agent
- `chatMessages` - AI chat history per agent
- `contacts` - Contact form submissions per agent
- `swipeReviewSessions` - Swipe analytics per agent

### Shared Collections (no `tenantId`)
- `listings` - GPS MLS listings (all agents share)
- `crmlsListings` - CRMLS listings (all agents share)
- `cities` - City data (all agents share)
- `neighborhoods` - Subdivision data (all agents share)
- `schools` - School data (all agents share)

**See**: `memory-files/DATABASE_ARCHITECTURE.md` for complete schema.

---

## Deployment

### CMS Deployment
**Platform**: DigitalOcean VPS
**URL**: https://cms.chatrealty.io
**Process Manager**: PM2
**Reverse Proxy**: Nginx
**SSL**: Let's Encrypt

**Deploy**:
```bash
ssh root@<server-ip>
cd /var/www/chatrealty-cms
git pull origin main
npm install
npm run build
pm2 restart chatrealty-cms
```

### Agent Frontend Deployment
**Platform**: Vercel (per agent)
**Process**: Auto-deploy on push to main branch

---

## Development Workflow

### Updating Documentation
```bash
# 1. Edit docs in chatRealty/memory-files/
vim memory-files/FRONTEND_ARCHITECTURE.md
git commit -am "docs: update frontend architecture"
git push

# 2. GitHub Action automatically syncs to agent repos
# (jpsrealtor/docs/platform/)
```

### Updating CMS
```bash
# 1. Edit CMS code in chatRealty/cms/
cd cms
vim src/collections/Users.ts
git commit -am "feat: add tenantId to users"
git push

# 2. Deploy to production
# (see Deployment section above)
```

---

## Roadmap

### Phase 1: Platform Foundation (Current)
- ✅ Multi-tenant CMS architecture
- ✅ Documentation system
- ✅ First agent (jpsrealtor) operational
- ⏳ OAuth 2.0 implementation
- ⏳ Frontend template creation

### Phase 2: Agent Provisioning
- ⏳ Agent signup flow
- ⏳ Self-service branding customization
- ⏳ MLS API key management
- ⏳ Automated deployment pipeline

### Phase 3: Platform Features
- ⏳ Analytics dashboard (per agent)
- ⏳ Subscription billing (Stripe)
- ⏳ White-label options
- ⏳ API access for integrations

---

## Contributing

**For Platform Development**:
1. Clone this repo
2. Create feature branch
3. Make changes
4. Test with agent instance (jpsrealtor)
5. Submit PR

**For Agent-Specific Features**:
- Develop in agent repo (e.g., jpsrealtor)
- If feature should be platform-wide, port to ChatRealty

---

## Support

**Platform Issues**: GitHub Issues in this repo
**Agent Issues**: GitHub Issues in respective agent repo
**Questions**: See `memory-files/DEVELOPER_ONBOARDING.md`

---

## License

Proprietary - ChatRealty LLC

---

**Built with ❤️ for real estate agents**
