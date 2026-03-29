export default function PublishingQueuePage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient p-10 text-center max-w-md">
        <span className="material-symbols-outlined text-surface-tint text-[48px] mb-4 block">
          schedule_send
        </span>
        <h2 className="font-display font-bold text-xl text-on-surface mb-2">Publishing Queue</h2>
        <p className="text-on-surface-variant text-sm">
          Automated publishing workflows and scheduling are coming soon. Stay tuned.
        </p>
      </div>
    </div>
  );
}
