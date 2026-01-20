# 🤖 Simple Discord White Label Manager (SaaS Demo)

A simple full-stack dashboard that allows Discord Server Owners to customize a bot's identity (Nickname & Avatar) specific to their server. This project demonstrates **Discord OAuth2**, **Guild Ownership Verification**, and **REST API manipulation** in a secure SaaS-style architecture.


## 🚀 Features

* **Per-Server Branding:** Change the bot's Avatar and Nickname for one specific server without affecting others (uses `PATCH /members/@me`).
* **Security First:**
    * **OAuth2 Login:** Users must log in via Discord.
    * **Ownership Check:** The backend verifies the logged-in user is the actual `Owner` of the target Guild before applying changes.
    * **Rate Limiting:** Protects the API from spam (50 req/min).
* **Audit Logging:** Tracks who changed what and when (Timestamp, UserID, Action).
* **Interactive UI:** Real-time feedback, loading spinners, and visual success badges.

## 🛠️ Tech Stack

* **Backend:** Node.js, Express, Discord.js (v14+)
* **Frontend:** HTML5, CSS3, Vanilla JS (No framework overhead)
* **Auth:** Discord OAuth2 + Express Session
* **Tools:** Multer (File Uploads), Axios (API Requests), Express-Rate-Limit

---

## ⚙️ Setup & Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/yourusername/discord-whitelabel-manager.git](https://github.com/yourusername/discord-whitelabel-manager.git)
    cd discord-whitelabel-manager
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory and add the following keys:

    ```env
    # Discord App Credentials (from Developer Portal)
    BOT_TOKEN=your_bot_token_here
    CLIENT_ID=your_client_id_here
    CLIENT_SECRET=your_client_secret_here

    # OAuth2 Configuration
    REDIRECT_URI=http://localhost:3000/api/callback

    # Server Config
    PORT=3000
    SESSION_SECRET=random_string_for_session_security
    ```

4.  **Start the Server**
    ```bash
    node index.js
    ```

5.  **Access the Dashboard**
    Open your browser and go to `http://localhost:3000`.

---

## 🔒 Security & Limitations (Demo Note)

This project is designed as a **Portfolio Showcase / MVP**. For a production environment, the following upgrades would be required:

* **Database:** Currently, audit logs are stored in-memory (array). A real production app should use PostgreSQL or MongoDB for persistence.
* **CSRF Protection:** The current build relies on session cookies but does not implement strict CSRF tokens for form submissions.
* **Guild Selection:** The UI requires manual input of the `Guild ID`. A production version would fetch the user's guilds via API and present a dropdown menu.
* **Session Store:** Uses `MemoryStore` for sessions (not suitable for high-traffic production). Redis would be the production standard.

## 📝 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/login` | Redirects to Discord OAuth2 authorization. |
| `GET` | `/api/user` | Returns current session user & recent audit logs. |
| `POST` | `/api/update-profile` | Updates bot identity. **Requires:** Session + Guild Ownership. |

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
