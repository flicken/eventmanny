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
import WithLoading from "./WithLoading"

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
  console.time('getAllVisibleEventIds')

  let recent = parseUpdatesSince(filter.since)

  let left
  let title
  switch (location.pathname) {
    case "/new":
      left = eventsSelectors.selectAll(state).filter(e =>
        DateTime.fromISO(e.created).diff(recent).valueOf() > 0
      ).map(e => e.id)
      title = <>newly created since <RelativeDate date={recent}/></>
      break

    case "/updates":
      let startOfNextMonth = new DateTime({}).plus({month: 1, days: 3}).startOf("month")
      left = eventsSelectors.selectAll(state).filter(e =>
          DateTime.fromISO(e.updated).diff(recent).valueOf() > 0 &&
          DateTime.fromMillis(e.start.ms).diff(startOfNextMonth).valueOf() < 0
        ).map(e => e.id)
        title = <>updates since <RelativeDate date={recent}/></>
        break

    case "/conflicts":
      left = state.events.ids.filter(id => state.events.conflicts[id]?.length)
      title = <>(nothing selected)</>
      break

    default:
      left = state.events.ids
      title = <>all</>
      break
  }

  let right
  let rightTitle
  switch (location.hash) {
    case "conflicts":
    case "":
      let allConflicts = new Set(left.flatMap(id =>
        state.events.conflicts[id] || []
      ))
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
        right = conflicts ? conflicts : []
        rightTitle = `Conflicts with ${event.summary}`
      } else {
        right = []
        rightTitle = ""
      }
  }

  console.timeEnd('getAllVisibleEventIds')
  return {left, right, rightTitle}
}

const mapStateToProps = (state, props) => {
    return {
      calendars: calendarsSelectors.selectAll(state),
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
    const { classes, onDelete, onAdd, onLoginCallback, location, calendars} = props

    return (<>
        <div className={classes.root}>
          <AppBar position="static">
          <Toolbar>
          <MyTabs tabs={tabs}/>
          <div style={{flexGrow: 1}}/>
              <RequireLogin showLogout={true} callback={onLoginCallback}/>
            </Toolbar>
          </AppBar>
          </div>

          <SignInError/>
          <Switch>
            <Route exact path='/'>
              <Home>
                <RequireLogin/>
              </Home>
            </Route>
            <Route path='/'>
              <RequireLogin>
                <GridWithLoading className={props.classes.root} container isLoading={props.loading} spacing={3}>
                 <Grid item xs={6}>
                        <ul>
                        {calendars.filter(c => c.selected).map( calendar => {
                          return <li key={calendar.id} title={calendar.id}>{calendar.summary}</li>
                        })
                        }
                        </ul>
                        <LeftEventList
                          showLink={true}
                          onDelete={onDelete}
                          path={location.path}
                          selectedEventId={location.hash?.substring(1)}
                          onAdd={onAdd}
                          title={<ConnectedUpdatesFilter/>}
                        />
                  </Grid>
                    <Grid item xs={6}>
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
