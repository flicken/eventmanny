import React from 'react'

import { useForm } from 'react-hook-form'

import {parseUpdatesSince} from "./dates"

export default function UpdatesFilter(props) {
  const {onValidated, title} = props
  const { register, handleSubmit, formState: { errors } } = useForm({
    mode: 'onBlur',
  })

  return (
    <form onSubmit={handleSubmit( onValidated)}>
      {title} <input
          type="text"
          name="since"
          defaultValue={props.defaultValue}
          placeholder={props.placeholder}
          {...register("since", { required: true, validate: value => parseUpdatesSince(value) && onValidated(value) })}
          />
      {errors.since && <div style={{color:"red"}}>Invalid relative date time, try "a week ago"</div>}
    </form>
  )
}
