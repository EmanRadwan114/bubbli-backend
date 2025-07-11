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
    a: "We offer 30-day returns for all items in original condition.",
  },
  {
    q: "shipping",
    a: "Standard shipping takes 3-5 business days. Express options are available.",
  },
  { q: "payment methods", a: "We accept credit cards, PayPal, and Apple Pay." },
  {
    q: "cancel order",
    a: "You can cancel an order within 24 hours before it ships.",
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

  // console.log("API KEY:", process.env.OPENAI_API_KEY); // for debugging only

  try {
    const lowerMessage = message.toLowerCase();

    // 1. Match against FAQs
    const matchedFaq = FAQs.find((faq) =>
      lowerMessage.includes(faq.q.toLowerCase())
    );
    if (matchedFaq) return res.json({ reply: matchedFaq.a });

    // 2. Try to match product by title or description
    const product = await Product.findOne({
      $or: [
        { title: new RegExp(message, "i") },
        { description: new RegExp(message, "i") },
      ],
    });

    let productInfo = "";
    if (product) {
      productInfo = `Here is a product you might like:\n\n🛍️ *${product.title}*\n💬 ${product.description}\n💰 Price: $${product.price}\n🚚 In stock: ${product.stock}`;
    }

    // 3. Use OpenAI to respond more naturally
    const completion = await openai.chat.completions.create({
      model: "mistralai/mistral-7b-instruct:free",
      messages: [
        {
          role: "system",
          content: `You are a helpful eCommerce chatbot. If the user asks about FAQs or store policies, answer directly. If they ask about products, use this product info: ${
            productInfo || "No product matched."
          }`,
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;
    // console.log("AI Reply:", reply);

    return res.json({ reply });
  } catch (err) {
    console.error("Chatbot Error:", err);
    res.status(500).json({ error: "AI request failed" });
  }
};
