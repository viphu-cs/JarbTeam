export type WorkStyle = 'Online' | 'On-site' | 'Hybrid';

export type ProjectType =
  | 'Course Project'
  | 'Competition'
  | 'Hackathon'
  | 'Innovation'
  | 'Startup'
  | 'Other';

export type ProjectStatus = 'open' | 'in_progress' | 'completed' | 'closed';

export type JoinRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  university?: string;
  major?: string;
  bio?: string;
  avatar_url?: string;
  preferred_roles?: string[];
  preferred_project_types?: string[];
  work_style?: WorkStyle;
  availability?: string;
  created_at?: string;
  updated_at?: string;
  skills?: Skill[];
  interests?: Interest[];
}

export interface Skill {
  id: string;
  name: string;
}

export interface Interest {
  id: string;
  name: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  profile_id: string;
  role: string;
  joined_at: string;
  status: string;
  profile?: Profile;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  project_type: ProjectType;
  image_url?: string;
  deadline?: string;
  duration?: string;
  team_size: number;
  work_style: WorkStyle;
  required_roles?: string[];
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  owner?: Profile;
  skills?: Skill[];
  members?: ProjectMember[];
  matchScore?: number;
  matchReasons?: MatchReason[];
}

export interface JoinRequest {
  id: string;
  project_id: string;
  profile_id: string;
  requested_role: string;
  message?: string;
  status: JoinRequestStatus;
  created_at: string;
  profile?: Profile;
  project?: Project;
}

export interface MatchReason {
  type: 'skill' | 'interest' | 'role' | 'availability' | 'work_style';
  title: string;
  description: string;
  score: number;
}

export interface MatchResult {
  totalScore: number;
  skillScore: number;
  interestScore: number;
  roleScore: number;
  availabilityScore: number;
  reasons: MatchReason[];
  matchedSkills: string[];
  matchedInterests: string[];
  roleMatch: boolean;
  workStyleMatch: boolean;
}

// ==============================================================================
// Chat Types (Phase 1 Foundation)
// ==============================================================================

export type ConversationType = 'direct' | 'project';

export interface Conversation {
  id: string;
  type: ConversationType;
  project_id?: string | null;
  created_at: string;
  updated_at: string;
  project?: Project;
  members?: ConversationMember[];
  last_message?: Message;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at?: string | null;
  profile?: Profile;
}

export type AttachmentType = 'image';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string | null;
  attachment_url?: string | null;
  attachment_type?: AttachmentType | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  sender?: Profile;
}

