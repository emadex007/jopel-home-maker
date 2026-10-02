import { cn, useSite } from "~/lib/ui";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  PinterestIcon,
  TikTokIcon,
  XIcon,
  YouTubeIcon,
} from "./Icons";

const NETWORKS = [
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "facebook", label: "Facebook", Icon: FacebookIcon },
  { key: "tiktok", label: "TikTok", Icon: TikTokIcon },
  { key: "x", label: "X (Twitter)", Icon: XIcon },
  { key: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
  { key: "youtube", label: "YouTube", Icon: YouTubeIcon },
  { key: "pinterest", label: "Pinterest", Icon: PinterestIcon },
] as const;

export function SocialLinks({ size = 18, className }: { size?: number; className?: string }) {
  const s = useSite();
  const links = NETWORKS.filter((n) => s.social[n.key]?.trim());
  if (!links.length) return null;
  return (
    <div className={cn("flex items-center", className)}>
      {links.map(({ key, label, Icon }) => (
        <a
          key={key}
          href={s.social[key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="transition-opacity hover:opacity-70"
        >
          <Icon size={size} />
        </a>
      ))}
    </div>
  );
}
