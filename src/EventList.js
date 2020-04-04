import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';

import Event from "./Event"

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
    const { events, eventCount, title, onClick, onDelete } = props;

    let eventsList = <div>
     {events.length} / {eventCount} events shown
       <List className={classes.root}>
       { events.map((event) => {

        return (
          <Event key={event.id} event={event} onClick={onClick} onDelete={onDelete}/ >
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
          <h1>{title}</h1>
          <div>
            {events.length > 0 && eventsList}
            {events.length === 0 && emptyState}
            {props.children}
          </div>
        </div>
      </div>
    );
}

export default EventList;
