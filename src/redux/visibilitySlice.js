import { createSlice } from '@reduxjs/toolkit'

export const VisibilityFilters = {
  SHOW_ALL: 'All',
  SHOW_NEW: 'New',
  SHOW_UPDATED: 'Updated',
  SHOW_CONFLICTED: 'Conflicted',
}

const filtersSlice = createSlice({
  name: 'visibilityFilters',
  initialState: {
    name: VisibilityFilters.SHOW_NEW,
    since: "a week ago",
  },
  reducers: {
    setVisibilityFilterName(state, action) {
      state.name = action.payload
    },
    setVisibilityFilterSince(state, action) {
      state.since = action.payload
    },
  }
})

export const { setVisibilityFilterName, setVisibilityFilterSince } = filtersSlice.actions

export default filtersSlice.reducer
