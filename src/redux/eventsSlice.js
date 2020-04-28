import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import { CALENDAR_ID} from "../config.js";
import { DateTime } from "luxon";
import chrono from "chrono-node";

import * as IntervalTree from '@davidisaaclee/interval-tree'

const eventsAdapter = createEntityAdapter({
  // Keep the "all IDs" array sorted based on start/end times
  sortComparer: (a, b) => (a, b) => a.start.ms - b.start.ms || a.end.ms - b.end.ms
})

const ensureAuthenticated = () => {
  if (!window.gapi.client) {
    const promise = new Promise(function(resolve, reject) {
      try {
        window.gapi.load("auth2:client", resolve);
      } catch(e) {
        reject(e)
      }
    });

    return promise
      .then(() => initClient());
  } else {
    return initClient();
  }
}

const initClient = () => {
  return window.gapi.client
    .init({
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
    })
};

export const fetchEvents = createAsyncThunk(
  'events/fetchPageStatus',
  async (args, {dispatch, getState}) => {
    console.log("Starting to fetch events")
    let {calendarId, pageToken} = args || {}
    let id = calendarId || CALENDAR_ID
    let request = {
          'calendarId': id,
          'pageToken': pageToken,
          'timeMin': new DateTime({}).toISO(),
          'showDeleted': false,
          'singleEvents': true,
          'maxResults': 100,
          'orderBy': 'startTime',
          'fields': 'nextPageToken,nextSyncToken,etag,timeZone,summary'+
                     ',items(etag,id,htmlLink,summary,description'+
                     ',start,end,updated,created,extendedProperties)',
          }

    await ensureAuthenticated()
    let results = await window.gapi.client.calendar.events.list(request)
    if (results.result.nextPageToken) {
      console.log(`Got next page token ${results.result.nextPageToken} for ${id}, dispatching`)
      dispatch(fetchEvents({calendarId: id, pageToken: results.result.nextPageToken}))
    } else {
      console.log("No next page token")
    }
    return results
  },
  {
    condition: (args, { getState }) => {
      let {events} = getState()
      let pageInProgress = events.fetchEventsInProgress[calendarIdOf(args)]
      return !(pageInProgress && pageInProgress === pageTokenOf(args))
    }
  }
)

const toDatetime = (components, other) => {
  if (!components) {
    if (other.date) {
      return other;
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
    console.log("deleteEvent")
    console.log(event)
    await ensureAuthenticated()
    await window.gapi.client.calendar.events.delete({
      'calendarId': CALENDAR_ID,
      'eventId': event.id
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
    console.log("Add event")
    console.log(input)

    await ensureAuthenticated()

    let response = await window.gapi.client.calendar.events.insert({
      'calendarId': CALENDAR_ID,
      'resource': asGoogleEvent(input)
    })
    return response.result
  }
)


const calendarIdOf = request => (request && request.calendarId) || CALENDAR_ID
const pageTokenOf = request => (request && request.pageToken) || "initial"

const eventsSlice = createSlice({
  name: 'events',
  initialState: eventsAdapter.getInitialState({
    loading: 'not-asked',
    intervalTree: IntervalTree.empty,
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

      let toMillis = (event, fieldName) => {
        let value = event[fieldName]
        let date = DateTime.fromISO(value.dateTime || value.date, {zone: value.timeZone || responseTz })
        if (fieldName === 'end' && value.date) {
          return date.plus({ days: 1 }).ts
        } else {
          return date.ts
        }
      }

      // let allConflicts = new Set()
      // TODO extract logic for adding a new event
      let start = toMillis(event, 'start')
      let end = toMillis(event, 'end')
      event.start.ms = start;
      event.end.ms = end;

      event.status = "tentative"
      event.placeholderForAdding = true
      eventsAdapter.addOne(state, event)
    },

    [addEvent.fulfilled]: (state, action) => {
      let event = action.payload
      let responseTz = state.responseTz

      let toMillis = (event, fieldName) => {
        let value = event[fieldName]
        let date = DateTime.fromISO(value.dateTime || value.date, {zone: value.timeZone || responseTz })
        if (fieldName === 'end' && value.date) {
          return date.plus({ days: 1 }).ts
        } else {
          return date.ts
        }
      }

      let allConflicts = new Set()
      let start = toMillis(event, 'start')
      let end = toMillis(event, 'end')
      event.start.ms = start;
      event.end.ms = end;
      let range = {
        low: start,
        high: Math.max(end - 1, start),
      }
      let interval = {
        id: event.id,
        range: range,
      }
      let conflicts = IntervalTree.queryIntersection(range, state.intervalTree)

      Object.values(conflicts).forEach(conflict => allConflicts.add(conflict))

      state.intervalTree = IntervalTree.insert(interval, state.intervalTree)

      Array.from(allConflicts).forEach(interval => {
        let conflicts = IntervalTree.queryIntersection(interval.range, state.intervalTree)
        delete conflicts[interval.id]
        state.conflicts[interval.id] = Object.keys(conflicts)
      })
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

    [fetchEvents.pending]: (state, action) => {
      state.fetchEventsInProgress[calendarIdOf(action.payload)] = pageTokenOf(action.payload)
      state.loadStatus = "pending"
    },
    [fetchEvents.fulfilled]: (state, action) => {
      console.log("Events successfully fetched")

      let result = action.payload.result
      let events = result.items
      let responseTz = result.responseTz || state.responseTz

      let intervalTree = state.intervalTree

      console.log(`Got ${events.length} new events`)

      let toMillis = (event, fieldName) => {
        let value = event[fieldName]
        let date = DateTime.fromISO(value.dateTime || value.date, {zone: value.timeZone || responseTz })
        if (fieldName === 'end' && value.date) {
          return date.plus({ days: 1 }).ts
        } else {
          return date.ts
        }
      }

      let allConflicts = new Set()

      events.forEach(event => {
        let start = toMillis(event, 'start', responseTz)
        let end = toMillis(event, 'end', responseTz)
        event.start.ms = start;
        event.end.ms = end;
        let range = {
          low: start,
          high: Math.max(end - 1, start),
        }
        let interval = {
          id: event.id,
          range: range,
        }
        let conflicts = Object.values(IntervalTree.queryIntersection(range, intervalTree))

        conflicts.forEach(conflict => allConflicts.add(conflict))
        allConflicts.add(interval)

        intervalTree = IntervalTree.insert(interval, intervalTree)
      })

      Array.from(allConflicts).forEach(interval => {
        let conflicts = IntervalTree.queryIntersection(interval.range, intervalTree)
        delete conflicts[interval.id]
        state.conflicts[interval.id] = Object.keys(conflicts)
      })

      eventsAdapter.upsertMany(state, action.payload.result.items)

      state.fetchEventsInProgress[calendarIdOf(action.payload)] = null
      state.loadStatus = "success"
      state.atLeastOneFetched = true
      state.intervalTree = intervalTree
      state.responseTz = responseTz
    },
    [fetchEvents.rejected]: (state, action) => {
      console.log("Failed to fetch events")
      console.log(action)
      state.fetchEventsInProgress[calendarIdOf(action.payload)] = null
    },
  },
})

export const eventsSelectors = eventsAdapter.getSelectors(
  state => state.events
)

export default eventsSlice
