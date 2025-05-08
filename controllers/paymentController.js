exports.verifyPayment = async (req, res) => {
    try {
      const { reference, bookingId } = req.body;
      
      // 1. Verify with Paystack API
      const paystackResponse = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        }
      );
  
      if (paystackResponse.data.status !== 'success') {
        return res.status(400).json({ 
          success: false,
          message: 'Payment not verified by Paystack'
        });
      }
  
      // 2. Update booking status
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          status: 'confirmed',
          'payment.paid': true,
          'payment.transactionId': reference,
          'payment.paymentDate': new Date()
        },
        { new: true }
      );
  
      if (!updatedBooking) {
        return res.status(404).json({ 
          success: false,
          message: 'Booking not found'
        });
      }
  
      // 3. Update room occupancy
      await Room.findByIdAndUpdate(
        updatedBooking.roomId,
        {
          $set: {
            [`currentOccupants.${updatedBooking.bedPosition?.toLowerCase() || 'top'}`]: updatedBooking.rollNumber
          }
        }
      );
  
      res.json({ success: true, booking: updatedBooking });
  
    } catch (error) {
      console.error('Payment Verification Error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error verifying payment'
      });
    }
  };