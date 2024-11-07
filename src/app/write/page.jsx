import dynamic from "next/dynamic";
import WritePage from "../../components/WritePage/WritePage";
export const dynamicParams = "force-dynamic";
export default function WritePageWrapper() {
  return <WritePage />;
}
