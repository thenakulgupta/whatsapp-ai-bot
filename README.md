# 🧩 Universal AI Business Support Agent

A modular WhatsApp AI chatbot system that supports multiple industry demos (Real Estate, E-commerce, Healthcare, HR, etc.) with session-based module switching and comprehensive admin dashboard.

## 🎯 Features

- **Modular Demo System**: Switch between different industry modules (Real Estate, E-commerce, etc.)
- **Session Management**: 24-hour session expiry with module context preservation
- **WhatsApp Integration**: Full WhatsApp Business API integration with webhooks
- **AI-Powered**: Groq integration for natural language processing
- **Human Escalation**: Seamless handoff to human agents with ticket system
- **Real-time Dashboard**: WebSocket-powered admin dashboard with live updates
- **Multi-language Support**: Google Translate integration
- **Analytics**: Comprehensive analytics per module with KPI tracking

## 🏗️ Architecture

```
User Message → WhatsApp Webhook → Session Manager → Module Router → AI Processing → Response
```

## 🚀 Quick Start

1. **Clone and Install**

   ```bash
   git clone <repository>
   cd universal-ai-support
   npm run install:all
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Database Setup**

   ```bash
   # Make sure MongoDB is running
   mongod
   ```

4. **Development**

   ```bash
   npm run dev
   ```

5. **Access Dashboard**
   - Backend API: http://localhost:3000
   - Admin Dashboard: http://localhost:3001

## 📱 WhatsApp Setup

1. Create a WhatsApp Business Account
2. Get your access token and phone number ID
3. Set up webhook URL: `https://yourdomain.com/webhook/whatsapp`
4. Configure webhook verify token

## 🧩 Module System

Each module is a self-contained folder with:

- `manifest.js`: Module configuration and available functions
- `functions/`: Module-specific function implementations
- Database models scoped to the module

### Example Module Structure

```
modules/real_estate/
├── manifest.js
└── functions/
    ├── fetch_property.js
    ├── schedule_visit.js
    └── cancel_visit.js
```

## 📊 Admin Dashboard

- **Module Filter**: Switch between different industry modules
- **Chat Management**: View and manage conversations per module
- **Ticket System**: Handle escalated cases
- **Analytics**: Real-time KPIs and performance metrics
- **Agent Management**: Assign human agents to modules

## 🔧 Configuration

Key environment variables:

- `MONGODB_URI`: MongoDB connection string
- `WHATSAPP_ACCESS_TOKEN`: WhatsApp Business API token
- `GROQ_API_KEY`: Groq API key for AI processing
- `SESSION_EXPIRY_HOURS`: Session timeout (default: 24)

## 📈 Analytics

Track per-module metrics:

- Message volume and response times
- Escalation rates
- User satisfaction scores
- Function usage statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your module or improvements
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:

- Create an issue in the repository
- Check the documentation in `/docs`
- Review the example modules for implementation patterns
