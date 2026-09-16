import { Layers, Sparkles, Code, Lightbulb, Rocket } from 'lucide-react';

interface ProjectPlaceholderProps {
  name?: string;
  type?: string;
  className?: string;
}

export function ProjectPlaceholder({
  name,
  type,
  className = '',
}: ProjectPlaceholderProps) {
  // Select an icon and pastel tone based on project type
  const getVisual = () => {
    switch (type) {
      case 'Competition':
        return {
          icon: Rocket,
          gradient: 'from-[#EDE9FE] via-[#FAF9F6] to-[#D4E6F1]',
          iconColor: 'text-[#8B5CF6]',
          badgeBg: 'bg-[#EDE9FE] text-[#6D28D9] border-[#DDD6FE]',
        };
      case 'Hackathon':
        return {
          icon: Code,
          gradient: 'from-[#DCFCE7] via-[#FAF9F6] to-[#E0F2FE]',
          iconColor: 'text-[#10B981]',
          badgeBg: 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]',
        };
      case 'Innovation':
        return {
          icon: Lightbulb,
          gradient: 'from-[#FEF9C3] via-[#FAF9F6] to-[#EDE9FE]',
          iconColor: 'text-[#EAB308]',
          badgeBg: 'bg-[#FEF9C3] text-[#A16207] border-[#FEF08A]',
        };
      case 'Startup':
        return {
          icon: Sparkles,
          gradient: 'from-[#FCE7F3] via-[#FAF9F6] to-[#D4E6F1]',
          iconColor: 'text-[#EC4899]',
          badgeBg: 'bg-[#FCE7F3] text-[#BE185D] border-[#FBCFE8]',
        };
      case 'Course Project':
      default:
        return {
          icon: Layers,
          gradient: 'from-[#E8F1F5] via-[#FAF9F6] to-[#EDE9FE]',
          iconColor: 'text-[#7CA5B8]',
          badgeBg: 'bg-[#E8F1F5] text-[#0B3B4B] border-[#BEE3F8]',
        };
    }
  };

  const visual = getVisual();
  const IconComponent = visual.icon;

  return (
    <div
      className={`relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-gradient-to-br ${visual.gradient} border border-[#E2E8F0]/80 flex flex-col items-center justify-center p-6 text-center select-none ${className}`}
    >
      {/* Decorative Subtle Background Shapes */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/40 blur-lg pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/40 blur-lg pointer-events-none" />

      {/* Center Icon */}
      <div className="relative w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-xs border border-white/60 shadow-xs flex items-center justify-center mb-2.5">
        <IconComponent className={`w-6 h-6 ${visual.iconColor}`} />
      </div>

      {/* Project initials or name snippet */}
      {name && (
        <span className="relative text-xs font-bold text-[#0F172A] max-w-[85%] truncate tracking-tight">
          {name}
        </span>
      )}
    </div>
  );
}
