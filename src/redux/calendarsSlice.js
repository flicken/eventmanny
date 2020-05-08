import {
  createAsyncThunk,
  createAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import {ensureClient} from "./eventsSlice"

const calendarListAdapter = createEntityAdapter({
})

const noteCalendar = createAction('calendars/note')

export const toggleSelectedCalendar = createAction('calendars/toggleSelected')

export const fetchCalendarList = createAsyncThunk(
  'events/fetchCalendarListStatus',
  async (args, {dispatch, getState}) => {
    let {pageToken} = args || {}
    let request = {   pageToken }

    await ensureClient()
    let response = await window.gapi.client.calendar.calendarList.list(request)
    if (response.result.nextPageToken) {
      dispatch(fetchCalendarList({pageToken: response.result.nextPageToken}))
    }
    response.result.items.forEach(calendar => {
      if (calendar.summaryOverride) {
        calendar.originalSummary = calendar.summary
        calendar.summary = calendar.summaryOverride
      }
      dispatch(noteCalendar(calendar))
    })
    return response
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

export const calendarsSelectors = calendarListAdapter.getSelectors(
  state => state.calendars
)


const calendarsSlice = createSlice({
  name: 'calendars',
  initialState: calendarListAdapter.getInitialState({
  }),
  reducers: {
  },
  extraReducers: {
    [toggleSelectedCalendar]: (state, action) => {
      let id = action.payload
      console.log("Toggling calendar", id)
      console.log(state)
      let calendar = state.entities[id]
      console.log(calendar.summary, calendar.id, !calendar.selected)
      calendar.selected = !calendar.selected
    },
    [noteCalendar]: (state, action) => {
      calendarListAdapter.upsertOne(state, action)
    },
    [fetchCalendarList.pending]: (state, action) => {
      state.fetching = pageTokenOf(action.payload)
      state.loadStatus = "pending"
    },
    [fetchCalendarList.fulfilled]: (state, action) => {
      state.fetching = null
    },
    [fetchCalendarList.rejected]: (state, action) => {
      console.log("Failed to fetch calendar list")
      console.log(action)
      state.fetching = null
    },
  },
})

export default calendarsSlice
