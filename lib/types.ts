export type UserRecord = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
};

export type StudyPlanRecord = {
  id: string;
  user_id: string;
  title: string;
  source_name: string;
  summary: string;
  highlights: string[];
  total_units: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
};

export type StudyDayRecord = {
  id: string;
  plan_id: string;
  day_index: number;
  target_date: string;
  goal: string;
  completed: boolean;
  notes: string | null;
};

export type DatabaseSchema = {
  users: UserRecord[];
  studyPlans: StudyPlanRecord[];
  studyDays: StudyDayRecord[];
};
