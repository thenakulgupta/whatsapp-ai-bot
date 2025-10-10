# 🤖 Universal AI Business Support Agent

## 📘 What It Is

A **Universal AI Business Support Agent** is an intelligent, fully agentic system that allows companies of any type — retail, healthcare, real estate, HR, or service agencies — to **automate their customer or internal support** on **WhatsApp** using natural language.

Instead of just answering FAQs, this AI can:

- Detect what the user wants,
- Call backend APIs or databases to perform real actions (like booking, status checking, or updating records),
- Respond naturally in multiple languages,
- Escalate to a human if needed,
- And provide real-time analytics to business owners through a dashboard.
- Also realtime green tick needs to be implemented like user send message to ai then green tick and if communicating to human then when human open user's chat then green tick.

**Example:**

- User: *“Can you book an appointment with Dr. Mehta on Monday?”*→ AI checks the doctor’s availability, books it, and confirms the appointment.
- User: *“Send me the latest property listings under ₹50L in Gurgaon.”*→ AI fetches results from the real estate database and sends them as WhatsApp messages with images.
- User: _“I want to cancel my order #4532.”_
  → AI cancels it via backend API and sends confirmation with refund details.

---

## 💡 Why It’s Important

Every company receives repetitive WhatsApp messages like:

- “What’s my order status?”
- “Do you have this product?”
- “How can I apply for leave?”
- “Book a demo for tomorrow.”

Businesses either ignore them or hire human agents.
This project replaces that need with a **customizable AI support agent** that integrates with any database or workflow.

The same platform can be reused across multiple industries — eCommerce, real estate, healthcare, HR, finance, or agencies — making it a **universal, scalable product** for B2B clients.

---

## 🧠 Core Functionalities

### 1. **Intent Detection & Function Calling**

- The LLM (Groq) analyzes incoming messages to detect what the user wants.
- It triggers a **specific function** with structured parameters.
- Example Functions:
  - `get_order_status(order_id)`
  - `book_appointment(name, date)`
  - `fetch_property(city, budget)`
  - `get_leave_balance(employee_id)`
- The function handler executes backend logic (calls database/API) and returns the result.

---

### 2. **Action Execution & Automation**

- Each function corresponds to a real action:
  - API call to business backend.
  - SQL query to a database.
  - CRUD operations for updating status or bookings.
- The system returns a natural, user-friendly message back to WhatsApp.

Example:

```json
{
  "name": "get_order_status",
  "arguments": { "order_id": "4532" }
}
```

Backend executes query:

```sql
SELECT status FROM orders WHERE order_id = '4532';
```

Response sent to user:

> "Your order #4532 has been shipped and will arrive by Monday."

---

### 3. **Small Talk & Context Memory**

- AI can handle casual conversation (“Hi”, “Thank you”, “Talk later”).
- Maintains short-term context:

  - If user says “cancel it”, AI knows which order was last discussed.

- Memory stored temporarily in database for multi-turn conversations.

---

### 4. **Human Escalation**

- If AI confidence < threshold (e.g., 0.6), it triggers:

  ```json
  {
    "name": "escalate_to_human",
    "arguments": {}
  }
  ```

- Chat transferred to human support agent (to chat support dashboard).
- Human can continue conversation from the admin panel (chat support dashboard).

---

### 5. **Multi-Language Support**

- Automatically detects user language and translates responses using:

  - Google Translate API

- Supports English, Hindi, Tamil, Telugu, Marathi, and whichever user speaks. Reply to user in same language they are talking to you.

---

### 6. **Admin Dashboard**

A full-featured dashboard for business owners to manage AI operations.

#### Dashboard Features:

- **Chat Viewer:** View all customer chats and AI responses.
- **Ticket Management:** See unresolved or escalated cases.
- **Analytics:**

  - Number of handled queries.
  - Success vs escalation rate.
  - Response time metrics.

- **Function Management:**

  - Add new callable functions (like “Check Policy Status”).
  - Set up input parameters via UI.

---

## 🧱 Example Industry Scenarios

### 🏠 Real Estate

- “Show me 2BHK flats under ₹50L in Noida.”

  - AI fetches listings from DB and sends WhatsApp messages with photos and links.

### 🏥 Healthcare

- “Book appointment with Dr. Ritu on Monday.”

  - AI checks availability and confirms booking.

### 🛍️ E-Commerce

