# GitHub Actions Setup Guide - Documentation Auto-Sync

**Purpose**: Automatically sync documentation from `chatRealty` to `jpsrealtor` and `chatrealty-cms`

**Status**: � Requires GitHub Token Setup

---

##  **How It Works**

### **Automatic Sync Flow**:
```
1. You edit docs in chatRealty/memory-files/
2. Commit & push to GitHub (main branch)
3. GitHub Action triggers automatically
4. Docs copied to jpsrealtor/docs/platform/
5. Docs copied to chatrealty-cms/docs/platform/
6.  All repos have identical, up-to-date documentation
```

### **Safety Guarantees**:
- **ONE-WAY ONLY**: chatRealty � agent repos (never reverse)
- **NO CONFLICTS**: Syncs to dedicated `docs/platform/` directory
- **NO CODE TOUCHED**: Only documentation is synchronized
- **SYSTEMATIC**: Automatic, consistent, reliable

---

## =' **Setup Instructions** (One-Time)

### **Step 1: Create GitHub Personal Access Token**

1. Go to GitHub.com � Settings � Developer settings � Personal access tokens � Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name: `ChatRealty Docs Sync`
4. Set expiration: **No expiration** (or 1 year)
5. Select scopes:
   -  `repo` (Full control of private repositories)
   -  `workflow` (Update GitHub Action workflows)
6. Click "Generate token"
7. **COPY THE TOKEN** - you won't see it again!

**Token format**: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### **Step 2: Add Token to chatRealty Repository Secrets**

1. Go to https://github.com/VirtualJoe760/chatRealty
2. Click **Settings** � **Secrets and variables** � **Actions**
3. Click **New repository secret**
4. Name: `SYNC_TOKEN`
5. Value: Paste your personal access token
6. Click **Add secret**

---

### **Step 3: Verify Workflow File Exists**

Check that `.github/workflows/sync-docs.yml` exists in chatRealty repo.

**Current workflow**:
- Triggers on push to `main` branch
- Monitors `memory-files/**` for changes
- Syncs to `jpsrealtor/docs/platform/` (v2 branch - development)
- Syncs to `chatrealty-cms/docs/platform/` (main branch)

---

### **Step 4: Test the Sync**

1. Make a small change to any doc in `chatRealty/memory-files/`
2. Commit and push:
   ```bash
   cd chatRealty
   git add memory-files/
   git commit -m "test: verify docs sync"
   git push origin main
   ```
3. Go to https://github.com/VirtualJoe760/chatRealty/actions
4. Watch the workflow run
5. Verify docs appeared in:
   - https://github.com/VirtualJoe760/jpsrealtor/tree/main/docs/platform
   - https://github.com/VirtualJoe760/chatrealty-cms/tree/main/docs/platform

---

## =� **Workflow Configuration**

### **File**: `.github/workflows/sync-docs.yml`

```yaml
name: Sync Documentation to Agent Repos

on:
  push:
    branches: [main]
    paths:
      - 'memory-files/**'
      - 'DOCS_INDEX.md'
      - 'ARCHITECTURE_UPDATE_SUMMARY.md'

jobs:
  sync-to-jpsrealtor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cpina/github-action-push-to-another-repository@main
        env:
          API_TOKEN_GITHUB: ${{ secrets.SYNC_TOKEN }}
        with:
          source-directory: 'memory-files'
          destination-repository-name: 'jpsrealtor'
          target-directory: 'docs/platform'
```

### **What Gets Synced**:
-  `memory-files/` � `jpsrealtor/docs/platform/`
-  `memory-files/` � `chatrealty-cms/docs/platform/`
-  `DOCS_INDEX.md` � Both repos
-  `ARCHITECTURE_UPDATE_SUMMARY.md` � Both repos

### **What DOESN'T Get Synced**:
- L Agent repo code (`src/`, `public/`, etc.)
- L Agent repo configs (`.env`, `package.json`)
- L Agent-specific files

---

## � **Important Rules**

### **DO**:
-  Edit docs ONLY in `chatRealty/memory-files/`
-  Let GitHub Actions sync automatically
-  Treat `docs/platform/` in agent repos as read-only

### **DON'T**:
- L Manually edit `docs/platform/` in jpsrealtor or chatrealty-cms
- L Delete the `docs/platform/` directory in agent repos
- L Modify the workflow file without testing

