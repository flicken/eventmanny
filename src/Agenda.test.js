import {DateTime} from "luxon"

import {eventSplitting} from "./Agenda"

it('splits into dates by person', () => {
  let events = [
    {
      id: "1",
      summary: "Brian/Billy: Something",
      start: {
        ms: DateTime.fromISO("2020-05-03T12:30:00Z").toMillis()
      },
      end: {
        ms: DateTime.fromISO("2020-05-03T14:30:00Z").toMillis()
      }
    },
    {
      id: "2",
      summary: "Brian",
      start: {
        ms: DateTime.fromISO("2020-05-03T12:30:00Z").toMillis()
      },
      end: {
        ms: DateTime.fromISO("2020-05-03T14:30:00Z").toMillis()
      }
    },
    {
      id: "3",
      summary: "Other",
      start: {
        ms: DateTime.fromISO("2020-05-03T12:30:00Z").toMillis()
      },
      end: {
        ms: DateTime.fromISO("2020-05-03T14:30:00Z").toMillis()
      }
    }

  ]
  let result = eventSplitting(events,
    ["2020-05-01", "2020-05-02", "2020-05-03",  "2020-05-04"],
    ["Brian", "Billy", ""])

  expect(result).toEqual({
      '2020-05-01': [[], [], []],
      '2020-05-02': [[], [], []],
      '2020-05-03': [[events[0], events[1]], [ events[0]], [events[2]]],
      '2020-05-04': [[], [], []],
    }
)
})
