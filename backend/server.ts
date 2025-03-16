import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import axios from "axios";

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;
const userThreads = new Map<string, string>(); // Store thread IDs per user

// =====================================
// 🔹 STEP 1: Start Chat (User Form Submission)
// =====================================
app.post("/start-chat", async (req: Request, res: Response) => {
  try {
    const { role, location, careType, paymentMethod, concerns, lifestylePreferences } = req.body;

    // ✅ Ensure user provides a location (fallback = "United States")
    const userLocation = location || "United States";

    // 🔹 Create a new conversation thread
    const thread = await openai.beta.threads.create();
    const threadId = thread.id;
    userThreads.set(req.ip, threadId); // Store thread ID for user

    // 🔹 Store user details in conversation
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: `
        I am a ${role} looking for ${careType} in ${userLocation}.
        Payment method: ${paymentMethod}.
        Main concern: ${concerns}.
        Preferences: ${lifestylePreferences?.join(", ")}.
      `,
    });

    res.json({ threadId });
  } catch (error) {
    console.error("🔥 Error starting chat:", error);
    res.status(500).json({ error: "Failed to start conversation." });
  }
});

// =====================================
// 🔹 STEP 2: Send Message to AVA (Chat Continuation)
// =====================================
app.post("/ask", async (req: Request, res: Response) => {
  try {
    const { message, threadId } = req.body;
    let storedThreadId = userThreads.get(req.ip) || threadId;

    if (!storedThreadId) {
      return res.status(400).json({ error: "No active session. Start a conversation first." });
    }

    // 🔹 Send user message to AVA
    await openai.beta.threads.messages.create(storedThreadId, {
      role: "user",
      content: message,
    });

    // 🔹 Run Assistant
    await openai.beta.threads.runs.create(storedThreadId, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
    });

    // 🔹 Wait for AVA's response
    let response;
    let attempts = 10;
    while (attempts > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const messages = await openai.beta.threads.messages.list(storedThreadId);

      const assistantMessages = messages.data.filter((msg) => msg.role === "assistant");
      if (assistantMessages.length > 0) {
        response = assistantMessages[assistantMessages.length - 1].content[0].text.value;
        break;
      }
      attempts--;
    }

    res.json({ reply: response || "AVA is thinking... Try again shortly!" });
  } catch (error) {
    console.error("🔥 Error in conversation:", error);
    res.status(500).json({ error: "Error processing conversation." });
  }
});

// =====================================
// 🔹 STEP 3: Fetch Senior Care Facilities (Google Maps API)
// =====================================
app.get("/facilities", async (req: Request, res: Response) => {
  try {
    const { location, pet_friendly, social_active, quiet_private, religious } = req.query;

    if (!location) {
      return res.status(400).json({ error: "Location is required." });
    }

    let query = `assisted living facility in ${location}`;
    if (pet_friendly === "true") query += " pet-friendly";
    if (social_active === "true") query += " social activities";
    if (quiet_private === "true") query += " quiet";
    if (religious) query += ` ${religious}`;

    // 🔹 Fetch real-time facilities from Google Maps API
    const response = await axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json`, {
      params: { query, key: GOOGLE_MAPS_API_KEY },
    });

    let facilities = response.data.results.map((place: any) => ({
      name: place.name,
      address: place.formatted_address,
      rating: place.rating || "No rating available",
      googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      subscribed: false, // Placeholder: This should be updated with database integration
    }));

    // 🔹 Sort Facilities: Subscribed → Distance → User Preferences
    facilities = facilities.sort((a, b) => {
      if (a.subscribed && !b.subscribed) return -1;
      if (!a.subscribed && b.subscribed) return 1;
      return 0;
    });

    res.json({ facilities: facilities.slice(0, 3) }); // ✅ Return Top 3 Facilities
  } catch (error) {
    console.error("🔥 Error fetching facilities:", error);
    res.status(500).json({ error: "Failed to fetch facility data." });
  }
});

// =====================================
// 🔹 STEP 4: Start Express Server
// =====================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
