import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import axios from "axios";

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 OpenAI API Setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// 🔹 Google Maps API Key
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

// 🔹 API Route for OpenAI Assistant
app.post("/ask", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const response = await openai.beta.threads.createAndRun({
      assistant_id: process.env.OPENAI_ASSISTANT_ID!,
      thread: {
        messages: [{ role: "user", content: message }],
      },
    });

    res.json({ reply: response });
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({ error: "Error fetching OpenAI response" });
  }
});

// 🔹 API Route to Fetch Assisted Living Facilities (Google Places API)
app.get("/facilities", async (req: Request, res: Response) => {
  try {
    const { location } = req.query; // Get user-input location
    if (!location) {
      return res.status(400).json({ error: "Location is required." });
    }

    // Fetch real-time facilities from Google Places API
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

// 🔹 Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
