import { BookingModel } from "../Models/Booking.model.js";
import { RoomModel } from "../Models/Room.model.js";
import { Usermodle } from "../Models/User.model.js";


export const guestBookRoom = async (req, res) => {
  try {
    /* ============================
       1️⃣ AUTH CHECK
    ============================ */
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Unauthorized. Please login to book a room."
      });
    }

    const guest = req.user.id;

    /* ============================
       2️⃣ REQUEST BODY
    ============================ */
    const {
      room,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      specialRequests = ""
    } = req.body;

    /* ============================
       3️⃣ BASIC VALIDATION
    ============================ */
    if (!room || !checkInDate || !checkOutDate || !numberOfGuests) {
      return res.status(400).json({
        message: "All required fields must be provided",
        received: req.body
      });
    }

    const guestsCount = Number(numberOfGuests);
    if (isNaN(guestsCount) || guestsCount <= 0) {
      return res.status(400).json({
        message: "Number of guests must be a valid number"
      });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn) || isNaN(checkOut)) {
      return res.status(400).json({
        message: "Invalid check-in or check-out date"
      });
    }

    if (checkIn >= checkOut) {
      return res.status(400).json({
        message: "Check-out date must be after check-in date"
      });
    }

    /* ============================
       4️⃣ ROOM CHECK
    ============================ */
    const roomExists = await RoomModel.findOne({
      _id: room,
      isActive: true
    });

    if (!roomExists) {
      return res.status(404).json({
        message: "Room not found or inactive"
      });
    }

    if (guestsCount > roomExists.capacity) {
      return res.status(400).json({
        message: `Room capacity is ${roomExists.capacity}`
      });
    }

    /* ============================
       5️⃣ OVERLAPPING BOOKINGS
    ============================ */
    const overlappingBooking = await BookingModel.findOne({
      room,
      status: { $in: ["Pending", "Confirmed", "Checked In"] },
      checkInDate: { $lt: checkOut },
      checkOutDate: { $gt: checkIn }
    });

    if (overlappingBooking) {
      return res.status(400).json({
        message: "Room is already booked for selected dates"
      });
    }

    /* ============================
       6️⃣ PRICE CALCULATION
    ============================ */
    const nights = Math.ceil(
      (checkOut - checkIn) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
      return res.status(400).json({
        message: "Invalid booking duration"
      });
    }

    const totalAmount = nights * roomExists.pricePerNight;

    /* ============================
       6.1️⃣ GENERATE BOOKING NUMBER
    ============================ */
    const generateBookingNumber = () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(100 + Math.random() * 900); // 3-digit random
      return `BK${timestamp}${random}`;
    };

    const bookingNumber = generateBookingNumber();

    /* ============================
       7️⃣ CREATE BOOKING
    ============================ */
    const booking = new BookingModel({
      guest,
      room,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests: guestsCount,
      totalAmount,
      specialRequests,
      status: "Pending",
      paymentStatus: "Pending",
      bookingNumber, // ✅ Added
      createdBy: guest
    });

    await booking.save();

    // Populate for response
    const populatedBooking = await booking.populate([
      { path: "guest", select: "name email" },
      { path: "room", select: "roomNumber roomType pricePerNight" }
    ]);

    return res.status(201).json({
      message: "Booking request submitted successfully",
      booking: populatedBooking
    });

  } catch (error) {
    console.error("❌ Guest booking error:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};









export const createBooking = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate, numberOfGuests } = req.body;

    /* =====================
       1️⃣ AUTH
    ===================== */
    const guest = req.user.id;

    if (!room || !checkInDate || !checkOutDate || !numberOfGuests) {
      return res.status(400).json({
        message: "All required fields must be provided"
      });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
      return res.status(400).json({
        message: "Check-out date must be after check-in date"
      });
    }

    /* =====================
       2️⃣ ROOM VALIDATION
    ===================== */
    const roomExists = await RoomModel.findById(room);
    if (!roomExists) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (roomExists.capacity < numberOfGuests) {
      return res.status(400).json({
        message: `Room capacity is ${roomExists.capacity}`
      });
    }

    /* =====================
       3️⃣ OVERLAP CHECK
    ===================== */
    const overlappingBooking = await BookingModel.findOne({
      room,
      status: { $in: ["Confirmed", "Checked In", "Pending"] },
      checkInDate: { $lt: checkOut },
      checkOutDate: { $gt: checkIn }
    });

    if (overlappingBooking) {
      return res.status(400).json({
        message: "Room already booked for selected dates"
      });
    }

    /* =====================
       4️⃣ PRICE CALCULATION
    ===================== */
    const nights = Math.ceil(
      (checkOut - checkIn) / (1000 * 60 * 60 * 24)
    );

    const totalAmount = nights * roomExists.pricePerNight;

    /* =====================
       5️⃣ BOOKING NUMBER
    ===================== */
    const generateBookingNumber = () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(100 + Math.random() * 900);
      return `BK${timestamp}${random}`;
    };

    const bookingNumber = generateBookingNumber();

    /* =====================
       6️⃣ CREATE BOOKING
    ===================== */
    const booking = await BookingModel.create({
      guest,
      room,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests,
      totalAmount,
      bookingNumber, // ✅ FIXED
      status: "Confirmed",
      paymentStatus: "Pending",
      createdBy: guest
    });

    const populatedBooking = await booking.populate([
      { path: "guest", select: "name email" },
      { path: "room", select: "roomNumber roomType pricePerNight" }
    ]);

    return res.status(201).json({
      message: "Booking created successfully",
      booking: populatedBooking
    });

  } catch (error) {
    console.error("❌ Create booking error:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};


// Get all bookings with filtering and pagination
export const getAllBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      checkInDate,
      checkOutDate,
      guest,
      room,
      search
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (guest) filter.guest = guest;
    if (room) filter.room = room;

    if (checkInDate) {
      filter.checkInDate = { $gte: new Date(checkInDate) };
    }
    if (checkOutDate) {
      filter.checkOutDate = { $lte: new Date(checkOutDate) };
    }

    const bookings = await BookingModel.find(filter)
      .populate('guest', 'name email')
      .populate('room', 'roomNumber roomType')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BookingModel.countDocuments(filter);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get booking by ID
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await BookingModel.findById(id)
      .populate('guest', 'name email phone')
      .populate('room', 'roomNumber roomType pricePerNight amenities')
      .populate('createdBy', 'name');

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ booking });
  } catch (error) {
    console.error("Get booking by ID error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update booking
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const booking = await BookingModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('guest', 'name email')
      .populate('room', 'roomNumber roomType');

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ message: "Booking updated successfully", booking });
  } catch (error) {
    console.error("Update booking error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkIn = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const booking = await BookingModel.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== 'Confirmed') {
      return res.status(400).json({ message: "Only confirmed bookings can be checked in" });
    }

    booking.status = 'Checked In';
    booking.notes = notes || booking.notes;
    await booking.save();

    await RoomModel.findByIdAndUpdate(booking.room, { status: 'Occupied' });

    const updatedBooking = await BookingModel.findById(id)
      .populate('guest', 'name email')
      .populate('room', 'roomNumber roomType');

    res.json({ message: "Check-in successful", booking: updatedBooking });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await BookingModel.findByIdAndDelete(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Delete booking error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const checkOut = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const booking = await BookingModel.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== 'Checked In') {
      return res.status(400).json({ message: "Only checked-in bookings can be checked out" });
    }

    booking.status = 'Checked Out';
    booking.notes = notes || booking.notes;
    await booking.save();

    // Update room status to cleaning
    await RoomModel.findByIdAndUpdate(booking.room, { status: 'Cleaning' });

    const updatedBooking = await BookingModel.findById(id)
      .populate('guest', 'name email')
      .populate('room', 'roomNumber roomType');

    res.json({ message: "Check-out successful", booking: updatedBooking });
  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await BookingModel.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (['Checked Out', 'Cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: "Cannot cancel this booking" });
    }

    booking.status = 'Cancelled';
    booking.notes = reason || booking.notes;
    await booking.save();

    // Update room status to available
    await RoomModel.findByIdAndUpdate(booking.room, { status: 'Available' });

    const updatedBooking = await BookingModel.findById(id)
      .populate('guest', 'name email')
      .populate('room', 'roomNumber roomType');

    res.json({ message: "Booking cancelled successfully", booking: updatedBooking });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get booking statistics
export const getBookingStatistics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const stats = await BookingModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ["$status", "Confirmed"] }, 1, 0] }
          },
          checkedInBookings: {
            $sum: { $cond: [{ $eq: ["$status", "Checked In"] }, 1, 0] }
          },
          checkedOutBookings: {
            $sum: { $cond: [{ $eq: ["$status", "Checked Out"] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] }
          },
          totalRevenue: { $sum: "$totalAmount" },
          averageBookingValue: { $avg: "$totalAmount" }
        }
      }
    ]);

    const dailyBookings = await BookingModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
      }
    ]);

    res.json({
      overall: stats[0] || {
        totalBookings: 0,
        confirmedBookings: 0,
        checkedInBookings: 0,
        checkedOutBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        averageBookingValue: 0
      },
      dailyBookings
    });
  } catch (error) {
    console.error("Get booking statistics error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
