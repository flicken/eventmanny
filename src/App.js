import React from 'react'
import './App.css'

import Home from "./Home"
import UpdatesFilter from "./UpdatesFilter"

import {parseUpdatesSince} from "./dates"

import { DateTime } from "luxon"

import { withStyles } from '@material-ui/core/styles'
import Toolbar from '@material-ui/core/Toolbar'
import AppBar from '@material-ui/core/AppBar'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'

import RelativeDate from "./RelativeDate"

import RequireLogin from "./RequireLogin"

import { BrowserRouter, Route, Switch, NavLink, useLocation} from "react-router-dom"
import { withRouter } from "react-router"

import {addEvent, deleteEvent, fetchEventsFromAllCalendars, eventsSelectors} from "./redux/eventsSlice"
import {calendarsSelectors} from "./redux/calendarsSlice"
import {setVisibilityFilterSince} from "./redux/visibilitySlice"

import { connect } from 'react-redux'

import EventList from "./EventList"
import CalendarList from "./CalendarList"
import WithLoading from "./WithLoading"
import Agenda from "./Agenda"
import Schedules from "./Schedules"
import EventTable from "./EventTable"


import Grid from '@material-ui/core/Grid'

const GridWithLoading = WithLoading(Grid)


const useStyles = theme => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  })

const getAllVisibleEventIds = (state, location, filter) => {
  let recent = parseUpdatesSince(filter.since)
  let selectedCalendarIds = new Set(calendarsSelectors.selectAll(state)
    .filter(c => c.selected).map(c => c.id))

  let left
  let title
  switch (location.pathname) {
    case "/new":
      left = eventsSelectors.selectAll(state).filter(e =>
        selectedCalendarIds.has(e.calendarId) &&
        DateTime.fromISO(e.created).diff(recent).valueOf() > 0
      ).map(e => e.id)
      title = <>newly created since <RelativeDate date={recent}/></>
      break

    case "/updates":
      let startOfNextMonth = new DateTime({}).plus({month: 1, days: 3}).startOf("month")
      left = eventsSelectors.selectAll(state).filter(e =>
          selectedCalendarIds.has(e.calendarId) &&
          DateTime.fromISO(e.updated).diff(recent).valueOf() > 0 &&
          DateTime.fromMillis(e.start.ms).diff(startOfNextMonth).valueOf() < 0
        ).map(e => e.id)
        title = <>updates since <RelativeDate date={recent}/></>
        break

    case "/conflicts":
      left = eventsSelectors.selectAll(state).filter(e =>
          selectedCalendarIds.has(e.calendarId) &&
          state.events.conflicts[e.id]?.size > 0
        ).map(e => e.id)
      title = <>(nothing selected)</>
      break

    default:
      left = eventsSelectors.selectAll(state).filter(e =>
          selectedCalendarIds.has(e.calendarId)
        ).map(e => e.id)
      title = <>all</>
      break
  }

  let right
  let rightTitle
  switch (location.hash) {
    case "conflicts":
    case "":
      let allConflicts = new Set()
      left.forEach(id =>
        (state.events.conflicts[id] || new Set()).forEach(i => allConflicts.add(i))
      )
      left.forEach(id => allConflicts.delete(id))
      right = Array.from(allConflicts)
      if (title) {
        rightTitle = <>Conflicts with {title}</>
      } else {
        rightTitle = <>Select event to see conflicts</>
      }
      break

    default:
      let hash = location.hash?.substring(1)
      let event = eventsSelectors.selectById(state, hash)
      if (event) {
        let id = event.id
        let conflicts = state.events.conflicts[id]
        right = conflicts ? conflicts : new Set()
        rightTitle = `Conflicts with ${event.summary}`
      } else {
        right = []
        rightTitle = ""
      }
  }

  return {left, right: Array.from(right), rightTitle}
}

const mapStateToProps = (state, props) => {
    return {
      focusedEventId: props.location.hash?.substring(1),
      loading: !state.events.atLeastOneFetched,
    }
}

const leftEventsMapStateToProps = (state, props) => {
  const {left} = getAllVisibleEventIds(state, props.location, state.visibilityFilter)
  return {
    ids: left,
    eventCount: eventsSelectors.selectTotal(state),
    since: state.visibilityFilter.since,
    loading: !state.events.atLeastOneFetched,
  }
}

