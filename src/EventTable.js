import React from 'react'
import { useTable,
  useBlockLayout,
  useGlobalFilter,
  useRowSelect,

} from 'react-table'
import { List, CellMeasurer, CellMeasurerCache, ArrowKeyStepper, AutoSizer } from 'react-virtualized'

import Event from "./Event"

import GlobalFilter from "./components/GlobalFilter"
import IndeterminateCheckbox from "./components/IndeterminateCheckbox"

import {eventsSelectors, addEventToSchedule, removeEventFromSchedule} from "./redux/eventsSlice"

import { connect } from 'react-redux'

function Table({ columns, data, title, classes }) {
  const cache = React.useMemo(() => new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 100
  }), [])

  const defaultColumn = React.useMemo(
    () => ({
      width: 500,
    }),
    []
  )

  const [scrollState, setScrollState] = React.useState({scrollToColumn: 0, scrollToRow: 0})

  const {
    getTableProps,
    getTableBodyProps,
    headers,
    rows,
    totalColumnsWidth,
    prepareRow,
    setGlobalFilter,
    selectedFlatRows,
    state: { selectedRowIds, globalFilter },
    state,
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      initialState: {
        hiddenColumns: ['summary']
      },
    },
    useBlockLayout,
    useGlobalFilter,
    useRowSelect,
    hooks => {
      hooks.visibleColumns.push(columns => [
        // Let's make a column for selection
        {
          id: 'selection',
          // The header can use the table's getToggleAllRowsSelectedProps method
          // to render a checkbox
          width: 30,
          Header: ({ getToggleAllRowsSelectedProps }) => (
            <div>
              <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
            </div>
          ),
          // The cell can use the individual row's getToggleRowSelectedProps method
          // to the render a checkbox
          Cell: ({ row }) => (
            <div>
              <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
            </div>
          ),
        },
        ...columns,
      ])
    },
  )

  const rowRenderer = React.useCallback(
    ({ index, isScrolling, key, style, parent }) => {
      const row = rows[index]
      prepareRow(row)
      return (
          <CellMeasurer
            key={key}
            cache={cache}
            parent={parent}
            columnIndex={0}
            rowIndex={index}
          >
        <div
          key={key} style={style}
          {...row.getRowProps({
            style,
          })}
          className="tr"
          onClick={() =>
              setScrollState({
                scrollToColumn: 0,
                scrollToRow: index,
              })}
        >
          {row.cells.map(cell => {
            prepareRow(row)
            return (
              <div {...cell.getCellProps()} className="td">
                {cell.render('Cell')}
              </div>
            )
          })}
        </div>
        </CellMeasurer>
      )
    },
    [prepareRow, rows, selectedRowIds]
  )


  // Render the UI for your table
  return (
    <div className="event-container">
    <h4>{title}</h4>
    <div {...getTableProps()} className="table">
      <div>
        {headers.filter(h => h.isVisible).map(header => {
          if (header.id === "event") {
            return <GlobalFilter className="tr"
                      globalFilter={globalFilter}
                      setGlobalFilter={setGlobalFilter}
                    />
          } else {
          return  (<div {...header.getHeaderProps()} className="tr">
            {header.render('Header')}
          </div>)
          }
      })}
      </div>

      <div {...getTableBodyProps()}>
      <ArrowKeyStepper
        columnCount={1}
        isControlled={true}
        onScrollToChange={setScrollState}
        mode={"cells"}
        rowCount={100}
        scrollToColumn={scrollState.scrollToColumn}
        scrollToRow={scrollState.scrollToRow}>
        {({onSectionRendered, scrollToColumn, scrollToRow}) => (
          <List
          className={classes?.root}
            rowCount={rows.length}
            width={totalColumnsWidth}
            height={600}
            deferredMeasurementCache={cache}
            rowHeight={cache.rowHeight}
            rowRenderer={args => rowRenderer({scrollToRow, scrollToColumn, ...args})}
            overscanRowCount={3}
            onSectionRendered={onSectionRendered}
            scrollToColumn={scrollToColumn}
            scrollToRow={scrollToRow}
          />)}
        </ArrowKeyStepper>
      </div>
    </div>
    </div>
  )
}

function EventTable(props) {
  const columns = React.useMemo(
    () => [
      {
        Header: '',
        id: 'event',
        Cell: ({row}) => <Event id={row.id} event={row.original}/>,
        width: 400,
      },
      {
        Header: 'summary',
        accessor: 'summary',
      },
    ],
    []
  )

  return (
      <Table columns={columns} data={props.events}/>
  )
}

const mapStateToProps = (state) => {
  const isOnSchedule = e => e.extendedProperties?.private?.ems?.includes("Brian - Chor")

  const events = eventsSelectors.selectAll(state)
  // .filter(e =>
  //       e.summary.includes("Brian - Chor")
  //     ).filter(e => !isOnSchedule(e))
  // const scheduleIds = eventsSelectors.selectAll(state).filter(isOnSchedule).map(e => e.id)
  return {
    events: events,
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
const ConnectedEventTable = connect(mapStateToProps, mapDispatchToProps)(EventTable)

export default ConnectedEventTable
