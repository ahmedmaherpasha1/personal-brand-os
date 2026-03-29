const STATUS_STYLES = {
  draft: {
    label: 'DRAFT',
    className: 'bg-secondary-container text-on-secondary-container',
  },
  approved: {
    label: 'APPROVED',
    className: 'bg-primary-fixed text-on-primary-fixed-variant',
  },
  scheduled: {
    label: 'SCHEDULED',
    className: 'bg-primary-fixed text-on-primary-fixed-variant',
  },
  generated: {
    label: 'AI-GENERATED',
    className: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  },
};

const TAG_STYLES = [
  'bg-primary-fixed text-on-primary-fixed-variant',
  'bg-secondary-fixed text-on-secondary-fixed-variant',
  'bg-tertiary-fixed text-on-tertiary-fixed-variant',
];

export default function PostCard({ post, onClick }) {
  const status = STATUS_STYLES[post.status] || STATUS_STYLES.draft;

  const tags = [
    post.pillar,
    post.format,
    post.platform,
  ].filter(Boolean);

  return (
    <button
      type="button"
      onClick={() => onClick(post)}
      className="w-full text-left bg-surface-container-lowest rounded-xl p-5 transition-all duration-200 hover:shadow-ambient cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-display font-semibold text-base text-on-surface leading-snug line-clamp-2 group-hover:text-surface-tint transition-colors duration-200">
          {post.hook || 'Untitled Post'}
        </h3>
        <span
          className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-[0.1em] uppercase ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {post.body && (
        <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-2 mb-4">
          {post.body}
        </p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, index) => (
            <span
              key={tag}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${TAG_STYLES[index % TAG_STYLES.length]}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
