# 🚀 CrypX-Pro Google Cloud Run Deployment & Database Migration Guide

This guide details how to:
1. **Export all data** from your current Supabase database and import it into a **new Supabase instance**.
2. **Deploy the entire application** to **Google Cloud Run** using Docker.

---

## 📦 Part 1: Exporting Current Database Data & Importing to New Database

### Option A: Using the In-App Database Backup Tool (Recommended)
1. Log in to the Admin Portal (`/admin/dashboard`).
2. Go to **Database Export** (`/admin/database-export`).
3. Click **Download Entire DB (.sql)** to get a complete transactional PostgreSQL dump containing all records (`profiles`, `positions`, `deposits`, `withdrawals`, `kyc_submissions`, `user_assets`, etc.).
4. Click **Download Schema (schema.sql)** to download the structural DDL setup.

### Option B: Importing into Your New Supabase Database
1. Log into your **New Supabase Dashboard** (or create a new Supabase project).
2. Go to **SQL Editor** -> **New Query**.
3. Paste the contents of `schema.sql` (or `setup_admin_auth.sql`) and click **Run**.
4. Paste the contents of your exported `.sql` dump file and click **Run**.
5. All your tables, user profiles, balance histories, and active futures trades are now imported into your new database!

---

## ☁️ Part 2: Deploying the Application to Google Cloud Run

Your application is already containerized with `Dockerfile` and configured to run on Express Node.js.

### Step 1: Install & Initialize Google Cloud SDK (`gcloud`)
If you haven't installed `gcloud`, install it from [cloud.google.com/sdk](https://cloud.google.com/sdk) and run:
```bash
gcloud auth login
gcloud config set project YOUR_GOOGLE_CLOUD_PROJECT_ID
```

### Step 2: Enable Google Cloud Run & Artifact Registry Services
```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

### Step 3: Deploy to Google Cloud Run in 1 Command
From the root directory of this repository, run:
```bash
gcloud run deploy crypx-pro \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars VITE_SUPABASE_URL="https://YOUR_NEW_SUPABASE_PROJECT.supabase.co",VITE_SUPABASE_ANON_KEY="YOUR_NEW_SUPABASE_ANON_KEY"
```

Google Cloud Build will automatically build the `Dockerfile`, push the image to Google Artifact Registry, and deploy it to a high-speed, auto-scaling HTTPS Cloud Run URL (e.g. `https://crypx-pro-xxxxx-uc.a.run.app`).

---

## ⚙️ Updating Environment Variables in Cloud Run
You can update your Supabase database connection credentials anytime in Google Cloud Run:
```bash
gcloud run services update crypx-pro \
  --region us-central1 \
  --update-env-vars VITE_SUPABASE_URL="https://your-new-supabase.supabase.co",VITE_SUPABASE_ANON_KEY="your-new-key"
```

Or visit the **Google Cloud Console** -> **Cloud Run** -> **crypx-pro** -> **Edit & Deploy New Revision** -> **Variables & Secrets**.

---

## 🛠️ Summary of Created Files
- `Dockerfile` — Multi-stage production container build (Node 20 Alpine).
- `.dockerignore` — Excludes local builds and environment secrets.
- `schema.sql` — Consolidated database schema.
- `setup_admin_auth.sql` — Admin authentication setup script.
