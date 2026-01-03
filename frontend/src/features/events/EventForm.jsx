import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { createEvent, updateEvent, getEventById, clearError } from "./eventSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import ErrorAlert from "../../components/common/ErrorAlert";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const EventForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentEvent, isLoading, error } = useSelector((state) => state.events);
  const { user } = useSelector((state) => state.auth);

  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "normal",
    startDate: "",
    endDate: "",
    settings: {
      commentEnabled: true,
      pollEnabled: false,
      visibility: "public",
    },
    media: {
      images: [],
      files: [],
      youtubeUrl: "",
      externalLink: {
        url: "",
        title: "",
        description: "",
        image: "",
      },
    },
    poll: {
      question: "",
      options: [],
    },
  });

  const [newPollOption, setNewPollOption] = useState("");

  useEffect(() => {
    if (isEdit && currentEvent) {
      setFormData({
        title: currentEvent.title || "",
        description: currentEvent.description || "",
        eventType: currentEvent.eventType || "normal",
        startDate: currentEvent.startDate
          ? new Date(currentEvent.startDate).toISOString().slice(0, 16)
          : "",
        endDate: currentEvent.endDate
          ? new Date(currentEvent.endDate).toISOString().slice(0, 16)
          : "",
        settings: {
          commentEnabled: currentEvent.settings?.commentEnabled !== false,
          pollEnabled: currentEvent.settings?.pollEnabled === true,
          visibility: currentEvent.settings?.visibility || "public",
        },
        media: {
          images: currentEvent.media?.images || [],
          files: currentEvent.media?.files || [],
          youtubeUrl: currentEvent.media?.youtubeUrl || "",
          externalLink: currentEvent.media?.externalLink || {
            url: "",
            title: "",
            description: "",
            image: "",
          },
        },
        poll: {
          question: currentEvent.poll?.question || "",
          options: currentEvent.poll?.options?.map((opt) => opt.text) || [],
        },
      });
    }
  }, [isEdit, currentEvent]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("settings.")) {
      const settingKey = name.split(".")[1];
      setFormData({
        ...formData,
        settings: {
          ...formData.settings,
          [settingKey]: type === "checkbox" ? checked : value,
        },
      });
    } else if (name.startsWith("media.")) {
      const mediaKey = name.split(".")[1];
      setFormData({
        ...formData,
        media: {
          ...formData.media,
          [mediaKey]: value,
        },
      });
    } else if (name.startsWith("externalLink.")) {
      const linkKey = name.split(".")[1];
      setFormData({
        ...formData,
        media: {
          ...formData.media,
          externalLink: {
            ...formData.media.externalLink,
            [linkKey]: value,
          },
        },
      });
    } else if (name === "poll.question") {
      setFormData({
        ...formData,
        poll: {
          ...formData.poll,
          question: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleAddPollOption = () => {
    if (newPollOption.trim() && formData.poll.options.length < 10) {
      setFormData({
        ...formData,
        poll: {
          ...formData.poll,
          options: [...formData.poll.options, newPollOption.trim()],
        },
      });
      setNewPollOption("");
    }
  };

  const handleRemovePollOption = (index) => {
    setFormData({
      ...formData,
      poll: {
        ...formData.poll,
        options: formData.poll.options.filter((_, i) => i !== index),
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.startDate) {
      toast.error("Start date is required");
      return;
    }

    if (formData.settings.pollEnabled && formData.poll.options.length < 2) {
      toast.error("Poll must have at least 2 options");
      return;
    }

    const eventData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      eventType: formData.eventType,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      settings: formData.settings,
      media: formData.media,
    };

    if (formData.settings.pollEnabled) {
      eventData.poll = {
        question: formData.poll.question.trim(),
        options: formData.poll.options,
      };
    }

    try {
      if (isEdit) {
        await dispatch(updateEvent({ eventId: id, eventData }));
        toast.success("Event updated successfully");
      } else {
        await dispatch(createEvent(eventData));
        toast.success("Event created successfully");
      }
      navigate("/admin/events");
    } catch (error) {
      // Error handled by slice
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <Link to="/admin/events">
            <Button variant="outline" className="mb-4">
              <ArrowLeft size={18} className="mr-2" />
              Back to Events
            </Button>
          </Link>

          <Card>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {isEdit ? "Edit Event" : "Create Event"}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Event title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Event description"
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                >
                  <option value="normal">Normal</option>
                  <option value="invitation">Invitation</option>
                  <option value="announcement">Announcement</option>
                  <option value="link">Link</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>
              </div>

              {/* Media - YouTube URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube URL
                </label>
                <Input
                  name="media.youtubeUrl"
                  value={formData.media.youtubeUrl}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              {/* Media - External Link */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">External Link</h3>
                <div className="space-y-3">
                  <Input
                    name="externalLink.url"
                    value={formData.media.externalLink.url}
                    onChange={handleChange}
                    placeholder="URL"
                  />
                  <Input
                    name="externalLink.title"
                    value={formData.media.externalLink.title}
                    onChange={handleChange}
                    placeholder="Title"
                  />
                  <textarea
                    name="externalLink.description"
                    value={formData.media.externalLink.description}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Description"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="settings.commentEnabled"
                      checked={formData.settings.commentEnabled}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span>Enable Comments</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="settings.pollEnabled"
                      checked={formData.settings.pollEnabled}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span>Enable Poll</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visibility
                    </label>
                    <select
                      name="settings.visibility"
                      value={formData.settings.visibility}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Poll */}
              {formData.settings.pollEnabled && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Poll</h3>
                  <div className="space-y-3">
                    <Input
                      name="poll.question"
                      value={formData.poll.question}
                      onChange={handleChange}
                      placeholder="Poll question"
                    />
                    <div className="space-y-2">
                      {formData.poll.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input value={option} disabled className="flex-1" />
                          <button
                            type="button"
                            onClick={() => handleRemovePollOption(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ))}
                      {formData.poll.options.length < 10 && (
                        <div className="flex gap-2">
                          <Input
                            value={newPollOption}
                            onChange={(e) => setNewPollOption(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddPollOption();
                              }
                            }}
                            placeholder="Add option"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddPollOption}
                            className="flex items-center gap-2"
                          >
                            <Plus size={18} />
                            Add
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="flex-1"
                >
                  {isEdit ? "Update Event" : "Create Event"}
                </Button>
                <Link to="/admin/events" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
};

export default EventForm;

