import React, { useEffect, useMemo, useState } from "react";
import ScheduleForm from "./components/ScheduleForm";
import TimeSlotGrid from "./components/TimeSlotGrid";
import SchedulePreviewModal from "./components/SchedulePreviewModal";
import ExportPDFButton from "./components/ExportPDFButton";
import { ThemeProvider } from "./components/theme-provider";
import { ModeToggle } from "./components/mode-toggle"; // Make sure you have this component
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import {
  initialRooms,
  initialDays,
  initialSubjects,
  initialSections,
  initialFaculty,
} from "./data/initialData";
import { db } from "../src/firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { PlusCircle } from "lucide-react";

const App = () => {
  const [schedules, setSchedules] = useState([]);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedDay, setSelectedDay] = useState(initialDays[0]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("IT");
  const [selectedSemester, setSelectedSemester] = useState("1st Semester");
  const [selectedYearLevel, setSelectedYearLevel] = useState("1st Year");
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFilterBy, setPreviewFilterBy] = useState(null);
  

  const schedulesCollection = collection(db, "schedules");

  useEffect(() => {
    const fetchSchedules = async () => {
      const querySnapshot = await getDocs(schedulesCollection);
      const data = querySnapshot.docs.map((doc) => doc.data());
      setSchedules(data);
    };
    fetchSchedules();
  }, []);

  const addOrUpdateSchedule = async (newSchedule) => {
    setSchedules((prev) => {
      const exists = prev.some((s) => s.id === newSchedule.id);
      return exists
        ? prev.map((s) => (s.id === newSchedule.id ? newSchedule : s))
        : [newSchedule, ...prev]; 
    });
    setEditingSchedule(null);
    await setDoc(doc(db, "schedules", newSchedule.id.toString()), newSchedule);
    setIsFormOpen(false);
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    await deleteDoc(doc(db, "schedules", id.toString()));
  };

  const handleFormOpenChange = (open) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingSchedule(null);
    }
  };

  const isMidyear = selectedSemester === "Midyear";
  const filteredSubjects = isMidyear
    ? initialSubjects?.[selectedProgram]?.[selectedSemester] || []
    : initialSubjects?.[selectedProgram]?.[selectedSemester]?.[0]?.[
        selectedYearLevel
      ] || [];

  const filteredSections = isMidyear
    ? Object.values(initialSections[selectedProgram]).flat()
    : initialSections?.[selectedProgram]?.[selectedYearLevel] || [];

  const filteredForPreview = () => {
    if (!previewFilterBy) return schedules;
    const grouped = {};
    for (const sched of schedules) {
      const key = sched[previewFilterBy];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(sched);
    }
    return Object.entries(grouped).flatMap(([group, items]) => [
      { id: `group-${group}`, groupLabel: group, isGroup: true },
      ...items,
    ]);
  };

  const handleOpenPreview = (filter) => {
    setPreviewFilterBy(filter);
    setPreviewModalOpen(true);
  };

  const recentSchedules = useMemo(() => {

    return [...schedules]
      .sort((a, b) => b.id - a.id)
      .slice(0, 5);
  }, [schedules]);

  return (
    // Wrap your entire app in the ThemeProvider
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {/* Use semantic 'background' color from shadcn which adapts to the theme */}
      <div className="min-h-screen bg-background">
        {/* Use adaptive colors for the navbar */}
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-4">
                <img
                  width="50"
                  height="50"
                  src="/cvsu_logo.png"
                  alt="CVSU DCS"
                />
                <div>
                  {/* Use 'foreground' for primary text */}
                  <h1 className="text-xl font-bold text-foreground">
                    DCS Faculty Room Scheduling
                  </h1>
                  {/* Use 'muted-foreground' for secondary text */}
                  <p className="text-sm text-muted-foreground">
                    Cavite State University - Department of Computer Studies
                  </p>
                </div>
              </div>
              {/* Add the ModeToggle button to the navbar */}
              <ModeToggle />
            </div>
          </div>
        </nav>

        <main className="p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-screen-2xl mx-auto">
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Schedule Filters</CardTitle>
                <CardDescription>
                  Select program, semester, and year to view available options.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    {/* Use muted-foreground for labels */}
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Program
                    </label>
                    <Select
                      value={selectedProgram}
                      onValueChange={setSelectedProgram}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(initialSubjects).map((prog) => (
                          <SelectItem key={prog} value={prog}>
                            {prog}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Semester
                    </label>
                    <Select
                      value={selectedSemester}
                      onValueChange={setSelectedSemester}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(initialSubjects[selectedProgram]).map(
                          (sem) => (
                            <SelectItem key={sem} value={sem}>
                              {sem}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-muted-foreground">
                      Year Level
                    </label>
                    <Select
                      value={selectedYearLevel}
                      onValueChange={setSelectedYearLevel}
                      disabled={isMidyear}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(initialSections[selectedProgram]).map(
                          (year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recently Added</CardTitle>
                <CardDescription>The last 5 schedules created.</CardDescription>
              </CardHeader>
              <CardContent>
                {recentSchedules.length > 0 ? (
                  <div className="space-y-3">
                    {recentSchedules.map((sched) => (
                      // Add adaptive border color
                      <div
                        key={sched.id}
                        className="text-sm p-3 border rounded-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold leading-tight">{sched.subject}</p>
                            <p className="text-xs text-muted-foreground">{sched.faculty}</p>
                          </div>
                          <Badge variant="outline">{sched.room}</Badge>
                        </div>
                        {/* Add adaptive border color for the top border */}
                        <div className="text-xs font-medium text-muted-foreground pt-2 mt-2 border-t">
                          {sched.day}, {sched.startTime} - {sched.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">
                    No schedules have been added yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Time Slots</CardTitle>
                  <CardDescription>
                    Select a day to view the schedule.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <ExportPDFButton schedules={schedules} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">Preview</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleOpenPreview(null)}>
                        All
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenPreview("room")}>
                        By Room
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenPreview("faculty")}
                      >
                        By Faculty
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenPreview("section")}
                      >
                        By Section
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Dialog open={isFormOpen} onOpenChange={handleFormOpenChange}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Schedule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {editingSchedule
                            ? "Edit Schedule"
                            : "Add New Schedule"}
                        </DialogTitle>
                      </DialogHeader>
                      <ScheduleForm
                        rooms={initialRooms}
                        days={initialDays}
                        subjects={filteredSubjects}
                        sections={filteredSections}
                        faculty={initialFaculty}
                        schedules={schedules}
                        onAddSchedule={addOrUpdateSchedule}
                        editingSchedule={editingSchedule}
                        selectedProgram={selectedProgram}
                        selectedSemester={selectedSemester}
                        selectedYearLevel={selectedYearLevel}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={initialRooms[0]}>
                  <TabsList className="flex-wrap h-auto justify-start">
                    {initialRooms.map((room) => (
                      <TabsTrigger key={room} value={room}>
                        {room}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="my-4">
                    <Select value={selectedDay} onValueChange={setSelectedDay}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {initialDays.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {initialRooms.map((room) => (
                    <TabsContent key={room} value={room}>
                      <TimeSlotGrid
                        selectedDay={selectedDay}
                        selectedRoom={room}
                        schedules={schedules.filter(
                          (s) => s.room === room && s.day === selectedDay
                        )}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>

        <SchedulePreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          schedules={filteredForPreview()}
          filterBy={previewFilterBy}
          title={
            previewFilterBy
              ? `Preview by ${
                  previewFilterBy.charAt(0).toUpperCase() +
                  previewFilterBy.slice(1)
                }`
              : "All Schedule Preview"
          }
        />
        <Toaster richColors />
      </div>
    </ThemeProvider>
  );
};

export default App;