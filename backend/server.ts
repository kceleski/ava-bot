import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Sample Arizona facility data
const sampleFacilities = [
    {
        id: 1,
        name: 'Sunrise Senior Living',
        location: {
            address: '123 Main St, Phoenix, AZ',
            city: 'Phoenix',
            state: 'AZ',
            zip: '85001',
            lat: 33.4484,
            lng: -112.0740
        },
        type: 'Assisted Living',
        contact: {
            phone: '602-555-1234',
            email: 'info@sunriseseniorliving.com',
            website: 'https://sunriseseniorliving.com'
        }
    }
];

// API Route for facilities
app.get('/facilities', (req: Request, res: Response) => {
    res.json({ facilities: sampleFacilities });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
