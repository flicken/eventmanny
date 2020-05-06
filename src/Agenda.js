import React from 'react'

import {useState} from 'react'
import { makeStyles } from '@material-ui/core/styles'

import { DateTime } from "luxon"

import {eventsSelectors} from "./redux/eventsSlice"
import { connect } from 'react-redux'

import {showTime} from "./Event"
import Filter from "./components/Filter"

import produce from "immer"

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
  inline: {
    display: 'inline',
  },
}))


function nextDays(today, count = 40) {
  return [...Array(count).keys()].map(i => today.plus({day: i}))
}

export const splitByFilters = (events, filters) => {
  const matchedIds = new Set()

  const matched = filters.map(f =>
    events.filter(e => f(e) && matchedIds.add(e.id)))

  return {
    matched: matched,
    unmatched: events.filter(e => !matchedIds.has(e.id))
  }
}


export const byDate = (events) => {
  let byDate = {}
  events.forEach(event => {
    let date = DateTime.fromMillis(event.start.ms).toISODate()
    let dateArray = byDate[date]
    if (!dateArray) {
      dateArray = byDate[date] = []
    }
    dateArray.push(event)
  })
  return byDate
}

const defaultColumns = [
  ""
]

const EL = ({event}) => {
  let recurring = event.recurringEventId	&&
                 (event.originalStartTime.date === event.start.date) &&
                 (event.originalStartTime.dateTime === event.start.dateTime)

  return (<span style={{color: (recurring ? "#888" : "#000")}}>
    <b>{showTime(event)}</b><br/>
    {(event.summary||event.description||JSON.stringify(event))}<br/>
    </span>)
}


const Row = ({day, filters, events, ...rest}) => {
  const alreadyDisplayed = new Set()
  const split = splitByFilters(events, filters)
  const {unmatched, matched} = split

  return <tr valign="top" {...rest}>
    <th key="day">{day}</th>
    {matched.map((columnEvents, index) => <td key={index}>
       {columnEvents.map(event => <EL key={`${index}/${event.id}`} event={event}/>)}
       </td>
     )}
     <td key="unmatched">
        {unmatched.map(event => <EL key={`unmatched/${event.id}`} event={event}/>)}
     </td>
 </tr>
}

function Agenda(props, state) {
    const classes = useStyles()
    const {
      events,
    } = props

    const [columns, setColumns] = useState(defaultColumns)

    let dom = nextDays(new DateTime({}), 40).map(d => d.toISODate())

    let eventsByDate = byDate(events)

    let f = [...columns]
    f.pop()
    let filters = f
                    .map(c => c && new RegExp(c, "i"))
                    .map(regex => event => {
                      if (regex) {
                        return (event.summary?.search(regex) >= 0) ||
                          (event.description?.search(regex) >= 0) ||
                          (event.attendees?.findIndex(a => (a.displayName?.search(regex) >= 0) || (a.email?.search(regex) >= 0)) >= 0)
                      } else {
                        return false
                      }
                    })

    console.log("Events with attendees", events.filter(event => event.attendees?.length))

    let list = <table className={classes.root} style={{margin: "0px", textAlign: "left"}} width="100%">
       <thead>
       <tr>
          <th key="day" style={{minWidth: "100px"}} width="10%" >Day</th>
        {columns.map((column, index) => <th key={`column-${index}`}
        width="15%">
        <Filter key={`filter-${index}`}
         filter={column}
          autoFocus={index === 0}
         onChange={v => {
           setColumns(produce(columns, draftColumns => {
               draftColumns[index] = v
           }))
         }}
         onDelete={() => {
           setColumns(produce(columns, draftColumns => {
               draftColumns.splice(index, 1)
           }))
         }}
         onFocus={() => {
           if (index === (columns.length - 1)) {
             setColumns(produce(columns, draftColumns => {
                 draftColumns.push("")
             }))
           }
         }}
      /></th>)}
      </tr>
      </thead>
      <tbody>
       {
         dom.map((day, index) => {
           const even = index % 2
           return <Row key={day}
                     day={day}
                     events={eventsByDate[day] || []}
                     filters={filters}
                     valign="top"
                     style={{backgroundColor: even ? "#fff": "#f2f2f2"}}/>
        })

      }
      </tbody>
      </table>

    let emptyState = (
      <div className="empty">
        <h3>
        Empty
        </h3>
      </div>
    )

    return (
            <>{events?.length && list}
            {(events?.length === 0) && emptyState}
            </>
    )
}

export default Agenda
