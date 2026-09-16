import { Profile, Project, MatchResult, MatchReason } from '@/types';

/**
 * Pure rule-based matching engine for JarbTeam.
 * Strictly separates matching calculations from UI components.
 * 
 * Formula:
 * - Skill Match: 40%
 * - Interest / Project Type Match: 25%
 * - Role Match: 20%
 * - Availability / Work Style Match: 15%
 * Total: 0 - 100
 */
export function calculateMatchScore(
  profile: Profile | null | undefined,
  project: Project
): MatchResult {
  if (!profile) {
    return {
      totalScore: 0,
      skillScore: 0,
      interestScore: 0,
      roleScore: 0,
      availabilityScore: 0,
      reasons: [],
      matchedSkills: [],
      matchedInterests: [],
      roleMatch: false,
      workStyleMatch: false,
    };
  }

  const reasons: MatchReason[] = [];

  // 1. Skill Match (40%)
  const userSkillNames = (profile.skills || []).map((s) => s.name.trim().toLowerCase());
  const projectSkillNames = (project.skills || []).map((s) => s.name.trim().toLowerCase());
  
  const matchedSkills: string[] = [];
  project.skills?.forEach((skill) => {
    if (userSkillNames.includes(skill.name.trim().toLowerCase())) {
      matchedSkills.push(skill.name);
    }
  });

  let skillScore = 0;
  if (projectSkillNames.length === 0) {
    skillScore = 40; // No hard skill requirements specified
  } else {
    skillScore = (matchedSkills.length / projectSkillNames.length) * 40;
  }
  skillScore = Math.round(skillScore);

  if (matchedSkills.length > 0) {
    reasons.push({
      type: 'skill',
      title: 'Skills match',
      description: `You match ${matchedSkills.length} of ${projectSkillNames.length || 1} required skills (${matchedSkills.join(', ')}).`,
      score: skillScore,
    });
  }

  // 2. Interest / Project Type Match (25%)
  let interestScore = 0;
  const userPreferredTypes = (profile.preferred_project_types || []).map((t) =>
    t.trim().toLowerCase()
  );
  const projectType = project.project_type?.trim().toLowerCase();

  const typeMatches = userPreferredTypes.includes(projectType);
  if (typeMatches) {
    interestScore += 15;
    reasons.push({
      type: 'interest',
      title: 'Project type match',
      description: `Matches your preferred project type: ${project.project_type}.`,
      score: 15,
    });
  }

  const userInterests = (profile.interests || []).map((i) => i.name.trim().toLowerCase());
  const matchedInterests: string[] = [];
  
  // Check if project description or name contains user interest keywords
  const projectText = `${project.name} ${project.description}`.toLowerCase();
  profile.interests?.forEach((interest) => {
    if (projectText.includes(interest.name.trim().toLowerCase())) {
      matchedInterests.push(interest.name);
    }
  });

  if (matchedInterests.length > 0) {
    const keywordScore = Math.min(10, matchedInterests.length * 5);
    interestScore += keywordScore;
    reasons.push({
      type: 'interest',
      title: 'Interests match',
      description: `Aligns with your interests in ${matchedInterests.join(', ')}.`,
      score: keywordScore,
    });
  } else if (!typeMatches && userInterests.length > 0) {
    // Partial baseline interest points if student has profile interests filled out
    interestScore += 5;
  }
  interestScore = Math.min(25, interestScore);

  // 3. Role Match (20%)
  const userRoles = (profile.preferred_roles || []).map((r) => r.trim().toLowerCase());
  const projectRequiredRoles = (project.required_roles || []).map((r) => r.trim().toLowerCase());
  
  let roleMatch = false;
  let roleScore = 0;

  if (projectRequiredRoles.length === 0) {
    roleMatch = true;
    roleScore = 20; // Open to any role
  } else {
    const matchedRole = project.required_roles?.find((role) =>
      userRoles.includes(role.trim().toLowerCase())
    );
    if (matchedRole) {
      roleMatch = true;
      roleScore = 20;
      reasons.push({
        type: 'role',
        title: 'Role match',
        description: `This team is looking for a ${matchedRole}, matching your preferred role.`,
        score: 20,
      });
    }
  }

  // 4. Availability / Work Style Match (15%)
  let availabilityScore = 0;
  let workStyleMatch = false;

  const userWorkStyle = profile.work_style;
  const projectWorkStyle = project.work_style;

  if (
    userWorkStyle === projectWorkStyle ||
    userWorkStyle === 'Hybrid' ||
    projectWorkStyle === 'Hybrid'
  ) {
    workStyleMatch = true;
    availabilityScore += 10;
    reasons.push({
      type: 'work_style',
      title: 'Work style match',
      description: `Compatible work style (${projectWorkStyle}).`,
      score: 10,
    });
  }

  if (profile.availability && profile.availability.trim().length > 0) {
    availabilityScore += 5;
    reasons.push({
      type: 'availability',
      title: 'Availability match',
      description: `Your stated availability (${profile.availability}) fits project expectations.`,
      score: 5,
    });
  }

  const totalScore = Math.min(
    100,
    Math.max(0, skillScore + interestScore + roleScore + availabilityScore)
  );

  return {
    totalScore,
    skillScore,
    interestScore,
    roleScore,
    availabilityScore,
    reasons,
    matchedSkills,
    matchedInterests,
    roleMatch,
    workStyleMatch,
  };
}
