export interface Message {
  type: "agent" | "user";
  text: string;
}
