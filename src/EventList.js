import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';

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

    let eventsList = <div>
     {events.length} / {eventCount} events shown
       <List className={classes.root}>
       { events.map((event) => {
        let selected = focusedEvent && event.id === focusedEvent.id

        return (
          <Event key={event.id}
                 event={event}
                 selected={selected}
                 onClick={onClick}
                 onDelete={onDelete}/ >
      )
    })}
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
