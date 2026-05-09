const fs = require("fs");
const axios = require("axios");

async function uploadBill(req, res) {

  try {

    const imagePath = req.file.path;

    // Read image as base64 to pass to Vision AI
    const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });
    const mimeType = req.file.mimetype || 'image/jpeg';

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.log("No OpenRouter API key found. Falling back to empty parse.");
      return res.status(200).json({
        success: true,
        billTitle: "Scanned Bill",
        items: [],
        tax: 0,
        tip: 0,
        total: 0,
        rawText: "Vision AI required API key"
      });
    }

    const prompt = `
Please carefully analyze this image of a receipt/bill and extract the following information. The receipt can be from any country, in any language, and using any currency.

1. "items": A list of all the food/drink/product items ordered. For each, extract the "name" and the exact "amount" (the final total price for that item's row, not the unit rate). Ignore the currency symbol in the amount, just return the number. Do NOT include taxes, tips, subtotals, or totals in this list.
2. "taxes": A list of all individual tax entries found (e.g., CGST, SGST, IGST, VAT, State Tax, City Tax). For each, extract the "name" and the exact monetary "amount". Do NOT sum them up yourself. Return them as a list just like items. Extract only the money amounts, not the percentage.
3. "tip": Any tip, gratuity, or service charge amount. Return 0 if none found.

Return ONLY a valid, minified JSON object with exactly these keys: "items" (array of objects with "name" string and "amount" number), "taxes" (array of objects with "name" string and "amount" number), "tip" (number). Do not include any markdown formatting, backticks, or other text. Just the raw JSON string.
`;

    const aiResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
            ]
          }
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "AI Bill Splitter",
        },
      }
    );

    const aiContent = aiResponse.data?.choices?.[0]?.message?.content || "{}";
    
    // Clean up potential markdown formatting (in case AI disobeys)
    let jsonStr = aiContent;
    const match = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      jsonStr = match[1].trim();
    } else {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
    }
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI JSON:", jsonStr);
      throw new Error("AI returned invalid JSON");
    }

    // Format items for frontend
    const formattedItems = (parsedData.items || []).map(item => ({
      name: item.name,
      amount: item.amount,
      splitType: "equal",
      assignedTo: []
    }));

    // Calculate tax sum precisely in JavaScript
    const extractedTaxes = parsedData.taxes || [];
    let calculatedTax = extractedTaxes.reduce((sum, taxItem) => sum + Number(taxItem.amount || 0), 0);
    
    // Fallback in case AI still returns "tax" as a number
    if (calculatedTax === 0 && parsedData.tax) {
      calculatedTax = Number(parsedData.tax);
    }

    // Calculate total precisely based on extracted amounts
    const calculatedTotal = formattedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0) + calculatedTax + Number(parsedData.tip || 0);

    return res.status(200).json({
      success: true,
      billTitle: "Scanned Bill",
      items: formattedItems,
      tax: calculatedTax,
      tip: parsedData.tip || 0,
      total: calculatedTotal,
      rawText: "Extracted via AI Vision"
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "OCR failed"
    });
  }
}



async function splitBill(req, res) {

  try {

    const {
      people,
      items,
      tax,
      tip,
      paidBy
    } = req.body;

    const owes = {};

    // Initialize
    people.forEach(person => {
      owes[person] = 0;
    });

    // Split items equally
    items.forEach(item => {

      const assigned =
        item.assignedTo &&
        item.assignedTo.length > 0
          ? item.assignedTo
          : people;

      const share =
        Number(item.amount || 0) / assigned.length;

      assigned.forEach(person => {
        owes[person] += share;
      });
    });

    const taxAmt = Number(tax || 0);
    const tipAmt = Number(tip || 0);

    // Add tax + tip equally
    const extraPerPerson =
      (taxAmt + tipAmt) / people.length;

    people.forEach(person => {
      owes[person] += extraPerPerson;
    });

    // Final total
    const totalBill =
      items.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      ) +
      taxAmt +
      tipAmt;

    // Transactions
    const transactions = [];

    if (paidBy) {

      people.forEach(person => {

        if (person !== paidBy) {

          transactions.push({
            from: person,
            to: paidBy,
            amount: Number(
              owes[person].toFixed(2)
            )
          });
        }
      });
    }

    const { saveHistory } = require("./historyController");
    const session = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      billTitle: req.body.billTitle || "Bill",
      people,
      items,
      taxAmt,
      tipAmt,
      paidBy,
      owes,
      totalBill,
      transactions
    };
    saveHistory(session);

    return res.json({
      success: true,
      totalBill,
      owes,
      transactions,
      taxAmt,
      tipAmt
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Split calculation failed"
    });
  }
}



const nodemailer = require("nodemailer");

async function sendEmailReminders(req, res) {
  try {
    const { transactions, emails, billTitle } = req.body;

    if (!transactions || !emails) {
      return res.status(400).json({ success: false, message: "Missing required data." });
    }

    const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD || GMAIL_USER === 'your-email@gmail.com') {
      console.log("No valid Gmail credentials found in .env. Returning error.");
      return res.status(500).json({ success: false, message: "Email credentials not configured in backend." });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });

    const messagesSent = [];

    // Send email for each transaction
    for (const t of transactions) {
      const email = emails[t.from];
      if (email) {
        const mailOptions = {
          from: `"AI Bill Splitter" <${GMAIL_USER}>`,
          to: email,
          subject: `Payment Reminder: ${billTitle || 'Shared Bill'}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8faff; border-radius: 10px; color: #333;">
              <h2 style="color: #3b5bdb;">💸 Payment Reminder</h2>
              <p style="font-size: 16px;">Hi <b>${t.from}</b>,</p>
              <p style="font-size: 16px;">This is a friendly reminder that you owe <b>${t.to}</b> for the <b>${billTitle || 'Shared Bill'}</b>.</p>
              <div style="background: #fff; border: 1px solid #e4eaff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #666;">Amount Due</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #fa5252;">₹${parseFloat(t.amount).toFixed(2)}</p>
              </div>
              <p style="font-size: 14px; color: #888;">Please settle up soon!</p>
              <br/>
              <p style="font-size: 12px; color: #aaa;">Sent automatically via AI Bill Splitter.</p>
            </div>
          `
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${email}`);
        messagesSent.push({ to: t.from, email, status: "sent" });
      }
    }

    return res.json({ success: true, count: messagesSent.length, details: messagesSent });

  } catch (error) {
    console.log("Email Error:", error);
    return res.status(500).json({ success: false, message: "Failed to send email reminders" });
  }
}

module.exports = {
  uploadBill,
  splitBill,
  sendEmailReminders
};