export interface TodoListRecord {
  id: string;
  title: string;
  colourCode: string;
  items: { isDone: boolean }[];
}
