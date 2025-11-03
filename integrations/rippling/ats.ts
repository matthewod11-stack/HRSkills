import { rippling } from './client';
import { Candidate, Job } from './types';

export async function getOpenJobs(): Promise<Job[]> {
  return rippling.request<Job[]>({
    method: 'GET',
    url: '/platform/api/jobs',
    params: { status: 'open' }
  });
}

export async function getJob(id: string): Promise<Job> {
  return rippling.request<Job>({
    method: 'GET',
    url: `/platform/api/jobs/${id}`
  });
}

export async function getCandidatesByJob(jobId: string): Promise<Candidate[]> {
  return rippling.request<Candidate[]>({
    method: 'GET',
    url: `/platform/api/jobs/${jobId}/applicants`
  });
}

export async function getCandidate(id: string): Promise<Candidate> {
  return rippling.request<Candidate>({
    method: 'GET',
    url: `/platform/api/applicants/${id}`
  });
}

export async function updateCandidateStatus(
  candidateId: string,
  status: 'screening' | 'interviewing' | 'offer' | 'hired' | 'rejected'
): Promise<Candidate> {
  return rippling.request<Candidate>({
    method: 'PATCH',
    url: `/platform/api/applicants/${candidateId}`,
    data: { status }
  });
}

export async function getRecentlyHired(daysBack: number = 7): Promise<Candidate[]> {
  const allCandidates = await rippling.request<Candidate[]>({
    method: 'GET',
    url: '/platform/api/applicants',
    params: { status: 'hired' }
  });

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  return allCandidates.filter(candidate => {
    const appliedDate = new Date(candidate.applied_date);
    return appliedDate >= cutoffDate;
  });
}
