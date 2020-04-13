import React from 'react';
import './App.css';

import Conflicts from "./Conflicts"
import Creation from "./Creation"
import Home from "./Home"
import Updates from "./Updates"

import EventFetcher from "./EventFetcher";

import IntervalTree from '@flatten-js/interval-tree';
import { DateTime } from "luxon";

import { withStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import RequireLogin from "./RequireLogin"

import chrono from "chrono-node";

import { BrowserRouter, Route, Link } from "react-router-dom";

import { GoogleLogout } from 'react-google-login';

import { GOOGLE_CLIENT_ID, } from "./config.js";

const useStyles = theme => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  });

const emptyState = {
  conflictedEvents: [],
  focusedEvent: null,
  events: [],
  intervals: new IntervalTree(),
  eventCount: 0,
  loading: true,
  isSignedIn: false,
  signInError: null,
  updatesSince: "a week ago",
  newSince: "a day ago"
}

class App extends React.Component{

  constructor(props) {
    super(props)
    this.state = emptyState;
    this.fetcher = new EventFetcher()
  }

  onLoginSuccess = (response) => {
    this.setState({isSignedIn: true, signInError: null})
    console.log("Logged in")
    console.log(response)
    this.fetcher.setAuth(response.tokenObj)
    this.fetcher.fetch({callback: this.addEvents})
  }

  onLogoutSuccess = (response) => {
    this.setState(emptyState)
    console.log("Logged out")
    console.log(response)
  }

  onLoginFailure = (response) => {
    this.setState({isSignedIn: false, signInError: response})
    console.log(`Error logging in ${response}`)
  }

  toMillis = (event, fieldName, responseTz) => {
    let value = event[fieldName];
    return DateTime.fromISO(value.dateTime || value.date, {zone: value.timeZone || responseTz }).ts
  }

  addComputedFields = (responseTz, event) => {
    event.conflicts = [];
    let start = this.toMillis(event, 'start', responseTz)
    let end = this.toMillis(event, 'end', responseTz)
    event.start.ms = start;
    event.end.ms = end;
  }

  handleEvent = (intervals, responseTz, event) => {
    this.addComputedFields(responseTz, event)
    let interval = [event.start.ms, event.end.ms - 1];
    intervals.search(interval).forEach( (e) => {
      console.log("Found conflict: " + e)
      event.conflicts.push(e.id);
      e.conflicts.push(event.id);
    });

    intervals.insert(interval, event);
  }

  addEvents = ({newEvents, responseTz}) => {
    this.setState((state, props) => {
      let events = state.events.concat(newEvents).sort((a, b) => a.start.ms - b.start.ms || a.end.ms - b.end.ms)
      let intervals = new IntervalTree();
      console.log("Last event")
      console.log(events[events.length - 1])

      events.forEach((event) => this.handleEvent(intervals, responseTz, event));

      let conflictedEvents = events.filter(e => {return e.conflicts.length > 0;});

      return {
        loading: false,
        events: events,
        conflictedEvents: conflictedEvents,
        intervals: intervals,
        eventCount: events.length,
        responseTz: responseTz
      };
    });
  }

  deleteEvent = (deletedEvent) => {
    this.setState((state, props) => {
      let events = state.events.filter((e) => e.id !== deletedEvent.id).sort((a, b) => a.start.ms - b.start.ms || a.end.ms - b.end.ms)
      let intervals = new IntervalTree();
      let {responseTz} = props
      console.log("Last event")
      console.log(events[events.length - 1])

      let conflictedEvents = state.conflictedEvents.filter((e) => e.id !== deletedEvent.id);

      events.forEach((event) => this.handleEvent(intervals, responseTz, event));

      conflictedEvents.forEach((e) => e.conflicts = e.conflicts.filter(id => id !== deletedEvent.id))

      return {
        loading: false,
        events: events,
        conflictedEvents: conflictedEvents,
        intervals: intervals,
        eventCount: events.length
      };
    });
  }

  doSearch = (event) => {
    this.setState({searchTerm: event.target.value},
       this.fetcher.fetch(this.addEvents));
  }

  handleEventClick = (e, event) => {
    this.setState((state, props) => {
      return {
        focusedEvent: event
      }
    }
    )
  }

