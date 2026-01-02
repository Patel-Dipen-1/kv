import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCommitteeMembers } from "../admin/adminSlice";
import Card from "../../components/common/Card";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import Navbar from "../../components/layout/Navbar";
import { getFullName, formatMobileNumber } from "../../utils/helpers";
import { Phone, Mail } from "lucide-react";

const Committee = () => {
  const dispatch = useDispatch();
  const { committeeMembers, isLoading, error } = useSelector(
    (state) => state.admin
  );

  useEffect(() => {
    dispatch(getCommitteeMembers());
  }, [dispatch]);

  const getPositionColor = (position) => {
    const colors = {
      President: "bg-blue-100 text-blue-800",
      "Vice President": "bg-purple-100 text-purple-800",
      Secretary: "bg-green-100 text-green-800",
      Treasurer: "bg-yellow-100 text-yellow-800",
      "Committee Member": "bg-gray-100 text-gray-800",
      Advisor: "bg-indigo-100 text-indigo-800",
    };
    return colors[position] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Committee Members
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Meet our dedicated committee members
          </p>

          {error && (
            <ErrorAlert message={error} className="mb-6" />
          )}

          {committeeMembers.length === 0 ? (
            <Card>
              <p className="text-center text-gray-600 py-12">
                No committee members found.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {committeeMembers.map((member) => (
                <Card key={member._id} className="text-center">
                  {/* Profile Image */}
                  <div className="mb-4">
                    {member.profileImage ? (
                      <img
                        src={member.profileImage}
                        alt={getFullName(member)}
                        className="w-32 h-32 md:w-40 md:h-40 rounded-full mx-auto object-cover border-4 border-gray-200"
                      />
                    ) : (
                      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full mx-auto bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                        <span className="text-4xl md:text-5xl text-gray-400">
                          {member.firstName?.charAt(0)?.toUpperCase() || "C"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {getFullName(member)}
                  </h3>

                  {/* Position Badge */}
                  {member.committeePosition && (
                    <div className="mb-4">
                      <span
                        className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getPositionColor(
                          member.committeePosition
                        )}`}
                      >
                        {member.committeePosition}
                      </span>
                    </div>
                  )}

                  {/* Contact Information */}
                  <div className="space-y-2 mb-4">
                    {member.mobileNumber && (
                      <a
                        href={`tel:${member.mobileNumber}`}
                        className="flex items-center justify-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors min-h-[44px]"
                      >
                        <Phone size={18} />
                        <span>{formatMobileNumber(member.mobileNumber)}</span>
                      </a>
                    )}
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="flex items-center justify-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors min-h-[44px]"
                      >
                        <Mail size={18} />
                        <span className="text-sm break-all">{member.email}</span>
                      </a>
                    )}
                  </div>

                  {/* Bio */}
                  {member.committeeBio && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {member.committeeBio}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Committee;

