"use client"

import { useState, useEffect } from "react"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import { MapPin, CreditCard, ArrowLeft } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import toast from "react-hot-toast"
import { format, differenceInDays } from "date-fns"

const Booking = () => {
  const { hotelId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [hotel, setHotel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Booking form data
  const [bookingData, setBookingData] = useState({
    roomType: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    rooms: 1,
    guestDetails: {
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
    },
    specialRequests: "",
  })

  const [pricing, setPricing] = useState({
    pricePerNight: 0,
    nights: 0,
    subtotal: 0,
    taxes: 0,
    total: 0,
  })

  useEffect(() => {
    // Get booking data from navigation state
    if (location.state) {
      setBookingData((prev) => ({
        ...prev,
        ...location.state,
      }))
    }
    fetchHotelDetails()
  }, [hotelId, location.state])

  useEffect(() => {
    calculatePricing()
  }, [bookingData, hotel])

  const fetchHotelDetails = async () => {
    try {
      const response = await axios.get(`/api/hotels/${hotelId}`)
      setHotel(response.data)
    } catch (error) {
      console.error("Error fetching hotel details:", error)
      toast.error("Failed to load hotel details")
      navigate("/hotels")
    } finally {
      setLoading(false)
    }
  }

  const calculatePricing = () => {
    if (!hotel || !bookingData.roomType || !bookingData.checkIn || !bookingData.checkOut) {
      return
    }

    const roomType = hotel.roomTypes.find((rt) => rt.name === bookingData.roomType)
    if (!roomType) return

    const checkInDate = new Date(bookingData.checkIn)
    const checkOutDate = new Date(bookingData.checkOut)
    const nights = differenceInDays(checkOutDate, checkInDate)

    const subtotal = roomType.pricePerNight * bookingData.rooms * nights
    const taxes = subtotal * 0.18 // 18% GST
    const total = subtotal + taxes

    setPricing({
      pricePerNight: roomType.pricePerNight,
      nights,
      subtotal,
      taxes,
      total,
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith("guestDetails.")) {
      const field = name.split(".")[1]
      setBookingData((prev) => ({
        ...prev,
        guestDetails: {
          ...prev.guestDetails,
          [field]: value,
        },
      }))
    } else {
      setBookingData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setProcessing(true)

    try {
      // Create booking
      const bookingResponse = await axios.post("/api/bookings", {
        hotelId,
        ...bookingData,
      })

      const booking = bookingResponse.data.booking

      // Create Razorpay order
      const orderResponse = await axios.post("/api/payments/create-order", {
        bookingId: booking._id,
      })

      const { orderId, amount, key } = orderResponse.data

      // Initialize Razorpay
      const options = {
        key: key,
        amount: amount,
        currency: "INR",
        name: "HotelBook",
        description: `Booking for ${hotel.name}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            // Verify payment
            await axios.post("/api/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id,
            })

            toast.success("Booking confirmed successfully!")
            navigate("/dashboard")
          } catch (error) {
            toast.error("Payment verification failed")
          }
        },
        prefill: {
          name: bookingData.guestDetails.name,
          email: bookingData.guestDetails.email,
          contact: bookingData.guestDetails.phone,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => {
            setProcessing(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      console.error("Booking error:", error)
      const message = error.response?.data?.message || "Booking failed"
      toast.error(message)
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Hotel not found</h2>
          <button onClick={() => navigate("/hotels")} className="btn-primary">
            Back to Hotels
          </button>
        </div>
      </div>
    )
  }

  const selectedRoomType = hotel.roomTypes.find((rt) => rt.name === bookingData.roomType)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Booking</h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Hotel Info */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-start space-x-4">
                    <img
                      src={hotel.images?.[0] || "/placeholder.svg?height=80&width=80"}
                      alt={hotel.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{hotel.name}</h2>
                      <div className="flex items-center text-gray-600 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {hotel.address.city}, {hotel.address.country}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
                    <select
                      name="roomType"
                      value={bookingData.roomType}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    >
                      <option value="">Select Room Type</option>
                      {hotel.roomTypes.map((roomType) => (
                        <option key={roomType.name} value={roomType.name}>
                          {roomType.name} - ₹{roomType.pricePerNight}/night
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Rooms</label>
                    <select
                      name="rooms"
                      value={bookingData.rooms}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          {num} Room{num > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Date</label>
                    <input
                      type="date"
                      name="checkIn"
                      value={bookingData.checkIn}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Date</label>
                    <input
                      type="date"
                      name="checkOut"
                      value={bookingData.checkOut}
                      onChange={handleInputChange}
                      min={bookingData.checkIn || new Date().toISOString().split("T")[0]}
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Guests</label>
                    <select
                      name="guests"
                      value={bookingData.guests}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} Guest{num > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Guest Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="guestDetails.name"
                        value={bookingData.guestDetails.name}
                        onChange={handleInputChange}
                        required
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="guestDetails.email"
                        value={bookingData.guestDetails.email}
                        onChange={handleInputChange}
                        required
                        className="input-field"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        name="guestDetails.phone"
                        value={bookingData.guestDetails.phone}
                        onChange={handleInputChange}
                        required
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests (Optional)</label>
                  <textarea
                    name="specialRequests"
                    value={bookingData.specialRequests}
                    onChange={handleInputChange}
                    rows={3}
                    className="input-field"
                    placeholder="Any special requests or preferences..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  {processing ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CreditCard className="h-5 w-5 mr-2" />
                  )}
                  {processing ? "Processing..." : "Proceed to Payment"}
                </button>
              </form>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>

              {selectedRoomType && (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room Type:</span>
                    <span className="font-medium">{selectedRoomType.name}</span>
                  </div>

                  {bookingData.checkIn && bookingData.checkOut && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check-in:</span>
                        <span className="font-medium">{format(new Date(bookingData.checkIn), "MMM dd, yyyy")}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Check-out:</span>
                        <span className="font-medium">{format(new Date(bookingData.checkOut), "MMM dd, yyyy")}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Nights:</span>
                        <span className="font-medium">{pricing.nights}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Rooms:</span>
                    <span className="font-medium">{bookingData.rooms}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Guests:</span>
                    <span className="font-medium">{bookingData.guests}</span>
                  </div>

                  <hr className="border-gray-200" />

                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      ₹{pricing.pricePerNight} × {pricing.nights} nights × {bookingData.rooms} room
                      {bookingData.rooms > 1 ? "s" : ""}
                    </span>
                    <span className="font-medium">₹{pricing.subtotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxes & Fees (18%):</span>
                    <span className="font-medium">₹{pricing.taxes.toLocaleString()}</span>
                  </div>

                  <hr className="border-gray-200" />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary-600">₹{pricing.total.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </div>
  )
}

export default Booking
