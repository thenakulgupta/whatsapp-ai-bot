# 🧩 What To Do — Universal AI Business Support Agent

## 🎯 Goal

Enable **multiple industry demo modules** (e.g., Real Estate, E-commerce, Healthcare, HR, etc.) on WhatsApp using the same AI backend.
When a user interacts, they can choose a module, and all their chats, tickets, and analytics get **scoped to that module** until they exit.

---

## 🧠 Core Concept: Modular Demo System

### 💬 WhatsApp Conversation Lifecycle

1. **User sends a message (e.g., “Hi”)**

   - If **no active session** or **last message > 24 hours ago**, AI resets session and sends a **demo module menu**.

   Example:

   > 👋 Hi! Welcome to the Universal AI Demo Platform.
   > Please choose a demo module to explore:
   >
   > 1️⃣ Real Estate
   > 2️⃣ E-Commerce
   > 3️⃣ Healthcare
   > 4️⃣ HR Support
   >
   > Reply with the number or name of the module you’d like to try.

2. **User chooses a module (e.g., “Real Estate”)**

   - System assigns the user to the `real_estate` module.
   - AI context switches to that module’s function set and database.
   - The phone number stays linked to that module until they exit.

3. **User interacts (e.g., “Show me 2BHK under 50L”)**

   - All intents, DB/API calls, and chat logs route through the **active module** (e.g., `real_estate`).
   - AI responses and analytics belong to that module.

4. **User clicks CTA “🚪 Exit Demo”**

   - Session resets.
   - User receives demo menu again.

5. **WebSocket-based live dashboard for instant module analytics.**

---

## 🧱 Module System Architecture

| Layer                        | Functionality                                                               |
| ---------------------------- | --------------------------------------------------------------------------- |
| **Module Registry**          | Central list of available modules (stored in modules folder).               |
| **Session Manager**          | Tracks user’s active module and last activity timestamp.                    |
| **Intent Router**            | Forwards messages to module-specific function handlers.                     |
| **Human Escalation Handler** | Routes escalated chats to human dashboard**under same module**.             |
| **Admin Module Scoping**     | All chats, analytics, and tickets in dashboard filtered by selected module. |

---

## 🔁 Session Handling Logic

### Table: `user_sessions`

| Field           | Type      | Description                   |
| --------------- | --------- | ----------------------------- |
| id              | ObjectId  | Unique session ID             |
| user_phone      | String    | User’s WhatsApp number        |
| active_module   | String    | Module ID (e.g.`real_estate`) |
| last_message_at | Timestamp | For 24-hour expiration        |
| context_data    | JSON      | Short-term memory or context  |
| is_active       | Boolean   | Active session flag           |

### Session Flow:

```plaintext
Incoming Message
   ↓
Check if session exists for user
   ↓
If >24h since last_message_at → Reset → Show module menu
Else → Route to user.active_module handler
```

---

## ⚙️ Message Flow with Module Awareness

```plaintext
User Message → WhatsApp Webhook
        ↓
Session Manager (check module & validity)
        ↓
If no module → Send module menu
If active module → Route to Intent Detector
        ↓
LLM detects intent → Function Router
        ↓
Execute module-specific backend logic
        ↓
Send response back via WhatsApp
        ↓
Log message under that module
```

---

## 🧰 Admin Dashboard Enhancements

### 🔽 Module Dropdown Filter

Add a dropdown in the admin panel header:

> **Module:** [ Real Estate ⌄ ]

When selected, all data (chats, tickets, analytics) filter by that module ID.

---

### 📊 Admin Panel Structure

| Section                | Description                                                                   |
| ---------------------- | ----------------------------------------------------------------------------- |
| **Chats**              | Displays all user conversations for the selected module.                      |
| **Tickets**            | Escalated cases under the same module.                                        |
| **Analytics**          | Charts for handled queries, response times, escalation rates per module.      |
| **Modules Management** | Admin can add or configure demo modules (like Real Estate, E-Commerce, etc.). |
| **Agents**             | Assign human support agents to specific modules.                              |

---

## 🧠 Example Flow — Real Estate Demo

1. User: “Hi”

   - AI: “Welcome! Choose a demo module: Real Estate, E-Commerce, Healthcare.”

2. User: “Real Estate”

   - AI: “Great! You’re now in the Real Estate demo. Try saying:
     _‘Show me flats under ₹50L in Gurgaon’_ or _‘Schedule a visit’_.”

3. User: “Show me flats under ₹50L in Gurgaon”

   - Function: `fetch_property(city="Gurgaon", budget="50L")`
   - AI sends carousel of listings.

4. User: “Cancel visit”

   - Context from session → `cancel_visit(last_property_id)`

---

## 🧩 Module-Scoped Data Model Example

### `user_sessions`

```
id | user_phone | active_module_id | last_message_at | is_active
```

