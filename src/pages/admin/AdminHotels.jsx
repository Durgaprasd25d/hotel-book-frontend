"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, MapPin, Star, Eye, X, Upload, ImageIcon } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"

const AdminHotels = () => {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingHotel, setEditingHotel] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
    },
    images: [],
    amenities: [],
    roomTypes: [],
    tags: [],
  })

  const [newRoomType, setNewRoomType] = useState({
    name: "",
    description: "",
    pricePerNight: "",
    maxGuests: "",
    totalRooms: "",
    amenities: [],
    images: [],
  })

  const commonAmenities = [
    "Free WiFi",
    "Parking",
    "Restaurant",
    "Gym",
    "Swimming Pool",
    "Spa",
    "Room Service",
    "Laundry",
    "Air Conditioning",
    "TV",
    "Mini Bar",
    "Balcony",
    "Beach Access",
    "Business Center",
    "Conference Rooms",
    "Pet Friendly",
    "24/7 Front Desk",
    "Concierge",
  ]

  useEffect(() => {
    fetchHotels()
  }, [])

  const fetchHotels = async () => {
    try {
      const response = await axios.get("/api/admin/hotels")
      setHotels(response.data.hotels)
    } catch (error) {
      console.error("Error fetching hotels:", error)
      toast.error("Failed to fetch hotels")
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (files, isRoomImage = false, roomIndex = null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append("image", file)

        const response = await axios.post("/api/upload/image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })

        return response.data.imageUrl
      })

      const imageUrls = await Promise.all(uploadPromises)

      if (isRoomImage && roomIndex !== null) {
        // Add images to specific room type
        setNewRoomType((prev) => ({
          ...prev,
          images: [...prev.images, ...imageUrls],
        }))
      } else {
        // Add images to hotel
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...imageUrls],
        }))
      }

      toast.success(`${imageUrls.length} image(s) uploaded successfully`)
    } catch (error) {
      console.error("Error uploading images:", error)
      toast.error("Failed to upload images")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index, isRoomImage = false) => {
    if (isRoomImage) {
      setNewRoomType((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.description || !formData.address.city || !formData.address.country) {
      toast.error("Please fill in all required fields")
      return
    }

    if (formData.roomTypes.length === 0) {
      toast.error("Please add at least one room type")
      return
    }

    try {
      if (editingHotel) {
        await axios.put(`/api/admin/hotels/${editingHotel._id}`, formData)
        toast.success("Hotel updated successfully")
      } else {
        await axios.post("/api/admin/hotels", formData)
        toast.success("Hotel created successfully")
      }

      setShowModal(false)
      setEditingHotel(null)
      resetForm()
      fetchHotels()
    } catch (error) {
      console.error("Error saving hotel:", error)
      const message = error.response?.data?.message || "Failed to save hotel"
      toast.error(message)
    }
  }

  const handleEdit = (hotel) => {
    setEditingHotel(hotel)
    setFormData({
      name: hotel.name,
      description: hotel.description,
      address: hotel.address,
      images: hotel.images || [],
      amenities: hotel.amenities || [],
      roomTypes: hotel.roomTypes || [],
      tags: hotel.tags || [],
    })
    setShowModal(true)
  }

  const handleDelete = async (hotelId) => {
    if (!window.confirm("Are you sure you want to delete this hotel?")) {
      return
    }

    try {
      await axios.delete(`/api/admin/hotels/${hotelId}`)
      toast.success("Hotel deleted successfully")
      fetchHotels()
    } catch (error) {
      console.error("Error deleting hotel:", error)
      toast.error("Failed to delete hotel")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      address: {
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
      },
      images: [],
      amenities: [],
      roomTypes: [],
      tags: [],
    })
    setNewRoomType({
      name: "",
      description: "",
      pricePerNight: "",
      maxGuests: "",
      totalRooms: "",
      amenities: [],
      images: [],
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith("address.")) {
      const field = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  const handleRoomAmenityToggle = (amenity) => {
    setNewRoomType((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  const addRoomType = () => {
    if (!newRoomType.name || !newRoomType.pricePerNight || !newRoomType.maxGuests || !newRoomType.totalRooms) {
      toast.error("Please fill in all room type fields")
      return
    }

    setFormData((prev) => ({
      ...prev,
      roomTypes: [
        ...prev.roomTypes,
        {
          ...newRoomType,
          pricePerNight: Number(newRoomType.pricePerNight),
          maxGuests: Number(newRoomType.maxGuests),
          totalRooms: Number(newRoomType.totalRooms),
        },
      ],
    }))

    setNewRoomType({
      name: "",
      description: "",
      pricePerNight: "",
      maxGuests: "",
      totalRooms: "",
      amenities: [],
      images: [],
    })
  }

  const removeRoomType = (index) => {
    setFormData((prev) => ({
      ...prev,
      roomTypes: prev.roomTypes.filter((_, i) => i !== index),
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage Hotels</h1>
            <p className="text-gray-600 mt-2">Create, edit, and manage hotel listings with images</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="btn-primary flex items-center justify-center w-full sm:w-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Hotel
          </button>
        </div>

        {/* Hotels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {hotels.map((hotel) => (
            <div key={hotel._id} className="card overflow-hidden">
              <div className="relative">
                <img
                  src={hotel.images?.[0] || "/placeholder.svg?height=200&width=300&text=No+Image"}
                  alt={hotel.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-full flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm font-medium">{hotel.rating}</span>
                </div>
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  {hotel.images?.length || 0} images
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-2 line-clamp-1">{hotel.name}</h3>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="text-sm line-clamp-1">
                    {hotel.address.city}, {hotel.address.country}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{hotel.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>{hotel.roomTypes?.length || 0} room types</span>
                  <span className="text-primary-600 font-semibold">
                    From ₹{hotel.roomTypes?.[0]?.pricePerNight || 0}/night
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleEdit(hotel)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(hotel._id)}
                    className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hotels.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-400 mb-4">
              <Eye className="h-12 w-12 sm:h-16 sm:w-16 mx-auto" />
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No hotels found</h3>
            <p className="text-gray-600 mb-6">Start by adding your first hotel</p>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="btn-primary"
            >
              Add Hotel
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-lg sm:text-xl font-semibold">{editingHotel ? "Edit Hotel" : "Add New Hotel"}</h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingHotel(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hotel Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                      placeholder="Enter hotel name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                      placeholder="Enter city"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="input-field"
                    placeholder="Enter hotel description"
                  />
                </div>

                {/* Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter street address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter state"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                      placeholder="Enter country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter zip code"
                    />
                  </div>
                </div>

                {/* Hotel Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Images</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="hotel-images" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            {uploading ? "Uploading..." : "Upload hotel images"}
                          </span>
                          <input
                            id="hotel-images"
                            name="hotel-images"
                            type="file"
                            multiple
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => handleImageUpload(e.target.files)}
                            disabled={uploading}
                          />
                        </label>
                        <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</p>
                      </div>
                    </div>
                  </div>

                  {/* Display uploaded images */}
                  {formData.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`Hotel ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {commonAmenities.map((amenity) => (
                      <label key={amenity} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.amenities.includes(amenity)}
                          onChange={() => handleAmenityToggle(amenity)}
                          className="mr-2"
                        />
                        <span className="text-sm">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Room Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Types <span className="text-red-500">*</span>
                  </label>

                  {/* Add New Room Type */}
                  <div className="border border-gray-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-3">Add Room Type</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="Room name (e.g., Deluxe)"
                        value={newRoomType.name}
                        onChange={(e) => setNewRoomType((prev) => ({ ...prev, name: e.target.value }))}
                        className="input-field"
                      />
                      <input
                        type="number"
                        placeholder="Price per night"
                        value={newRoomType.pricePerNight}
                        onChange={(e) => setNewRoomType((prev) => ({ ...prev, pricePerNight: e.target.value }))}
                        className="input-field"
                      />
                      <input
                        type="number"
                        placeholder="Max guests"
                        value={newRoomType.maxGuests}
                        onChange={(e) => setNewRoomType((prev) => ({ ...prev, maxGuests: e.target.value }))}
                        className="input-field"
                      />
                      <input
                        type="number"
                        placeholder="Total rooms"
                        value={newRoomType.totalRooms}
                        onChange={(e) => setNewRoomType((prev) => ({ ...prev, totalRooms: e.target.value }))}
                        className="input-field"
                      />
                      <div className="md:col-span-2">
                        <textarea
                          placeholder="Room description"
                          value={newRoomType.description}
                          onChange={(e) => setNewRoomType((prev) => ({ ...prev, description: e.target.value }))}
                          className="input-field"
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Room Amenities */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Room Amenities</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                        {commonAmenities.map((amenity) => (
                          <label key={amenity} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newRoomType.amenities.includes(amenity)}
                              onChange={() => handleRoomAmenityToggle(amenity)}
                              className="mr-2"
                            />
                            <span className="text-xs">{amenity}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Room Images */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Room Images</label>
                      <div className="border border-dashed border-gray-300 rounded p-4">
                        <label htmlFor="room-images" className="cursor-pointer block text-center">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <span className="mt-2 block text-sm text-gray-600">
                            {uploading ? "Uploading..." : "Upload room images"}
                          </span>
                          <input
                            id="room-images"
                            type="file"
                            multiple
                            accept="image/*"
                            className="sr-only"
                            onChange={(e) => handleImageUpload(e.target.files, true)}
                            disabled={uploading}
                          />
                        </label>
                      </div>

                      {/* Display room images */}
                      {newRoomType.images.length > 0 && (
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {newRoomType.images.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={image || "/placeholder.svg"}
                                alt={`Room ${index + 1}`}
                                className="w-full h-16 object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index, true)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button type="button" onClick={addRoomType} className="mt-3 btn-secondary text-sm">
                      Add Room Type
                    </button>
                  </div>

                  {/* Existing Room Types */}
                  <div className="space-y-2">
                    {formData.roomTypes.map((roomType, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex-1">
                          <span className="font-medium">{roomType.name}</span>
                          <span className="text-gray-600 ml-2">₹{roomType.pricePerNight}/night</span>
                          <span className="text-gray-600 ml-2">Max {roomType.maxGuests} guests</span>
                          <span className="text-gray-600 ml-2">{roomType.totalRooms} rooms</span>
                          {roomType.images && roomType.images.length > 0 && (
                            <span className="text-gray-600 ml-2">({roomType.images.length} images)</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRoomType(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingHotel(null)
                      resetForm()
                    }}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary w-full sm:w-auto" disabled={uploading}>
                    {uploading ? "Uploading..." : editingHotel ? "Update Hotel" : "Create Hotel"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminHotels
