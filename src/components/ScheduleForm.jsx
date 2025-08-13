import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { timeToMinutes, minutesToTime, allTimeSlots } from '../utils/timeUtils';
import {
  CalendarDays,
  Building,
  BookOpen,
  Users,
  User,
  Clock,
  Timer,
  Hourglass,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const ScheduleForm = ({
  rooms,
  days,
  subjects,
  sections,
  faculty,
  onAddSchedule,
  schedules,
  editingSchedule,
  selectedProgram,
  selectedSemester,
  selectedYearLevel,
}) => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [subject, setSubject] = useState('');
  const [section, setSection] = useState('');
  const [facultyMember, setFacultyMember] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (editingSchedule) {
      setSubject(editingSchedule.subject);
      setSection(editingSchedule.section);
      setFacultyMember(editingSchedule.faculty);
      setStartTime(editingSchedule.startTime);
      setDuration(editingSchedule.duration);
      setSelectedRoom(editingSchedule.room);
      setSelectedDay(editingSchedule.day);
      setMessage('');
    } else {
      setSubject('');
      setSection('');
      setFacultyMember('');
      setStartTime('');
      setDuration(60);
      setSelectedRoom('');
      setSelectedDay('');
      setMessage('');
    }
  }, [editingSchedule]);

  useEffect(() => {
    if (startTime && duration) {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = startMinutes + parseInt(duration, 10);
      setEndTime(minutesToTime(endMinutes));
    } else {
      setEndTime('');
    }
  }, [startTime, duration]);

  const checkConflict = useCallback(
    (newSchedule) => {
      const newStartMinutes = timeToMinutes(newSchedule.startTime);
      const newEndMinutes = newStartMinutes + parseInt(newSchedule.duration, 10);

      for (const existing of schedules) {
        if (editingSchedule && existing.id === editingSchedule.id) continue;

        const existingStart = timeToMinutes(existing.startTime);
        const existingEnd = existingStart + existing.duration;
        const hasOverlap = newStartMinutes < existingEnd && newEndMinutes > existingStart;

        if (existing.day === newSchedule.day && hasOverlap) {
          if (existing.room === newSchedule.room)
            return `Room Conflict: ${existing.room} is already occupied.`;
          if (existing.section === newSchedule.section)
            return `Section Conflict: ${existing.section} has another class.`;
          if (existing.faculty === newSchedule.faculty)
            return `Faculty Conflict: ${existing.faculty} has another class.`;
        }
      }
      return null;
    },
    [schedules, editingSchedule]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject || !section || !facultyMember || !startTime || !duration || !selectedRoom || !selectedDay) {
      setMessageType('error');
      setMessage('Please fill in all required fields.');
      return;
    }

    const newSchedule = {
      id: editingSchedule ? editingSchedule.id : Date.now().toString(),
      subject,
      section,
      faculty: facultyMember,
      startTime,
      duration: parseInt(duration, 10),
      endTime,
      room: selectedRoom,
      day: selectedDay,
      program: selectedProgram,
      semester: selectedSemester,
      yearLevel: selectedYearLevel,
    };

    const conflict = checkConflict(newSchedule);
    if (conflict) {
      setMessageType('error');
      setMessage(conflict);
      return;
    }

    onAddSchedule(newSchedule);
    setMessageType('success');
    setMessage(`Schedule has been ${editingSchedule ? 'updated' : 'added'} successfully.`);
  };

  const durationOptions = Array.from({ length: 11 }, (_, i) => 30 * (i + 1));

  const FormLabel = ({ icon, children }) => (
    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
      {icon}
      {children}
    </Label>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FormLabel icon={<CalendarDays className="w-4 h-4 text-muted-foreground"/>}>Day</FormLabel>
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger><SelectValue placeholder="Select Day" /></SelectTrigger>
            <SelectContent>
              {days.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <FormLabel icon={<Building className="w-4 h-4 text-muted-foreground"/>}>Room</FormLabel>
          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
            <SelectTrigger><SelectValue placeholder="Select Room" /></SelectTrigger>
            <SelectContent>
              {rooms.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <FormLabel icon={<BookOpen className="w-4 h-4 text-muted-foreground"/>}>Subject</FormLabel>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FormLabel icon={<Users className="w-4 h-4 text-muted-foreground"/>}>Section</FormLabel>
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
            <SelectContent>
              {sections.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <FormLabel icon={<User className="w-4 h-4 text-muted-foreground"/>}>Faculty</FormLabel>
          <Select value={facultyMember} onValueChange={setFacultyMember}>
            <SelectTrigger><SelectValue placeholder="Select Faculty" /></SelectTrigger>
            <SelectContent>
              {faculty.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <FormLabel icon={<Clock className="w-4 h-4 text-muted-foreground"/>}>Start Time</FormLabel>
          <Select value={startTime} onValueChange={setStartTime}>
            <SelectTrigger><SelectValue placeholder="Select Time" /></SelectTrigger>
            <SelectContent>
              {allTimeSlots.slice(0, -1).map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <FormLabel icon={<Timer className="w-4 h-4 text-muted-foreground"/>}>Duration</FormLabel>
          <Select value={String(duration)} onValueChange={(val) => setDuration(Number(val))}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {durationOptions.map((d) => (<SelectItem key={d} value={String(d)}>{`${d} mins`}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <FormLabel icon={<Hourglass className="w-4 h-4 text-muted-foreground"/>}>End Time</FormLabel>
          <Input type="text" value={endTime} readOnly className="bg-gray-100 focus:ring-0"/>
        </div>
      </div>

      <div className="pt-2 space-y-4">
        {message && (
          <div
            className={`flex items-center gap-3 rounded-lg p-3 text-sm ${
              messageType === 'error'
                ? 'bg-red-50 text-red-800'
                : 'bg-green-50 text-green-800'
            }`}
          >
            {messageType === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
            <span>{message}</span>
          </div>
        )}
        <div className="flex justify-end">
          <Button type="submit">
            {editingSchedule ? "Update Schedule" : "Add Schedule"}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ScheduleForm;