"use client"

import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { MapPin, Star, Users, Wifi, Car, Coffee, Dumbbell, ArrowLeft } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import toast from "react-hot-toast"

const HotelDetails = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [hotel, setHotel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState(1)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [availability, setAvailability] = useState({})
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  useEffect(() => {
    fetchHotelDetails()
  }, [id])

  const fetchHotelDetails = async () => {
    try {
      const response = await axios.get(`/api/hotels/${id}`)
      setHotel(response.data)
      if (response.data.roomTypes.length > 0) {
        setSelectedRoom(response.data.roomTypes[0])
      }
    } catch (error) {
      console.error("Error fetching hotel details:", error)
      toast.error("Failed to load hotel details")
    } finally {
      setLoading(false)
    }
  }

  const checkAvailability = async (roomType) => {
    if (!checkIn || !checkOut) {
      toast.error("Please select check-in and check-out dates")
      return
    }

    setCheckingAvailability(true)
    try {
      const response = await axios.post(`/api/hotels/${id}/check-availability`, {
        roomType: roomType.name,
        checkIn,
        checkOut,
        rooms: 1,
      })

      setAvailability({
        ...availability,
        [roomType.name]: response.data,
      })
    } catch (error) {
      console.error("Error checking availability:", error)
      toast.error("Failed to check availability")
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleBookNow = () => {
    if (!user) {
      toast.error("Please login to book a hotel")
      navigate("/login")
      return
    }

    if (!checkIn || !checkOut || !selectedRoom) {
      toast.error("Please select dates and room type")
      return
    }

    // Navigate to booking page with query parameters
    const bookingData = {
      hotelId: id,
      roomType: selectedRoom.name,
      checkIn,
      checkOut,
      guests,
    }

    navigate(`/booking/${id}`, { state: bookingData })
  }

  const amenityIcons = {
    "Free WiFi": Wifi,
    Parking: Car,
    Restaurant: Coffee,
    Gym: Dumbbell,
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
          <Link to="/hotels" className="btn-primary">
            Back to Hotels
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        {/* Hotel Images */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <div className="relative mb-4">
              <img
                src={hotel.images?.[selectedImage] || "/placeholder.svg?height=400&width=600"}
                alt={hotel.name}
                className="w-full h-96 object-cover rounded-lg"
              />
              <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="ml-1 font-medium">{hotel.rating}</span>
                <span className="ml-1 text-sm text-gray-600">({hotel.totalReviews} reviews)</span>
              </div>
            </div>

            {/* Image Thumbnails */}
            {hotel.images && hotel.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {hotel.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? "border-primary-600" : "border-gray-200"
                    }`}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${hotel.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hotel Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{hotel.name}</h1>

            <div className="flex items-center text-gray-600 mb-4">
              <MapPin className="h-5 w-5 mr-2" />
              <span>
                {hotel.address.street}, {hotel.address.city}, {hotel.address.state}, {hotel.address.country}
              </span>
            </div>

            <p className="text-gray-700 mb-6">{hotel.description}</p>

            {/* Amenities */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Amenities</h3>
              <div className="grid grid-cols-2 gap-2">
                {hotel.amenities.map((amenity, index) => {
                  const IconComponent = amenityIcons[amenity] || Coffee
                  return (
                    <div key={index} className="flex items-center text-gray-600">
                      <IconComponent className="h-4 w-4 mr-2" />
                      <span className="text-sm">{amenity}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Booking Form */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Book Your Stay</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split("T")[0]}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="input-field">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} Guest{num > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <button onClick={handleBookNow} className="w-full btn-primary">
                Book Now
              </button>
            </div>
          </div>
        </div>

        {/* Room Types */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Room Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotel.roomTypes.map((roomType, index) => (
              <div
                key={index}
                className={`card p-6 cursor-pointer transition-all ${
                  selectedRoom?.name === roomType.name ? "ring-2 ring-primary-600" : ""
                }`}
                onClick={() => setSelectedRoom(roomType)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{roomType.name}</h3>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary-600">₹{roomType.pricePerNight}</div>
                    <div className="text-sm text-gray-600">per night</div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">{roomType.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>Max {roomType.maxGuests} guests</span>
                  </div>
                  <span>{roomType.totalRooms} rooms available</span>
                </div>

                {roomType.amenities && roomType.amenities.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Room Amenities:</div>
                    <div className="flex flex-wrap gap-1">
                      {roomType.amenities.map((amenity, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => checkAvailability(roomType)}
                  disabled={checkingAvailability}
                  className="w-full btn-secondary text-sm"
                >
                  {checkingAvailability ? "Checking..." : "Check Availability"}
                </button>

                {availability[roomType.name] && (
                  <div className="mt-2 text-sm">
                    {availability[roomType.name].available ? (
                      <span className="text-green-600">
                        ✓ Available ({availability[roomType.name].availableRooms} rooms)
                      </span>
                    ) : (
                      <span className="text-red-600">✗ Not available for selected dates</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HotelDetails
