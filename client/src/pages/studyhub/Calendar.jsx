import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

const Calendar = ({ size }) => {
  return (
    <CalendarIcon size={size || 24} />
  );
};

export default Calendar;
