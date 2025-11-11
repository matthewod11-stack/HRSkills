/**
 * Performance Calculator Tests
 */

import {
  calculateEmployeeRating,
  calculateDepartmentStats,
  calculateBatchRatings,
  identifyRatingInflation,
  type EmployeeDataForRating,
} from '../performance-calculator';

describe('Performance Calculator', () => {
  const mockDepartmentStats = {
    avgCompensation: 100000,
    avgTenure: 3,
    promotionRate: 0.3,
  };

  describe('calculateEmployeeRating', () => {
    it('should calculate high performance score for top compensated employee', () => {
      const employee: EmployeeDataForRating = {
        employee_id: 'emp1',
        name: 'John Doe',
        department: 'Engineering',
        compensation_base: 150000, // 1.5x avg
        tenure_years: 5,
        promotions: 2,
      };

      const rating = calculateEmployeeRating(employee, mockDepartmentStats);

      expect(rating.ai_performance_score).toBeGreaterThan(3.5);
      expect(rating.factors).toContain('Top compensation tier');
      expect(rating.confidence).toBeGreaterThan(50);
    });

    it('should detect rating inflation when manager over-rates', () => {
      const employee: EmployeeDataForRating = {
        employee_id: 'emp2',
        name: 'Jane Smith',
        compensation_base: 90000, // Below average
        tenure_years: 6,
        manager_rating: 5, // Manager says exceptional
      };

      const rating = calculateEmployeeRating(employee, mockDepartmentStats);

      expect(rating.rating_inflation).toBeGreaterThan(0); // Manager over-rated
      expect(rating.ai_performance_score).toBeLessThan(5); // AI more conservative
    });

    it('should lower score for employees on PIP', () => {
      const employee: EmployeeDataForRating = {
        employee_id: 'emp3',
        compensation_base: 100000,
        red_flags: 'PIP, performance concerns',
        tenure_years: 3,
      };

      const rating = calculateEmployeeRating(employee, mockDepartmentStats);

      expect(rating.ai_performance_score).toBeLessThan(3);
      expect(rating.factors).toContain('Performance improvement plan');
    });

    it('should calculate high potential for fast-track promotions', () => {
      const employee: EmployeeDataForRating = {
        employee_id: 'emp4',
        compensation_base: 120000,
        tenure_years: 4,
        promotions: 2, // 0.5 promotions/year
        tenure_at_level: 1,
      };

      const rating = calculateEmployeeRating(employee, mockDepartmentStats);

      expect(rating.ai_potential_score).toBeGreaterThan(2.5);
      expect(rating.factors).toContain('Fast promotion track');
    });

    it('should identify senior plateau (low potential)', () => {
      const employee: EmployeeDataForRating = {
        employee_id: 'emp5',
        level: 'Senior Engineer',
        compensation_base: 140000,
        tenure_years: 8,
        promotions: 0,
        tenure_at_level: 5,
      };

      const rating = calculateEmployeeRating(employee, mockDepartmentStats);

      expect(rating.ai_potential_score).toBeLessThan(2);
      expect(rating.factors).toContain('Senior plateau');
    });

    it('should handle employees with no compensation data', () => {
      const employee: EmployeeDataForRating = {
        employee_id: 'emp6',
        name: 'New Hire',
        tenure_years: 0.5,
      };

      const rating = calculateEmployeeRating(employee);

      expect(rating.ai_performance_score).toBeGreaterThanOrEqual(1);
      expect(rating.ai_performance_score).toBeLessThanOrEqual(5);
      expect(rating.ai_potential_score).toBeGreaterThanOrEqual(1);
      expect(rating.ai_potential_score).toBeLessThanOrEqual(3);
    });
  });

  describe('calculateDepartmentStats', () => {
    it('should calculate average compensation across department', () => {
      const employees: EmployeeDataForRating[] = [
        { employee_id: '1', compensation_base: 80000, tenure_years: 2, promotions: 0 },
        { employee_id: '2', compensation_base: 120000, tenure_years: 5, promotions: 2 },
        { employee_id: '3', compensation_base: 100000, tenure_years: 3, promotions: 1 },
      ];

      const stats = calculateDepartmentStats(employees);

      expect(stats.avgCompensation).toBe(100000);
      expect(stats.avgTenure).toBe((2 + 5 + 3) / 3);
      expect(stats.promotionRate).toBeCloseTo(0.3, 1);
    });

    it('should handle empty employee list', () => {
      const stats = calculateDepartmentStats([]);

      expect(stats.avgCompensation).toBe(0);
      expect(stats.avgTenure).toBe(0);
      expect(stats.promotionRate).toBe(0);
    });
  });

  describe('calculateBatchRatings', () => {
    it('should calculate ratings for all employees grouped by department', () => {
      const employees: EmployeeDataForRating[] = [
        { employee_id: '1', department: 'Engineering', compensation_base: 120000, tenure_years: 4 },
        { employee_id: '2', department: 'Engineering', compensation_base: 100000, tenure_years: 3 },
        { employee_id: '3', department: 'Sales', compensation_base: 90000, tenure_years: 2 },
      ];

      const ratings = calculateBatchRatings(employees, true);

      expect(ratings.size).toBe(3);
      expect(ratings.has('1')).toBe(true);
      expect(ratings.has('2')).toBe(true);
      expect(ratings.has('3')).toBe(true);

      // Engineering employees should be rated relative to each other
      const eng1 = ratings.get('1')!;
      const eng2 = ratings.get('2')!;
      expect(eng1.ai_performance_score).toBeGreaterThan(eng2.ai_performance_score);
    });
  });

  describe('identifyRatingInflation', () => {
    it('should identify over-rated and under-rated employees', () => {
      const ratings = new Map([
        [
          'emp1',
          {
            employee_id: 'emp1',
            ai_performance_score: 3.0,
            ai_potential_score: 2.0,
            rating_inflation: 1.5, // Manager over-rated by 1.5
            confidence: 75,
            factors: [],
          },
        ],
        [
          'emp2',
          {
            employee_id: 'emp2',
            ai_performance_score: 4.5,
            ai_potential_score: 3.0,
            rating_inflation: -1.2, // Manager under-rated by 1.2
            confidence: 80,
            factors: [],
          },
        ],
        [
          'emp3',
          {
            employee_id: 'emp3',
            ai_performance_score: 3.5,
            ai_potential_score: 2.5,
            rating_inflation: 0.3, // Well aligned
            confidence: 70,
            factors: [],
          },
        ],
      ]);

      const analysis = identifyRatingInflation(ratings, 1.0);

      expect(analysis.overRated).toHaveLength(1);
      expect(analysis.overRated[0].employee_id).toBe('emp1');

      expect(analysis.underRated).toHaveLength(1);
      expect(analysis.underRated[0].employee_id).toBe('emp2');

      expect(analysis.aligned).toHaveLength(1);
      expect(analysis.aligned[0].employee_id).toBe('emp3');
    });

    it('should sort over-rated employees by inflation magnitude', () => {
      const ratings = new Map([
        [
          'emp1',
          {
            employee_id: 'emp1',
            ai_performance_score: 3.0,
            ai_potential_score: 2.0,
            rating_inflation: 2.0,
            confidence: 75,
            factors: [],
          },
        ],
        [
          'emp2',
          {
            employee_id: 'emp2',
            ai_performance_score: 3.5,
            ai_potential_score: 2.0,
            rating_inflation: 1.2,
            confidence: 70,
            factors: [],
          },
        ],
      ]);

      const analysis = identifyRatingInflation(ratings, 1.0);

      expect(analysis.overRated[0].rating_inflation).toBeGreaterThan(
        analysis.overRated[1].rating_inflation!
      );
    });
  });
});
