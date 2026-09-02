/** 菜品图片：有图显示图，无图显示代码绘制的暖色餐盘纹样占位 */
export function DishImage({
  imageUrl,
  name,
  className = "",
}: {
  imageUrl?: string | null;
  name: string;
  className?: string;
}) {
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className={`object-cover ${className}`} loading="lazy" />;
  }
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-[#f6e7c8] via-[#f3ddba] to-[#eccfa4] ${className}`}
      role="img"
      aria-label={name}
    >
      <svg viewBox="0 0 80 80" className="h-1/2 w-1/2 opacity-70" fill="none">
        <ellipse cx="40" cy="50" rx="26" ry="12" fill="#d5593f" opacity="0.9" />
        <ellipse cx="40" cy="47" rx="26" ry="12" fill="#fcf8ef" />
        <ellipse cx="40" cy="46" rx="20" ry="9" fill="#dfa43d" opacity="0.55" />
        <path d="M32 30c0-4 4-4 4-8M40 32c0-4 4-4 4-8M48 30c0-4 4-4 4-8" stroke="#b23a2a" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M14 50c0 10 12 18 26 18s26-8 26-18" stroke="#b23a2a" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}
