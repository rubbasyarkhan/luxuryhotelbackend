import { BookingModel } from "../Models/Booking.model.js";
import { RoomModel } from "../Models/Room.model.js";
import { Usermodle } from "../Models/User.model.js";

export const createBooking = async (req, res) => {
  try {
    const bookingData = req.body;

    const { guest, room, checkInDate, checkOutDate, numberOfGuests } = bookingData;

    if (!guest || !room || !checkInDate || !checkOutDate || !numberOfGuests) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const roomExists = await RoomModel.findById(room);
    if (!roomExists) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (roomExists.status !== 'Available') {
      return res.status(400).json({ message: "Room is not available" });
    }

    if (roomExists.capacity < numberOfGuests) {
      return res.status(400).json({ message: `Maximum Room Capacity for the number of guests is ${roomExists.capacity}` });
    }

    const existingBooking = await BookingModel.findOne({
      room,
      status: { $in: ['Confirmed', 'Checked In'] },
      $or: [
        {
          checkInDate: { $lte: new Date(checkOutDate) },
          checkOutDate: { $gte: new Date(checkInDate) }
        }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({ message: "Room is already booked for the selected dates" });
    }

    const nights = Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24));
    const totalAmount = roomExists.pricePerNight * nights;

    const booking = await BookingModel.create({
      ...bookingData,
      totalAmount,
      createdBy: req.user?.id
    });

    // Update room status
    await RoomModel.findByIdAndUpdate(room, { status: 'Occupied' });

    // Populate the booking with guest and room details
    const populatedBooking = await BookingModel.findById(booking._id)
      .populate('guest', 'name email')
      .populate('room', 'roomNumber roomType pricePerNight');

    res.status(201).json({
      message: "Booking created successfully",
      booking: populatedBooking
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ message: "Internal server error" });
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
