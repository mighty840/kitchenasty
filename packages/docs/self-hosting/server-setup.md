# 🖥️ Server Setup

This page walks you through setting up a fresh Linux server for KitchenAsty. We'll use Ubuntu 24.04 LTS, but any modern Debian-based distribution works similarly.

## 1️⃣ Step 1: Create a Server

Sign up with your chosen hosting provider (see [Overview](/self-hosting/overview) for options) and create a new server with these settings:

- 🐧 **OS**: Ubuntu 24.04 LTS
- 💾 **Plan**: 2 GB RAM / 1 vCPU minimum (4 GB / 2 vCPU recommended)
- 🌍 **Region**: Choose the region closest to your restaurant's customers
- 🔑 **Authentication**: SSH key (preferred) or password

After creation, note the server's **public IP address** (e.g., `203.0.113.50`). You'll need it throughout this guide.

## 2️⃣ Step 2: Connect to Your Server

Open a terminal on your local computer and connect via SSH:

```bash
ssh root@203.0.113.50
```

Replace `203.0.113.50` with your server's actual IP address.

::: tip 🪟 For Windows Users
Use **Windows Terminal** (built into Windows 11) or download [PuTTY](https://www.putty.org/). Windows Terminal supports SSH natively — just open it and type the `ssh` command above.
:::

## 3️⃣ Step 3: Create a Non-Root User

Running everything as `root` is a security risk. Create a dedicated user:

```bash
# Create user
adduser kitchenasty

# Give sudo privileges
usermod -aG sudo kitchenasty

# If you used an SSH key, copy it to the new user
mkdir -p /home/kitchenasty/.ssh
cp ~/.ssh/authorized_keys /home/kitchenasty/.ssh/
chown -R kitchenasty:kitchenasty /home/kitchenasty/.ssh
chmod 700 /home/kitchenasty/.ssh
chmod 600 /home/kitchenasty/.ssh/authorized_keys
```

Log out and reconnect as the new user:

```bash
exit
ssh kitchenasty@203.0.113.50
```

## 4️⃣ Step 4: Update the System

```bash
sudo apt update && sudo apt upgrade -y
```

## 5️⃣ Step 5: Install Docker

Docker lets you run KitchenAsty without installing Node.js, PostgreSQL, or any other dependencies directly on the server.

```bash
# Install Docker's official GPG key and repository
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Docker Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to the docker group (avoids needing sudo for docker commands)
sudo usermod -aG docker kitchenasty
```

**Log out and log back in** for the group change to take effect:

```bash
exit
ssh kitchenasty@203.0.113.50
```

Verify Docker is working:

```bash
docker --version
# Docker version 27.x.x

docker compose version
# Docker Compose version v2.x.x
```

## 6️⃣ Step 6: Configure the Firewall

Ubuntu comes with `ufw` (Uncomplicated Firewall). Enable it and allow only the ports you need:

```bash
# Allow SSH (so you don't lock yourself out!)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS (for web traffic)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable the firewall
sudo ufw enable

# Verify the rules
sudo ufw status
```

Expected output:

```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

::: warning ⚠️ Important
Do **not** expose ports 3000, 5173, 5174, or 5432 to the internet. The reverse proxy (Caddy or Nginx) will handle routing on ports 80/443. Direct access to the application ports is unnecessary and a security risk.
:::

## 7️⃣ Step 7: Set Up Automatic Security Updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Select **Yes** when prompted. This keeps your server patched against known security vulnerabilities automatically.

## 8️⃣ Step 8: (Optional) Configure SSH Security

For additional security, disable password login and root login:

```bash
sudo nano /etc/ssh/sshd_config
```

Find and change these lines:

```
PermitRootLogin no
PasswordAuthentication no
```

Restart SSH:

```bash
sudo systemctl restart sshd
```

::: danger 🚨
Only do this if you have SSH key authentication working. Otherwise, you will lock yourself out of the server.
:::

## ➡️ Next Step

Your server is ready. Continue to **[Docker Compose Production](/self-hosting/docker-compose)** to deploy KitchenAsty.
