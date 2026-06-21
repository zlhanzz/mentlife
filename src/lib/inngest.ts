import { Inngest } from "inngest";

// Define the event types
export type Events = {
  "chat/message.sent": {
    data: {
      userId: string;
      content: string;
      chatHistory: string[];
    };
  };
};

// Create a client to send and receive events
export const inngest = new Inngest({ 
  id: "mentlife",
  schemas: {
    "chat/message.sent": {
      helper: {} as any,
      schema: {} as any
    }
  }
});
