import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';

import Event from "./Event"
import AddEvent from "./AddEvent";

import {eventsSelectors} from "./redux/eventsSlice"
import { connect } from 'react-redux'


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



const makeMapStateToProps = () => (state, props) => {
  return {
    event: eventsSelectors.selectById(state, props.eventId),
    conflicts: state.events.conflicts[props.eventId],
  }
}

const ConnectedEvent = connect(makeMapStateToProps)(Event)


function EventList(props) {

    const classes = useStyles()
    const {
      ids,
      focusedEventId,
      eventCount,
      title,
      onClick,
      onDelete,
      onAdd,
      focusedEvent
    } = props
    console.log("EventList")
    console.log(props)

    let eventsList = <div>
     {ids.length} / {eventCount} events shown
       <List className={classes.root}>
       { ids.map((id) => {
        let selected = id === focusedEventId

        return (
          <ConnectedEvent
                 key={id}
                 eventId={id}
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
            {ids.length > 0 && eventsList}
            {ids.length === 0 && emptyState}
            {props.children}
            {onAdd && <AddEvent onSubmit={onAdd}/>}
          </div>
        </div>
      </div>
    );
}

export default EventList;
