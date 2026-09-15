export const DEFAULT_STUDENT_INTERESTS = [
  'AI / Machine Learning',
  'Software Engineering',
  'Web Development',
  'Computer Vision',
  'Data Engineering',
  'Embedded Systems',
  'IoT',
  'Robotics',
  'Automation',
  'Cloud',
  'Cybersecurity'
];

export const EXPLORABLE_INTERESTS = [
  'AI / ML',
  'Software Engineering',
  'Web Development',
  'Cybersecurity',
  'Embedded / Hardware',
  'Robotics',
  'Cloud',
  'Data',
  'IoT',
  'Computer Vision',
  'Automation'
];

/**
 * Normalizes keyword for flexible fuzzy matching
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if a specific career role matches student interests
 */
export function isCareerRelevant(careerTitle: string, interests: string[] = DEFAULT_STUDENT_INTERESTS): boolean {
  const normRole = normalize(careerTitle);
  return interests.some(interest => {
    const normInterest = normalize(interest);
    if (normRole.includes(normInterest) || normInterest.includes(normRole)) return true;
    
    // Substring associations
    if (normInterest.includes('ai') || normInterest.includes('machinelearning') || normInterest.includes('ml')) {
      if (normRole.includes('ai') || normRole.includes('ml') || normRole.includes('machinelearning') || normRole.includes('vision') || normRole.includes('nlp')) return true;
    }
    if (normInterest.includes('software')) {
      if (normRole.includes('software') || normRole.includes('developer') || normRole.includes('backend') || normRole.includes('frontend') || normRole.includes('fullstack')) return true;
    }
    if (normInterest.includes('data')) {
      if (normRole.includes('data') || normRole.includes('analytics') || normRole.includes('scientist')) return true;
    }
    if (normInterest.includes('cloud')) {
      if (normRole.includes('cloud') || normRole.includes('devops') || normRole.includes('site') || normRole.includes('reliability') || normRole.includes('infrastructure')) return true;
    }
    if (normInterest.includes('security') || normInterest.includes('cyber')) {
      if (normRole.includes('security') || normRole.includes('cyber') || normRole.includes('infosec')) return true;
    }
    if (normInterest.includes('embedded') || normInterest.includes('hardware') || normInterest.includes('iot')) {
      if (normRole.includes('embedded') || normRole.includes('hardware') || normRole.includes('firmware') || normRole.includes('iot') || normRole.includes('electronic')) return true;
    }
    if (normInterest.includes('robotics') || normInterest.includes('automation')) {
      if (normRole.includes('robot') || normRole.includes('automation') || normRole.includes('control') || normRole.includes('mechatronics')) return true;
    }
    return false;
  });
}

/**
 * Counts how many roles at a company match student interests
 */
export function countMatchingRoles(commonCareers: string[], interests: string[] = DEFAULT_STUDENT_INTERESTS): number {
  return commonCareers.filter(role => isCareerRelevant(role, interests)).length;
}

/**
 * Generates the clean explanation label: "X roles match your interests"
 */
export function getStudentMatchLabel(matchingCount: number): string | null {
  if (matchingCount === 0) return null;
  return `${matchingCount} ${matchingCount === 1 ? 'role matches' : 'roles match'} your interests`;
}

/**
 * Calculates a dynamic recommendation score based on user interests
 */
export function calculateStudentFitScore(
  categories: string[],
  technicalAreas: string[],
  commonCareers: string[],
  selectedInterests: string[]
): number {
  let score = 0;
  
  for (const interest of selectedInterests) {
    const norm = normalize(interest);
    
    // Check categories
    if (categories.some(c => normalize(c).includes(norm) || norm.includes(normalize(c)))) {
      score += 15;
    }
    
    // Check technical areas
    if (technicalAreas.some(t => normalize(t).includes(norm) || norm.includes(normalize(t)))) {
      score += 20;
    }
    
    // Check careers
    if (commonCareers.some(c => normalize(c).includes(norm))) {
      score += 25;
    }
  }

  return score;
}
