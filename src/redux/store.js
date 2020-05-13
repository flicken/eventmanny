import { combineReducers } from 'redux'

import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit"

import eventsSlice from './eventsSlice'
import visibilityFilter from './visibilitySlice'
import sessionSlice from './sessionSlice'
import calendarsSlice from "./calendarsSlice"
import schedulesSlice from './schedulesSlice'

import { batchedSubscribe } from 'redux-batched-subscribe';

import debounce from 'lodash.debounce';

const debounceNotify = debounce(notify => notify())

const reducers = combineReducers({
  events: eventsSlice.reducer,
  calendars: calendarsSlice.reducer,
  visibilityFilter: visibilityFilter,
  session: sessionSlice.reducer,
  schedules: schedulesSlice.reducer,
})

const customizedMiddleware = getDefaultMiddleware({
  serializableCheck: false,
  immutableCheck: false,
})

export default configureStore({
   reducer: reducers,
   middleware: [...customizedMiddleware],
   enhancers: [batchedSubscribe(debounceNotify)]
})
