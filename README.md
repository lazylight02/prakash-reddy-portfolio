# B. Prakash Reddy — Personal Portfolio

A single-page, premium glassmorphism portfolio with a modular, separated architecture.

## Project Structure

```
prakash-reddy-portfolio/
├── frontend/                     # All client-side UI & presentation files
│   ├── assets/
│   │   └── prakash-profile.png   # Profile portrait photo
│   ├── index.html                # Main semantic HTML structure
│   ├── styles.css                # Obsidian Black + Deep Burgundy glassmorphism styles
│   ├── main.js                   # Interactive 3D WebGL scene & UI logic
│   └── profile.js                # Centralized identity & profile data
├── backend/                      # Server-side HTTP preview & routing
│   ├── package.json              # Backend package configuration
│   └── server.js                 # HTTP server with security headers & MIME routing
├── .vscode/                      # VS Code debug & launch configuration
│   └── launch.json
├── package.json                  # Root npm scripts
├── vercel.json                   # Vercel deployment configuration
└── README.md                     # Documentation
```

---

## How to Run Separately

### 1. Run the Backend Server
In your VS Code terminal:

```powershell
cd backend
node server.js
```
*(or run `npm start` from inside the `backend` folder)*

Then open **`http://localhost:8080`** in your browser.

---

### 2. Run / Preview the Frontend Separately
Because the frontend is 100% static (HTML, CSS, JS):

- **In VS Code**: Right-click `frontend/index.html` and select **"Open with Live Server"** (if you have the Live Server extension).
- **Direct in browser**: Double-click `frontend/index.html` in your file explorer, or in PowerShell:
  ```powershell
  Start-Process "frontend\index.html"
  ```
- **Using any static HTTP server**:
  ```powershell
  npx serve frontend
  ```

---

### 3. Run Everything from Project Root
From the root folder `prakash-reddy-portfolio`:

```powershell
node server.js
```
*(or `npm start`)*

It automatically launches the backend server, which serves your `frontend/` folder.

---

## Deploy to Vercel (Step-by-Step)

1. **Commit your changes**:
   ```powershell
   git add .
   git commit -m "feat: modular frontend and backend separation"
   ```

2. **Push to GitHub**:
   ```powershell
   git push -u origin master
   ```

3. **Deploy on Vercel**:
   - In [Vercel](https://vercel.com), import your GitHub repository.
   - The included `vercel.json` automatically routes all web traffic to `frontend/`.
   - Click **Deploy**!
