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

    // 🔹 Run AVA's Assistant using the Assistant ID
    const run = await openai.beta.threads.runs.createAndRun(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
    });

    // 🔹 Wait for the assistant to process and respond
    let response;
    let attempts = 10; // Try for 20 seconds max (waiting 2s each time)
    while (attempts > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 sec
      const messages = await openai.beta.threads.messages.list(thread.id);

      if (messages.data.length > 0) {
        response = messages.data[messages.data.length - 1].content[0].text.value;
        break;
      }
      attempts--;
    }

    res.json({ reply: response || "No response from AVA yet. Try again in a moment!" });
  } catch (error) {
    console.error("OpenAI API error:", error);
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
    console.error("Error fetching facilities:", error);
    res.status(500).json({ error: "Failed to fetch facility data." });
  }
});

// =========================
// 🔹 START THE SERVER
// =========================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
