import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import { CALENDAR_ID} from "../config.js"
import { DateTime } from "luxon"
import * as chrono from 'chrono-node';

import {fetchCalendarList, calendarsSelectors} from "./calendarsSlice"

const eventsAdapter = createEntityAdapter({
  // Keep the "all IDs" array sorted based on start/end times
  sortComparer: (a, b) => a.start.ms - b.start.ms || a.end.ms - b.end.ms
})

export const ensureClient = () => {
  const initClient = () => {
    return window.gapi.client
      .init({
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
      })
  }

  if (!window.gapi.client) {
    const promise = new Promise(function(resolve, reject) {
      try {
        window.gapi.load("auth2:client", resolve)
      } catch(e) {
        reject(e)
      }
    })

    return promise
      .then(() => initClient())
  } else {
    return initClient()
  }
}

const ignoredCalendars = new Set(["addressbook#contacts@group.v.calendar.google.com"])
const ignoredAccessRoles = new Set(["freeBusyReader"])

export const fetchEventsFromAllCalendars = createAsyncThunk(
  'events/fetchEventsFromAllCalendarsStatus',
  async (args, {dispatch, getState}) => {
    console.log("Starting to fetch events from all calendars")
    return dispatch(fetchCalendarList()).then(() => Promise.all(calendarsSelectors.selectAll(getState())
      .filter(c => c.selected)
//      .filter(c => c.primary)
      .filter(c => !ignoredAccessRoles.has(c.accessRole))
      .filter(c => !ignoredCalendars.has(c.id))
      .map(c => dispatch(fetchAllEvents({calendarId: c.id})))))
  }
)

export const fetchRecursive = createAsyncThunk(
  'eventsRecursive',
  async({depth}, {dispatch, getState}) => {
    console.log(`At depth ${depth}`)
    if (depth > 0) {
      dispatch(fetchRecursive({depth: depth - 1}))
    }
    return depth
  }
)


export const fetchAllEvents = createAsyncThunk(
  'events/fetchAllEvents',
  async ({calendarId}, {dispatch, getState}) => {
    await ensureClient()

    let pageToken = null
    do {
      let response = await dispatch(fetchEventsPage({calendarId, pageToken}))
      console.log(response)
      pageToken = response.payload.result.nextPageToken
    } while (pageToken)
  }
  //,
  // {
  //   condition: ({calendarId}, { getState }) => {
  //     let inProgress = getState().events.fetchEventsInProgress[calendarId]
  //     return !inProgress
  //   }
  // }
)


export const fetchEventsPage = createAsyncThunk(
  'events/fetchPageStatus',
  async (args, {dispatch, getState}) => {
    let {calendarId, pageToken} = args || {}
    let id = calendarId || CALENDAR_ID
    console.log(`Starting to fetch events from calendar ${id}`)
    let request = {
          'calendarId': id,
          'pageToken': pageToken,
          'timeMin': new DateTime({}).toISO(),
          'showDeleted': false,
          'singleEvents': true,
          'maxResults': 100,
          'orderBy': 'startTime',
          'fields': 'nextPageToken,nextSyncToken,etag,timeZone,summary'+
                     ',items'//+'(etag,id,htmlLink,summary,description'+',start,end,updated,created,extendedProperties)'
                     ,
          }

    return ensureClient()
      .then(() => window.gapi.client.calendar.events.list(request))
  }
)

const toDatetime = (components, other) => {
  if (!components) {
    if (other.date) {
      return other
    } else {
      return {
        dateTime: DateTime.fromISO(other.dateTime).plus({ hours: 1 })
      }
    }
  }
  let values = {...components.impliedValues, ...components.knownValues}
  let d = DateTime.fromObject({
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second
  })

  if (components.knownValues.hour) {
    return {
      dateTime: d.toISO()
    }
  } else {
    return {
      date: d.toISODate()
    }
  }
}


export const deleteEvent = createAsyncThunk(
  'events/deleteEventStatus',
  async (event, {dispatch}) => {
    await ensureClient()
    await window.gapi.client.calendar.events.delete({
      'calendarId': event.calendarId,
      'eventId': event.eventId
    })
    return event
  }
)

const asGoogleEvent = (input, id) => {
  let datetimes = chrono.parse(input.datetimes, new Date(), { forwardDate: true })

  let start = toDatetime(datetimes[0].start)
  let end = toDatetime(datetimes[0].end, start)

  let event = {
    id: id,
    summary: input.summary,
    start: start,
    end: end,
    created: new DateTime({}).toISO(),
  }

  return event
}

export const addEvent = createAsyncThunk(
  'events/addEventStatus',
  async (input, {dispatch}) => {
    await ensureClient()

    let response = await window.gapi.client.calendar.events.insert({
      'calendarId': CALENDAR_ID,
      'resource': asGoogleEvent(input)
    })
    return response.result
  }
)

export function getPrivateExtendedProperty(event, name) {
  const p = event.extendedProperties?.private
  if (p) {
    return p[name]
  } else {
    return undefined
  }
}

async function setPrivateExtendedProperty(event, privateExtendedProperties) {
  await ensureClient()

  const extendedProperties = {
    ...event.extendedProperties,
    'private': {
      ...event.extendedProperties?.private,
      ...privateExtendedProperties
    }
  }
  let response = await window.gapi.client.calendar.events.patch({
    'calendarId': event.calendarId,
    'eventId': event.eventId,
    'resource': {
      extendedProperties
    }
  })
  return response.result
}