### `chats`

```
id | user_phone | module_id | message | sender_type | timestamp
```

### `tickets`

```
id | chat_id | module_id | status | assigned_to | created_at
```

#### `active_module_id` or `module_id` means folder name like `real_estate` or `ecommerce`

---

## 🧱 Implementation Steps

2. **Build Session Manager** for user–module linkage (24h expiry).
3. **Modify Function Router** to route by active module.
4. **Update WhatsApp Webhook** to send demo menu when no session.
5. **Implement Admin Panel module filter.**
6. **Scope analytics, chats, tickets to module.**
7. **Add `exit_module` CTA button in every flow.**

---

## ✅ Green Tick Logic (AI ↔ Human)

- When AI sends message → immediate green tick (when user read the message).
- When chat escalates to human → AI message shows pending tick.
- Once human agent opens the chat in dashboard → tick turns green (message seen by human).
- When human replies → continue green tick flow as WhatsApp does (when user read the message).

---

## Repo layout

```
universal-ai-support/
├─ README.md
├─ .env.example
├─ package.json              # workspace root (npm workspaces)
├─ apps/
│  ├─ backend/
│  │  ├─ package.json
│  │  ├─ src/
│  │  │  ├─ index.js
│  │  │  ├─ config/
│  │  │  │  ├─ env.js
│  │  │  │  └─ logger.js
│  │  │  ├─ db/
│  │  │  │  ├─ connect.js
│  │  │  │  └─ models/
│  │  │  │     ├─ Module.js
│  │  │  │     ├─ Session.js
│  │  │  │     ├─ Chat.js
│  │  │  │     ├─ Ticket.js
│  │  │  │     └─ Agent.js
│  │  │  ├─ modules/                # 🔑 pluggable industry modules
│  │  │  │  ├─ registry.js          # central registry loader
│  │  │  │  ├─ real_estate/
│  │  │  │  │  ├─ manifest.js
│  │  │  │  │  ├─ functions/
│  │  │  │  │  │  ├─ fetch_property.js
│  │  │  │  │  │  ├─ schedule_visit.js
│  │  │  │  │  │  └─ cancel_visit.js
│  │  │  │  ├─ ecommerce/
│  │  │  │  │  ├─ manifest.js
│  │  │  │  │  └─ functions/
│  │  │  │  │     ├─ get_order_status.js
│  │  │  │  │     ├─ cancel_order.js
│  │  │  │  │     └─ browse_catalog.js
│  │  │  ├─ services/
│  │  │  │  ├─ whatsapp.js          # Cloud API client + webhook helpers
│  │  │  │  ├─ translation.js       # Google Translate wrapper
│  │  │  │  ├─ nlp.js               # Groq intent detection + function-calling
│  │  │  │  ├─ functionRouter.js    # routes intent→module functions
│  │  │  │  ├─ escalation.js        # human handoff + agent state
│  │  │  │  └─ wsHub.js             # WebSocket pub/sub for dashboard ticks
│  │  │  ├─ middleware/
│  │  │  │  ├─ sessionGate.js       # 24h window + module binding
│  │  │  │  ├─ languageDetect.js
│  │  │  │  └─ auth.js
│  │  │  ├─ routes/
│  │  │  │  ├─ webhook.js           # WhatsApp webhook
│  │  │  │  ├─ admin.js             # modules, agents
│  │  │  │  ├─ chats.js             # list/filter chats per module
│  │  │  │  ├─ tickets.js
│  │  │  │  └─ analytics.js
│  │  │  └─ utils/
│  │  │     ├─ constants.js
│  │  │     └─ types.js
│  │  └─ test/
│  └─ dashboard/
│     ├─ package.json
│     ├─ tsconfig.json
│     ├─ src/
│     │  ├─ main.jsx
│     │  ├─ App.jsx
│     │  ├─ routes/
│     │  │  ├─ Chats.jsx
│     │  │  ├─ Tickets.jsx
│     │  │  ├─ Analytics.jsx
│     │  │  └─ Modules.jsx
│     │  ├─ components/
│     │  │  ├─ ModuleFilter.jsx     # 🔽 dropdown that scopes everything
│     │  │  ├─ ChatWindow.jsx       # shows green ticks + seen by human
│     │  │  ├─ ChatList.jsx
│     │  │  ├─ TicketList.jsx
│     │  │  └─ Charts/
│     │  │     ├─ KPI.jsx
│     │  │     └─ ByIntent.jsx
│     │  ├─ state/
│     │  │  ├─ store.js
│     │  │  ├─ moduleSlice.js
│     │  │  └─ authSlice.js
│     │  ├─ services/
│     │  │  ├─ api.js               # axios wrapper
│     │  │  └─ ws.js                # WebSocket client for green ticks
│     │  └─ utils/format.js
└─ …

```
