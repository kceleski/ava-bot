import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 OpenAI API Setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// 🔹 API Route for OpenAI Assistant
import { OpenAI } from "openai";

app.post("/ask", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: message }],
    });

    res.json({ reply: response.choices[0].message?.content || "No response from AI." });
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({ error: "Error fetching OpenAI response" });
  }
});

// 🔹 Sample Arizona Facility Data
const sampleFacilities = [
  {
    id: 1,
    name: "Sunrise Senior Living",
    location: {
      address: "123 Main St, Phoenix, AZ",
      city: "Phoenix",
      state: "AZ",
      zip: "85001",
      lat: 33.4484,
      lng: -112.074,
    },
    type: "Assisted Living",
    contact: {
      phone: "602-555-1234",
      email: "info@sunriseseniorliving.com",
      website: "https://sunriseseniorliving.com",
    },
  },
];

// 🔹 API Route for Facilities
app.get("/facilities", (req: Request, res: Response) => {
  res.json({ facilities: sampleFacilities });
});

// 🔹 Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
