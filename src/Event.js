import React from 'react';

import { DateTime } from "luxon";

import { makeStyles } from '@material-ui/core/styles';
import ListItem from '@material-ui/core/ListItem';
import Divider from '@material-ui/core/Divider';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';

import Badge from '@material-ui/core/Badge';
import EventBusy from '@material-ui/icons/Event';
import DeleteIcon from '@material-ui/icons/Delete';

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

function DeleteButton(props) {
  let handleClick = e => {
    e.stopPropagation()
    props.onClick(e, props.event)
  }

  return <DeleteIcon {...props} onClick={handleClick} />
}

export default function Event({event, onClick, onDelete}) {
  const classes = useStyles()

  let warningBadge = event.conflicts.length === 0 ? null :
   <Badge badgeContent={event.conflicts.length} max={99} color="primary">
    <EventBusy />
  </Badge>

  return (
    <React.Fragment>
  <ListItem  button component="a" alignItems="flex-start" onClick={(e)=>onClick && onClick(e, event)}>
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
    <DeleteButton event={event} onClick={onDelete}/>
    {warningBadge}

  </ListItem>
  <Divider />
  </React.Fragment>

  )
}
