// database.js
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/turfz', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

module.exports = mongoose;

// models/Booking.js
const mongoose = require('./database');
const bookingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String },
  address: { type: String, required: true },
  time: { type: String, required: true },
  date: { type: String, required: true },
  email: { type: String, required: true },
}, { timestamps: true });
module.exports = mongoose.model('Booking', bookingSchema);

// routes/bookings.js
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

router.post('/create', async (req, res) => {
  try {
    const { userId, name, image, address, time, date, email } = req.body;
    const newBooking = new Booking({ userId, name, image, address, time, date, email });
    await newBooking.save();
    res.status(201).json({ message: 'Booking created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const booking = await Booking.findOne({ userId: req.params.userId });
    if (booking) {
      res.status(200).json(booking);
    } else {
      res.status(404).json({ error: 'No booking found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

router.delete('/:userId', async (req, res) => {
  try {
    await Booking.deleteOne({ userId: req.params.userId });
    res.status(200).json({ message: 'Booking canceled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

module.exports = router;

// server.js
const express = require('express');
const mongoose = require('./database'); 
const bookingRoutes = require('./routes/bookings'); 
const app = express();
app.use(express.json());
app.use('/api/bookings', bookingRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// React Component - Bookings.js
import React, { useState, useEffect } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { Link, useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/Authcontext";
import { Button, Text } from "@chakra-ui/react";

export const Bookings = () => {
  const { user } = useUserAuth();
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [add, setAdd] = useState("");
  const [time, setTime] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setName(data.name);
        setImage(data.image);
        setAdd(data.address);
        setTime(data.time);
        setEmail(data.email);
        setDate(data.date);
        setError("");
      } else {
        setError("No Bookings found");
      }
    } catch (error) {
      setError("Failed to fetch booking data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserData();
  }, [user]);

  const handleBooking = async () => {
    const bookingData = {
      userId: user.uid,
      name,
      image,
      address: add,
      time,
      date,
      email,
    };
    try {
      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      if (response.ok) {
        alert("Booking successfully created");
        navigate("/turf");
      } else {
        const data = await response.json();
        alert(`Booking failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while creating the booking.");
    }
  };

  const handleCancel = async () => {
    try {
      const response = await fetch(`/api/bookings/${user.uid}`, { method: "DELETE" });
      if (response.ok) {
        alert("Successfully canceled booking");
        navigate("/turf");
      } else {
        const data = await response.json();
        alert(`Cancellation failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while canceling the booking.");
    }
  };

  return (
    <div>
      <div id="paymentNav">
        <Link to={"/turf"}>
          <IoMdArrowRoundBack fontWeight={"bold"} fontSize="30px" />
        </Link>
        <Text color={"red"} fontSize="30px" fontWeight={"bold"}>
          Bookings
        </Text>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <Text fontSize={"50px"} textAlign="center" marginTop={"50px"} fontWeight="bold">
          {error}
        </Text>
      ) : (
        <div id="bookingsDetails">
          <p id="BookedTurfName">Current Booking</p>
          <p>{name}</p>
          <div id="bookingImageBox">
            <img src={image} alt="" />
          </div>
          <p>Address: {add}</p>
          <p>Time: {time}</p>
          <p>Date: {date}</p>
          <Button colorScheme={"red"} onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};
