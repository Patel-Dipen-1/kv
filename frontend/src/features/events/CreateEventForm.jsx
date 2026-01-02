import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { createEvent } from "./eventSlice";
import { usePermission } from "../../hooks/usePermission";
import { useEnums } from "../../hooks/useEnums";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import ErrorAlert from "../../components/common/ErrorAlert";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import { ArrowLeft, MapPin, Users, Settings, Image as ImageIcon, X, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import axios from "axios";

const CreateEventForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.events);
  const canCreateEvents = usePermission("canCreateEvents");

  const SAMAJ_TYPES = useEnums("SAMAJ_TYPES");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const eventType = watch("eventType");
  const visibility = watch("visibility");

  // Media state
  const [youtubeLinks, setYoutubeLinks] = useState([]);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    if (!canCreateEvents) {
      toast.error("You don't have permission to create events");
      navigate("/events");
    }
  }, [canCreateEvents, navigate]);

  // YouTube link handlers
  const addYouTubeLink = () => {
    setYoutubeLinks([...youtubeLinks, { url: "", title: "", description: "", isLive: false }]);
  };

  const removeYouTubeLink = (index) => {
    setYoutubeLinks(youtubeLinks.filter((_, i) => i !== index));
  };

  const updateYouTubeLink = (index, field, value) => {
    const updated = [...youtubeLinks];
    updated[index][field] = value;
    setYoutubeLinks(updated);
  };

  // Photo handlers
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      caption: "",
    }));
    setSelectedPhotos([...selectedPhotos, ...newPhotos]);
  };

  const removePhoto = (index) => {
    URL.revokeObjectURL(selectedPhotos[index].preview);
    setSelectedPhotos(selectedPhotos.filter((_, i) => i !== index));
  };

  // Video handlers
  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files);
    const newVideos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      caption: "",
    }));
    setSelectedVideos([...selectedVideos, ...newVideos]);
  };

  const removeVideo = (index) => {
    URL.revokeObjectURL(selectedVideos[index].preview);
    setSelectedVideos(selectedVideos.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    // Format date and time
    if (data.startDate && data.startTime) {
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
      data.startDate = startDateTime.toISOString();
    }

    if (data.endDate && data.endTime) {
      const endDateTime = new Date(`${data.endDate}T${data.endTime}`);
      data.endDate = endDateTime.toISOString();
    }

    // Handle visibility settings
    if (data.visibility === "samaj" && data.visibleToSamaj) {
      data.visibleToSamaj = Array.isArray(data.visibleToSamaj)
        ? data.visibleToSamaj
        : [data.visibleToSamaj];
    }

    // Remove empty fields
    Object.keys(data).forEach((key) => {
      if (data[key] === "" || data[key] === null || data[key] === undefined) {
        delete data[key];
      }
    });

    try {
      // Create event first
      const result = await dispatch(createEvent(data));
      if (!createEvent.fulfilled.match(result)) {
        toast.error(result.payload || "Failed to create event");
        return;
      }

      const eventId = result.payload._id;

      // Upload media if any
      if (selectedPhotos.length > 0 || selectedVideos.length > 0 || youtubeLinks.length > 0) {
        setUploadingMedia(true);
        const formData = new FormData();

        // Add photos
        selectedPhotos.forEach((photo) => {
          formData.append("photos", photo.file);
          if (photo.caption) {
            formData.append(`photoCaptions[${photo.file.name}]`, photo.caption);
          }
        });

        // Add videos
        selectedVideos.forEach((video) => {
          formData.append("videos", video.file);
          if (video.caption) {
            formData.append(`videoCaptions[${video.file.name}]`, video.caption);
          }
        });

        // Add YouTube links
        if (youtubeLinks.length > 0) {
          formData.append("youtubeLinks", JSON.stringify(youtubeLinks.filter(link => link.url)));
        }

        // Upload media
        const token = localStorage.getItem("token");
        await axios.post(
          `${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/events/${eventId}/media`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUploadingMedia(false);
      }

      toast.success("Event created successfully!");
      // Navigate to events list instead of event detail so user can see it in the list
      navigate("/events");
    } catch (error) {
      setUploadingMedia(false);
      toast.error(error.response?.data?.message || "Failed to create event");
    }
  };

  if (!canCreateEvents) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <div className="min-h-screen bg-gray-50 md:ml-64">
          <div className="p-4 md:p-8">
            <Card>
              <div className="text-center py-12">
                <p className="text-gray-600">
                  You don't have permission to create events.
                </p>
                <Link to="/events">
                  <Button variant="outline" className="mt-4">
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Events
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64">
        <div className="p-4 md:p-8">
          <Link to="/events">
            <Button variant="outline" className="mb-4 flex items-center gap-2">
              <ArrowLeft size={18} />
              Back to Events
            </Button>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Event</h1>

          {error && (
            <ErrorAlert
              message={error}
              onDismiss={() => dispatch({ type: "events/clearError" })}
              className="mb-4"
            />
          )}

          <Card>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Event Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("eventName", {
                    required: "Event name is required",
                    maxLength: {
                      value: 200,
                      message: "Event name cannot exceed 200 characters",
                    },
                  })}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  placeholder="Enter event name"
                />
                {errors.eventName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.eventName.message}
                  </p>
                )}
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("eventType", {
                    required: "Event type is required",
                  })}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                >
                  <option value="">Select event type</option>
                  <option value="funeral">Funeral / Condolence</option>
                  <option value="festival">Festival</option>
                  <option value="marriage">Marriage</option>
                  <option value="engagement">Engagement</option>
                  <option value="reception">Reception</option>
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="housewarming">Housewarming</option>
                  <option value="community_function">Community Function</option>
                  <option value="religious">Religious / Spiritual</option>
                  <option value="informational">Informational</option>
                  <option value="youtube_live">YouTube Live</option>
                  <option value="other">Other</option>
                </select>
                {errors.eventType && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.eventType.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register("description", {
                    maxLength: {
                      value: 2000,
                      message: "Description cannot exceed 2000 characters",
                    },
                  })}
                  rows={4}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter event description"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("startDate", {
                      required: "Start date is required",
                    })}
                    className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    {...register("startTime", {
                      required: "Start time is required",
                    })}
                    className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.startTime.message}
                    </p>
                  )}
                </div>
              </div>

              {/* End Date and Time (Optional) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    {...register("endDate")}
                    className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time (Optional)
                  </label>
                  <input
                    type="time"
                    {...register("endTime")}
                    className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin size={20} />
                  Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue Name
                    </label>
                    <input
                      type="text"
                      {...register("location.venueName")}
                      className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      placeholder="Venue name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      {...register("location.city")}
                      className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      placeholder="City"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    {...register("location.address")}
                    rows={2}
                    className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Full address"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      {...register("location.state")}
                      className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      {...register("location.country")}
                      defaultValue="India"
                      className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Visibility */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users size={20} />
                  Visibility
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Who can view this event?
                  </label>
                  <select
                    {...register("visibility", {
                      default: "public",
                    })}
                    className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  >
                    <option value="public">Public (All users)</option>
                    <option value="samaj">By Samaj/Community</option>
                    <option value="family">By Family</option>
                    <option value="role">By Role</option>
                  </select>
                </div>
                {visibility === "samaj" && SAMAJ_TYPES && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Samaj/Community
                    </label>
                    <select
                      {...register("visibleToSamaj")}
                      multiple
                      className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    >
                      {SAMAJ_TYPES.map((samaj) => (
                        <option key={samaj} value={samaj}>
                          {samaj}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Hold Ctrl/Cmd to select multiple
                    </p>
                  </div>
                )}
              </div>

              {/* Event Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Settings size={20} />
                  Event Settings
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register("allowRSVP")}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Allow RSVP</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register("allowComments", { default: true })}
                      defaultChecked
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Allow Comments</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register("isPinned")}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Pin Event (Show at top)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register("isImportant")}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Mark as Important</span>
                  </label>
                </div>
              </div>

              {/* Funeral Specific Fields */}
              {(eventType === "funeral" || eventType === "condolence") && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Funeral Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deceased Name
                      </label>
                      <input
                        type="text"
                        {...register("funeralDetails.deceasedName")}
                        className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        {...register("funeralDetails.deceasedAge")}
                        className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relation
                      </label>
                      <input
                        type="text"
                        {...register("funeralDetails.relation")}
                        className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        placeholder="e.g., Father, Mother, Brother"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Death
                      </label>
                      <input
                        type="date"
                        {...register("funeralDetails.dateOfDeath")}
                        className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prayer Meet Details
                    </label>
                    <textarea
                      {...register("funeralDetails.prayerMeetDetails")}
                      rows={3}
                      className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Prayer meet details..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Family Contact Person
                      </label>
                      <input
                        type="text"
                        {...register("funeralDetails.familyContactPerson")}
                        className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        {...register("funeralDetails.familyContactNumber")}
                        className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        placeholder="+91XXXXXXXXXX"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Media Section */}
              <div className="space-y-6 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ImageIcon size={20} />
                  Media (Optional)
                </h3>

                {/* YouTube Links */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    YouTube Links
                  </label>
                  {youtubeLinks.map((link, index) => (
                    <div key={index} className="mb-4 p-4 border rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">YouTube Link {index + 1}</span>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeYouTubeLink(index)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">URL *</label>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => updateYouTubeLink(index, "url", e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Title</label>
                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) => updateYouTubeLink(index, "title", e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Video title"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Description</label>
                        <textarea
                          value={link.description}
                          onChange={(e) => updateYouTubeLink(index, "description", e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Video description"
                        />
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={link.isLive}
                          onChange={(e) => updateYouTubeLink(index, "isLive", e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700">This is a live stream</span>
                      </label>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addYouTubeLink}
                    className="flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add YouTube Link
                  </Button>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {selectedPhotos.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedPhotos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={photo.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                          >
                            <X size={16} />
                          </button>
                          <input
                            type="text"
                            value={photo.caption}
                            onChange={(e) => {
                              const updated = [...selectedPhotos];
                              updated[index].caption = e.target.value;
                              setSelectedPhotos(updated);
                            }}
                            placeholder="Caption"
                            className="w-full mt-2 px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Videos
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleVideoSelect}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {selectedVideos.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {selectedVideos.map((video, index) => (
                        <div key={index} className="flex gap-4 p-3 border rounded-lg">
                          <video
                            src={video.preview}
                            className="w-32 h-24 object-cover rounded"
                            controls
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium">{video.file.name}</span>
                              <button
                                type="button"
                                onClick={() => removeVideo(index)}
                                className="text-red-500"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={video.caption}
                              onChange={(e) => {
                                const updated = [...selectedVideos];
                                updated[index].caption = e.target.value;
                                setSelectedVideos(updated);
                              }}
                              placeholder="Video caption"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4 border-t">
                <Link to="/events" className="flex-1">
                  <Button variant="secondary" fullWidth>
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading || uploadingMedia}
                  disabled={isLoading || uploadingMedia}
                >
                  {uploadingMedia ? "Uploading Media..." : "Create Event"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CreateEventForm;

