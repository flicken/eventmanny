import {
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import {
  fetchEventsPage,
  addEventToSchedule,
  removeEventFromSchedule,
  getPrivateExtendedProperty} from "./eventsSlice"

const schedulesAdapter = createEntityAdapter({
})

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
          schedules.add(schedule)
        }
      })

      if (schedules.size > 0) {
        schedulesAdapter.upsertMany(state,  Array.from(schedules).map(s => {return {id: s, name: s}}))
        schedulesAdapter.upsertMany(state,  ["Example 1", "Example 2", "Example 3"].map(s => {return {id: s, name: s}}))
      }
    },
  },
})

export default schedulesSlice
