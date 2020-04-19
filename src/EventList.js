import React from 'react';

import { makeStyles } from '@material-ui/core/styles'
import { FixedSizeList as List } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

import Event from "./Event"
import AddEvent from "./AddEvent";

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: '36ch',
    backgroundColor: theme.palette.background.paper,
  },
  inline: {
    display: 'inline',
  },
}));

function EventList(props) {

    const classes = useStyles()
    const { events, eventCount, title, onClick, onDelete, onAdd, focusedEvent} = props

    const Row = ({ index, style }) => {
      let event = events[index]
      let selected = focusedEvent && event.id === focusedEvent.id

      return <Event key={event.id}
               event={event}
               style={style}
               selected={selected}
               onClick={onClick}
               onDelete={onDelete}/ >
    }

    let eventsList = <div>
     {events.length} / {eventCount} events shown
         <List className={classes.root}
         height={1000}
         itemCount={events.length}
         itemSize={100}
         width={500}
         >
          {Row}
        </List>
    </div>

    let emptyState = (
      <div className="empty">
        <h3>
        Empty
        </h3>
      </div>
    );

    return (
      <div className="event-container">
        <div>
          <h4>{title}</h4>
          <div>
            {events.length > 0 && eventsList}
            {events.length === 0 && emptyState}
            {props.children}
            {onAdd && <AddEvent onSubmit={onAdd}/>}
          </div>
        </div>
      </div>
    );
}

export default EventList;
