import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import {ensureClient} from "./eventsSlice"

const calendarListAdapter = createEntityAdapter({
})

export const fetchCalendarList = createAsyncThunk(
  'events/fetchCalendarListStatus',
  async (args, {dispatch, getState}) => {
    let {pageToken} = args || {}
    let request = {   pageToken }

    await ensureClient()
    let results = await window.gapi.client.calendar.calendarList.list(request)
    if (results.result.nextPageToken) {
      dispatch(fetchCalendarList({pageToken: results.result.nextPageToken}))
    }
    return results
  },
  {
    condition: (args, { getState }) => {
      let {events} = getState()
      let pageInProgress = events.fechCalendarListInProgress
      return !(pageInProgress && pageInProgress === pageTokenOf(args))
    }
  }
)


const pageTokenOf = request => (request && request.pageToken) || "initial"

const calendarsSlice = createSlice({
  name: 'calendars',
  initialState: calendarListAdapter.getInitialState({
  }),
  reducers: {
  },
  extraReducers: {
    [fetchCalendarList.pending]: (state, action) => {
      state.fetching = pageTokenOf(action.payload)
      state.loadStatus = "pending"
    },
    [fetchCalendarList.fulfilled]: (state, action) => {
      state.fetching = null

      calendarListAdapter.upsertMany(state, action.payload.result.items)
    },
    [fetchCalendarList.rejected]: (state, action) => {
      console.log("Failed to fetch calendar list")
      console.log(action)
      state.fetching = null
      // fetchCalendarList()
    },
  },
})

export const calendarsSelectors = calendarListAdapter.getSelectors(
  state => state.calendars
)

export default calendarsSlice
