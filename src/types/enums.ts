// Enums as const objects
const RoleEnum = {
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
};

const TaskStatusEnum = {
  PENDING: "PENDING",
  PLANNING: "PLANNING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
};

const TaskPriorityEnum = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
};

// Export the enums
module.exports = {
  RoleEnum,
  TaskStatusEnum,
  TaskPriorityEnum,
};
