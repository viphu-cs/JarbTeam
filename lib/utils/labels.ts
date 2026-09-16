export type CommonTranslationFn = (
  key:
    | 'projectTypes.Course Project'
    | 'projectTypes.Competition'
    | 'projectTypes.Hackathon'
    | 'projectTypes.Innovation'
    | 'projectTypes.Startup'
    | 'projectTypes.Other'
    | 'workStyles.Online'
    | 'workStyles.On-site'
    | 'workStyles.Hybrid'
    | 'status.open'
    | 'status.recruiting'
    | 'status.in_progress'
    | 'status.completed'
    | 'status.closed'
    | 'status.pending'
    | 'status.accepted'
    | 'status.rejected'
) => string;

export function getProjectTypeLabel(
  t: CommonTranslationFn,
  type?: string | null
): string {
  if (!type) return '';
  switch (type) {
    case 'Course Project':
      return t('projectTypes.Course Project');
    case 'Competition':
      return t('projectTypes.Competition');
    case 'Hackathon':
      return t('projectTypes.Hackathon');
    case 'Innovation':
      return t('projectTypes.Innovation');
    case 'Startup':
      return t('projectTypes.Startup');
    case 'Other':
      return t('projectTypes.Other');
    default:
      return type;
  }
}

export function getWorkStyleLabel(
  t: CommonTranslationFn,
  style?: string | null
): string {
  if (!style) return '';
  switch (style) {
    case 'Online':
      return t('workStyles.Online');
    case 'On-site':
      return t('workStyles.On-site');
    case 'Hybrid':
      return t('workStyles.Hybrid');
    default:
      return style;
  }
}

export function getStatusLabel(
  t: CommonTranslationFn,
  status?: string | null
): string {
  if (!status) return '';
  switch (status) {
    case 'open':
      return t('status.open');
    case 'recruiting':
      return t('status.recruiting');
    case 'in_progress':
      return t('status.in_progress');
    case 'completed':
      return t('status.completed');
    case 'closed':
      return t('status.closed');
    case 'pending':
      return t('status.pending');
    case 'accepted':
      return t('status.accepted');
    case 'rejected':
      return t('status.rejected');
    default:
      return status;
  }
}
