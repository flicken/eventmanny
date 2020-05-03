import React from 'react'
import { useTable,
  useBlockLayout,
  useGlobalFilter,
  useRowSelect,

} from 'react-table'
import { FixedSizeList } from 'react-window'

import Event from "./Event"

import {useWhyDidYouUpdate} from 'use-why-did-you-update'

import GlobalFilter from "./components/GlobalFilter"
import IndeterminateCheckbox from "./components/IndeterminateCheckbox"

function Table({ columns, data, title, classes }) {

  // Use the state and functions returned from useTable to build your UI

  const defaultColumn = React.useMemo(
    () => ({
      width: 500,
    }),
    []
  )

  const {
    getTableProps,
    getTableBodyProps,
    headers,
    rows,
    totalColumnsWidth,
    prepareRow,
    setGlobalFilter,
    selectedFlatRows,
    state,
    state: { selectedRowIds },
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

  const RenderRow = React.useCallback(
    ({ index, style }) => {
      const row = rows[index]
      prepareRow(row)

      return (
        <div
          {...row.getRowProps({
            style,
          })}
          className="tr"
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
      )
    },
    [prepareRow, rows, selectedRowIds]
  )


  // Render the UI for your table
  return (
    <div className="event-container">
    <h4>{title}</h4>
    <div {...getTableProps()} className="table">
      <GlobalFilter
        globalFilter={state.globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
      <div>
        {headers.map(header => (
          <div {...header.getHeaderProps()} className="tr">
            {header.render('Header')}
          </div>
        ))}
      </div>

      <div {...getTableBodyProps()}>
        <FixedSizeList
          className={classes?.root}
          height={1000}
          itemCount={rows.length}
          itemSize={100}
          width={totalColumnsWidth}
        >
          {calendars.map(calendar => RenderRow(calendar))}
        </FixedSizeList>
      </div>
    </div>
    <p>Selected Rows: {Object.keys(selectedRowIds).length}</p>
    <pre>
      <code>
        {JSON.stringify(
          {
            selectedRowIds: selectedRowIds,
            'selectedFlatRows[].original': selectedFlatRows.map(
              d => d.original
            ),
          },
          null,
          2
        )}
      </code>
    </pre>
    </div>
  )
}

function EventTable(props) {
  useWhyDidYouUpdate('EventTable', props)
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
      <Table columns={columns} data={props.events} />
  )
}

export default EventTable
