import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPollById, voteOnPoll, changeVote } from "./pollSlice";
import { usePermission } from "../../hooks/usePermission";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Clock, CheckCircle2, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const PollCard = ({ poll: initialPoll, eventId }) => {
  const dispatch = useDispatch();
  const { currentPoll } = useSelector((state) => state.polls);
  const { user } = useSelector((state) => state.auth);
  const canVoteInPolls = usePermission("canVoteInPolls");

  const poll = currentPoll?._id === initialPoll._id ? currentPoll : initialPoll;
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (poll._id && !poll.options?.[0]?.percentage) {
      dispatch(getPollById(poll._id));
    }
  }, [dispatch, poll._id]);

  useEffect(() => {
    if (poll.userVote) {
      setSelectedOptions(poll.userVote);
    }
  }, [poll.userVote]);

  const handleOptionChange = (optionId) => {
    if (poll.pollType === "single_choice" || poll.pollType === "yes_no") {
      setSelectedOptions([optionId]);
    } else {
      // Multiple choice
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter((id) => id !== optionId));
      } else {
        if (selectedOptions.length < poll.maxVotesPerUser) {
          setSelectedOptions([...selectedOptions, optionId]);
        }
      }
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0) {
      return;
    }

    setIsVoting(true);
    const result = await dispatch(
      voteOnPoll({ pollId: poll._id, optionIds: selectedOptions })
    );
    setIsVoting(false);

    if (voteOnPoll.fulfilled.match(result)) {
      dispatch(getPollById(poll._id));
    }
  };

  const handleChangeVote = async () => {
    if (selectedOptions.length === 0) {
      return;
    }

    setIsVoting(true);
    const result = await dispatch(
      changeVote({ pollId: poll._id, optionIds: selectedOptions })
    );
    setIsVoting(false);

    if (changeVote.fulfilled.match(result)) {
      dispatch(getPollById(poll._id));
    }
  };

  const isClosed = poll.status === "closed" || new Date(poll.endDate) < new Date();
  const canVote = !isClosed && canVoteInPolls && !poll.userHasVoted;
  const canChangeVote = !isClosed && poll.allowVoteChanges && poll.userHasVoted;

  return (
    <Card>
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900">{poll.question}</h3>
          {isClosed && (
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
              Closed
            </span>
          )}
        </div>
        {poll.description && (
          <p className="text-sm text-gray-600 mb-3">{poll.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>
              {isClosed
                ? "Closed"
                : `Closes ${formatDistanceToNow(new Date(poll.endDate), {
                    addSuffix: true,
                  })}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 size={14} />
            <span>{poll.totalVotes || 0} votes</span>
          </div>
        </div>
      </div>

      {!isClosed && canVote && (
        <div className="space-y-3 mb-4">
          {poll.options?.map((option) => (
            <label
              key={option._id}
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedOptions.includes(option._id.toString())
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type={poll.pollType === "multiple_choice" ? "checkbox" : "radio"}
                checked={selectedOptions.includes(option._id.toString())}
                onChange={() => handleOptionChange(option._id.toString())}
                className="mr-3"
              />
              <span className="flex-1">{option.optionText}</span>
            </label>
          ))}
          <Button
            variant="primary"
            onClick={handleVote}
            isLoading={isVoting}
            fullWidth
            disabled={selectedOptions.length === 0}
          >
            Submit Vote
          </Button>
        </div>
      )}

      {(poll.showLiveResults || isClosed || poll.userHasVoted) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">
              {isClosed ? "Final Results" : "Live Results"}
            </h4>
            {poll.winner && isClosed && (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                🏆 Winner
              </span>
            )}
          </div>
          {poll.options?.map((option) => {
            const percentage = option.percentage || 0;
            const isWinner = poll.winner?._id === option._id;
            return (
              <div key={option._id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {option.optionText}
                    {isWinner && isClosed && " 🏆"}
                  </span>
                  <span className="text-gray-600">
                    {option.voteCount} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isWinner && isClosed
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          {canChangeVote && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">
                You voted for:{" "}
                {poll.options
                  ?.filter((opt) =>
                    poll.userVote?.includes(opt._id.toString())
                  )
                  .map((opt) => opt.optionText)
                  .join(", ")}
              </p>
              <div className="space-y-3">
                {poll.options?.map((option) => (
                  <label
                    key={option._id}
                    className={`flex items-center p-2 border rounded cursor-pointer ${
                      selectedOptions.includes(option._id.toString())
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <input
                      type={poll.pollType === "multiple_choice" ? "checkbox" : "radio"}
                      checked={selectedOptions.includes(option._id.toString())}
                      onChange={() => handleOptionChange(option._id.toString())}
                      className="mr-2"
                    />
                    <span className="text-sm">{option.optionText}</span>
                  </label>
                ))}
                <Button
                  variant="outline"
                  onClick={handleChangeVote}
                  isLoading={isVoting}
                  fullWidth
                  disabled={selectedOptions.length === 0}
                >
                  Change Vote
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {!poll.showLiveResults && !poll.userHasVoted && !isClosed && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Results will be shown after you vote or when poll closes.
        </div>
      )}
    </Card>
  );
};

export default PollCard;

