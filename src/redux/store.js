import { combineReducers } from 'redux'

import { configureStore } from "@reduxjs/toolkit"

import eventsSlice from './eventsSlice'
import visibilityFilter from './visibilitySlice'
import sessionSlice from './sessionSlice'


const reducers = combineReducers({
  events: eventsSlice.reducer,
  visibilityFilter: visibilityFilter,
  session: sessionSlice.reducer,
})

export default configureStore({
   reducer: reducers,
})
