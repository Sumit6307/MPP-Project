# Mutual Partner Platform (MPP) - Phase 1

Mutual Partner Platform is a job-swap enablement platform designed for government and semi-government employees in India. It helps individuals find compatible partners for mutual transfers between districts through an automated WhatsApp onboarding and matching system.

## 🚀 How to Run the Bot

I have created simple shortcuts for you to start the project:

### 1. START THE SERVER
Double-click **`1_START_SERVER.bat`**.
*   This starts the Node.js backend.
*   Wait until it says: `✅ SUCCESS: Server is running on port 4000`.

### 2. START THE TUNNEL (NGROK)
Double-click **`2_START_TUNNEL.bat`**.
*   This makes your local machine reachable by Meta.
*   **Copy the "Forwarding" URL** (e.g., `https://xxxx.ngrok-free.app`).

### 3. CONFIGURATION IN META PORTAL
1.  Go to the [Meta Developer Portal](https://developers.facebook.com/).
2.  Navigate to **WhatsApp > Configuration**.
3.  **Callback URL**: Paste your ngrok URL and add `/webhook` at the end.
    *   Example: `https://xxxx.ngrok-free.app/webhook`
4.  **Verify Token**: `mpp_secret_verify_token_2026`
5.  **Subscribe to Fields**: Click "Manage" next to Webhooks and ensure **`messages`** is subscribed.

---

## 🛠 Technology Stack
*   **Backend**: Node.js & Express.js
*   **Database**: SQLite (via `better-sqlite3`) for robust local state management.
*   **Messaging**: WhatsApp Cloud API (Meta Graph API v22.0).
*   **Tunneling**: Ngrok (for local development).

---

## 🤖 Phase 1 Logic

### 11-Frame Onboarding Flow
The bot guides users through a structured state-machine to collect:
1.  Greeting & Language Selection (English Only for Phase 1).
2.  Consent for data sharing.
3.  User Name & Professional Category.
4.  Current District & Block.
5.  **Dream Selection**: Users select their top 3 preferred districts for transfer.
6.  Confirmation & Final Submission.

### Mutual Matching Engine
Once a user completes onboarding, the engine automatically checks for **2-way mutual matches**:
*   **Condition**: User A wants District B, and User B (already in District B) wants User A's District.
*   **Notification**: Both users are instantly notified via WhatsApp with each other's contact details to initiate the swap.

---

## 📂 Project Structure
*   `src/server.js`: Main entry point and Webhook handlers.
*   `src/onboardingLogic.js`: The 11-frame conversation state machine.
*   `src/matchingEngine.js`: Logic for finding and notifying mutual matches.
*   `src/db.js`: Database schema and connection.
*   `src/whatsappService.js`: Helper functions for Interactive Buttons and Lists.

---

## ⚠️ Important Note
In development mode, ensure your test recipient phone number is added to the **"Allowed List"** in the Meta Dashboard under **WhatsApp > API Setup**.