  handleDeleteClick = (e, event) => {
    console.log("Trying to delete event")
    console.log(event)
    this.fetcher.delete(event, () => this.deleteEvent(event))
  }


  toDatetime = (components, other) => {
    if (!components) {
      if (other.date) {
        return other;
      } else {
        return {
          dateTime: DateTime.fromISO(other.dateTime).plus({ hours: 1 })
        }
      }
    }
    let values = {...components.impliedValues, ...components.knownValues}
    let d = DateTime.fromObject({
      year: values.year,
      month: values.month,
      day: values.day,
      hour: values.hour,
      minute: values.minute,
      second: values.second
    })

    if (components.knownValues.hour) {
      return {
        dateTime: d.toISO()
      }
    } else {
      return {
        date: d.toISODate()
      }
    }
  }

  handleUpdatesSince = (since) => {
      this.setState({updatesSince: since})
  }

  handleNewSince = (since) => {
      this.setState({newSince: since})
  }

  handleAddEvent = (input) => {
    console.log(input)

    let datetimes = chrono.parse(input.datetimes, new Date(), { forwardDate: true })
    console.log(datetimes)

    let start = this.toDatetime(datetimes[0].start)
    console.log(start)
    let end = this.toDatetime(datetimes[0].end, start)
    console.log(end)


    const event = {
      summary: input.summary,
      start: start,
      end: end
    }

    console.log(event)

    this.fetcher.insert(event, (createdEvent) => {
      console.log("Event created")
      console.log(createdEvent)
      this.addEvents({newEvents: [createdEvent], responseTz: this.state.responseTz})
    })
  }

  render() {
    const { classes } = this.props;

    const { isSignedIn, signInError} = this.state;

    const eventHandlers = {
      onDelete: this.handleDeleteClick,
      onClick: this.handleEventClick,
      onAdd: this.handleAddEvent,
    }

    const tabs = [
      {label: "Home", path: "/"},
      {label: "Conflicts", path: "/conflicts"},
      {label: "New", path: "/new"},
      {label: "Updates", path: "/updates"},
    ]

    const self = this;
    let requireSignon = (children) => {
      return <RequireLogin isSignedIn={isSignedIn} onSuccess={self.onLoginSuccess} onLoginFailure={self.onLoginFailure}>{children}</RequireLogin>
    }

    return (
      <div>
    <BrowserRouter initialIndex={0}>
        <div className={classes.root}>
            <AppBar position="static">
          <Toolbar>

          <Tabs value={window.location.pathname} variant="fullWidth">
            {
              tabs.map(
                ({label, path})=><Tab key={label}
                                      label={label}
                                      value={path}
                                      style={{
                                          display:"flex",
                                          alignItems:"center",
                                          justifyContent:"center"
                                      }}
                                      component={Link}
                                      to={path} />
              )
            }
          </Tabs>
          <div style={{flexGrow: 1}}/>
              {requireSignon(
                <GoogleLogout
                    clientId={GOOGLE_CLIENT_ID}
                    buttonText="Logout"
                    onLogoutSuccess={this.onLogoutSuccess}
                  />
                )}
            </Toolbar>
          </AppBar>

          {signInError && <div>Sign on error: {signInError}</div>}
          <Route exact path='/'>
            <Home>
              {requireSignon(<></>)}
            </Home>
          </Route>
          <Route path='/new'>
            {requireSignon(<Creation
              eventHandlers={eventHandlers}
              handleNewSince={this.handleNewSince}
               {...eventHandlers}
               {...this.props}
               {...this.state}/>)}
          </Route>
          <Route path='/conflicts'>
            {requireSignon(<Conflicts
              eventHandlers={eventHandlers}
              {...eventHandlers}
              {...this.props}
              {...this.state}/>)}
          </Route>
          <Route path='/updates'>
          {requireSignon(<Updates
            eventHandlers={eventHandlers}
            handleUpdatesSince={this.handleUpdatesSince}
            {...eventHandlers}
            {...this.props}
            {...this.state}/>)}
          </Route>
        </div>
      </BrowserRouter>
      </div>
    )
  }
}

export default withStyles(useStyles)(App)
