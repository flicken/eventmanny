import React from 'react'

import { DateTime } from "luxon"

import { makeStyles } from '@material-ui/core/styles'
import ListItem from '@material-ui/core/ListItem'
import Divider from '@material-ui/core/Divider'
import ListItemText from '@material-ui/core/ListItemText'
import Typography from '@material-ui/core/Typography'
import {Link} from "react-router-dom"

import Badge from '@material-ui/core/Badge'
import EventBusy from '@material-ui/icons/Event'
import DeleteIcon from '@material-ui/icons/Delete'
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty'


const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: '36ch',
    backgroundColor: theme.palette.background.paper,
  },
  inline: {
    display: 'inline',
  },
}))


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

function ConflictsBadge({conflicts}) {
  return <Badge badgeContent={conflicts.length} max={99} color="primary">
   <EventBusy />
 </Badge>
}

export default function Event({event, conflicts, onClick, onDelete, selected, showLink}) {
  const classes = useStyles()

  return (
    <React.Fragment>
  <ListItem button
    selected={selected}
    to={showLink && {hash: event.id}}
    component={showLink ? Link : "a"}
    alignItems="flex-start"
    onClick={(e)=>onClick && onClick(e, event)}>
    {conflicts && conflicts.length > 0 && <ConflictsBadge conflicts={conflicts}/>}
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
    { (event.status === "cancelled") ? <HourglassEmptyIcon/> : (onDelete && <DeleteButton event={event} onClick={onDelete}/>)}

  </ListItem>
  <Divider />
  </React.Fragment>

  )
}