const LeftEventList = withRouter(connect(leftEventsMapStateToProps)(EventList))
const LeftAgenda = withRouter(connect(leftEventsMapStateToProps)(Agenda))

const ConnectedAgenda = connect((state, props) => {
  return {
    events: eventsSelectors.selectAll(state) || [],
  }
})(Agenda)



const rightEventsMapStateToProps = (state, props) => {
  const {right, rightTitle} = getAllVisibleEventIds(state, props.location, state.visibilityFilter)
  return {
    ids: right,
    title: rightTitle,
    eventCount: eventsSelectors.selectTotal(state),
    loading: !state.events.atLeastOneFetched,
  }
}

const RightEventList = withRouter(connect(rightEventsMapStateToProps)(EventList))


const mapDispatchToProps = (dispatch) => {
  return {
    onDelete: (e, event) => {
      console.log("Deleting...", event)
      dispatch(deleteEvent(event))
    },
    onAdd: e => {
      dispatch(addEvent(e))
    },
    onLoginCallback: () => {
      dispatch(fetchEventsFromAllCalendars())
    },
  }
}
function MyTabs({tabs}) {
  let location = useLocation()

  return <Tabs value={location.pathname} variant="fullWidth">
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
                              component={NavLink}
                              to={path} />
      )
    }
  </Tabs>
}

const tabs = [
  {label: "Home", path: "/"},
  {label: "Conflicts", path: "/conflicts"},
  {label: "New", path: "/new"},
  {label: "Updates", path: "/updates"},
  {label: "Agenda", path: "/agenda"},
]


const SignInError = connect((state) => {return {signInError: state.session.signInError}})(({signInError}) => {
  if (signInError) {
    return <div>Sign on error: {signInError}</div>
  } else {
    return <></>
  }
})

const ConnectedUpdatesFilter = connect((state) => {return {
  since: state.visibilityFilter.since,
}},
(dispatch) => {return {
  onValidated: value => dispatch(setVisibilityFilterSince(value))
}}
)(({since, onValidated}) => <UpdatesFilter title="since "
defaultValue={since}
placeholder="a week ago"
onValidated={onValidated}/>)

function InnerApp(props) {
    const { onDelete, onAdd, onLoginCallback, location} = props

    return (<>
          <AppBar position="static">
          <Toolbar>
          <MyTabs tabs={tabs}/>
          <div style={{flexGrow: 1}}/>
              <RequireLogin showLogin={true} showLogout={true} callback={onLoginCallback}/>
            </Toolbar>
          </AppBar>

          <SignInError/>
          <Switch>
            <Route exact path='/'>
              <Home>
                <RequireLogin showLogin={true}/>
              </Home>
            </Route>
            <Route path='/agenda'>
                    <ConnectedAgenda/>
            </Route>
            <Route path='/table'>
                  <EventTable/>
            </Route>
            <Route path='/schedules'>
                  <Schedules/>
            </Route>
            <Route path='/'>
              <RequireLogin showLogin={true}>
                <GridWithLoading className={props.classes.root} container isLoading={props.loading} spacing={3} direction="row">
                <Grid item xs={2}>
                    <CalendarList/>
                </Grid>
                 <Grid item xs={3}>
                        <LeftEventList
                          showLink={true}
                          onDelete={onDelete}
                          path={location.path}
                          selectedEventId={location.hash?.substring(1)}
                          onAdd={onAdd}
                          title={<ConnectedUpdatesFilter/>}
                        />
                  </Grid>
                  <Grid item xs={3}>
                    <RightEventList location={location}/>
                  </Grid>
                </GridWithLoading>
              </RequireLogin>
            </Route>
          </Switch>
          </>
    )
  }

const InnerAppWithRouter = withStyles(useStyles)(withRouter(connect(mapStateToProps, mapDispatchToProps)(InnerApp)))

function App(props) {
  return (
    <BrowserRouter initialIndex={0}>
            <InnerAppWithRouter {...props}/>
    </BrowserRouter>
  )
}
export default App
