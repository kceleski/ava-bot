import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import axios from "axios";

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// 🔹 OpenAI API SETUP
// =========================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// 🔹 Use OpenAI Assistant ID to Generate AVA’s Response
app.post("/ask", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    // 🔹 Create a thread for conversation history
    const thread = await openai.beta.threads.create();

    // 🔹 Run AVA's Assistant using the Assistant ID + Hardcoded Behavior Instructions
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
      instructions: `
        You are AVA, a warm, witty, and highly knowledgeable AI assistant for Health Pro Assist.
        Your mission is to **help users find senior care** in the most **supportive, simple, and friendly way possible**.

        🔹 **If the user is a healthcare professional**, be efficient and clinically focused.
        🔹 **If the user is a family member or looking for themselves**, offer **emotional reassurance** and break things down step by step.
        🔹 **If the user is overwhelmed**, acknowledge emotions first: *"I know this can feel like a lot, but you're not alone. Let's go one step at a time."*
        🔹 **If the user expresses urgency** (e.g., "ASAP," "urgent"), immediately suggest human escalation: *"I can connect you to a care advisor right now."*
        🔹 **Use multiple-choice responses** when possible to simplify decisions.
        🔹 **Keep responses short, warm, and engaging**. Use **light humor when appropriate**, but only if the user seems comfortable with it.
        🔹 **Never sound robotic or generic.** Always be **directly relevant to senior care, assisted living, memory care, financial options, and user concerns.**

        🔥 **IMPORTANT:** Never provide general AI assistant responses. ONLY talk about senior care, facilities, payment options, and next steps. You are an expert in senior care ONLY.
      `,
    });

    // 🔹 Wait for AVA to process and respond
    let response;
    let attempts = 10; // Try for 20 seconds max (waiting 2s each time)
    while (attempts > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 sec
      const messages = await openai.beta.threads.messages.list(thread.id);

      const assistantMessages = messages.data.filter((msg) => msg.role === "assistant");
      if (assistantMessages.length > 0) {
        response = assistantMessages[assistantMessages.length - 1].content[0].text.value;
        break;
      }
      attempts--;
    }

    res.json({ reply: response || "No response from AVA yet. Try again in a moment!" });
  } catch (error) {
    console.error("🔥 OpenAI API error:", error);
    res.status(500).json({ error: "Error fetching OpenAI response" });
  }
});

// =========================
// 🔹 GOOGLE MAPS API SETUP
// =========================

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

// 🔹 Fetch Real-Time Assisted Living Facilities Using Google Places API
app.get("/facilities", async (req: Request, res: Response) => {
  try {
    const { location } = req.query; // Get user-input location

    if (!location) {
      return res.status(400).json({ error: "Location is required." });
    }

    // 🔹 Fetch real-time facilities from Google Places API
    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json`, {
      params: {
        query: `assisted living facility in ${location}`,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    const facilities = response.data.results.map((place: any) => ({
      name: place.name,
      address: place.formatted_address,
      rating: place.rating || "No rating available",
      googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    }));

    res.json({ facilities });
  } catch (error) {
    console.error("🔥 Error fetching facilities:", error);
    res.status(500).json({ error: "Failed to fetch facility data." });
  }
});

// =========================
// 🔹 START THE SERVER
// =========================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
