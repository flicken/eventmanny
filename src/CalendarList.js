import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {calendarsSelectors, toggleSelectedCalendar} from "./redux/calendarsSlice"
import { connect } from 'react-redux'

import { useTable,
  useBlockLayout,
  useGlobalFilter,
  useRowSelect,

} from 'react-table'

import GlobalFilter from "./components/GlobalFilter"
import IndeterminateCheckbox from "./components/IndeterminateCheckbox"

const drawerWidth = 240;


const rolePriority = {
  owner: 1,
  writer: 2,
  reader: 3,
  freeBusyReader: 4,
}
const compareRoles = (a, b) => rolePriority[a] - rolePriority[b]

const mapDispatchToProps = (dispatch) => {
  return {
    onCalendarToggled: calendarId => dispatch(toggleSelectedCalendar(calendarId))
  }
}

const mapStateToProps = (state) => {
  let calendars = calendarsSelectors.selectAll(state)
  calendars.sort((a, b) => {
    return (a.primary ? (b.primary ? 0 : -1) : (b.primary ? 1 : 0)) ||
      compareRoles(a.accessRole, b.accessRole) ||
      a.summary.localeCompare(b.summary)
  })
  return {calendars}
}

const useStyles = makeStyles((theme) => ({
  }));

function CalendarList(props) {
  const { calendars, onCalendarToggled } = props;
  const classes = useStyles();

  const columns = React.useMemo(
    () => [
      {
        Header: ({state, setGlobalFilter}) => <GlobalFilter globalFilter={state.globalFilter} setGlobalFilter={setGlobalFilter}/>,
        Cell: ({value}) => <>{value}</>,
        accessor: 'summary',
        width: 200,
      }
    ],
    []
  )


  const {
    getTableProps,
    getTableBodyProps,
    headers,
    rows,
    totalColumnsWidth,
    prepareRow,
  } = useTable(
    {
      columns,
      data: calendars,
      initialState: {
        selectedRowIds: calendars.filter(c => c.selected).map(c => c.id),
      },
    },
    useBlockLayout,
    useGlobalFilter,
    useRowSelect,
    hooks => {
      hooks.visibleColumns.push(columns => [
        {
          id: 'selection',
          width: 30,
          Header: ({ getToggleAllRowsSelectedProps }) => (
              <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} disabled={true}/>
          ),
          Cell: ({ row }) => (
              <IndeterminateCheckbox  disabled={true}
              {...row.getToggleRowSelectedProps()}
              onChange={(event, a) => {
                onCalendarToggled(row.original.id)
                row.getToggleRowSelectedProps().onChange(event)
              }}/>
          ),
        },
        ...columns,
      ])
    },
  )

  return (
      <nav {...getTableProps()} width={totalColumnsWidth} className={classes.drawer} aria-label="calendars">
            <div>
              {headers.map(header => (
                <div {...header.getHeaderProps()} className="tr">
                  {header.render('Header')}
                </div>
              ))}
              <div {...getTableBodyProps()}>
              {rows.map((row, i) => {
                prepareRow(row)
                return (
                  <div {...row.getRowProps()}>
                    {row.cells.map(cell => {
                      return <div {...cell.getCellProps()}>{cell.render('Cell')}</div>
                    })}
                  </div>
                )
              })}
              </div>
            </div>
      </nav>
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(CalendarList)
