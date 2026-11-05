import { redirect } from "next/navigation";
import { SEGMENTS } from "@/lib/segments";

export default function SegmentsIndex() {
  redirect(`/segments/${SEGMENTS[0].slug}`);
}
