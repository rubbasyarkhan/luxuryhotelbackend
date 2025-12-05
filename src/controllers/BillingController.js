import { BookingModel } from "../Models/Booking.model.js";
import { PaymentModel } from "../Models/Payment.model.js";
import { RoomModel } from "../Models/Room.model.js";
import PDFDocument from "pdfkit";

const computeTotals = (booking) => {
  const nights = Math.max(1, Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000*60*60*24)));
  const roomPrice = booking.room?.pricePerNight || 0;
  const roomTotal = nights * roomPrice;
  const servicesTotal = (booking.additionalServices || []).reduce((sum, s) => sum + ((s.price || 0) * (s.quantity || 1)), 0);
  const total = roomTotal + servicesTotal;
  return { nights, roomPrice, roomTotal, servicesTotal, total };
};

export const getBilling = async (req, res) => {
  try {
    const { q, status, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (from || to) filter.createdAt = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };

    const bookings = await BookingModel.find(filter)
      .populate('guest', 'name email')
      .populate('room');

    const rows = await Promise.all(bookings.map(async (b) => {
      const payments = await PaymentModel.find({ booking: b._id });
      const paid = payments.filter(p => p.type === 'payment').reduce((s,p)=>s+p.amount,0);
      const refunded = payments.filter(p => p.type === 'refund').reduce((s,p)=>s+p.amount,0);
      const { total } = computeTotals(b);
      const remaining = Math.max(0, total - paid + refunded);
      return {
        id: b._id,
        bookingNumber: b.bookingNumber,
        guestName: b.guest?.name,
        roomNumber: b.room?.roomNumber,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        totalAmount: total,
        amountPaid: paid,
        remainingBalance: remaining,
        paymentStatus: remaining === 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Pending')
      };
    }));

    res.json({ rows });
  } catch (e) {
    console.error('getBilling error', e);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getInvoice = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await BookingModel.findById(bookingId).populate('guest', 'name email').populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const totals = computeTotals(booking);
    res.json({ booking, totals, services: booking.additionalServices || [] });
  } catch (e) {
    console.error('getInvoice error', e);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getInvoicePdf = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await BookingModel.findById(bookingId).populate('guest', 'name email').populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    const totals = computeTotals(booking);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${booking.bookingNumber || booking._id}.pdf`);
    doc.pipe(res);

    // Header
    doc
      .fontSize(20).fillColor('#111827').text('Invoice', { align: 'right' })
      .moveDown(0.5)
      .fontSize(10).fillColor('#4B5563').text(`Invoice #: ${booking.bookingNumber || booking._id}`, { align: 'right' })
      .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' })
      .moveDown(1);

    // Guest & Booking Info
    doc
      .fontSize(12).fillColor('#111827').text('Guest Information')
      .fontSize(10).fillColor('#374151')
      .text(`Name: ${booking.guest?.name || ''}`)
      .text(`Email: ${booking.guest?.email || ''}`)
      .moveDown(0.5)
      .fontSize(12).fillColor('#111827').text('Booking Details')
      .fontSize(10).fillColor('#374151')
      .text(`Room: ${booking.room?.roomNumber} · ${booking.room?.roomType}`)
      .text(`Check-in: ${new Date(booking.checkInDate).toLocaleDateString()}`)
      .text(`Check-out: ${new Date(booking.checkOutDate).toLocaleDateString()}`)
      .text(`Days: ${totals.nights}`)
      .moveDown(1);

    // Charges Table
    const startX = doc.x, startY = doc.y;
    const colWidths = [240, 80, 80, 100];
    const headers = ['Item', 'Days', 'Rate', 'Total'];
    doc.rect(startX, startY, colWidths.reduce((a,b)=>a+b,0), 20).fill('#F3F4F6').stroke('#E5E7EB');
    doc.fillColor('#374151').fontSize(10);
    let x = startX; headers.forEach((h,i)=>{ doc.text(h, x+6, startY+6, { width: colWidths[i]-12 }); x += colWidths[i]; });
    let y = startY + 20;
    doc.rect(startX, y, colWidths.reduce((a,b)=>a+b,0), 20).fill('#FFFFFF').stroke('#E5E7EB');
    x = startX;
    doc.fillColor('#111827');
    doc.text('Room (Rs/day)', x+6, y+6, { width: colWidths[0]-12 }); x += colWidths[0];
    doc.text(String(totals.nights), x+6, y+6, { width: colWidths[1]-12 }); x += colWidths[1];
    doc.text(`Rs:${(totals.roomPrice||0).toLocaleString()}`, x+6, y+6, { width: colWidths[2]-12 }); x += colWidths[2];
    doc.text(`Rs:${(totals.roomTotal||0).toLocaleString()}`, x+6, y+6, { width: colWidths[3]-12, align: 'right' });
    y += 20;

    (booking.additionalServices || []).forEach(s => {
      const lineTotal = (s.price||0) * (s.quantity||1);
      x = startX;
      doc.rect(startX, y, colWidths.reduce((a,b)=>a+b,0), 20).fill('#FFFFFF').stroke('#E5E7EB');
      doc.fillColor('#111827');
      doc.text(s.service || 'Service', x+6, y+6, { width: colWidths[0]-12 }); x += colWidths[0];
      doc.text(String(s.quantity||1), x+6, y+6, { width: colWidths[1]-12 }); x += colWidths[1];
      doc.text(`Rs:${(s.price||0).toLocaleString()}`, x+6, y+6, { width: colWidths[2]-12 }); x += colWidths[2];
      doc.text(`Rs:${lineTotal.toLocaleString()}`, x+6, y+6, { width: colWidths[3]-12, align: 'right' });
      y += 20;
    });

    // Total Row
    doc.rect(startX, y, colWidths.reduce((a,b)=>a+b,0), 24).fill('#F9FAFB').stroke('#E5E7EB');
    doc.fillColor('#111827').font('Helvetica-Bold');
    doc.text('Final Total', startX + colWidths[0] + colWidths[1], y+6, { width: colWidths[2]-12 });
    doc.text(`Rs:${(totals.total||0).toLocaleString()}`, startX + colWidths[0] + colWidths[1] + colWidths[2] + 6, y+6, { width: colWidths[3]-12, align: 'right' });
    doc.font('Helvetica').fillColor('#374151');

    doc.moveDown(2).fontSize(9).text('Thank you for your stay!', { align: 'center' });
    doc.end();
  } catch (e) {
    console.error('getInvoicePdf error', e);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount, method, note } = req.body;
    if (!amount || !method) return res.status(400).json({ message: 'Amount and method required' });
    const payment = await PaymentModel.create({ booking: bookingId, amount, method, type: 'payment', note, createdBy: req.user?.id });
    res.status(201).json({ payment });
  } catch (e) {
    console.error('addPayment error', e);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addRefund = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount, method, note } = req.body;
    if (!amount || !method) return res.status(400).json({ message: 'Amount and method required' });
    const payment = await PaymentModel.create({ booking: bookingId, amount, method, type: 'refund', note, createdBy: req.user?.id });
    res.status(201).json({ payment });
  } catch (e) {
    console.error('addRefund error', e);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentStatus } = req.body; // Paid, Pending, Partial
    await BookingModel.findByIdAndUpdate(bookingId, { paymentStatus });
    res.json({ ok: true });
  } catch (e) {
    console.error('updatePaymentStatus error', e);
    res.status(500).json({ message: 'Internal server error' });
  }
};
