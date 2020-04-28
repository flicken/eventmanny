import { createSlice } from '@reduxjs/toolkit'

const filtersSlice = createSlice({
  name: 'visibilityFilters',
  initialState: {
    since: "a week ago",
  },
  reducers: {
    setVisibilityFilterSince(state, action) {
      state.since = action.payload
    },
  }
})

export const { setVisibilityFilterSince } = filtersSlice.actions

export default filtersSlice.reducer