- “Cancel order #1234” or “Where is my order?”

  - AI updates backend and sends order details.

### 💼 HR & Internal Support

- “How many leaves do I have left?”

  - AI reads from HR database and responds instantly.

### 💳 Finance / Accounting

- “Generate invoice for client XYZ.”

  - AI triggers invoice generation API and shares link.

---

## 🧩 Architecture Flow

```plaintext
User Message via WhatsApp
        ↓
WhatsApp Cloud API → Webhook
        ↓
Intent Detection (Groq or GPT)
        ↓
Function Router (decides which action to take)
        ↓
Execute Function (DB/API call)
        ↓
Format and send reply
        ↓
Log chat to Admin Dashboard
```

---

## 🏗️ Tech Stack

| Layer                    | Recommended Tools                               |
| ------------------------ | ----------------------------------------------- |
| **Frontend (Dashboard)** | React                                           |
| **Backend**              | Node.js (Express)                               |
| **LLM**                  | Groq (fast inference)                           |
| **Database**             | MongoDB                                         |
| **Integrations**         | WhatsApp Cloud API (Meta), Google Translate API |
| **Authentication**       | JWT                                             |

---

## 🧰 Function Calling Schema (Example)

```json
[
  {
    "name": "get_order_status",
    "description": "Fetch the order status from backend",
    "parameters": {
      "type": "object",
      "properties": {
        "order_id": { "type": "string", "description": "Order ID" }
      },
      "required": ["order_id"]
    }
  },
  {
    "name": "book_appointment",
    "description": "Book appointment with given doctor and time",
    "parameters": {
      "type": "object",
      "properties": {
        "doctor_name": { "type": "string" },
        "date": { "type": "string" }
      },
      "required": ["doctor_name", "date"]
    }
  },
  {
    "name": "fetch_property",
    "description": "Search property listings by city and budget",
    "parameters": {
      "type": "object",
      "properties": {
        "city": { "type": "string" },
        "budget": { "type": "string" }
      },
      "required": ["city", "budget"]
    }
  },
  {
    "name": "escalate_to_human",
    "description": "Escalate the chat to a human agent",
    "parameters": { "type": "object", "properties": {} }
  }
]
```

---

## 🧱 System Modules

| Module                          | Description                                             |
| ------------------------------- | ------------------------------------------------------- |
| **WhatsApp Webhook Handler**    | Receives incoming user messages.                        |
| **Intent Classification Layer** | Uses LLM (Groq) to identify intent and parameters.      |
| **Function Router**             | Maps intent → corresponding backend function.           |
| **Action Executor**             | Executes DB queries or API calls.                       |
| **Response Formatter**          | Converts results into user-friendly replies.            |
| **Chat Logger**                 | Stores conversations for analytics.                     |
| **Dashboard API**               | Backend for admin view, analytics, and chat monitoring. |
| **Frontend (Dashboard)**        | React UI for monitoring and managing conversations.     |

---

## 🖥️ Admin Dashboard Features

| Section          | Functionality                                                   |
| ---------------- | --------------------------------------------------------------- |
| **Chats**        | Live display of ongoing and past conversations.                 |
| **Tickets**      | List of escalated queries awaiting human resolution.            |
| **Analytics**    | Charts showing query distribution, AI accuracy, response times. |
| **Integrations** | Add/Edit callable business functions via UI.                    |

---

## 🧩 Example Data Models

**Users Table**

```sql
id | name | phone_number | role | created_at
```

**Chats Table**

```sql
id | user_id | message | sender_type | timestamp | session_id
```

**Tickets Table**

```sql
id | chat_id | status | assigned_to | created_at | resolved_at
```

**Functions Table**

```sql
id | name | description | endpoint | method | created_at
```

---

## 🧠 AI Flow Example (E-Commerce)

1. User: “Where is my order #4532?”
2. LLM → `get_order_status(order_id="4532")`
3. Backend → Fetches from mock DB
4. Reply: “Your order #4532 is in transit and will arrive by Monday.”

If user then says “Cancel it”:

- Context Memory detects previous order ID = 4532
- Calls `cancel_order(order_id="4532")`
- Confirms cancellation.

---

## 🌐 Demo Plan

You can create mock in demo dashboard:

1. **E-Commerce Mode**

   - Order database, cancel/refund flows. Create catalog system in whatsapp.

---
