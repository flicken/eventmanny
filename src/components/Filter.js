import React from "react"

import {useState} from "react"

const Filter = ({ filter, onChange, placeholder, onFocus, ...rest }) => {
  const [value, setValue] = useState(filter)

  return (
    <input
      {...rest}
      value={value || ""}
      onChange={e => {
        let v = e.target.value
        setValue(v)
        onChange(v)
      }}
      onFocus={onFocus}
      placeholder={placeholder}
    />
  )
}

Filter.defaultProps = {
  placeholder: "Search events..."
}

export default Filter
