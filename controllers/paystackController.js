// controllers/paystackController.js
const axios = require('axios')
const Booking = require('../models/Booking')

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

const verifyPaystackPayment = async (reference) => {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    )
    return response.data
  } catch (error) {
    console.error('Paystack verification error:', error)
    throw error
  }
}

const handlePaystackWebhook = async (req, res) => {
  // Validate the event is from Paystack
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex')
  
  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).send('Unauthorized')
  }

  const event = req.body
  console.log('Paystack webhook event:', event.event)

  // Handle only successful charge events
  if (event.event === 'charge.success') {
    try {
      const transactionData = event.data
      const reference = transactionData.reference
      
      // Verify the transaction with Paystack (double verification)
      const verification = await verifyPaystackPayment(reference)
      
      if (verification.status !== true || verification.data.status !== 'success') {
        return res.status(400).json({ success: false, message: 'Payment not verified' })
      }

      const metadata = verification.data.metadata
      const bookingId = metadata.booking_id
      const amount = verification.data.amount / 100 // Convert from kobo to currency

      if (!bookingId) {
        return res.status(400).json({ success: false, message: 'Booking ID not found in metadata' })
      }

      // Update the booking status
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          status: 'confirmed',
          payment: {
            amount: amount,
            method: 'Paystack',
            transactionId: reference,
            paid: true,
            paymentDate: new Date()
          }
        },
        { new: true }
      ).populate('roomId')

      if (!updatedBooking) {
        return res.status(404).json({ success: false, message: 'Booking not found' })
      }

      // Here you can add additional logic like:
      // - Send confirmation email
      // - Update room availability
      // - Notify admin

      console.log(`Booking ${bookingId} confirmed successfully`)
      return res.status(200).json({ success: true })

    } catch (error) {
      console.error('Error processing Paystack webhook:', error)
      return res.status(500).json({ success: false, message: 'Internal server error' })
    }
  }

  // Respond to other events (not charge.success)
  res.status(200).json({ received: true })
}

module.exports = {
  handlePaystackWebhook,
  verifyPaystackPayment
}   