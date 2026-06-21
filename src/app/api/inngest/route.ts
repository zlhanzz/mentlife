import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { extractDataFromChat, ChatExtractionResult } from "@/services/ai";
import { createAdminClient } from "@/lib/supabase/admin";

// Define the background job function
const extractChatDataJob = inngest.createFunction(
  { id: "extract-chat-data", name: "Extract Chat Data", triggers: { event: "chat/message.sent" } },
  async ({ event, step }: any) => {
    // Definisikan tipe event.data secara eksplisit karena inisialisasi generic minimal
    const { userId, content, chatHistory } = event.data as { userId: string; content: string; chatHistory: string[] };

    // Run extraction using Gemini API
    const extracted = await step.run("extract-from-chat-api", async (): Promise<ChatExtractionResult> => {
      return await extractDataFromChat(content, chatHistory);
    });

    // Save extracted data to Supabase using admin client
    await step.run("save-extracted-data-to-db", async () => {
      const supabase = createAdminClient();

      if (extracted.users_core && Object.keys(extracted.users_core).length > 0) {
        const { error: coreError } = await supabase.from("users_core").upsert({
          id: userId,
          ...extracted.users_core,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" });

        if (coreError) {
          console.error("Inngest: Gagal menyimpan users_core:", coreError.message);
          throw new Error(`Core insert error: ${coreError.message}`);
        }
      }

      if (extracted.ikigai_vectors && extracted.ikigai_vectors.length > 0) {
        for (const vec of extracted.ikigai_vectors) {
          const { error: memError } = await supabase.from("ai_memory").insert({
            user_id: userId,
            context: vec.category,
            insight: vec.content,
            confidence: 0.9
          });

          if (memError) {
            console.error("Inngest: Gagal menyimpan ai_memory:", memError.message);
          }
        }
      }
    });

    return { success: true, extracted };
  }
);

// Serve the endpoints
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [extractChatDataJob],
});
