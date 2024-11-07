import dynamic from "next/dynamic";
import WritePage from "../../components/WritePage/WritePage";
export const dynamic = "force-dynamic";

export default function WritePageWrapper() {
  return <WritePage />;
}
