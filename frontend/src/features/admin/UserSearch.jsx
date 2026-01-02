import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { searchUsers } from "./adminSlice";
import { useEnums } from "../../hooks/useEnums";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import { Search, X, Filter } from "lucide-react";

const UserSearch = ({ onSearchResults }) => {
  const dispatch = useDispatch();
  // Get dynamic enums
  const USER_ROLES = useEnums("USER_ROLES");
  const USER_STATUS = useEnums("USER_STATUS");
  const SAMAJ_TYPES = useEnums("SAMAJ_TYPES");
  const COUNTRIES = useEnums("COUNTRIES");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [samajFilter, setSamajFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm && !roleFilter && !statusFilter && !samajFilter && !countryFilter) {
      return;
    }

    setIsSearching(true);
    try {
      const result = await dispatch(
        searchUsers({
          q: searchTerm || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          samaj: samajFilter || undefined,
          country: countryFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          minAge: minAge || undefined,
          maxAge: maxAge || undefined,
          page: 1,
          limit: 20,
        })
      );
      if (searchUsers.fulfilled.match(result)) {
        if (onSearchResults) {
          onSearchResults(result.payload);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    setRoleFilter("");
    setStatusFilter("");
    setSamajFilter("");
    setCountryFilter("");
    setStartDate("");
    setEndDate("");
    setMinAge("");
    setMaxAge("");
    if (onSearchResults) {
      onSearchResults(null);
    }
  };

  return (
    <Card className="mb-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, mobile, family ID..."
                className="w-full pl-10 pr-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="w-full md:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              <option value="">All Roles</option>
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              <option value="">All Status</option>
              {USER_STATUS.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSearching}
              disabled={isSearching}
              className="min-w-[100px]"
            >
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="min-w-[100px] flex items-center gap-2"
            >
              <Filter size={18} />
              {showAdvanced ? "Hide" : "Advanced"}
            </Button>
            {(searchTerm || roleFilter || statusFilter || samajFilter || countryFilter || startDate || endDate || minAge || maxAge) && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleClear}
                className="min-w-[100px] flex items-center gap-2"
              >
                <X size={18} />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Samaj/Community
              </label>
              <select
                value={samajFilter}
                onChange={(e) => setSamajFilter(e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              >
                <option value="">All Samaj</option>
                {SAMAJ_TYPES.map((samaj) => (
                  <option key={samaj} value={samaj}>
                    {samaj}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              >
                <option value="">All Countries</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration To
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Age
              </label>
              <input
                type="number"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                min="0"
                max="120"
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Age
              </label>
              <input
                type="number"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                min="0"
                max="120"
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
          </div>
        )}
      </form>
    </Card>
  );
};

export default UserSearch;

