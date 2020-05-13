import React from 'react'

import {eventsSelectors, addEventToSchedule, removeEventFromSchedule} from "./redux/eventsSlice"
import { connect } from 'react-redux'

import EventList from "./EventList"

function Schedules({ids, scheduleIds, onClick, removeFromSchedule, ...props}) {
    return (<><EventList
                ids = {ids}
                showLink={true}
                onClick={(reactEvent, event) => onClick(event, "Brian - Chor")}
                //onDelete={onDelete}
                // selectedEventId={location.hash?.substring(1)}
                // onAdd={onAdd}
                title="Schedule"
                            />
            <EventList
                        ids = {scheduleIds}
                        showLink={true}
                        onClick={(reactEvent, event) => removeFromSchedule(event, "Brian - Chor")}
                        //onDelete={onDelete}
                        // selectedEventId={location.hash?.substring(1)}
                        // onAdd={onAdd}
                        title="On Schedule"
                                    /></>)
}

const mapStateToProps = (state) => {
  const isOnSchedule = e => e.extendedProperties?.private?.ems?.includes("Brian - Chor")

  const eventIds = eventsSelectors.selectAll(state).filter(e =>
        e.summary.includes("Brian - Chor")
      ).filter(e => !isOnSchedule(e)).map(e => e.id)
  const scheduleIds = eventsSelectors.selectAll(state).filter(isOnSchedule).map(e => e.id)
  return {
    ids: eventIds,
    scheduleIds: scheduleIds,
  }
}
const mapDispatchToProps = (dispatch) => {
  return {
      onClick: (event, schedule) =>
          dispatch(addEventToSchedule({event, schedule})),
      removeFromSchedule: (event, schedule) =>
        dispatch(removeEventFromSchedule({event, schedule})),
  }
}
const ConnectedSchedules = connect(mapStateToProps, mapDispatchToProps)(Schedules)

export default ConnectedSchedules
