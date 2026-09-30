/**
 * Pass-through layout for the overview segment.
 *
 * The overview header lives in `page.tsx` so nested routes (the finding detail
 * page) can provide their own header.
 */
export default function OverViewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
