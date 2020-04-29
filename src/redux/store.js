import { combineReducers } from 'redux'

import { configureStore } from "@reduxjs/toolkit"

import eventsSlice from './eventsSlice'
import visibilityFilter from './visibilitySlice'
import sessionSlice from './sessionSlice'
import calendarsSlice from "./calendarsSlice"


const reducers = combineReducers({
  events: eventsSlice.reducer,
  calendars: calendarsSlice.reducer,
  visibilityFilter: visibilityFilter,
  session: sessionSlice.reducer,
})

export default configureStore({
   reducer: reducers,
})
