"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Calendar, MapPin, Star, CreditCard, Eye, X } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import axios from "axios"
import { format } from "date-fns"
import toast from "react-hot-toast"

const Dashboard = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchBookings()
  }, [filter])

  const fetchBookings = async () => {
    try {
      const params = filter !== "all" ? `?status=${filter}` : ""
      const response = await axios.get(`/api/bookings/my-bookings${params}`)
      setBookings(response.data.bookings)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      toast.error("Failed to fetch bookings")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return
    }

    try {
      await axios.patch(`/api/bookings/${bookingId}/cancel`)
      toast.success("Booking cancelled successfully")
      fetchBookings()
    } catch (error) {
      const message = error.response?.data?.message || "Failed to cancel booking"
      toast.error(message)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 mt-2">Manage your bookings and explore new destinations</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link to="/hotels" className="card p-6 hover:shadow-lg transition-shadow text-center">
            <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Book New Stay</h3>
            <p className="text-gray-600 text-sm">Discover and book amazing hotels</p>
          </Link>

          <div className="card p-6 text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Total Bookings</h3>
            <p className="text-2xl font-bold text-green-600">{bookings.length}</p>
          </div>

          <div className="card p-6 text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Active Bookings</h3>
            <p className="text-2xl font-bold text-blue-600">
              {bookings.filter((b) => b.status === "confirmed").length}
            </p>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">My Bookings</h2>

              {/* Filter Tabs */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {[
                  { key: "all", label: "All" },
                  { key: "confirmed", label: "Active" },
                  { key: "completed", label: "Completed" },
                  { key: "cancelled", label: "Cancelled" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      filter === tab.key ? "bg-white text-primary-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-200 h-32 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600 mb-6">Start exploring and book your first stay!</p>
                <Link to="/hotels" className="btn-primary">
                  Browse Hotels
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {bookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-4">
                          <img
                            src={booking.hotel.images?.[0] || "/placeholder.svg?height=80&width=80"}
                            alt={booking.hotel.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{booking.hotel.name}</h3>
                            <div className="flex items-center text-gray-600 mb-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span className="text-sm">
                                {booking.hotel.address.city}, {booking.hotel.address.country}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span>Room: {booking.roomType}</span>
                              <span>Guests: {booking.guests}</span>
                              <span>Rooms: {booking.rooms}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 lg:mt-0 lg:ml-6 lg:text-right">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}
                            >
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(
                                booking.paymentStatus,
                              )}`}
                            >
                              {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                            </span>
                          </div>

                          <div className="text-sm text-gray-600">
                            <div>Check-in: {format(new Date(booking.checkIn), "MMM dd, yyyy")}</div>
                            <div>Check-out: {format(new Date(booking.checkOut), "MMM dd, yyyy")}</div>
                          </div>

                          <div className="text-lg font-semibold text-gray-900">
                            ₹{booking.totalAmount.toLocaleString()}
                          </div>

                          <div className="flex space-x-2 mt-2">
                            <Link
                              to={`/booking/${booking._id}`}
                              className="flex items-center px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>

                            {booking.status === "confirmed" &&
                              new Date(booking.checkIn) > new Date(Date.now() + 24 * 60 * 60 * 1000) && (
                                <button
                                  onClick={() => handleCancelBooking(booking._id)}
                                  className="flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
