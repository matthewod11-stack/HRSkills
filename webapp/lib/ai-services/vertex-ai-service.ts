/**
 * Vertex AI Service
 *
 * Provides machine learning prediction capabilities using Google Cloud Vertex AI:
 * - Attrition prediction (flight risk scoring)
 * - Performance prediction (next review rating forecast)
 * - Promotion readiness prediction
 * - AutoML model training and deployment
 * - Feature engineering and data preparation
 *
 * Cost: AutoML training $19.32/hour, predictions $0.000002/prediction
 *
 * Setup:
 * 1. Enable Vertex AI API in Google Cloud Console
 * 2. Create AutoML datasets and train models
 * 3. Deploy models to endpoints
 * 4. Set GOOGLE_APPLICATION_CREDENTIALS environment variable
 * 5. Configure model endpoint IDs in environment variables
 *
 * @see https://cloud.google.com/vertex-ai/docs
 */

import { env } from '@/env.mjs';
import { PredictionServiceClient, EndpointServiceClient } from '@google-cloud/aiplatform';

// Singleton client instances
let predictionClient: PredictionServiceClient | null = null;
let endpointClient: EndpointServiceClient | null = null;

/**
 * Get or create Prediction Service client
 */
function getPredictionClient(): PredictionServiceClient {
  if (!predictionClient) {
    try {
      predictionClient = new PredictionServiceClient();
    } catch (error) {
      console.error('Failed to initialize Vertex AI Prediction client:', error);
      throw new Error('Vertex AI Prediction client initialization failed');
    }
  }
  return predictionClient;
}

/**
 * Get or create Endpoint Service client
 */
function getEndpointClient(): EndpointServiceClient {
  if (!endpointClient) {
    try {
      endpointClient = new EndpointServiceClient();
    } catch (error) {
      console.error('Failed to initialize Vertex AI Endpoint client:', error);
      throw new Error('Vertex AI Endpoint client initialization failed');
    }
  }
  return endpointClient;
}

/**
 * Check if Vertex AI is available
 */
export async function isVertexAIAvailable(): Promise<boolean> {
  try {
    getPredictionClient();
    return true;
  } catch (error) {
    console.error('Vertex AI not available:', error);
    return false;
  }
}

// ============================================
// TypeScript Interfaces
// ============================================

export interface EmployeeFeatures {
  // Demographics
  employeeId: string;
  tenure_months: number;
  age?: number;
  department: string;
  level: string;

  // Performance
  eNPS: number;
  last_review_score?: number;
  avg_review_score?: number;
  review_sentiment?: number; // -1 to 1
  trend_sentiment?: number; // Recent trend

  // Compensation
  salary: number;
  comp_percentile: number; // 0-100
  last_raise_months_ago?: number;
  last_raise_percent?: number;

  // Manager & Team
  manager_tenure?: number;
  team_size?: number;
  reports_to?: string;

  // Engagement
  sick_days_last_year?: number;
  pto_used_percent?: number;
  training_hours?: number;
  internal_moves?: number;

  // Promotion History
  months_since_promotion?: number;
  total_promotions?: number;
  promotion_eligible?: boolean;
}

export interface AttritionPrediction {
  employeeId: string;
  employeeName: string;
  flightRisk: 'low' | 'medium' | 'high' | 'critical';
  probabilityToLeave: number; // 0-1
  confidenceScore: number; // 0-1
  topRiskFactors: RiskFactor[];
  recommendedActions: string[];
  predictedTimeframe: string; // "Next 3 months", "Next 6 months", etc.
}

export interface RiskFactor {
  factor: string;
  importance: number; // 0-1
  description: string;
  value?: any;
}

export interface PerformancePrediction {
  employeeId: string;
  employeeName: string;
  predictedRating: number; // 1-5
  confidence: number; // 0-1
  currentRating?: number;
  expectedChange: 'improve' | 'maintain' | 'decline';
  topInfluencingFactors: Factor[];
  recommendations: string[];
}

export interface Factor {
  name: string;
  impact: number; // -1 to 1 (negative = decline, positive = improve)
  currentValue: any;
  description: string;
}

