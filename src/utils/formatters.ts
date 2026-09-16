export function formatDuration(seconds: number): string {
  const wholeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const remainingSeconds = wholeSeconds % 60;
  return hours > 0
    ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatCompletedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatEndReason(reason: string): string {
  if (reason === 'time') return 'Time Expired';
  if (reason === 'player_destroyed') return 'Player Destroyed';
  return reason.replace(/_/g, ' ');
}
