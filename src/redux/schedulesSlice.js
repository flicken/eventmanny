import {
  createAsyncThunk,
  createAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import {ensureClient,
  fetchEventsPage,
  addEventToSchedule,
  removeEventFromSchedule,
  getPrivateExtendedProperty} from "./eventsSlice"

const schedulesAdapter = createEntityAdapter({
})

const noteSchedule = createAction('calendars/note')

export const schedulesSelectors = schedulesAdapter.getSelectors(
  state => state.schedules
)

const schedulesSlice = createSlice({
  name: 'schedules',
  initialState: schedulesAdapter.getInitialState({
  }),
  reducers: {
  },
  extraReducers: {
    [addEventToSchedule.fulfilled]: (state, action) => {
      console.log("addEventToSchedule in schedulesSlice", action)
    },
    [removeEventFromSchedule.fulfilled]: (state, action) => {
      console.log("removeEventFromSchedule in schedulesSlice", action)
    },
    [fetchEventsPage.pending]: (state, action) => {
      console.log("fetchEventsPage pending in schedulesSlice", action)
    },
    [fetchEventsPage.fulfilled]: (state, action) => {
      console.log("fetchEventsPage in schedulesSlice", action)
      let {items} = action.payload.result

      const schedules = new Set()
      items.forEach (event => {
        const schedule = getPrivateExtendedProperty(event, 'ems')
        if (schedule) {
          schedule.add(schedule)
        }
      })

      schedulesAdapter.upsertMany(state, schedules.values().map(s => {return {id: s, name: s}}))
    },
  },
})

export default schedulesSlice
