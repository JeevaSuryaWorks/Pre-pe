# DigitalOcean Backend Deployment Guide

Follow these steps to set up your fresh DigitalOcean Droplet and deploy your Pre-pe backend.

### 1. Connect to your Droplet
Open your terminal and SSH into your server:
```bash
ssh root@64.227.151.233
```

### 2. Install Docker & Docker Compose
Run this command to install the necessary tools:
```bash
sudo apt update && sudo apt install -y docker.io docker-compose
```

### 3. Clone your Repository
Clone your project onto the server:
```bash
git clone <your-repository-url> prepe
cd prepe/backend
```

### 4. Set up Environment Variables
Create a `.env` file and add your credentials:
```bash
nano .env
```
Paste the following (adjust with your actual keys):
```env
# Database (Use your Supabase URL if you want to keep the same database)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# KwikAPI Key
KWIK_API_KEY="your_kwik_api_key"

# Port
PORT=3000
```
*Press `Ctrl+O`, `Enter`, then `Ctrl+X` to save.*

### 5. Deploy with Docker
Start your backend services:
```bash
docker-compose up -d --build
```

### 6. Verify Deployment
Check if the containers are running:
```bash
docker ps
```
You can also test if the API is reachable by visiting:
`http://64.227.151.233:3000/api/kwik-proxy` (It should return a 405 or JSON error, not a 404).

### 7. Firewall Setup
Open the ports for your app and database:
```bash
ufw allow 3000
ufw allow 80
ufw allow 443
```

---

### Important: Update your Frontend
In your Vercel project, update your Environment Variable:
`VITE_API_BASE_URL` = `http://64.227.151.233:3000`

*Note: Once you add a domain, you should change this to `https://your-api-domain.com`.*
