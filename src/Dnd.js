// @flow
import React from 'react'
import ReactDOM from 'react-dom'
import 'react-virtualized/styles.css'
import { WindowScroller,
  List,
  CellMeasurer,
  CellMeasurerCache
} from 'react-virtualized'

import {
  Droppable,
  Draggable,
  DragDropContext,
} from 'react-beautiful-dnd'
import Event from "./Event"
import {eventsSelectors} from "./redux/eventsSlice"
import { connect } from 'react-redux'

import styled from '@emotion/styled'
import { colors } from '@atlaskit/theme'

function getStyle(provided, style) {
  if (!style) {
    return provided.draggableProps.style
  }

  return {
    ...provided.draggableProps.style,
    ...style,
  }
}

const grid = 0
const borderRadius = 2

const getBackgroundColor = (
  isDragging: boolean,
  isGroupedOver: boolean,
  authorColors: AuthorColors,
) => {
  if (isDragging) {
    return authorColors.soft;
  }

  if (isGroupedOver) {
    return colors.N30;
  }

  return colors.N0;
};

const getBorderColor = (isDragging: boolean, authorColors: AuthorColors) =>
  isDragging ? authorColors.hard : 'transparent';

const imageSize: number = 0;

const Container = styled.div`
  border-radius: ${borderRadius}px;
  border: 2px solid transparent;
  border-color: ${(props) => getBorderColor(props.isDragging, props.colors)};
  background-color: ${(props) =>
    getBackgroundColor(props.isDragging, props.isGroupedOver, props.colors)};
  box-shadow: ${({ isDragging }) =>
    isDragging ? `2px 2px 1px ${colors.N70}` : 'none'};
  box-sizing: border-box;
  padding: ${grid}px;
  min-height: ${imageSize}px;
  margin-bottom: ${grid}px;
  user-select: none;

  /* anchor overrides */
  color: ${colors.N900};

  &:hover,
  &:active {
    color: ${colors.N900};
    text-decoration: none;
  }

  &:focus {
    outline: none;
    border-color: ${(props) => props.colors.hard};
    box-shadow: none;
  }

  /* flexbox */
  display: flex;
`;

const eventColors = {
  hard: "#FF6347",
  soft: "#FF6347"
}


const makeMapStateToProps = () => (state, props) => {
  return {
    event: eventsSelectors.selectById(state, props.eventId),
    conflicts: state.events?.conflicts[props.eventId],
  }
}

const ConnectedEvent = connect(makeMapStateToProps)(Event)

function DraggableEvent({
  event,
  isDragging,
  isGroupedOver,
  provided,
  style,
  isClone,
  index,
}) {
  // <Event
  //   ref={provided.innerRef}
  //   {...provided.draggableProps}
  //   {...provided.dragHandleProps}
  //   style={getStyle(provided, style)}
  //   event={event}/>

  return <Container
    isDragging={isDragging}
    isGroupedOver={isGroupedOver}
    isClone={isClone}
    colors={eventColors}
    ref={provided.innerRef}
    {...provided.draggableProps}
    {...provided.dragHandleProps}
    style={getStyle(provided, style)}
    data-is-dragging={isDragging}
    data-testid={event.id}
    data-index={index}
    aria-label={`event ${event.summary}`}
  >
   <ConnectedEvent eventId={event.id}/>
  </Container>
}

function Dnd({events, schedules, ...props}) {
  function onDragEnd(result) {
    console.log("onDragEnd", result)
    // if (result. )
  }

  const cache = React.useMemo(() => new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 125,
    events: events,
  }), [events])

  const rowRenderer = React.useCallback(
    ({ index, isScrolling, key, style, parent }) => {
      const event = events[index]

      return (
            <Draggable draggableId={event.id} index={index} key={event.id}>
              {(provided, snapshot) => (
                <CellMeasurer
                  key={key}
                  cache={cache}
                  parent={parent}
                  columnIndex={0}
                  rowIndex={index}
                >
                  <DraggableEvent
                    provided={provided}
                    event={event}
                    isDragging={snapshot.isDragging}
                    style={{ margin: 0, ...style }}
                    index={index}
                  />
            </CellMeasurer>
          )}
          </Draggable>
      )
    },
    [events, cache]
  )

  const droppableProps = {
    mode: "virtual",
    renderClone: (
      provided,
      snapshot,
      rubric,
    ) => (
        <DraggableEvent
          provided={provided}
          isDragging={snapshot.isDragging}
          event={{...events[rubric.source.index], summary: "Dragging..."}}
          style={{ margin: 0 }}
          index={rubric.source.index}
        />
      ),
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <ul>
         {schedules.map(schedule => {
           return (<Droppable
              {...droppableProps}
              droppableId = {`schedule/${schedule.id}`}
              >
              {(provided, snapshot) => (
                  <div
                     ref={provided.innerRef}
                     style={{ backgroundColor: snapshot.isDraggingOver ? 'blue' : 'grey' }}
                     {...provided.droppableProps}
                     >
                     <li key={schedule.id}>{schedule.name}</li>
               </div>
             )}
             </Droppable>)
           })}
    </ul>

      <Droppable
        droppableId="droppable"
        isDropDisabled={true}
        mode="virtual"
        renderClone={(
          provided,
          snapshot,
          rubric,
        ) => (
          <DraggableEvent
            provided={provided}
            isDragging={snapshot.isDragging}
            event={{...events[rubric.source.index], summary: "Dragging..."}}
            style={{ margin: 0 }}
            index={rubric.source.index}
          />
        )}
      >
        {(droppableProvided) => (
          <WindowScroller>
            {({ height, isScrolling, onChildScroll, scrollTop }) => (
              <List
                autoHeight
                rowCount={events.length}
                height={height}
                isScrolling={isScrolling}
                onScroll={onChildScroll}
                scrollTop={scrollTop}
                deferredMeasurementCache={cache}
                rowHeight={cache.rowHeight}
                width={300}
                ref={(ref) => {
                  console.log("Getting ref", ref)
                  // react-virtualized has no way to get the list's ref that I can find
                  // so we use the `ReactDOM.findDOMNode(ref)` escape hatch to get the ref
                  if (ref) {
                    const whatHasMyLifeComeTo = ReactDOM.findDOMNode(ref)
                    console.log("whatHasMyLifeComeTo", whatHasMyLifeComeTo)

                    if (whatHasMyLifeComeTo instanceof HTMLElement) {
                      console.log("setting ref", whatHasMyLifeComeTo)
                      droppableProvided.innerRef(whatHasMyLifeComeTo)
                    }
                  }
                }}
                rowRenderer={rowRenderer}
              />
            )}
          </WindowScroller>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default Dnd
