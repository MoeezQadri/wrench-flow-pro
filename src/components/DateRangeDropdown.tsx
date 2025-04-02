
import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type DateRangeOption = "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "custom";

interface DateRangeDropdownProps {
  startDate: Date;
  endDate: Date;
  onRangeChange: (startDate: Date, endDate: Date) => void;
}

const DateRangeDropdown: React.FC<DateRangeDropdownProps> = ({
  startDate, 
  endDate, 
  onRangeChange
}) => {
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>("today");
  const [customStartDate, setCustomStartDate] = useState<Date>(startDate);
  const [customEndDate, setCustomEndDate] = useState<Date>(endDate);

  const handlePresetChange = (value: string) => {
    const today = new Date();
    let newStartDate = new Date();
    let newEndDate = new Date();

    switch (value as DateRangeOption) {
      case "today":
        newStartDate = new Date(today.setHours(0, 0, 0, 0));
        newEndDate = new Date();
        setIsCustom(false);
        break;
      case "yesterday":
        newStartDate = new Date(today);
        newStartDate.setDate(newStartDate.getDate() - 1);
        newStartDate.setHours(0, 0, 0, 0);
        newEndDate = new Date(today);
        newEndDate.setDate(newEndDate.getDate() - 1);
        newEndDate.setHours(23, 59, 59, 999);
        setIsCustom(false);
        break;
      case "thisWeek":
        const firstDayOfWeek = new Date(today);
        firstDayOfWeek.setDate(today.getDate() - today.getDay());
        firstDayOfWeek.setHours(0, 0, 0, 0);
        newStartDate = firstDayOfWeek;
        newEndDate = new Date();
        setIsCustom(false);
        break;
      case "lastWeek":
        const firstDayOfLastWeek = new Date(today);
        firstDayOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
        firstDayOfLastWeek.setHours(0, 0, 0, 0);
        newStartDate = firstDayOfLastWeek;
        
        const lastDayOfLastWeek = new Date(firstDayOfLastWeek);
        lastDayOfLastWeek.setDate(lastDayOfLastWeek.getDate() + 6);
        lastDayOfLastWeek.setHours(23, 59, 59, 999);
        newEndDate = lastDayOfLastWeek;
        setIsCustom(false);
        break;
      case "thisMonth":
        newStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        newEndDate = new Date();
        setIsCustom(false);
        break;
      case "lastMonth":
        newStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        newEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
        newEndDate.setHours(23, 59, 59, 999);
        setIsCustom(false);
        break;
      case "custom":
        setIsCustom(true);
        // Don't update dates here, wait for user to select
        break;
      default:
        break;
    }

    if (value !== "custom") {
      setCustomStartDate(newStartDate);
      setCustomEndDate(newEndDate);
      onRangeChange(newStartDate, newEndDate);
    }

    setSelectedRange(value as DateRangeOption);
  };

  const handleCustomRangeConfirm = () => {
    onRangeChange(customStartDate, customEndDate);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Select
        value={selectedRange}
        onValueChange={handlePresetChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="thisWeek">This Week</SelectItem>
          <SelectItem value="lastWeek">Last Week</SelectItem>
          <SelectItem value="thisMonth">This Month</SelectItem>
          <SelectItem value="lastMonth">Last Month</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {isCustom && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[160px] justify-start text-left font-normal",
                  !customStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customStartDate ? format(customStartDate, "PPP") : <span>Start date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customStartDate}
                onSelect={(date) => date && setCustomStartDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <span>to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[160px] justify-start text-left font-normal",
                  !customEndDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customEndDate ? format(customEndDate, "PPP") : <span>End date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customEndDate}
                onSelect={(date) => date && setCustomEndDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleCustomRangeConfirm} size="sm">Apply</Button>
        </div>
      )}
    </div>
  );
};

export default DateRangeDropdown;
