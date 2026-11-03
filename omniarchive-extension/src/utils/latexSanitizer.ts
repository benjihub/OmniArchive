export function sanitizeLatex(input: string) {
  return input.replace(/\\\((.*?)\\\)/gs, (_, expression: string) => `$${expression}$`).replace(/\\\[(.*?)\\\]/gs, (_, expression: string) => `$$${expression}$$`);
}
