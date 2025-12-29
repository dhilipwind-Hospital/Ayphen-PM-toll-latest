# 🏢 Time Tracking - Enterprise Grade Implementation Plan
## Exact Jira Feature Parity

**Date:** Dec 29, 2025  
**Objective:** Implement time tracking with 100% Jira feature parity  
**Quality Standard:** Enterprise-grade, production-ready  
**Timeline:** 8-10 working days

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Jira Time Tracking Analysis](#jira-time-tracking-analysis)
3. [Implementation Architecture](#implementation-architecture)
4. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
5. [Component Specifications](#component-specifications)
6. [API Requirements](#api-requirements)
7. [UI/UX Design Standards](#uiux-design-standards)
8. [Testing Strategy](#testing-strategy)
9. [Quality Assurance Checklist](#quality-assurance-checklist)

---

## 1. Executive Summary

### Current State: 42% Complete
- ❌ Log Work: Non-functional
- ❌ Work Log Display: Missing
- ❌ Edit/Delete: Missing
- ⚠️ Data Types: Inconsistent
- ✅ Reports: Functional
- ✅ Timer: Functional

### Target State: 100% Jira Parity
- ✅ All Jira time tracking features
- ✅ Exact UI/UX matching Jira
- ✅ Enterprise-grade code quality
- ✅ Comprehensive testing
- ✅ Full documentation

### Success Criteria
1. **Functional:** Every feature works exactly like Jira
2. **Visual:** UI matches Jira's design patterns
3. **Performance:** < 200ms response time
4. **Reliability:** Zero data loss, accurate calculations
5. **Usability:** Intuitive, no training needed

---

## 2. Jira Time Tracking Analysis

### 2.1 Jira's Time Tracking Features

#### A. Time Fields on Issue
```
┌─────────────────────────────────────┐
│ TIME TRACKING                       │
├─────────────────────────────────────┤
│ Original Estimate:    8h            │
│ Remaining Estimate:   3h 30m        │
│ Time Spent:          4h 30m         │
│                                     │
│ Progress Bar: ████░░░░░░  56%      │
│                                     │
│ [Log Work]                          │
└─────────────────────────────────────┘
```

**Fields:**
- **Original Estimate:** Initial time estimate (set on create or later)
- **Remaining Estimate:** Time left to complete
- **Time Spent:** Total logged time (sum of all work logs)
- **Progress:** Visual indicator (spent / original * 100%)

#### B. Log Work Modal (Jira UI)
```
┌────────────────────────────────────────────┐
│  Log Work                             [X]  │
├────────────────────────────────────────────┤
│                                            │
│  Time Spent *                              │
│  ┌──────────────────────────────────────┐ │
│  │ 2h 30m                               │ │
│  └──────────────────────────────────────┘ │
│  Examples: 3w 4d 12h, 1d 6h, 45m          │
│                                            │
│  Date Started                              │
│  ┌──────────────────────────────────────┐ │
│  │ Dec 29, 2025 11:00 AM          [📅] │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Remaining Estimate                        │
│  ○ Auto Adjust                            │
│     The Remaining Estimate will be        │
│     reduced by 2h 30m automatically       │
│                                            │
│  ○ Set to                                 │
│     ┌──────────────────────────────────┐ │
│     │ 1h                               │ │
│     └──────────────────────────────────┘ │
│                                            │
│  ○ Leave as is (3h 30m)                   │
│                                            │
│  Work Description                          │
│  ┌──────────────────────────────────────┐ │
│  │ Implemented user authentication      │ │
│  │                                      │ │
│  │                                      │ │
│  └──────────────────────────────────────┘ │
│                                            │
│             [Cancel]  [Log]               │
└────────────────────────────────────────────┘
```

**Key Features:**
1. **Smart Time Parsing:** "2h 30m", "1d", "30m", "1w 2d 3h"
2. **Date/Time Selection:** When work was performed
3. **Remaining Estimate Options:**
   - Auto-adjust (reduce by logged amount)
   - Set to specific value
   - Keep current value
4. **Work Description:** Optional notes
5. **Validation:** Required fields, format checking

#### C. Work Log Tab (Jira UI)
```
┌─────────────────────────────────────────────────────┐
│  Work Log (5)                         [Log Work]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  👤 John Doe                          Dec 29, 11:00│
│     2h 30m  |  Implemented authentication          │
│     Started: Dec 29, 09:00 AM                      │
│     [Edit] [Delete]                                │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  👤 Jane Smith                        Dec 28, 15:30│
│     1h 15m  |  Code review and testing             │
│     Started: Dec 28, 14:15 PM                      │
│     [Edit] [Delete]                                │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  👤 John Doe                          Dec 28, 10:00│
│     45m     |  Initial setup                       │
│     Started: Dec 28, 09:15 AM                      │
│     [Edit] [Delete]                                │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Total Time Logged: 4h 30m                         │
└─────────────────────────────────────────────────────┘
```

**Key Features:**
1. **Chronological List:** Newest first
2. **Author Info:** Avatar + name
3. **Time Display:** Formatted duration
4. **Description:** Work notes
5. **Timestamps:** Date + time started
6. **Actions:** Edit/Delete (permissions-based)
7. **Total Summary:** Sum of all logs

#### D. Edit Work Log Modal (Jira UI)
```
┌────────────────────────────────────────────┐
│  Edit Work Log                        [X]  │
├────────────────────────────────────────────┤
│                                            │
│  Time Spent *                              │
│  ┌──────────────────────────────────────┐ │
│  │ 2h 30m                               │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Date Started                              │
│  ┌──────────────────────────────────────┐ │
│  │ Dec 29, 2025 11:00 AM          [📅] │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Adjust Remaining Estimate                 │
│  ○ Auto Adjust                            │
│     Increase by: 0h (no change)           │
│                                            │
│  ○ Set to                                 │
│     ┌──────────────────────────────────┐ │
│     │ 3h 30m                           │ │
│     └──────────────────────────────────┘ │
│                                            │
│  ○ Leave as is (3h 30m)                   │
│                                            │
│  Work Description                          │
│  ┌──────────────────────────────────────┐ │
│  │ Implemented user authentication      │ │
│  │ (Updated with OAuth integration)     │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  Logged by: John Doe                       │
│  Created: Dec 29, 2025 11:05 AM           │
│  Updated: Dec 29, 2025 11:45 AM           │
│                                            │
│             [Cancel]  [Save]               │
└────────────────────────────────────────────┘
```

#### E. Delete Work Log Confirmation
```
┌────────────────────────────────────────────┐
│  Delete Work Log                      [X]  │
├────────────────────────────────────────────┤
│                                            │
│  ⚠️  Are you sure you want to delete      │
│      this work log?                        │
│                                            │
│  Time Logged: 2h 30m                       │
│  Author: John Doe                          │
│  Date: Dec 29, 2025                        │
│                                            │
│  This action cannot be undone.             │
│                                            │
│  Adjust Remaining Estimate                 │
│  ○ Auto Adjust                            │
│     Increase by: 2h 30m                   │
│                                            │
│  ○ Set to                                 │
│     ┌──────────────────────────────────┐ │
│     │ 6h                               │ │
│     └──────────────────────────────────┘ │
│                                            │
│  ○ Leave as is (3h 30m)                   │
│                                            │
│             [Cancel]  [Delete]            │
└────────────────────────────────────────────┘
```

### 2.2 Jira's Time Format Standards

**Supported Formats:**
- Minutes: `30m`, `45m`
- Hours: `1h`, `2h 30m`, `0.5h`
- Days: `1d`, `2d 3h`, `0.5d`
- Weeks: `1w`, `2w 3d`, `1w 2d 4h 30m`

**Conversion Rules:**
- 1 week = 5 working days
- 1 day = 8 working hours
- 1 hour = 60 minutes

**Display Format:**
- Internal: Store as minutes (integer)
- Display: "Xw Xd Xh Xm" (omit zero values)
- Examples: "2h 30m", "1d 4h", "2w 3d"

### 2.3 Jira's Permissions Model

**Who Can:**
- **Log Work:** Any user with Edit permission on issue
- **Edit Own Logs:** User who created the log
- **Delete Own Logs:** User who created the log
- **Edit Any Log:** Project Admin / Jira Admin
- **Delete Any Log:** Project Admin / Jira Admin
- **View Logs:** Anyone who can view the issue

### 2.4 Jira's Calculation Logic

**Time Spent Calculation:**
```typescript
timeSpent = SUM(all work logs)
```

**Remaining Estimate on Log Work:**
```typescript
// Option 1: Auto-adjust
newRemaining = currentRemaining - timeLogged

// Option 2: Set to value
newRemaining = userSpecifiedValue

// Option 3: Leave as is
newRemaining = currentRemaining
```

**Remaining Estimate on Edit Work Log:**
```typescript
// Option 1: Auto-adjust
difference = newTimeLogged - oldTimeLogged
newRemaining = currentRemaining - difference

// Option 2: Set to value
newRemaining = userSpecifiedValue

// Option 3: Leave as is
newRemaining = currentRemaining
```

**Remaining Estimate on Delete Work Log:**
```typescript
// Option 1: Auto-adjust
newRemaining = currentRemaining + deletedTimeLogged

// Option 2: Set to value
newRemaining = userSpecifiedValue

// Option 3: Leave as is
newRemaining = currentRemaining
```

**Progress Calculation:**
```typescript
if (originalEstimate > 0) {
  progress = (timeSpent / originalEstimate) * 100
  // Cap at 100%
  progress = Math.min(progress, 100)
} else {
  progress = 0
}
```

---

## 3. Implementation Architecture

### 3.1 Data Model

```typescript
// types/index.ts

export interface Issue {
  id: string;
  key: string;
  summary: string;
  
  // Time Tracking Fields (store in MINUTES)
  originalEstimate: number | null;      // minutes
  remainingEstimate: number | null;     // minutes
  timeSpent: number;                    // minutes (calculated)
  
  workLogs: WorkLog[];
  
  // ... other fields
}

export interface WorkLog {
  id: string;
  issueId: string;
  author: User;
  timeSpentMinutes: number;             // minutes
  description: string;
  startDate: string;                    // ISO 8601 datetime
  createdAt: string;                    // ISO 8601 datetime
  updatedAt: string;                    // ISO 8601 datetime
}

export interface LogWorkInput {
  timeSpent: string;                    // "2h 30m" format
  startDate: Date;
  description: string;
  remainingEstimateOption: 'auto' | 'manual' | 'leave';
  remainingEstimateValue?: string;      // if manual
}
```

### 3.2 Component Architecture

```
src/
├── components/
│   └── TimeTracking/
│       ├── TimeTrackingSection.tsx        // Sidebar widget
│       ├── LogWorkModal.tsx               // Log work dialog
│       ├── EditWorkLogModal.tsx           // Edit dialog
│       ├── DeleteWorkLogModal.tsx         // Delete confirmation
│       ├── WorkLogList.tsx                // Work log display
│       ├── WorkLogItem.tsx                // Single log entry
│       ├── TimeProgressBar.tsx            // Progress visualization
│       └── TimeInput.tsx                  // Smart time input field
├── utils/
│   └── timeFormat.ts                      // Time parsing/formatting
├── services/
│   └── worklog-api.ts                     // API calls
└── hooks/
    └── useTimeTracking.ts                 // Time tracking logic
```

### 3.3 State Management

```typescript
// Local component state (no global store needed)
interface TimeTrackingState {
  workLogs: WorkLog[];
  loading: boolean;
  modalVisible: 'log' | 'edit' | 'delete' | null;
  selectedLog: WorkLog | null;
}
```

---

## 4. Phase-by-Phase Implementation

### Phase 1: Foundation (Day 1-2)

#### Day 1: Data Layer & Utilities

**Tasks:**
1. ✅ Update type definitions
2. ✅ Implement time format utilities
3. ✅ Create API service layer
4. ✅ Write unit tests for utilities

**Deliverables:**
- `types/index.ts` - Updated interfaces
- `utils/timeFormat.ts` - Time parsing/formatting
- `services/worklog-api.ts` - API calls
- `utils/timeFormat.test.ts` - Unit tests

**Files to Create/Modify:**

**A. `utils/timeFormat.ts`**
```typescript
/**
 * Time Format Utilities
 * Matches Jira's time parsing and formatting exactly
 */

export interface TimeComponents {
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
}

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 8;  // Jira default
const DAYS_PER_WEEK = 5;  // Jira default

/**
 * Parse time string to minutes
 * Supports: "2h 30m", "1d", "1w 2d 3h 30m", etc.
 */
export function parseTimeString(input: string): number {
  const trimmed = input.trim().toLowerCase();
  
  // Match patterns: 1w, 2d, 3h, 30m
  const weekMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*w/);
  const dayMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*d/);
  const hourMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*h/);
  const minuteMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*m/);
  
  let totalMinutes = 0;
  
  if (weekMatch) {
    totalMinutes += parseFloat(weekMatch[1]) * DAYS_PER_WEEK * HOURS_PER_DAY * MINUTES_PER_HOUR;
  }
  if (dayMatch) {
    totalMinutes += parseFloat(dayMatch[1]) * HOURS_PER_DAY * MINUTES_PER_HOUR;
  }
  if (hourMatch) {
    totalMinutes += parseFloat(hourMatch[1]) * MINUTES_PER_HOUR;
  }
  if (minuteMatch) {
    totalMinutes += parseFloat(minuteMatch[1]);
  }
  
  return Math.round(totalMinutes);
}

/**
 * Format minutes to Jira time string
 * Output: "1w 2d 3h 30m" (omits zero values)
 */
export function formatMinutesToTimeString(minutes: number): string {
  if (!minutes || minutes === 0) return '0m';
  
  let remaining = Math.abs(minutes);
  const isNegative = minutes < 0;
  
  const weeks = Math.floor(remaining / (DAYS_PER_WEEK * HOURS_PER_DAY * MINUTES_PER_HOUR));
  remaining -= weeks * DAYS_PER_WEEK * HOURS_PER_DAY * MINUTES_PER_HOUR;
  
  const days = Math.floor(remaining / (HOURS_PER_DAY * MINUTES_PER_HOUR));
  remaining -= days * HOURS_PER_DAY * MINUTES_PER_HOUR;
  
  const hours = Math.floor(remaining / MINUTES_PER_HOUR);
  remaining -= hours * MINUTES_PER_HOUR;
  
  const mins = Math.round(remaining);
  
  const parts: string[] = [];
  if (weeks > 0) parts.push(`${weeks}w`);
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  
  const result = parts.join(' ');
  return isNegative ? `-${result}` : result;
}

/**
 * Validate time string format
 */
export function isValidTimeString(input: string): boolean {
  const trimmed = input.trim().toLowerCase();
  const pattern = /^(\d+(?:\.\d+)?\s*[wdhm]\s*)+$/;
  return pattern.test(trimmed);
}

/**
 * Get time components from minutes
 */
export function getTimeComponents(minutes: number): TimeComponents {
  let remaining = Math.abs(minutes);
  
  const weeks = Math.floor(remaining / (DAYS_PER_WEEK * HOURS_PER_DAY * MINUTES_PER_HOUR));
  remaining -= weeks * DAYS_PER_WEEK * HOURS_PER_DAY * MINUTES_PER_HOUR;
  
  const days = Math.floor(remaining / (HOURS_PER_DAY * MINUTES_PER_HOUR));
  remaining -= days * HOURS_PER_DAY * MINUTES_PER_HOUR;
  
  const hours = Math.floor(remaining / MINUTES_PER_HOUR);
  remaining -= hours * MINUTES_PER_HOUR;
  
  const mins = Math.round(remaining);
  
  return { weeks, days, hours, minutes: mins };
}
```

**B. `services/worklog-api.ts`**
```typescript
import { api } from './api';
import { WorkLog, LogWorkInput } from '../types';

export const worklogApi = {
  /**
   * Get all work logs for an issue
   */
  getWorkLogs: async (issueId: string): Promise<WorkLog[]> => {
    const response = await api.get(`/issues/${issueId}/worklog`);
    return response.data;
  },

  /**
   * Log work on an issue
   */
  logWork: async (
    issueId: string,
    input: LogWorkInput,
    userId: string
  ): Promise<WorkLog> => {
    const response = await api.post(`/issues/${issueId}/worklog`, {
      ...input,
      userId
    });
    return response.data;
  },

  /**
   * Update a work log
   */
  updateWorkLog: async (
    issueId: string,
    workLogId: string,
    input: Partial<LogWorkInput>
  ): Promise<WorkLog> => {
    const response = await api.put(
      `/issues/${issueId}/worklog/${workLogId}`,
      input
    );
    return response.data;
  },

  /**
   * Delete a work log
   */
  deleteWorkLog: async (
    issueId: string,
    workLogId: string,
    remainingEstimateOption: 'auto' | 'manual' | 'leave',
    remainingEstimateValue?: number
  ): Promise<void> => {
    await api.delete(`/issues/${issueId}/worklog/${workLogId}`, {
      data: {
        remainingEstimateOption,
        remainingEstimateValue
      }
    });
  }
};
```

#### Day 2: Core Components

**Tasks:**
1. ✅ TimeInput component (smart input field)
2. ✅ TimeProgressBar component
3. ✅ WorkLogItem component
4. ✅ Component unit tests

**C. `components/TimeTracking/TimeInput.tsx`**
```typescript
import React, { useState, useEffect } from 'react';
import { Input, Tag } from 'antd';
import styled from 'styled-components';
import { parseTimeString, formatMinutesToTimeString, isValidTimeString } from '../../utils/timeFormat';
import { colors } from '../../theme/colors';

const InputWrapper = styled.div`
  position: relative;
`;

const HintText = styled.div`
  font-size: 11px;
  color: ${colors.text.secondary};
  margin-top: 4px;
`;

const ParsedValue = styled(Tag)`
  margin-top: 4px;
`;

interface TimeInputProps {
  value?: string;
  onChange: (value: string, minutes: number) => void;
  placeholder?: string;
  error?: string;
}

export const TimeInput: React.FC<TimeInputProps> = ({
  value = '',
  onChange,
  placeholder = 'e.g., 2h 30m',
  error
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [parsedMinutes, setParsedMinutes] = useState<number | null>(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (!newValue.trim()) {
      setParsedMinutes(null);
      setIsValid(true);
      onChange('', 0);
      return;
    }

    const valid = isValidTimeString(newValue);
    setIsValid(valid);

    if (valid) {
      const minutes = parseTimeString(newValue);
      setParsedMinutes(minutes);
      onChange(newValue, minutes);
    }
  };

  return (
    <InputWrapper>
      <Input
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        status={error || !isValid ? 'error' : undefined}
      />
      {parsedMinutes !== null && isValid && (
        <ParsedValue color="blue">
          = {formatMinutesToTimeString(parsedMinutes)} ({parsedMinutes} minutes)
        </ParsedValue>
      )}
      {!isValid && inputValue && (
        <HintText style={{ color: colors.error[500] }}>
          Invalid format. Use: 1w 2d 3h 30m
        </HintText>
      )}
      {!error && isValid && (
        <HintText>
          Examples: 3w 4d 12h, 1d 6h, 45m
        </HintText>
      )}
    </InputWrapper>
  );
};
```

**D. `components/TimeTracking/TimeProgressBar.tsx`**
```typescript
import React from 'react';
import { Progress } from 'antd';
import styled from 'styled-components';
import { formatMinutesToTimeString } from '../../utils/timeFormat';
import { colors } from '../../theme/colors';

const Container = styled.div`
  margin-bottom: 16px;
`;

const Labels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: ${colors.text.secondary};
  margin-top: 6px;
`;

interface TimeProgressBarProps {
  originalEstimate: number | null;
  timeSpent: number;
  remainingEstimate: number | null;
}

export const TimeProgressBar: React.FC<TimeProgressBarProps> = ({
  originalEstimate,
  timeSpent,
  remainingEstimate
}) => {
  const percent = originalEstimate && originalEstimate > 0
    ? Math.min(100, Math.round((timeSpent / originalEstimate) * 100))
    : 0;

  const isOverBudget = originalEstimate && timeSpent > originalEstimate;

  return (
    <Container>
      <Progress
        percent={percent}
        showInfo={false}
        strokeColor={isOverBudget ? colors.error[500] : colors.primary[500]}
        trailColor={colors.background.secondary}
      />
      <Labels>
        <span>
          {formatMinutesToTimeString(timeSpent)} logged
        </span>
        <span>
          {remainingEstimate !== null
            ? `${formatMinutesToTimeString(remainingEstimate)} remaining`
            : 'No estimate'}
        </span>
      </Labels>
    </Container>
  );
};
```

---

### Phase 2: Log Work Feature (Day 3-4)

#### Day 3: Log Work Modal

**E. `components/TimeTracking/LogWorkModal.tsx`**
```typescript
import React, { useState } from 'react';
import { Modal, Form, DatePicker, Radio, Space, message } from 'antd';
import { TimeInput } from './TimeInput';
import { worklogApi } from '../../services/worklog-api';
import { formatMinutesToTimeString, parseTimeString } from '../../utils/timeFormat';
import styled from 'styled-components';
import dayjs, { Dayjs } from 'dayjs';
import { colors } from '../../theme/colors';

const { TextArea } = Input;

const HelpText = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
  margin-top: 4px;
  padding: 8px;
  background: ${colors.background.secondary};
  border-radius: 4px;
`;

interface LogWorkModalProps {
  visible: boolean;
  issueId: string;
  currentRemaining: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const LogWorkModal: React.FC<LogWorkModalProps> = ({
  visible,
  issueId,
  currentRemaining,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [timeSpentMinutes, setTimeSpentMinutes] = useState(0);
  const [remainingOption, setRemainingOption] = useState<'auto' | 'manual' | 'leave'>('auto');

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await worklogApi.logWork(
        issueId,
        {
          timeSpent: values.timeSpent,
          startDate: values.startDate.toDate(),
          description: values.description || '',
          remainingEstimateOption: remainingOption,
          remainingEstimateValue: remainingOption === 'manual' 
            ? values.remainingEstimate 
            : undefined
        },
        localStorage.getItem('userId')!
      );

      message.success('Work logged successfully');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to log work');
    } finally {
      setLoading(false);
    }
  };

  const getAdjustedRemaining = () => {
    if (currentRemaining === null) return null;
    return Math.max(0, currentRemaining - timeSpentMinutes);
  };

  return (
    <Modal
      title="Log Work"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Log"
      confirmLoading={loading}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          startDate: dayjs(),
          remainingOption: 'auto'
        }}
      >
        <Form.Item
          label="Time Spent"
          name="timeSpent"
          rules={[{ required: true, message: 'Please enter time spent' }]}
        >
          <TimeInput
            onChange={(value, minutes) => setTimeSpentMinutes(minutes)}
            placeholder="e.g., 2h 30m"
          />
        </Form.Item>

        <Form.Item
          label="Date Started"
          name="startDate"
        >
          <DatePicker
            showTime
            format="MMM DD, YYYY hh:mm A"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="Remaining Estimate">
          <Radio.Group
            value={remainingOption}
            onChange={(e) => setRemainingOption(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value="auto">
                <strong>Auto Adjust</strong>
                {currentRemaining !== null && timeSpentMinutes > 0 && (
                  <HelpText>
                    The Remaining Estimate will be reduced by{' '}
                    {formatMinutesToTimeString(timeSpentMinutes)} automatically
                    <br />
                    New remaining: {formatMinutesToTimeString(getAdjustedRemaining()!)}
                  </HelpText>
                )}
                {currentRemaining === null && (
                  <HelpText>
                    No current estimate set
                  </HelpText>
                )}
              </Radio>

              <Radio value="manual">
                <strong>Set to</strong>
                {remainingOption === 'manual' && (
                  <Form.Item
                    name="remainingEstimate"
                    style={{ marginTop: 8, marginBottom: 0 }}
                  >
                    <TimeInput
                      placeholder="e.g., 1h"
                      onChange={() => {}}
                    />
                  </Form.Item>
                )}
              </Radio>

              <Radio value="leave">
                <strong>Leave as is</strong>
                {currentRemaining !== null && (
                  <HelpText>
                    Keep remaining estimate at{' '}
                    {formatMinutesToTimeString(currentRemaining)}
                  </HelpText>
                )}
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="Work Description"
          name="description"
        >
          <TextArea
            rows={3}
            placeholder="Describe what you worked on..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
```

#### Day 4: Work Log Display

**F. `components/TimeTracking/WorkLogList.tsx`**
```typescript
import React, { useState, useEffect } from 'react';
import { Button, Empty, Spin, message } from 'antd';
import { Plus } from 'lucide-react';
import styled from 'styled-components';
import { WorkLogItem } from './WorkLogItem';
import { LogWorkModal } from './LogWorkModal';
import { EditWorkLogModal } from './EditWorkLogModal';
import { DeleteWorkLogModal } from './DeleteWorkLogModal';
import { worklogApi } from '../../services/worklog-api';
import { WorkLog } from '../../types';
import { formatMinutesToTimeString } from '../../utils/timeFormat';
import { colors } from '../../theme/colors';

const Container = styled.div`
  margin-top: 16px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Title = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
`;

const LogsContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const TotalTime = styled.div`
  margin-top: 16px;
  padding: 12px;
  background: ${colors.background.secondary};
  border-radius: 6px;
  font-weight: 600;
  text-align: center;
`;

interface WorkLogListProps {
  issueId: string;
  currentRemaining: number | null;
  onUpdate: () => void;
}

export const WorkLogList: React.FC<WorkLogListProps> = ({
  issueId,
  currentRemaining,
  onUpdate
}) => {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WorkLog | null>(null);

  useEffect(() => {
    loadWorkLogs();
  }, [issueId]);

  const loadWorkLogs = async () => {
    try {
      setLoading(true);
      const logs = await worklogApi.getWorkLogs(issueId);
      setWorkLogs(logs.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      message.error('Failed to load work logs');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log: WorkLog) => {
    setSelectedLog(log);
    setEditModalVisible(true);
  };

  const handleDelete = (log: WorkLog) => {
    setSelectedLog(log);
    setDeleteModalVisible(true);
  };

  const handleSuccess = () => {
    loadWorkLogs();
    onUpdate();
  };

  const totalTime = workLogs.reduce((sum, log) => sum + log.timeSpentMinutes, 0);

  if (loading) {
    return <Spin />;
  }

  return (
    <Container>
      <Header>
        <Title>Work Log ({workLogs.length})</Title>
        <Button
          type="primary"
          size="small"
          icon={<Plus size={14} />}
          onClick={() => setLogModalVisible(true)}
        >
          Log Work
        </Button>
      </Header>

      {workLogs.length === 0 ? (
        <Empty
          description="No work logged yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          <LogsContainer>
            {workLogs.map(log => (
              <WorkLogItem
                key={log.id}
                workLog={log}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </LogsContainer>

          <TotalTime>
            Total Time Logged: {formatMinutesToTimeString(totalTime)}
          </TotalTime>
        </>
      )}

      <LogWorkModal
        visible={logModalVisible}
        issueId={issueId}
        currentRemaining={currentRemaining}
        onClose={() => setLogModalVisible(false)}
        onSuccess={handleSuccess}
      />

      {selectedLog && (
        <>
          <EditWorkLogModal
            visible={editModalVisible}
            issueId={issueId}
            workLog={selectedLog}
            currentRemaining={currentRemaining}
            onClose={() => setEditModalVisible(false)}
            onSuccess={handleSuccess}
          />

          <DeleteWorkLogModal
            visible={deleteModalVisible}
            issueId={issueId}
            workLog={selectedLog}
            currentRemaining={currentRemaining}
            onClose={() => setDeleteModalVisible(false)}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </Container>
  );
};
```

**G. `components/TimeTracking/WorkLogItem.tsx`**
```typescript
import React from 'react';
import { Avatar, Button, Dropdown } from 'antd';
import { Edit2, Trash2, MoreVertical } from 'lucide-react';
import styled from 'styled-components';
import { WorkLog } from '../../types';
import { formatMinutesToTimeString } from '../../utils/timeFormat';
import { colors } from '../../theme/colors';
import dayjs from 'dayjs';
import { useStore } from '../../store/useStore';

const Container = styled.div`
  padding: 12px;
  border-bottom: 1px solid ${colors.border.light};
  
  &:hover {
    background: ${colors.background.secondary};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AuthorName = styled.span`
  font-weight: 600;
  font-size: 13px;
`;

const TimeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
`;

const TimeSpent = styled.span`
  font-weight: 600;
  color: ${colors.primary[500]};
`;

const Description = styled.div`
  font-size: 13px;
  color: ${colors.text.secondary};
  margin-top: 4px;
  margin-left: 36px;
`;

const StartedAt = styled.div`
  font-size: 11px;
  color: ${colors.text.tertiary};
  margin-top: 4px;
  margin-left: 36px;
`;

interface WorkLogItemProps {
  workLog: WorkLog;
  onEdit: (log: WorkLog) => void;
  onDelete: (log: WorkLog) => void;
}

export const WorkLogItem: React.FC<WorkLogItemProps> = ({
  workLog,
  onEdit,
  onDelete
}) => {
  const { currentUser } = useStore();
  const isOwn = currentUser?.id === workLog.author.id;

  const menuItems = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit2 size={14} />,
      onClick: () => onEdit(workLog)
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 size={14} />,
      danger: true,
      onClick: () => onDelete(workLog)
    }
  ];

  return (
    <Container>
      <Header>
        <AuthorInfo>
          <Avatar src={workLog.author.avatar} size={28}>
            {workLog.author.name[0]}
          </Avatar>
          <div>
            <AuthorName>{workLog.author.name}</AuthorName>
            <div style={{ fontSize: 11, color: colors.text.tertiary }}>
              {dayjs(workLog.createdAt).format('MMM DD, hh:mm A')}
            </div>
          </div>
        </AuthorInfo>

        {isOwn && (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button
              type="text"
              size="small"
              icon={<MoreVertical size={16} />}
            />
          </Dropdown>
        )}
      </Header>

      <TimeInfo>
        <TimeSpent>{formatMinutesToTimeString(workLog.timeSpentMinutes)}</TimeSpent>
        {workLog.description && <span>|</span>}
        {workLog.description}
      </TimeInfo>

      {workLog.startDate && (
        <StartedAt>
          Started: {dayjs(workLog.startDate).format('MMM DD, YYYY hh:mm A')}
        </StartedAt>
      )}
    </Container>
  );
};
```

---

### Phase 3: Edit & Delete (Day 5-6)

#### Day 5: Edit Work Log

**H. `components/TimeTracking/EditWorkLogModal.tsx`**
```typescript
// Similar to LogWorkModal but pre-filled with existing values
// Shows created/updated metadata
// Calculates difference for auto-adjust option
```

#### Day 6: Delete Work Log

**I. `components/TimeTracking/DeleteWorkLogModal.tsx`**
```typescript
// Confirmation dialog
// Shows work log details
// Remaining estimate adjustment options
// Warning about permanent deletion
```

---

### Phase 4: Integration & Testing (Day 7-8)

#### Day 7: Update TimeTrackingSection

**J. Update `components/IssueDetail/Sidebar/TimeTrackingSection.tsx`**
```typescript
import React, { useState } from 'react';
import { InputNumber } from 'antd';
import styled from 'styled-components';
import { SidebarSection } from './SidebarSection';
import { TimeProgressBar } from '../../TimeTracking/TimeProgressBar';
import { WorkLogList } from '../../TimeTracking/WorkLogList';
import { colors } from '../../../theme/colors';

const FieldRow = styled.div`
  margin-bottom: 12px;
`;

const Label = styled.div`
  font-size: 12px;
  color: ${colors.text.secondary};
  margin-bottom: 4px;
`;

interface TimeTrackingSectionProps {
  issue: any;
  onUpdate: (field: string, value: any) => Promise<void>;
}

export const TimeTrackingSection: React.FC<TimeTrackingSectionProps> = ({
  issue,
  onUpdate
}) => {
  const [updating, setUpdating] = useState(false);

  const handleEstimateUpdate = async (field: string, value: number | null) => {
    try {
      setUpdating(true);
      await onUpdate(field, value);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SidebarSection title="Time Tracking">
      <TimeProgressBar
        originalEstimate={issue.originalEstimate}
        timeSpent={issue.timeSpent || 0}
        remainingEstimate={issue.remainingEstimate}
      />

      <FieldRow>
        <Label>Original Estimate (minutes)</Label>
        <InputNumber
          value={issue.originalEstimate}
          onChange={(val) => handleEstimateUpdate('originalEstimate', val)}
          disabled={updating}
          min={0}
          style={{ width: '100%' }}
          placeholder="No estimate"
        />
      </FieldRow>

      <FieldRow>
        <Label>Remaining Estimate (minutes)</Label>
        <InputNumber
          value={issue.remainingEstimate}
          onChange={(val) => handleEstimateUpdate('remainingEstimate', val)}
          disabled={updating}
          min={0}
          style={{ width: '100%' }}
          placeholder="No estimate"
        />
      </FieldRow>

      <WorkLogList
        issueId={issue.id}
        currentRemaining={issue.remainingEstimate}
        onUpdate={() => onUpdate('refresh', true)}
      />
    </SidebarSection>
  );
};
```

#### Day 8: Testing

**Test Checklist:**
- [ ] Log work with different time formats
- [ ] Auto-adjust remaining estimate
- [ ] Manual remaining estimate
- [ ] Leave remaining as is
- [ ] Edit own work log
- [ ] Delete own work log
- [ ] View work logs by others
- [ ] Progress bar calculation
- [ ] Total time calculation
- [ ] Permissions (can't edit others' logs)
- [ ] All issue types (Epic, Story, Task, Bug, Subtask)
- [ ] Edge cases (negative remaining, over budget, etc.)

---

### Phase 5: Polish & Production (Day 9-10)

#### Day 9: UI Polish

**Tasks:**
- Responsive design
- Loading states
- Error handling
- Accessibility (ARIA labels)
- Keyboard navigation
- Tooltips

#### Day 10: Documentation & Deployment

**Tasks:**
- Component documentation
- User guide
- API documentation
- Build & deploy
- Production testing
- Performance monitoring

---

## 5. Component Specifications

### All components detailed in previous sections with:
- Props interfaces
- State management
- Event handlers
- Styling
- Accessibility
- Error handling

---

## 6. API Requirements

### Backend Endpoints Needed

```
POST   /api/issues/:issueId/worklog
GET    /api/issues/:issueId/worklog
PUT    /api/issues/:issueId/worklog/:worklogId
DELETE /api/issues/:issueId/worklog/:worklogId

PATCH  /api/issues/:issueId/estimates
```

### Request/Response Formats

**Log Work Request:**
```json
{
  "timeSpentMinutes": 150,
  "description": "Implemented user auth",
  "startDate": "2025-12-29T09:00:00Z",
  "remainingEstimateOption": "auto",
  "remainingEstimateValue": null,
  "userId": "user-123"
}
```

**Work Log Response:**
```json
{
  "id": "log-456",
  "issueId": "issue-123",
  "author": {
    "id": "user-123",
    "name": "John Doe",
    "avatar": "https://..."
  },
  "timeSpentMinutes": 150,
  "description": "Implemented user auth",
  "startDate": "2025-12-29T09:00:00Z",
  "createdAt": "2025-12-29T11:00:00Z",
  "updatedAt": "2025-12-29T11:00:00Z"
}
```

---

## 7. UI/UX Design Standards

### Design System Compliance

**Colors:**
- Primary: `colors.primary[500]` (#0EA5E9)
- Success: `colors.success[500]` (#10B981)
- Error: `colors.error[500]` (#EF4444)
- Text: `colors.text.primary`, `colors.text.secondary`

**Typography:**
- Headings: 14px, 600 weight
- Body: 13px, 400 weight
- Labels: 12px, 400 weight
- Hints: 11px, 400 weight

**Spacing:**
- Component padding: 12px
- Section margin: 16px
- Field margin: 12px

**Animations:**
- Transitions: 0.2s ease
- Loading: Ant Design Spin component
- Modal: Fade in/out

---

## 8. Testing Strategy

### Unit Tests
- Time format utilities (100% coverage)
- API service layer
- Individual components

### Integration Tests
- Complete workflows (log → edit → delete)
- API integration
- State management

### E2E Tests
- User scenarios (Playwright/Cypress)
- All issue types
- Permission scenarios

### Performance Tests
- Large work log lists (100+ entries)
- Concurrent editing
- Time parsing performance

---

## 9. Quality Assurance Checklist

### Functional Requirements
- [ ] Log work with all time formats
- [ ] View work logs chronologically
- [ ] Edit own work logs
- [ ] Delete own work logs
- [ ] Auto-adjust remaining estimate
- [ ] Manual remaining estimate
- [ ] Progress bar accurate
- [ ] Works on all issue types

### Non-Functional Requirements
- [ ] Response time < 200ms
- [ ] No data loss
- [ ] Handles errors gracefully
- [ ] Mobile responsive
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Cross-browser compatible

### Code Quality
- [ ] TypeScript strict mode
- [ ] ESLint passing
- [ ] No console errors
- [ ] Components documented
- [ ] Tests passing (>80% coverage)

### Production Readiness
- [ ] Logging implemented
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Database migrations
- [ ] Rollback plan

---

## 🎯 Success Metrics

### KPIs
1. **Feature Parity:** 100% of Jira time tracking features
2. **Bug Rate:** < 1 bug per 100 user sessions
3. **User Satisfaction:** > 4.5/5 rating
4. **Performance:** < 200ms average response time
5. **Test Coverage:** > 80%

### Definition of Done
- ✅ All features implemented
- ✅ All tests passing
- ✅ Code reviewed & approved
- ✅ Documentation complete
- ✅ QA sign-off
- ✅ Product owner approval
- ✅ Deployed to production
- ✅ Monitoring in place

---

**END OF ENTERPRISE IMPLEMENTATION PLAN**
