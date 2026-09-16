import Link from 'next/link';
import { Project } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, Users, Sparkles, ArrowRight } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  hasUser: boolean;
}

export function ProjectCard({ project, hasUser }: ProjectCardProps) {
  const currentMembersCount = project.members?.length || 1;
  const isFull = currentMembersCount >= project.team_size;

  const score = project.matchScore ?? 0;

  // Format deadline
  let deadlineText = 'Open enrollment';
  if (project.deadline) {
    try {
      const d = new Date(project.deadline);
      deadlineText = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      deadlineText = project.deadline;
    }
  }

  return (
    <Card
      variant="white"
      hoverEffect
      className="flex flex-col justify-between h-full group"
    >
      <div>
        {/* Header: Project Type & Match Score */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant="blue" size="sm">
            {project.project_type}
          </Badge>

          {hasUser && project.matchScore !== undefined ? (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                score >= 75
                  ? 'bg-[#DCFCE7] text-[#14532D] border border-[#BBF7D0]'
                  : score >= 50
                  ? 'bg-[#EDE9FE] text-[#3F1E8C] border border-[#E0E7FF]'
                  : 'bg-[#FAF9F6] text-[#475569] border border-[#E2E8F0]'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {score}% Match
            </span>
          ) : (
            <span className="text-[11px] text-[#64748B]">
              {project.work_style}
            </span>
          )}
        </div>

        {/* Project Title */}
        <h3 className="font-bold text-base text-[#0F172A] group-hover:text-[#3b6475] transition-colors line-clamp-1">
          {project.name}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-[#475569] mt-2 line-clamp-3 leading-relaxed">
          {project.description}
        </p>

        {/* Required Skills Chips */}
        {project.skills && project.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {project.skills.slice(0, 4).map((skill) => (
              <Badge key={skill.id} variant="blue" size="sm">
                {skill.name}
              </Badge>
            ))}
            {project.skills.length > 4 && (
              <span className="text-[11px] text-[#64748B] self-center">
                +{project.skills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-4 border-t border-[#F1F5F9] space-y-3">
        <div className="flex items-center justify-between text-xs text-[#64748B]">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#7CA5B8]" />
            <span>
              {currentMembersCount}/{project.team_size} members
              {isFull && <strong className="text-rose-600 ml-1">(Full)</strong>}
            </span>
          </span>

          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>{deadlineText}</span>
          </span>
        </div>

        <Link href={`/projects/${project.id}`} className="block">
          <Button
            variant="secondary"
            fullWidth
            size="sm"
            className="group-hover:bg-[#D4E6F1] group-hover:border-[#BEE3F8] group-hover:text-[#0B3B4B] transition-all"
          >
            <span>View Project</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
