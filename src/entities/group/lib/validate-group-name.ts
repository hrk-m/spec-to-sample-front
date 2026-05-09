const NAME_MAX_LENGTH = 100;

export function validateGroupName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return "Name is required";
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return "Name must be 100 characters or less";
  }
  return null;
}
