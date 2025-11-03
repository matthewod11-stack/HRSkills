export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  title: string;
  manager_id?: string;
  start_date: string;
  employment_type: 'full_time' | 'part_time' | 'contractor';
  location: string;
  status: 'active' | 'inactive' | 'terminated';
}

export interface EmployeeFilters {
  status?: 'active' | 'inactive' | 'terminated';
  department?: string;
  employment_type?: 'full_time' | 'part_time' | 'contractor';
}

export interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_id: string;
  status: 'screening' | 'interviewing' | 'offer' | 'hired' | 'rejected';
  applied_date: string;
  current_stage?: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  description: string;
  status: 'open' | 'closed' | 'draft';
  created_date: string;
  hiring_manager_id?: string;
}

export interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  review_period: string;
  rating?: number;
  status: 'pending' | 'completed';
  submitted_date?: string;
}
