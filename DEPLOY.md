# Deployment Guide - Azure Static Web Apps

Total cost: **$0/month** (within free tier)

## Prerequisites

- Azure account with credits
- GitHub repository
- Stripe account

---

## Step 1: Create Stripe Product (5 min)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Products** → **Add product**
   - Name: `Fabric Toolbox Pro`
   - Price: `$5.00` / month (recurring)
3. Copy the **Price ID** (starts with `price_`)
4. Go to **Developers** → **API keys**
   - Copy **Publishable key** (`pk_live_...`)
   - Copy **Secret key** (`sk_live_...`)

---

## Step 2: Create Azure Static Web App (10 min)

### Option A: Azure Portal (Recommended)

1. Go to [Azure Portal](https://portal.azure.com)
2. **Create a resource** → Search "Static Web App"
3. Fill in:
   - **Resource Group**: Create new or use existing
   - **Name**: `fabric-toolbox` (or your choice)
   - **Plan type**: Free
   - **Region**: Pick closest to you
   - **Source**: GitHub
   - **Organization**: Your GitHub org
   - **Repository**: `fabric-toolbox-ui` (or your repo name)
   - **Branch**: `main`
   - **Build Presets**: Custom
   - **App location**: `/tools/FabricToolboxDashboard`
   - **API location**: `api`
   - **Output location**: `dist`

4. Click **Review + create** → **Create**

### Option B: Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create --name rg-fabric-toolbox --location eastus

# Create Static Web App
az staticwebapp create \
  --name fabric-toolbox \
  --resource-group rg-fabric-toolbox \
  --source https://github.com/YOUR_USERNAME/YOUR_REPO \
  --location eastus \
  --branch main \
  --app-location "/tools/FabricToolboxDashboard" \
  --api-location "api" \
  --output-location "dist" \
  --login-with-github
```

---

## Step 3: Configure Secrets (5 min)

### GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | (Auto-added by Azure) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxxxx` |
| `VITE_STRIPE_PRICE_ID` | `price_xxxxx` |

### Azure Application Settings

1. Go to your Static Web App in Azure Portal
2. **Settings** → **Configuration**
3. Add these **Application settings**:

| Name | Value |
|------|-------|
| `STRIPE_SECRET_KEY` | `sk_live_xxxxx` |
| `STRIPE_WEBHOOK_SECRET` | (from Step 4) |

---

## Step 4: Configure Stripe Webhook (5 min)

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. **Add endpoint**
   - URL: `https://YOUR-APP-NAME.azurestaticapps.net/api/stripe/webhook`
   - Events to listen:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
3. Copy the **Signing secret** (`whsec_...`)
4. Add it to Azure Application Settings as `STRIPE_WEBHOOK_SECRET`

---

## Step 5: Deploy (Automatic)

Push to `main` branch and GitHub Actions will auto-deploy:

```bash
git add .
git commit -m "Deploy to Azure"
git push origin main
```

Check deployment: **Actions** tab in GitHub

---

## Verify Deployment

1. Visit: `https://YOUR-APP-NAME.azurestaticapps.net`
2. Click **Build Infra** → Click locked template
3. Click **Upgrade Now** → Should redirect to Stripe Checkout

---

## Custom Domain (Optional)

1. Azure Portal → Your Static Web App → **Custom domains**
2. Add your domain (e.g., `app.fabrictoolbox.com`)
3. Configure DNS:
   - **CNAME**: `app` → `YOUR-APP-NAME.azurestaticapps.net`
   - Or use Azure DNS for apex domains

---

## Troubleshooting

### API not working
- Check Azure Portal → Static Web App → **Functions** → Should show 5 functions
- Check **Application settings** for missing env vars

### Stripe checkout fails
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` in GitHub secrets
- Verify `STRIPE_SECRET_KEY` in Azure settings
- Check browser console for errors

### Build fails
- Check GitHub Actions logs
- Ensure `npm ci` and `npm run build` work locally

---

## Cost Breakdown

| Service | Monthly Cost |
|---------|-------------|
| Azure Static Web Apps | $0 (Free tier) |
| Azure Functions (integrated) | $0 (Free tier: 1M requests) |
| Stripe | 2.9% + $0.30 per transaction |
| **Total** | **~$0** + Stripe fees |

---

## Scaling

If you outgrow free tier:

- **Standard plan**: $9/month - Custom auth, more storage
- **Custom API**: Move to Azure Functions Premium ($50+/month)

For now, free tier handles ~100,000 requests/month.
