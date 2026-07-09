import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { formatMessage } from "@/lib/i18n/format";

type ErrorKey = keyof Dictionary["errors"];

const MESSAGE_TO_KEY: Record<string, ErrorKey> = {
  "Invalid email or password.": "invalidEmailOrPassword",
  "Unable to sign in. Please try again.": "unableToSignIn",
  "Invalid plan parameters.": "invalidPlanParameters",
  "Invalid report parameters.": "invalidReportParameters",
  "Invalid date.": "invalidDate",
  "Invalid month.": "invalidMonth",
  "Invalid week.": "invalidWeek",
  "Invalid day.": "invalidDay",
  "Invalid role.": "invalidRole",
  "Invalid organization name.": "invalidOrganizationName",
  Unauthorized: "unauthorized",
  "No file selected.": "noFileSelected",
  "Notes are too long.": "notesTooLong",
  "This period is outside the edit window.": "outsideEditWindow",
  "Unable to save notes.": "unableToSaveNotes",
  "Invalid input.": "invalidInput",
  "Unable to add item.": "unableToAddItem",
  "Unable to update item.": "unableToUpdateItem",
  "Unable to delete item.": "unableToDeleteItem",
  "Unable to submit plan.": "unableToSubmitPlan",
  "Unable to reopen plan.": "unableToReopenPlan",
  "Unable to delete plan.": "unableToDeletePlan",
  "Unable to upload file.": "unableToUploadFile",
  "Unable to delete attachment.": "unableToDeleteAttachment",
  "Unable to check off item.": "unableToCheckOffItem",
  "Unable to uncheck item.": "unableToUncheckItem",
  "Unable to update plan item.": "unableToUpdatePlanItem",
  "Unable to add entry.": "unableToAddEntry",
  "Unable to update entry.": "unableToUpdateEntry",
  "Unable to delete entry.": "unableToDeleteEntry",
  "Unable to submit report.": "unableToSubmitReport",
  "Unable to open tomorrow’s plan.": "unableToOpenTomorrowsPlan",
  "Unable to delete report.": "unableToDeleteReport",
  "Unable to open plan.": "unableToOpenPlan",
  "Unable to open report.": "unableToOpenReport",
  "Unable to update profile.": "unableToUpdateProfile",
  "Unable to change password.": "unableToChangePassword",
  "Unable to upload avatar.": "unableToUploadAvatar",
  "Unable to remove avatar.": "unableToRemoveAvatar",
  "Unable to create user.": "unableToCreateUser",
  "Unable to update role.": "unableToUpdateRole",
  "Unable to update user status.": "unableToUpdateUserStatus",
  "Unable to generate password-set link.": "unableToGeneratePasswordLink",
  "Unable to update organization settings.": "unableToUpdateOrganizationSettings",
  "Name is required.": "nameRequired",
  "Email is required.": "emailRequired",
  "Invalid email address.": "invalidEmailAddress",
  "Password is required.": "passwordRequired",
  "Password must be at least 8 characters.": "passwordMinLength",
  "Passwords do not match.": "passwordsDoNotMatch",
  "Current password is required.": "currentPasswordRequired",
  "Confirm your new password.": "confirmPasswordRequired",
  "Organization name is required.": "organizationNameRequired",
  "Title is required.": "titleRequired",
  "Invalid date format.": "invalidDateFormat",
  "Hours cannot be negative.": "hoursCannotBeNegative",
  "Hours cannot exceed 24 per entry.": "hoursCannotExceed24",
  "Hours must be greater than zero.": "hoursMustBeGreaterThanZero",
  "This link has expired. Ask your admin for a new one.": "linkExpired",
  "This link has already been used.": "linkUsed",
  "This account is inactive.": "linkInactive",
  "Invalid password-set link.": "invalidPasswordSetLink",
  "Plan item not found.": "planItemNotFound",
  "This plan cannot be edited.": "planCannotBeEdited",
  "Resolved items cannot be edited.": "resolvedItemsCannotBeEdited",
  "Submitted plans cannot be edited.": "submittedPlansCannotBeEdited",
  "Add at least one plan item before submitting.": "addPlanItemBeforeSubmit",
  "Plan not found.": "planNotFound",
  "Only submitted plans can be reopened.": "onlySubmittedPlansCanBeReopened",
  "Plan item not found on your submitted plan.": "planItemNotOnPlan",
  "This plan item was already resolved in another report.": "planItemResolvedElsewhere",
  "Report entry not found.": "reportEntryNotFound",
  "Uncheck the plan item to remove this entry.": "uncheckToRemoveEntry",
  "Add at least one report entry before submitting.": "addReportEntryBeforeSubmit",
  "Completed plan items need hours greater than zero.": "completedItemsNeedHours",
  "Every entry must have hours greater than zero.": "entriesNeedHours",
  "Report not found.": "reportNotFound",
  "Submitted reports cannot be edited.": "submittedReportsCannotBeEdited",
  "User not found.": "userNotFound",
  "A user with this email already exists.": "emailAlreadyExists",
  "No password is set for this account. Use a password-set link from your admin.":
    "noPasswordSetUseLink",
  "Current password is incorrect.": "currentPasswordIncorrect",
  "Select an image file.": "selectImageFile",
  "Avatar must be a JPEG, PNG, GIF, or WebP image.": "avatarInvalidType",
  "Cannot generate a link for an inactive user.": "cannotGenerateLinkInactive",
  "You cannot change your own role.": "cannotChangeOwnRole",
  "You cannot deactivate your own account.": "cannotDeactivateSelf",
  "Invalid week value.": "invalidWeekValue",
  "Invalid month value.": "invalidMonthValue",
  "Attachment not found.": "attachmentNotFound",
  "File name is required.": "fileNameRequired",
  "File is empty.": "fileEmpty",
  "File type not allowed. Use PDF, images, Office documents, or plain text.":
    "fileTypeNotAllowed",
  "Tomorrow’s plan is outside the daily edit window.": "tomorrowPlanOutsideWindow",
};

function translateDynamicMessage(
  message: string,
  dict: Dictionary,
): string | null {
  const fileSizeMatch = message.match(
    /^File exceeds maximum size of (\d+) MB\.$/,
  );
  if (fileSizeMatch) {
    return formatMessage(dict.errors.fileExceedsMaxSize, {
      mb: fileSizeMatch[1]!,
    });
  }

  const avatarSizeMatch = message.match(
    /^Avatar exceeds maximum size of (\d+) MB\.$/,
  );
  if (avatarSizeMatch) {
    return formatMessage(dict.errors.avatarExceedsMaxSize, {
      mb: avatarSizeMatch[1]!,
    });
  }

  return null;
}

export function translateError(
  message: string,
  dict: Dictionary,
  fallback?: string,
): string {
  const key = MESSAGE_TO_KEY[message];
  if (key) {
    return dict.errors[key];
  }

  const dynamic = translateDynamicMessage(message, dict);
  if (dynamic) {
    return dynamic;
  }

  return fallback ?? dict.errors.generic;
}

export function translateFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
  dict: Dictionary,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (!messages?.length) {
      continue;
    }
    result[field] = messages.map((message) => translateError(message, dict));
  }
  return result;
}
