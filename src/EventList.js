import React from 'react';

import { DateTime } from "luxon";

import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Divider from '@material-ui/core/Divider';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';

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

function showTime(event) {
  if (event.start.date) {
    return "All day"
  } else {
    // TODO handle multi-day events
    return DateTime.fromMillis(event.start.ms).toLocaleString(DateTime.TIME_SIMPLE) + " - " + DateTime.fromMillis(event.end.ms).toLocaleString(DateTime.TIME_SIMPLE)
  }
}

function EventList(props) {

    const classes = useStyles()
    const { events, eventCount, title } = props;

    let eventsList = <div>
     {events.length} / {eventCount} events shown
       <List className={classes.root}>
       { events.map((event) => {

        return (
          <div key={event.id}>
        <ListItem  button component="a" alignItems="flex-start" onClick={(e)=>props.onClick(e, event)}>
        <ListItemAvatar>
          <Avatar alt={event.summary} src="doesnotexist.jpg" />
        </ListItemAvatar>
          <ListItemText
            primary={event.summary}
            secondary={
              <React.Fragment>
              <Typography
                component="span"
                variant="body2"
                className={classes.inline}
                color="textPrimary"
              >
              {DateTime.fromMillis(event.start.ms).toLocaleString(DateTime.DATE_SIMPLE)}{" "}
              {showTime(event)}
              </Typography>
              </React.Fragment>
            }
          />
        </ListItem>
        <Divider />
        </div>
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
          </div>
        </div>
      </div>
    );
}

export default EventList;
