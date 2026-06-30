import DashboardClientWrapper from "./_components/DashboardClientWrapper";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardClientWrapper>{children}</DashboardClientWrapper>;
}
