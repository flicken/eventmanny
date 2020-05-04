import {DateTime} from "luxon"

import {byDate, splitByFilters} from "./Agenda"

it('splits into dates', () => {
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
        ms: DateTime.fromISO("2020-05-04T12:30:00Z").toMillis()
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
  let result = byDate(events)

  expect(result).toEqual({
      '2020-05-03': [events[0], events[2]],
      '2020-05-04': [events[1]],
    }
)})

it('splits by filters', () => {
  let events = [
    {
      id: "1",
      summary: "Brian/Billy: Something",
    },
    {
      id: "2",
      summary: "Brian",
    },
    {
      id: "3",
      summary: "Other",
    }
  ]

  let result = splitByFilters(events, [
    e => e.summary.includes("Brian"),
    e => e.summary.includes("Billy"),
  ])

  expect(result).toEqual({
    matched:[
      [events[0], events[1]],
      [events[0]]
    ],
    unmatched: [events[2]],
  })

})
