import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import searchReducer from "../features/search/searchSlice";
import userReducer from "../features/users/userSlice";
import adminReducer from "../features/admin/adminSlice";
import familyReducer from "../features/family/familySlice";
import familyRequestReducer from "../features/family/familyRequestSlice";
import enumReducer from "../features/enums/enumSlice";
import roleReducer from "../features/roles/roleSlice";
import eventReducer from "../features/events/eventSlice";
import pollReducer from "../features/polls/pollSlice";
import commentReducer from "../features/comments/commentSlice";
import relationshipReducer from "../features/relationships/relationshipSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    search: searchReducer,
    users: userReducer,
    admin: adminReducer,
    family: familyReducer,
    familyRequest: familyRequestReducer,
    enums: enumReducer,
    roles: roleReducer,
    events: eventReducer,
    polls: pollReducer,
    comments: commentReducer,
    relationships: relationshipReducer,
  },
});

export default store;