export interface PromotionPrediction {
  employeeId: string;
  employeeName: string;
  promotionReadiness: 'not_ready' | 'developing' | 'ready' | 'overdue';
  probabilityOfPromotion: number; // 0-1
  estimatedMonthsUntilReady: number;
  strengths: string[];
  developmentAreas: string[];
  recommendedActions: string[];
}

export interface PredictionConfig {
  endpointId?: string;
  projectId?: string;
  location?: string;
  useCache?: boolean;
}

export interface BatchPredictionRequest {
  employees: EmployeeFeatures[];
  predictionType: 'attrition' | 'performance' | 'promotion';
}

export interface BatchPredictionResult {
  predictions: (AttritionPrediction | PerformancePrediction | PromotionPrediction)[];
  processingTime: number;
  modelVersion: string;
  timestamp: string;
}

// ============================================
// Feature Engineering
// ============================================

/**
 * Extract features from employee data for ML predictions
 */
export function extractEmployeeFeatures(employee: any): EmployeeFeatures {
  // Calculate tenure
  const hireDate = new Date(employee.hire_date || employee.hireDate);
  const now = new Date();
  const tenure_months = Math.floor(
    (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  // Calculate compensation percentile (simplified - would use actual salary data in production)
  const comp_percentile = employee.compensation_percentile || 50;

  // Extract review data
  const reviews = employee.reviews || [];
  const last_review = reviews[reviews.length - 1];
  const avg_review_score =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + (r.rating || r.score || 3), 0) /
        reviews.length
      : 3;

  // Calculate sentiment from reviews
  const review_sentiment = last_review?.sentiment_score || 0;

  // Calculate months since last raise
  const last_raise_date = employee.last_raise_date ? new Date(employee.last_raise_date) : hireDate;
  const last_raise_months_ago = Math.floor(
    (now.getTime() - last_raise_date.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  // Promotion data
  const promotions = employee.promotion_history || [];
  const last_promotion = promotions[promotions.length - 1];
  const months_since_promotion = last_promotion
    ? Math.floor(
        (now.getTime() - new Date(last_promotion.date).getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
    : tenure_months;

  return {
    employeeId: employee.id || employee.employee_id,
    tenure_months,
    age: employee.age,
    department: employee.department || 'Unknown',
    level: employee.level || employee.job_title || 'Individual Contributor',

    eNPS: employee.eNPS || employee.enps || 0,
    last_review_score: last_review?.rating || last_review?.score,
    avg_review_score,
    review_sentiment,

    salary: employee.salary || employee.compensation || 0,
    comp_percentile,
    last_raise_months_ago,
    last_raise_percent: employee.last_raise_percent,

    manager_tenure: employee.manager_tenure,
    team_size: employee.team_size,

    sick_days_last_year: employee.sick_days_last_year || 0,
    pto_used_percent: employee.pto_used_percent || 0,
    training_hours: employee.training_hours || 0,

    months_since_promotion,
    total_promotions: promotions.length,
    promotion_eligible: months_since_promotion >= 18 && avg_review_score >= 3.5,
  };
}

/**
 * Normalize features for ML model input
 */
export function normalizeFeatures(features: EmployeeFeatures): Record<string, number> {
  return {
    tenure_months: features.tenure_months,
    eNPS: features.eNPS,
    avg_review_score: features.avg_review_score || 3,
    review_sentiment: features.review_sentiment || 0,
    comp_percentile: features.comp_percentile,
    last_raise_months_ago: features.last_raise_months_ago || 12,
    months_since_promotion: features.months_since_promotion || features.tenure_months,
    sick_days_last_year: features.sick_days_last_year || 0,
    training_hours: features.training_hours || 0,
  };
}

// ============================================
// Attrition Prediction
// ============================================

/**
 * Predict employee attrition risk
 */
export async function predictAttrition(
  employee: any,
  config: PredictionConfig = {}
): Promise<AttritionPrediction> {
  try {
    const features = extractEmployeeFeatures(employee);

    // Use Vertex AI endpoint if configured
    const endpointId = config.endpointId || env.VERTEX_AI_ATTRITION_ENDPOINT_ID;

    if (!endpointId) {
      // Fallback to rule-based prediction
      return predictAttritionRuleBased(employee, features);
    }

    // Call Vertex AI prediction endpoint
    const client = getPredictionClient();
    const projectId = config.projectId || env.GOOGLE_CLOUD_PROJECT;
    const location = config.location || env.VERTEX_AI_LOCATION;
    const endpoint = `projects/${projectId}/locations/${location}/endpoints/${endpointId}`;

    const normalizedFeatures = normalizeFeatures(features);
    const instance = { features: normalizedFeatures };

    const result = await client.predict({
      endpoint,
      instances: [instance] as any,
    });
    const [response] = result as any;

    const prediction = response.predictions?.[0];
    const probability = parseFloat(prediction?.probability || prediction?.value || '0');

    return buildAttritionPrediction(employee, features, probability);
  } catch (error) {
    console.error('Attrition prediction error:', error);
    // Fallback to rule-based
    const features = extractEmployeeFeatures(employee);
    return predictAttritionRuleBased(employee, features);
  }
}

/**
 * Rule-based attrition prediction (fallback when ML model not available)
 */
function predictAttritionRuleBased(employee: any, features: EmployeeFeatures): AttritionPrediction {
  let riskScore = 0;
  const riskFactors: RiskFactor[] = [];

  // Low eNPS is a strong indicator
  if (features.eNPS <= -50) {
    riskScore += 35;
    riskFactors.push({
      factor: 'Low eNPS Score',
      importance: 0.35,
      description: `eNPS of ${features.eNPS} indicates very low engagement`,
      value: features.eNPS,
    });
  } else if (features.eNPS <= -20) {
    riskScore += 20;
    riskFactors.push({
      factor: 'Negative eNPS',
      importance: 0.2,
      description: `eNPS of ${features.eNPS} suggests dissatisfaction`,
      value: features.eNPS,
    });
  }

  // Compensation below market
  if (features.comp_percentile < 30) {
    riskScore += 25;
    riskFactors.push({
      factor: 'Below Market Compensation',
      importance: 0.25,
      description: `Compensation at ${features.comp_percentile}th percentile`,
      value: features.comp_percentile,
    });
  }

  // Long time since last raise
  if (features.last_raise_months_ago && features.last_raise_months_ago > 18) {
    riskScore += 20;
    riskFactors.push({
      factor: 'Overdue for Raise',
      importance: 0.2,
      description: `Last raise was ${features.last_raise_months_ago} months ago`,
      value: features.last_raise_months_ago,
    });
  }

  // Negative review sentiment
  if (features.review_sentiment && features.review_sentiment < -0.3) {
    riskScore += 15;
    riskFactors.push({
      factor: 'Negative Review Feedback',
      importance: 0.15,
      description: 'Recent performance reviews show negative sentiment',
      value: features.review_sentiment,
    });
  }

  // Tenure sweet spot (highest risk at 2-3 years)
  if (features.tenure_months >= 24 && features.tenure_months <= 48) {
    riskScore += 10;
    riskFactors.push({
      factor: 'High-Risk Tenure Period',
      importance: 0.1,
      description: `${(features.tenure_months / 12).toFixed(1)} years is common attrition period`,
      value: features.tenure_months,
    });
  }

  // Sort by importance
  riskFactors.sort((a, b) => b.importance - a.importance);

  const probability = Math.min(riskScore / 100, 0.95);
  return buildAttritionPrediction(employee, features, probability, riskFactors);
}

/**
 * Build attrition prediction result
 */
function buildAttritionPrediction(
  employee: any,
  features: EmployeeFeatures,
  probability: number,
  customRiskFactors?: RiskFactor[]
): AttritionPrediction {
  // Determine risk level
  let flightRisk: AttritionPrediction['flightRisk'];
  if (probability >= 0.7) flightRisk = 'critical';
  else if (probability >= 0.5) flightRisk = 'high';
  else if (probability >= 0.3) flightRisk = 'medium';
  else flightRisk = 'low';

  // Generate recommendations based on risk factors
  const recommendations: string[] = [];
  const topFactors = customRiskFactors || [];

  if (topFactors.some((f) => f.factor.includes('eNPS'))) {
    recommendations.push('Schedule 1-on-1 to discuss job satisfaction and career goals');
    recommendations.push('Review workload and work-life balance');
  }

  if (topFactors.some((f) => f.factor.includes('Compensation'))) {
    recommendations.push('Review compensation against market data');
    recommendations.push('Consider off-cycle adjustment or promotion');
  }

  if (topFactors.some((f) => f.factor.includes('Raise'))) {
    recommendations.push('Prioritize for next compensation review cycle');
    recommendations.push('Communicate timeline for next raise opportunity');
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue regular check-ins to maintain engagement');
    recommendations.push('Identify growth opportunities and career development path');
  }

  return {
    employeeId: features.employeeId,
    employeeName: employee.name || employee.employee_name || 'Unknown',
    flightRisk,
    probabilityToLeave: probability,
    confidenceScore: 0.85, // Would come from model in production
    topRiskFactors: topFactors.slice(0, 3),
    recommendedActions: recommendations,
    predictedTimeframe: probability >= 0.7 ? 'Next 3 months' : 'Next 6 months',
  };
}

/**
 * Batch attrition predictions
 */
export async function batchPredictAttrition(
  employees: any[],
  config: PredictionConfig = {}
): Promise<AttritionPrediction[]> {
  const predictions = await Promise.all(employees.map((emp) => predictAttrition(emp, config)));

  // Sort by risk (highest first)
  return predictions.sort((a, b) => b.probabilityToLeave - a.probabilityToLeave);
}

// ============================================
// Performance Prediction
// ============================================

/**
 * Predict employee performance in next review cycle
 */
export async function predictPerformance(
  employee: any,
  config: PredictionConfig = {}
): Promise<PerformancePrediction> {
  try {
    const features = extractEmployeeFeatures(employee);

    const endpointId = config.endpointId || env.VERTEX_AI_PERFORMANCE_ENDPOINT_ID;

    if (!endpointId) {
      return predictPerformanceRuleBased(employee, features);
    }

    // Call Vertex AI endpoint
    const client = getPredictionClient();
    const projectId = config.projectId || env.GOOGLE_CLOUD_PROJECT;
    const location = config.location || env.VERTEX_AI_LOCATION;
    const endpoint = `projects/${projectId}/locations/${location}/endpoints/${endpointId}`;

    const normalizedFeatures = normalizeFeatures(features);
    const result2 = await client.predict({
      endpoint,
      instances: [{ features: normalizedFeatures }] as any,
    });
    const [response] = result2 as any;

    const prediction = response.predictions?.[0];
    const predictedRating = parseFloat(prediction?.rating || prediction?.value || '3');

    return buildPerformancePrediction(employee, features, predictedRating);
  } catch (error) {
    console.error('Performance prediction error:', error);
    const features = extractEmployeeFeatures(employee);
    return predictPerformanceRuleBased(employee, features);
  }
}

/**
 * Rule-based performance prediction
 */
function predictPerformanceRuleBased(
  employee: any,
  features: EmployeeFeatures
): PerformancePrediction {
  let predictedRating = features.avg_review_score || 3;

  const influencingFactors: Factor[] = [];

  // Positive sentiment trend
  if (features.review_sentiment && features.review_sentiment > 0.3) {
    predictedRating += 0.3;
    influencingFactors.push({
      name: 'Positive Review Sentiment',
      impact: 0.3,
      currentValue: features.review_sentiment,
      description: 'Recent reviews show consistently positive feedback',
    });
  }

  // High engagement (eNPS)
  if (features.eNPS > 30) {
    predictedRating += 0.2;
    influencingFactors.push({
      name: 'High Engagement',
      impact: 0.2,
      currentValue: features.eNPS,
      description: 'Strong eNPS indicates high motivation and engagement',
    });
  } else if (features.eNPS < -30) {
    predictedRating -= 0.2;
    influencingFactors.push({
      name: 'Low Engagement',
      impact: -0.2,
      currentValue: features.eNPS,
      description: 'Low eNPS may impact performance',
    });
  }

  // Training investment
  if (features.training_hours && features.training_hours > 20) {
    predictedRating += 0.15;
    influencingFactors.push({
      name: 'High Training Investment',
      impact: 0.15,
      currentValue: features.training_hours,
      description: 'Significant training hours suggest skill development',
    });
  }

  // Tenure experience
  if (features.tenure_months > 12 && features.tenure_months < 60) {
    predictedRating += 0.1;
    influencingFactors.push({
      name: 'Optimal Experience Level',
      impact: 0.1,
      currentValue: features.tenure_months,
      description: 'Good balance of experience and fresh perspective',
    });
  }

  // Cap rating between 1-5
  predictedRating = Math.max(1, Math.min(5, predictedRating));

  return buildPerformancePrediction(employee, features, predictedRating, influencingFactors);
}

/**
 * Build performance prediction result
 */
function buildPerformancePrediction(
  employee: any,
  features: EmployeeFeatures,
  predictedRating: number,
  customFactors?: Factor[]
): PerformancePrediction {
  const currentRating = features.last_review_score || features.avg_review_score;

  let expectedChange: PerformancePrediction['expectedChange'];
  if (currentRating) {
    if (predictedRating > currentRating + 0.3) expectedChange = 'improve';
    else if (predictedRating < currentRating - 0.3) expectedChange = 'decline';
    else expectedChange = 'maintain';
  } else {
    expectedChange = 'maintain';
  }

  const recommendations: string[] = [];

  if (expectedChange === 'improve') {
    recommendations.push('Recognize improvement and positive trajectory');
    recommendations.push('Consider for stretch assignments');
    recommendations.push('Document achievements for promotion consideration');
  } else if (expectedChange === 'decline') {
    recommendations.push('Provide additional support and resources');
    recommendations.push('Schedule regular check-ins to address challenges');
    recommendations.push('Create performance improvement plan if needed');
  } else {
    recommendations.push('Continue current development path');
    recommendations.push('Identify new growth opportunities');
  }

  return {
    employeeId: features.employeeId,
    employeeName: employee.name || employee.employee_name || 'Unknown',
    predictedRating: Math.round(predictedRating * 10) / 10,
    confidence: 0.8,
    currentRating,
    expectedChange,
    topInfluencingFactors: customFactors?.slice(0, 5) || [],
    recommendations,
  };
}

// ============================================
// Promotion Prediction
// ============================================

/**
 * Predict employee promotion readiness
 */
export async function predictPromotion(
  employee: any,
  config: PredictionConfig = {}
): Promise<PromotionPrediction> {
  try {
    const features = extractEmployeeFeatures(employee);

    const endpointId = config.endpointId || env.VERTEX_AI_PROMOTION_ENDPOINT_ID;

    if (!endpointId) {
      return predictPromotionRuleBased(employee, features);
    }

    // Call Vertex AI endpoint
    const client = getPredictionClient();
    const projectId = config.projectId || env.GOOGLE_CLOUD_PROJECT;
    const location = config.location || env.VERTEX_AI_LOCATION;
    const endpoint = `projects/${projectId}/locations/${location}/endpoints/${endpointId}`;

    const normalizedFeatures = normalizeFeatures(features);
    const result3 = await client.predict({
      endpoint,
      instances: [{ features: normalizedFeatures }] as any,
    });
    const [response] = result3 as any;

    const prediction = response.predictions?.[0];
    const probability = parseFloat(prediction?.probability || prediction?.value || '0');

    return buildPromotionPrediction(employee, features, probability);
  } catch (error) {
    console.error('Promotion prediction error:', error);
    const features = extractEmployeeFeatures(employee);
    return predictPromotionRuleBased(employee, features);
  }
}

/**
 * Rule-based promotion prediction
 */
function predictPromotionRuleBased(employee: any, features: EmployeeFeatures): PromotionPrediction {
  let readinessScore = 0;
  const strengths: string[] = [];
  const developmentAreas: string[] = [];

  // Strong performance
  if (features.avg_review_score && features.avg_review_score >= 4) {
    readinessScore += 30;
    strengths.push(
      'Consistently high performance (avg rating: ' + features.avg_review_score.toFixed(1) + ')'
    );
  } else if (features.avg_review_score && features.avg_review_score < 3.5) {
    developmentAreas.push('Needs to improve performance ratings');
  }

  // Sufficient tenure in role
  if (features.months_since_promotion && features.months_since_promotion >= 18) {
    readinessScore += 25;
    strengths.push(
      `Sufficient time in role (${Math.floor(features.months_since_promotion / 12)} years)`
    );
  } else {
    developmentAreas.push('Needs more experience in current role');
  }

  // High engagement
  if (features.eNPS > 20) {
    readinessScore += 20;
    strengths.push('High engagement and satisfaction');
  }

  // Training and development
  if (features.training_hours && features.training_hours > 15) {
    readinessScore += 15;
    strengths.push('Active in professional development');
  } else {
    developmentAreas.push('Should increase training and skill development');
  }

  // Leadership indicators (if managing team)
  if (features.team_size && features.team_size > 0) {
    readinessScore += 10;
    strengths.push('Demonstrated leadership capability');
  }

  const probability = readinessScore / 100;

  return buildPromotionPrediction(employee, features, probability, strengths, developmentAreas);
}

/**
 * Build promotion prediction result
 */
function buildPromotionPrediction(
  employee: any,
  features: EmployeeFeatures,
  probability: number,
  customStrengths?: string[],
  customDevelopmentAreas?: string[]
): PromotionPrediction {
  let promotionReadiness: PromotionPrediction['promotionReadiness'];
  let estimatedMonthsUntilReady: number;

  if (probability >= 0.8) {
    promotionReadiness = 'overdue';
    estimatedMonthsUntilReady = 0;
  } else if (probability >= 0.6) {
    promotionReadiness = 'ready';
    estimatedMonthsUntilReady = 3;
  } else if (probability >= 0.4) {
    promotionReadiness = 'developing';
    estimatedMonthsUntilReady = 12;
  } else {
    promotionReadiness = 'not_ready';
    estimatedMonthsUntilReady = 24;
  }

  const recommendations: string[] = [];

  if (promotionReadiness === 'overdue' || promotionReadiness === 'ready') {
    recommendations.push('Initiate promotion discussion');
    recommendations.push('Document achievements and impact');
    recommendations.push('Identify next-level responsibilities');
  } else if (promotionReadiness === 'developing') {
    recommendations.push('Create 6-12 month development plan');
    recommendations.push('Assign stretch projects to build skills');
    recommendations.push('Provide mentorship from senior leaders');
  } else {
    recommendations.push('Focus on performance improvement');
    recommendations.push('Increase training and skill development');
    recommendations.push('Set clear milestones for promotion readiness');
  }

  return {
    employeeId: features.employeeId,
    employeeName: employee.name || employee.employee_name || 'Unknown',
    promotionReadiness,
    probabilityOfPromotion: probability,
    estimatedMonthsUntilReady,
    strengths: customStrengths || [],
    developmentAreas: customDevelopmentAreas || [],
    recommendedActions: recommendations,
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate prediction cost
 * @param predictionCount Number of predictions made
 * @returns Cost in USD
 */
export function calculatePredictionCost(predictionCount: number): number {
  // Vertex AI predictions: $0.000002 per prediction
  return predictionCount * 0.000002;
}

/**
 * Get model endpoint status
 */
export async function getEndpointStatus(
  endpointId: string,
  config: PredictionConfig = {}
): Promise<any> {
  try {
    const client = getEndpointClient();
    const projectId = config.projectId || env.GOOGLE_CLOUD_PROJECT;
    const location = config.location || env.VERTEX_AI_LOCATION;
    const name = `projects/${projectId}/locations/${location}/endpoints/${endpointId}`;

    const [endpoint] = await client.getEndpoint({ name });
    return endpoint;
  } catch (error) {
    console.error('Failed to get endpoint status:', error);
    return null;
  }
}
