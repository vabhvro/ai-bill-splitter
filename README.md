# 🤖 AI Bill Splitter

An advanced AI-powered application that seamlessly scans restaurant bills using OCR, intelligently parses them with Claude 3 AI, and automatically calculates individual shares, taxes, and settlements.

## 🚀 How to Start the Project

To present this project, you need to start both the **Backend** server and the **Frontend** server in two separate terminal windows.

### 1. Start the Backend Server
The backend handles the OCR image processing, AI parsing, and saving history.
1. Open a terminal (or Command Prompt / PowerShell).
2. Navigate to the backend folder:
   ```bash
   cd c:\Users\vaibh\Downloads\ai-bill-splitter-v2\bill-splitter-v2\backend
   ```
3. Run the start command:
   ```bash
   npm start
   ```
   *You should see a message saying: `🚀 Server running on http://localhost:5000`*

### 2. Start the Frontend Application
The frontend is the beautiful React user interface you interact with.
1. Open a **new, second** terminal window.
2. Navigate to the frontend folder:
   ```bash
   cd c:\Users\vaibh\Downloads\ai-bill-splitter-v2\bill-splitter-v2\frontend
   ```
3. Run the start command:
   ```bash
   npm start
   ```
   *This will automatically open your web browser to `http://localhost:3000`.*

---

## 🎯 Presentation Flow (Demo Guide)

If you are presenting this project to an audience, here is the best way to show off the features:

1. **Smart OCR Scan**: Start by clicking **"Smart Scan"** and upload the test `RESTAURANT FOOD BILL` image. Show how the AI perfectly bypasses messy text to extract items and exactly ₹24.50 in taxes.
2. **Add People**: Add 2-3 friends (e.g., Vaibhav, Rudra). 
3. **Customize Splits**: Show how you can assign specific items to specific people (e.g., Rudra ate the Biryani alone). Assign someone to pay the entire bill.
4. **Calculate**: Hit calculate and showcase the beautiful **"Individual Shares"** and **"Settle Up"** UI that tells exactly who owes whom.
5. **✨ AI Analysis**: Click the **AI Analysis** button at the bottom to show off the witty, sarcastic AI summary of the group's spending!
6. **History Tab**: Finally, click the History tab at the top to prove that the entire session was seamlessly saved to a database.
