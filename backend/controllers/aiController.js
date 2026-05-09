const axios = require("axios");

async function analyzeBill(req, res) {
  try {
    const {
      billTitle,
      people,
      items,
      tax,
      tip,
      paidBy,
      owes,
      totalBill,
      transactions,
    } = req.body;

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "No OpenRouter API key found in backend configuration.",
      });
    }

    const prompt = `
You are a witty, insightful, and slightly sarcastic AI financial analyzer. 
I have a group of friends who just split a bill. Here are the details:
- Bill Title: ${billTitle || "Dinner"}
- People involved: ${people ? people.join(", ") : "Unknown"}
- Total Bill: ₹${totalBill}
- Tax: ₹${tax}
- Tip: ₹${tip}
- Paid By: ${paidBy || "Someone"}

Items ordered:
${items ? items.map((i) => `- ${i.name} (₹${i.amount})`).join("\n") : "None"}

Final Debts (Who owes what):
${owes ? Object.entries(owes).map(([person, amt]) => `- ${person} owes ₹${amt.toFixed(2)}`).join("\n") : "None"}

Settlements:
${transactions && transactions.length > 0 ? transactions.map((t) => `- ${t.from} must pay ${t.to} ₹${t.amount.toFixed(2)}`).join("\n") : "Everyone is settled."}

Please generate a short, fun, and witty 2-3 paragraph summary of this bill split. 
Point out who spent the most, who barely spent anything but still had to pay tax/tip, or if someone paid for the whole group. Make it entertaining! Use markdown formatting for emphasis.
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "anthropic/claude-3-haiku",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter
          "X-Title": "AI Bill Splitter",
        },
      }
    );

    const analysisText =
      response.data?.choices?.[0]?.message?.content ||
      "Could not generate analysis.";

    return res.json({
      success: true,
      analysis: analysisText,
    });
  } catch (error) {
    console.error("AI Analysis Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "AI Analysis failed to generate a response.",
    });
  }
}

module.exports = {
  analyzeBill,
};
