# TruTrace — TiDB Cloud Setup Guide

## Step 1: Create a TiDB Cloud Account
1. Go to → https://tidbcloud.com
2. Sign up for free (no credit card needed for Serverless tier)
3. Create a new **Serverless** cluster (takes ~30 seconds)

## Step 2: Get Your Connection Details
1. In TiDB Cloud, click your cluster → **Connect**
2. Choose **General** connection type
3. Copy these values:

```
Host:     <your-cluster>.ap-southeast-1.prod.aws.tidbcloud.com
Port:     4000
User:     <username>.<prefix>   ← includes the prefix automatically
Password: <your-password>
Database: test (or create one called "trutrace")
```

## Step 3: Update Your .env File
Open: `c:\Users\gag90\Downloads\prototype canara\.env`

Replace with your real values:
```
TIDB_HOST=<your-cluster>.ap-southeast-1.prod.aws.tidbcloud.com
TIDB_PORT=4000
TIDB_USER=<your-full-username-with-prefix>
TIDB_PASSWORD=<your-password>
TIDB_DATABASE=trutrace
JWT_SECRET=trutrace_super_secret_jwt_key_canara2024
PORT=3001
```

## Step 4: Create the Database
In TiDB Cloud SQL Editor, run:
```sql
CREATE DATABASE IF NOT EXISTS trutrace;
```
The app will automatically create all tables on first startup.

## Step 5: Restart the Backend
In a new terminal:
```
node server/index.cjs
```

You should see:
```
✅ TiDB tables initialized successfully
🛡️  TruTrace Backend running on http://localhost:3001
📊  TiDB connected: your-cluster.tidbcloud.com:4000
```

## Running Both Servers

**Terminal 1 — Frontend (Vite):**
```powershell
& "C:\Program Files\nodejs\npm.cmd" run dev
```

**Terminal 2 — Backend (Express + TiDB):**
```powershell
& "C:\Program Files\nodejs\node.exe" server/index.cjs
```

App runs at: http://localhost:5173
