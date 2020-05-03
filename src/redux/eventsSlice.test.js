import {DateTime} from "luxon"

import {findConflicts} from "./eventsSlice"

it('finds conflicts', () => {
  let events = [
    {
      id: "1",
      summary: "Conflicts with 2 + 3",
      start: {
        ms: DateTime.fromISO("2020-05-03T00:00:00Z").toMillis()
      },
      end: {
        ms: DateTime.fromISO("2020-05-03T12:00:00Z").toMillis()
      }
    },
    {
      id: "2",
      summary: "Conflicts with 1",
      start: {
        ms: DateTime.fromISO("2020-05-03T00:30:00Z").toMillis()
      },
      end: {
        ms: DateTime.fromISO("2020-05-03T03:00:00Z").toMillis()
      }
    },
    {
      id: "3",
      summary: "Conflicts with 1 + 4",
      start: {
        ms: DateTime.fromISO("2020-05-03T04:00:00Z").toMillis()
      },
      end: {
        ms: DateTime.fromISO("2020-05-03T14:00:00Z").toMillis()
      }
    },
    {
      id: "4",
      summary: "Conflicts with 3",
      start: {
        ms: DateTime.fromISO("2020-05-03T13:00:00Z").toMillis()
      },
      end: {
        ms: DateTime.fromISO("2020-05-03T16:00:00Z").toMillis()
      }
    },
    {
      id: "5",
      summary: "Conflicts with nothing",
      start: {
        ms: DateTime.fromISO("2020-05-04T12:30:00Z").toMillis()
      },
      end: {
        ms: DateTime.fromISO("2020-05-04T14:30:00Z").toMillis()
      }
    },
  ]

  expect(findConflicts(events)).toEqual({
      '1': new Set(["2", "3"]),
      '2': new Set(["1"]),
      '3': new Set(["1", "4"]),
      '4': new Set(["3"]),
      '5': new Set(),
    }
)
})
