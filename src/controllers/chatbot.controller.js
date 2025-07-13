import Product from "../../db/models/product.model.js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Replace with your OpenRouter key
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.FRONT_URL, // your frontend domain
    "X-Title": "Bubbli AI Chatbot", // custom name shown in OpenRouter dashboard
  },
});

// Example FAQ list
const FAQs = [
  {
    q: "return policy",
    a: "We offer 14-day returns for all items in original condition.",
  },
  {
    q: "shipping",
    a: "Standard shipping takes 3-5 business days. Express options are available.",
  },
  { q: "payment methods", a: "We accept credit cards, PayPal, and Apple Pay." },
  {
    q: "cancel order",
    a: "You can cancel an order.",
  },
  {
    q: "track order",
    a: "To track your order, go to 'My Orders' and click 'Track' next to the item.",
  },
  {
    q: "support",
    a: "You can reach support via our Contact page or live chat from 9am–6pm.",
  },
  {
    q: "offer discounts",
    a: "Yes, we offer discounts through seasonal coupons and sales.",
  },
];

export const handleChatRequest = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "No message provided" });

  try {
    const lowerMessage = message.toLowerCase();

    // 1️⃣ Check FAQs first
    const matchedFaq = FAQs.find((faq) =>
      lowerMessage.includes(faq.q.toLowerCase())
    );
    if (matchedFaq) return res.json({ reply: matchedFaq.a });

    // 2️⃣ Build flexible search for product info
    const searchTerms = lowerMessage
      .split(" ")
      .map((term) => term.trim())
      .filter((term) => term.length > 0);

    const orQueries = searchTerms.map((term) => ({
      $or: [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { color: { $regex: term, $options: "i" } },
        { material: { $regex: term, $options: "i" } },
      ],
    }));

    // Find the first product matching ANY of these terms
    let productInfo = "";
    let product = null;

    if (orQueries.length > 0) {
      product = await Product.findOne({ $or: orQueries });
    }

    if (product) {
      productInfo = `*${product.title}* - ${product.description}. Price: $${product.price}, Stock: ${product.stock}.`;
    } else {
      productInfo = "No product matched.";
    }

    // 3️⃣ Call AI for final answer
    const completion = await openai.chat.completions.create({
      model: "mistralai/mistral-7b-instruct:free",
      messages: [
        {
          role: "system",
          content: `You are a helpful eCommerce chatbot. Always respond in under 150 characters. Be extremely concise. Avoid extra words. Summarize if needed. If the user asks about FAQs or store policies, answer directly. If they ask about products, use this product info: ${productInfo}`,
        },
        {
          role: "user",
          content: `${message} (Respond in under 150 characters.)`,
        },
      ],
    });

    const reply = completion.choices[0].message.content;
    return res.json({ reply });
  } catch (err) {
    console.error("Chatbot Error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
};