export const addEventToSchedule = createAsyncThunk(
  'events/addEventToScheduleStatus',
  async ({event, schedule, ...input}, {dispatch}) => {
    console.log("Starting to add event to schedule", event, schedule, input)
    return setPrivateExtendedProperty(event, {'ems': schedule})
  }
)

export const removeEventFromSchedule = createAsyncThunk(
  'events/removeEventFromScheduleStatus',
  async ({event, schedule, ...input}, {dispatch}) => {
    console.log("Starting to remove event from schedule", event, schedule, input)
    return setPrivateExtendedProperty(event, {'ems': null}, dispatch)
  }
)


const calendarIdOf = request => {
  return (request && request.calendarId) || CALENDAR_ID
}
const idFor = event => `${event.calendarId}/${event.eventId}`

const toMillis = (event, fieldName, timeZone) => {
  let value = event[fieldName]
  let date = DateTime.fromISO(value.dateTime || value.date, {zone: value.timeZone || timeZone })
  return date.toMillis()
}

let mutateEvent = (event, calendarId, timeZone) => {
  let start = toMillis(event, 'start', timeZone)
  let end = toMillis(event, 'end', timeZone)
  event.start.ms = start
  event.end.ms = end
  event.eventId = event.id
  event.calendarId = calendarId
  event.id = idFor(event)
}

export const findConflicts = (events) => {
  console.time("findConflicts")
  let currentEvents = []
  let conflicts = {}
  events.forEach(e => {
    conflicts[e.id] = new Set()
    currentEvents = currentEvents.filter(c => c.end.ms > e.start.ms)

    currentEvents.forEach(c => {
        conflicts[c.id] = conflicts[c.id].add(e.id)
        conflicts[e.id] = conflicts[e.id].add(c.id)
    })

    currentEvents.push(e)
  })
  console.timeEnd ("findConflicts")

  return conflicts
}

const eventsSlice = createSlice({
  name: 'events',
  initialState: eventsAdapter.getInitialState({
    loading: 'not-asked',
    conflicts: {},
    fetchEventsInProgress: {},
  }),
  reducers: {
    eventAdded: eventsAdapter.addOne,
    eventsAdded: eventsAdapter.addMany,
    eventsLoading(state, action) {
      state.loading = 'loading'
    },
    eventsLoadingSuccess(state, action) {
      state.loading = 'success'
    },
    eventsLoadingFailure(state, action) {
      state.loading = 'failure'
    },
  },
  extraReducers: {
    [addEvent.pending]: (state, action) => {
      let event = asGoogleEvent(action.meta.arg, action.meta.requestId)
      let responseTz = state.responseTz

      // let allConflicts = new Set()
      // TODO extract logic for adding a new event
      let start = toMillis(event, 'start', responseTz)
      let end = toMillis(event, 'end', responseTz)
      event.start.ms = start
      event.end.ms = end

      event.status = "tentative"
      event.placeholderForAdding = true
      eventsAdapter.addOne(state, event)

    },

    [addEvent.fulfilled]: (state, action) => {
      let event = action.payload
      let responseTz = state.responseTz

      let start = toMillis(event, 'start', responseTz)
      let end = toMillis(event, 'end', responseTz)
      event.start.ms = start
      event.end.ms = end
      eventsAdapter.removeOne(state, action.meta.requestId)
      eventsAdapter.upsertOne(state, event)

  },
  [addEvent.rejected]: (state, action) => {
      console.log("Failed to add event")
      console.log(action)
      state.loadStatus = "error"
    },
    [deleteEvent.pending]: (state, action) => {
      eventsAdapter.updateOne(state, {id: action.meta.arg.id, status: "cancelled"})
    },
    [deleteEvent.rejected]: (state, action) => {
      eventsAdapter.updateOne(state, {id: action.meta.arg.id, status: "confirmed"})
    },
    [deleteEvent.fulfilled]: (state, action) => {
      eventsAdapter.removeOne(state, action.meta.arg.id)
    },

    [fetchAllEvents.pending]: (state, action) => {
      state.fetchEventsInProgress[calendarIdOf(action.meta.arg)] = true
    },
    [fetchAllEvents.fulfilled]: (state, action) => {
      delete state.fetchEventsInProgress[calendarIdOf(action.meta.arg)]
    },
    [fetchAllEvents.rejected]: (state, action) => {
      let calendarId = calendarIdOf(action.meta.arg)
      console.log(`Fetch all events failed ${calendarId}`)
      console.log(action)
      delete state.fetchEventsInProgress[calendarIdOf(action.meta.arg)]
    },
    [fetchEventsPage.fulfilled]: (state, action) => {
      let calendarId = calendarIdOf(action.meta.arg)
      console.log(`Got ${action.payload.result.items.length} new events for ${calendarId}`)
      console.log(action)

try {
      let {items, timeZone} = action.payload.result

      items.forEach (event => {
        mutateEvent(event, calendarId, timeZone)
      })

      eventsAdapter.upsertMany(state, items)

      state.conflicts = findConflicts(eventsAdapter.getSelectors().selectAll(state))
      state.fetchEventsInProgress[calendarIdOf(action.meta.arg)] = null
      state.loadStatus = "success"
      state.atLeastOneFetched = true
    } catch(e) {
      console.log(e)
    }
    },
    [fetchEventsPage.rejected]: (state, action) => {
      let calendarId = calendarIdOf(action.meta.arg)
      console.log(`Fetch all events failed ${calendarId}`)
      console.log(action)
      state.fetchEventsInProgress[calendarIdOf(action.meta.arg)] = null
    },
  },
})

export const eventsSelectors = eventsAdapter.getSelectors(
  state => state.events
)

export default eventsSlice
