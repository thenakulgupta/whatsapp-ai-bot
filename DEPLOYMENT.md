# 🚀 Deployment Guide

This guide will help you deploy the Universal AI Business Support Agent to production.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Domain name with SSL certificate (for production)
- WhatsApp Business API credentials
- MongoDB database (or use the included Docker setup)
- AI service API keys (Groq)

## 🔧 Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd universal-ai-support
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your production values:

```env
# Database
MONGODB_URI=mongodb://admin:password123@mongodb:27017/universal-ai-support?authSource=admin
MONGODB_DATABASE=universal-ai-support

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# AI Services
GROQ_API_KEY=your_groq_api_key

# Server Configuration
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Admin Dashboard
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password

# WebSocket
WS_PORT=3001

# Session Configuration
SESSION_EXPIRY_HOURS=24
MAX_SESSION_CONTEXT_SIZE=1000
```

## 🐳 Docker Deployment

### 1. Build and Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 2. Initialize Database

The MongoDB container will automatically initialize with the required collections and indexes.

### 3. Verify Deployment

- Backend API: http://localhost:3000/health
- Admin Dashboard: http://localhost:3001
- MongoDB: localhost:27017

## 🌐 Production Deployment

### 1. Domain and SSL Setup

Update your domain DNS to point to your server, then configure SSL certificates:

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy your SSL certificates
cp your-domain.crt nginx/ssl/
cp your-domain.key nginx/ssl/
```

### 2. Nginx Configuration

Update `nginx/nginx.conf` with your domain:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/your-domain.crt;
    ssl_certificate_key /etc/nginx/ssl/your-domain.key;

    # Backend API
    location /api/ {
        proxy_pass http://backend:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WhatsApp Webhook
    location /webhook/ {
        proxy_pass http://backend:3000/webhook/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Dashboard
    location / {
        proxy_pass http://dashboard:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. WhatsApp Webhook Configuration

Configure your WhatsApp Business API webhook:

- **Webhook URL**: `https://your-domain.com/webhook/whatsapp`
- **Verify Token**: Use the same token from your `.env` file
- **Webhook Fields**: Subscribe to `messages` events

### 4. Deploy to Production

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

## 📊 Monitoring and Maintenance

### 1. Health Checks

```bash
# Check all services
curl https://your-domain.com/health

# Check individual services
docker-compose ps
```

### 2. Log Monitoring

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f dashboard
```

### 3. Database Backup

```bash
# Create backup
docker-compose exec mongodb mongodump --out /backup

# Restore backup
docker-compose exec mongodb mongorestore /backup
```

### 4. Updates and Maintenance

```bash
# Update application
git pull origin main
docker-compose down
docker-compose up -d --build

# Update dependencies
docker-compose exec backend npm update
docker-compose exec dashboard npm update
```

## 🔒 Security Considerations

### 1. Environment Variables

- Use strong, unique passwords
- Rotate JWT secrets regularly
- Keep API keys secure and rotate them

### 2. Network Security

- Use HTTPS in production
- Configure firewall rules
- Limit database access

### 3. Data Protection

- Enable MongoDB authentication
- Use encrypted connections
- Regular security updates

## 🚨 Troubleshooting

### Common Issues

1. **Webhook Verification Failed**
   - Check webhook URL and verify token
   - Ensure HTTPS is properly configured

2. **Database Connection Issues**
   - Verify MongoDB credentials
   - Check network connectivity

3. **AI Service Errors**
   - Verify API keys are correct
   - Check rate limits and quotas

4. **Dashboard Not Loading**
   - Check nginx configuration
   - Verify backend API is running

### Debug Commands

```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs --tail=100 backend

# Access container shell
docker-compose exec backend sh

# Check database connection
docker-compose exec backend node -e "console.log('DB connection test')"
```

## 📈 Scaling

### Horizontal Scaling

For high-traffic deployments:

1. **Load Balancer**: Use nginx or cloud load balancer
2. **Multiple Backend Instances**: Scale backend containers
3. **Database Clustering**: Use MongoDB replica sets
4. **Redis Clustering**: For session storage and caching

### Performance Optimization

1. **Enable Caching**: Use Redis for session and data caching
2. **Database Indexing**: Ensure proper MongoDB indexes
3. **CDN**: Use CDN for static assets
4. **Monitoring**: Implement APM tools

## 📞 Support

For deployment issues:

1. Check the logs first
2. Review this documentation
3. Check GitHub issues
4. Contact support team

---

**Note**: This is a production-ready deployment guide. Make sure to test thoroughly in a staging environment before deploying to production.
