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


const mapStateToProps = () => (state, props) => {
  return {
    events: eventsSelectors.selectAll(state),
  }
}

function nextDays(today, count = 40) {
  return [...Array(count).keys()].map(i => today.plus({day: i}))
}

export const eventSplitting = (events, rows, columns) => {
  let result = { }
  rows.forEach(row => {
    let r = Array(columns.length)
    columns.forEach((column, index) => r[index] = [])
    result[row] = r
  })

  let lastIndex = columns.length - 1
  let regex = columns.map(c => c && new RegExp(c, "i"))

  events.forEach(event => {
    let eventRow = DateTime.fromMillis(event.start.ms).toISODate()
    if (rows.includes(eventRow)) {
      let foundIndexes = columns.flatMap((column, i) => {
          if (column && event.summary?.search(regex[i]) !== -1) {
          return [i]
        } else {
          return []
        }
      })
      foundIndexes.forEach(index => {
            result[eventRow][index].push(event)
      })

      let found = foundIndexes.length > 0
      if (!found) {
        result[eventRow][lastIndex].push(event)
      }
    }
  })
  return result
}

const defaultColumns = [
  "Alice",
  "",
]


function Agenda(props, state) {
    const classes = useStyles()
    const {
      events,
    } = props

    const [columns, setColumns] = useState(defaultColumns)

    let dom = nextDays(new DateTime({}), 40).map(d => d.toISODate())
    let personEvents = eventSplitting(events, dom, columns)

    const EL = ({event}) => {
      let recurring = event.recurringEventId	&&
                     (event.originalStartTime.date === event.start.date) &&
                     (event.originalStartTime.dateTime === event.start.dateTime)

      return (<span style={{color: (recurring ? "#888" : "#000")}}>
        <b>{showTime(event)}</b><br/>
        {(event.summary||event.description||JSON.stringify(event))}<br/>
        </span>)
    }

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

           return <tr key={day} valign="top" style={{backgroundColor: even ? "#fff": "#f2f2f2"}}>
           <th key="day">{day}</th>
            {columns.map((person, index)=> <td key={index}>
              {personEvents[day][index]?.map(event =><EL key={`${index}/${event.id}`} event={event}/>)}
            </td>)}
          </tr>
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
            <>{events.length > 0 && list}
            {events.length === 0 && emptyState}
            </>
    )
}

export default connect(mapStateToProps)(Agenda)