**Why**: Manual edits to `docs/platform/` will be overwritten on next sync.

---

## = **Troubleshooting**

### **Issue**: Workflow doesn't trigger
**Solution**:
1. Check GitHub Actions tab for errors
2. Verify `SYNC_TOKEN` secret exists
3. Ensure pushing to `main` branch
4. Check that changes are in `memory-files/` directory

### **Issue**: "Permission denied" error
**Solution**:
1. Regenerate personal access token
2. Ensure `repo` scope is selected
3. Update `SYNC_TOKEN` secret with new token

### **Issue**: Sync succeeds but docs not appearing
**Solution**:
1. Check target repo: `jpsrealtor/docs/platform/`
2. Verify commit appears in agent repo history
3. Pull latest changes: `git pull origin main`

### **Issue**: Workflow fails with "Resource not accessible"
**Solution**:
1. Token may have expired - regenerate
2. Check repo permissions - token needs access to all 3 repos
3. Verify repo names in workflow file match GitHub

---

## =� **Monitoring**

### **View Workflow Runs**:
https://github.com/VirtualJoe760/chatRealty/actions

### **Check Sync Status**:
```bash
# In jpsrealtor repo
cd jpsrealtor
git log --oneline docs/platform/ | head -5

# Should show commits like:
# =� docs: sync architecture from ChatRealty platform
```

### **Verify Docs Are Current**:
```bash
# Compare timestamps
ls -la chatRealty/memory-files/
ls -la jpsrealtor/docs/platform/

# Should have identical files with recent timestamps
```

---

## <� **Expected Behavior**

### **After Setup**:
Every time you push docs changes to `chatRealty`:

1. **Immediately**: GitHub Action starts (< 10 seconds)
2. **~30 seconds**: Docs sync to jpsrealtor
3. **~30 seconds**: Docs sync to chatrealty-cms
4. **~1 minute total**: All repos have identical docs

### **Verification Checklist**:
- [ ] Can see workflow run in Actions tab
- [ ] New commit appears in jpsrealtor: "=� docs: sync architecture from ChatRealty platform"
- [ ] New commit appears in chatrealty-cms with same message
- [ ] Files in `docs/platform/` match `memory-files/`
- [ ] Timestamp on files is recent

---

## =� **Best Practices**

### **1. Commit Message Convention**:
```bash
# When editing docs in chatRealty
git commit -m "docs: update user schema in AUTH_ARCHITECTURE"
git commit -m "docs: add branding algorithm to FRONTEND_ARCHITECTURE"
git commit -m "docs: fix typo in DATABASE_ARCHITECTURE"
```

### **2. Batch Documentation Updates**:
```bash
# Update multiple docs, commit once
git add memory-files/AUTH_ARCHITECTURE.md
git add memory-files/DATABASE_ARCHITECTURE.md
git commit -m "docs: update user schema across AUTH and DATABASE docs"
git push origin main
# � Triggers ONE sync to all repos
```

### **3. Review Before Push**:
```bash
# Always review changes before pushing
git diff memory-files/

# Check what will be synced
git status

# Push when ready
git push origin main
```

---

## =� **Quick Reference**

| Action | Command |
|--------|---------|
| **Edit docs** | Edit `chatRealty/memory-files/*.md` |
| **Commit** | `git commit -am "docs: update X"` |
| **Push** | `git push origin main` |
| **Check sync** | https://github.com/VirtualJoe760/chatRealty/actions |
| **View in jpsrealtor** | https://github.com/VirtualJoe760/jpsrealtor/tree/main/docs/platform |
| **View in chatrealty-cms** | https://github.com/VirtualJoe760/chatrealty-cms/tree/main/docs/platform |

---

##  **Setup Complete Checklist**

- [ ] Created GitHub Personal Access Token
- [ ] Added token to chatRealty repository secrets as `SYNC_TOKEN`
- [ ] Verified workflow file exists: `.github/workflows/sync-docs.yml`
- [ ] Tested sync with sample commit
- [ ] Confirmed docs appeared in jpsrealtor/docs/platform/
- [ ] Confirmed docs appeared in chatrealty-cms/docs/platform/
- [ ] Reviewed this guide and understand the workflow

---

**Once setup is complete, documentation will automatically stay synchronized across all three repos!** <�

No manual copying, no version drift, no conflicts - just push to `chatRealty` and let GitHub Actions handle the rest.
