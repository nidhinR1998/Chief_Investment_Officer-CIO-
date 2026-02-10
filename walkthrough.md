# CIO - Application Walkthrough

## Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (Running locally on default port 27017)

## Setup & Run

### 1. Backend
Open a terminal in `C:\Users\nidhi\CODING\CIO\backend`:

```powershell
# Create venv (Optional but recommended)
python -m venv venv
.\venv\Scripts\Activate

# Install Dependencies
pip install -r requirements.txt

# Run Server
# Run from 'backend' directory
uvicorn cio_app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend
Open a new terminal in `C:\Users\nidhi\CODING\CIO\frontend`:

```powershell
# Install Dependencies
npm install

# Run Development Server
npm run dev
```

## Usage
1. Open Browser at `http://localhost:5173`.
2. In the top search bar, type a stock ticker (e.g., `RELIANCE`, `TATASTEEL`, `INFY`).
3. Press **ENTER**.
4. A new window will appear for that stock.
5. The system will:
    - Fetch live/historical data.
    - Analyze technicals.
    - Check News sentiment.
    - Provide a **BUY/SELL/HOLD** signal.
6. Switch tabs (Analysis, News, Risk) to see details.
7. To close, click the **X** on the window.
8. To clear workspace, type `close` in the main search bar and hit Enter.

## Phase 3: Enhanced Frontend & Portfolio [New]
- **Portfolio Persistence**: Your trades and cash balance are now saved to `data/portfolio.json`. You start with a simulated ₹10,00,000.
- **Dashboard Priority**: Stocks you own in your portfolio will automatically appear pinned to the Dashboard when you launch the app.
- **Visual Analytics**: The Portfolio tab features a real-time Net Worth tracker and Allocation bars.

## Features
- **Dynamic AI Model Selection**: Automatically detects GPU and selects FinBERT (Small) or larger models.
- **Real-time Monitoring**: Background scheduler tracks stocks.
- **Multi-Window UI**: Drag and organize multiple stocks.
- **Responsive UI**: Optimized for mobile/tablet with sidebar drawer.
- **Git Repository**: Initialized and pushed to GitHub with MIT License.

## Repository Info
- **URL**: [Chief_Investment_Officer-CIO-](https://github.com/nidhinR1998/Chief_Investment_Officer-CIO-)
- **License**: MIT
- **Structure**: 
  - `/backend`: FastAPI Python App
  - `/frontend`: React/Vite App

## Database Architecture
- **Type**: MongoDB
- **Collections**:
  - `users`: Stores cash balance.
  - `portfolios`: Current stock holdings.
  - `transactions`: Audit log of all Buys/Sells.
  - `alerts`: Persistent price alerts.

## Troubleshooting

### Windows PowerShell "Scripts is disabled" Error
If you see an error like `npm.ps1 cannot be loaded because running scripts is disabled`, run this command in PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then try `npm run dev` again.

### Python "pandas-ta" Error
If `pip install` fails on `pandas-ta`, try:
```powershell
pip install ta
```
(The codebase has been updated to use the `ta` library instead of `pandas-ta`).
