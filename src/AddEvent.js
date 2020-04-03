import React from 'react';

import { useForm } from 'react-hook-form'

export default function AddEvent(props) {
  const { register, handleSubmit, watch, errors } = useForm()

  return (
    <form onSubmit={handleSubmit(props.onSubmit)}>
      <input type="text" name="summary" ref={register({ required: true })}/>
      <input name="datetimes" ref={register({ required: true })} placeholder="e.g. Monday, 11-12"/>
      <input type="submit" />
    </form>
  )

  return <form>
  </form>
}
