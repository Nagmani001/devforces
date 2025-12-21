import { Input } from "./input"
import { Label } from "./label"


const TimePicker = ({ onChange }: any) => {
  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor='time-picker' className='px-1'>
        Time input
      </Label>
      <Input
        onChange={onChange}
        type='time'
        id='time-picker'
        step='1'
        defaultValue=''
        className='bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
      />
    </div>
  )
}

export default TimePicker 
