import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";

// Serve the Inngest endpoint — functions will be registered here when needed
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [],
});
