export type Dictionary = {
  app: { title: string };
  header: { language: string; signOut: string };
  nav: {
    home: string;
    myFeed: string;
    teamFeed: string;
    users: string;
    settings: string;
  };
  roles: { ADMIN: string; MANAGER: string; MEMBER: string };
  auth: {
    signIn: string;
    signInDescription: string;
    email: string;
    password: string;
    signingIn: string;
    loading: string;
    passwordSetSuccess: string;
    setPassword: {
      title: string;
      welcome: string;
      confirmPassword: string;
      button: string;
      unableTitle: string;
      tokenInvalid: string;
      tokenUsed: string;
      tokenUsedSignIn: string;
      tokenExpired: string;
      tokenInactive: string;
    };
  };
  common: {
    plan: string;
    report: string;
    title: string;
    description: string;
    visibility: string;
    name: string;
    email: string;
    role: string;
    hours: string;
    save: string;
    saving: string;
    cancel: string;
    delete: string;
    deleting: string;
    open: string;
    more: string;
    expandAll: string;
    collapseAll: string;
    editItem: string;
    deleteItem: string;
    removeFile: string;
    expandItem: string;
    collapseItem: string;
    fileSizeB: string;
    fileSizeKB: string;
    fileSizeMB: string;
  };
  periods: {
    type: { daily: string; weekly: string; monthly: string };
    picker: { date: string; week: string; month: string; period: string; day: string };
    relative: { today: string; yesterday: string; thisWeek: string };
    weekOf: string;
    weekOption: string;
  };
  badges: {
    submitted: string;
    draft: string;
    completed: string;
    failed: string;
    cancelled: string;
    public: string;
    private: string;
    missing: string;
    open: string;
  };
  home: {
    welcome: string;
    subtitle: string;
    outsideEditWindow: string;
    itemsCompleted: string;
    noItemsYet: string;
    noPlanFiled: string;
    entryCountOne: string;
    entryCountMany: string;
    hoursShort: string;
    noReportFiled: string;
    submitPlan: string;
    viewPlan: string;
    submitReport: string;
    viewReport: string;
    filePlan: string;
    fileReport: string;
    continueDraftPlan: string;
    continueDraftReport: string;
    openingPlan: string;
    openingReport: string;
  };
  settings: {
    subtitle: string;
    languageTitle: string;
    languageDescription: string;
    avatarTitle: string;
    avatarDescription: string;
    avatarAlt: string;
    uploading: string;
    upload: string;
    removing: string;
    remove: string;
    avatarTooLarge: string;
    avatarUpdated: string;
    profileTitle: string;
    profileDescription: string;
    profileSaved: string;
    saveProfile: string;
    passwordTitle: string;
    passwordNoPassword: string;
    passwordDescription: string;
    passwordCurrent: string;
    passwordNew: string;
    passwordConfirm: string;
    passwordUpdated: string;
    changePassword: string;
    updating: string;
  };
  feed: {
    subtitle: string;
    dailyTitle: string;
    dailyDescription: string;
    weeklyTitle: string;
    weeklyDescription: string;
    completed: string;
    noPlanItems: string;
    openPlan: string;
    noReportEntries: string;
    openReport: string;
    hoursShort: string;
    moreCount: string;
  };
  dashboard: {
    subtitle: string;
    period: string;
    members: string;
    filtersType: string;
    tableName: string;
    tableRole: string;
    tablePlan: string;
    tableReport: string;
    tablePlanComplete: string;
    tableHours: string;
    noMembers: string;
    noPlanFiled: string;
    noReportFiled: string;
    submittedAt: string;
    lastChangedAt: string;
    backToDashboard: string;
    planComplete: string;
    planCompleteDescription: string;
    workingHours: string;
    workingHoursDescription: string;
    noPlan: string;
    planTitle: string;
    noVisibleItems: string;
    noReport: string;
    reportTitle: string;
    noVisibleEntries: string;
  };
  plans: {
    title: string;
    outsideEditWindow: string;
    itemsTitle: string;
    itemsDescription: string;
    itemsEmpty: string;
    attachments: string;
    noAttachments: string;
    uploadFile: string;
    uploading: string;
    addItemTitle: string;
    titlePlaceholder: string;
    descriptionPlaceholder: string;
    visibilityPublicHint: string;
    visibilityPrivateHint: string;
    fileOptional: string;
    adding: string;
    addItem: string;
    submittedMessage: string;
    reopening: string;
    reopenDraft: string;
    draftOutsideWindow: string;
    submitReady: string;
    submitNeedItems: string;
    submitting: string;
    submit: string;
    deleteConfirm: string;
    deleteAria: string;
  };
  reports: {
    title: string;
    totalHours: string;
    fromPlanTitle: string;
    fromPlanDescription: string;
    ongoingWork: string;
    fromPlanEmpty: string;
    noPlanMessage: string;
    entriesTitle: string;
    unplannedTitle: string;
    entriesDescription: string;
    unplannedDescription: string;
    entriesEmpty: string;
    unplannedEmpty: string;
    outsideEditWindow: string;
    resolvedElsewhere: string;
    failedNote: string;
    cancelledNote: string;
    saved: string;
    descriptionPlaceholder: string;
    attachmentsHint: string;
    addEntryTitle: string;
    addEntryPlaceholder: string;
    adding: string;
    addEntry: string;
    submittedMessage: string;
    checklist: string;
    tomorrowPrompt: string;
    tomorrowOpening: string;
    tomorrowFile: string;
    draftOutsideWindow: string;
    submitNeedEntries: string;
    submitNeedHours: string;
    submitReady: string;
    submitting: string;
    submit: string;
    deleteConfirm: string;
    deleteAria: string;
    checkOffItem: string;
  };
  shell: {
    expandSidebar: string;
    collapseSidebar: string;
    mainNav: string;
  };
  navEditor: {
    backToHome: string;
  };
  admin: {
    usersTitle: string;
    usersDescription: string;
    createUserTitle: string;
    createUserDescription: string;
    creating: string;
    createUser: string;
    copied: string;
    copyLink: string;
    linkCreatedTitle: string;
    linkCreatedDescription: string;
    teamMembers: string;
    userCountOne: string;
    userCountMany: string;
    noUsers: string;
    inactive: string;
    passwordSet: string;
    awaitingPassword: string;
    you: string;
    deactivate: string;
    activate: string;
    regenerate: string;
    generateLink: string;
    linkExpires: string;
    roleFor: string;
    organizationTitle: string;
    organizationDescription: string;
    slug: string;
    slugFixed: string;
    saveChanges: string;
    settingsSaved: string;
    appUrlTitle: string;
    appUrlDescription: string;
    appUrlHint: string;
  };
  errors: {
    generic: string;
    invalidInput: string;
    invalidEmailOrPassword: string;
    unableToSignIn: string;
    invalidPlanParameters: string;
    invalidReportParameters: string;
    invalidDate: string;
    invalidMonth: string;
    invalidWeek: string;
    invalidDay: string;
    invalidRole: string;
    invalidOrganizationName: string;
    unauthorized: string;
    noFileSelected: string;
    notesTooLong: string;
    outsideEditWindow: string;
    unableToSaveNotes: string;
    unableToAddItem: string;
    unableToUpdateItem: string;
    unableToDeleteItem: string;
    unableToSubmitPlan: string;
    unableToReopenPlan: string;
    unableToDeletePlan: string;
    unableToUploadFile: string;
    unableToDeleteAttachment: string;
    unableToCheckOffItem: string;
    unableToUncheckItem: string;
    unableToUpdatePlanItem: string;
    unableToAddEntry: string;
    unableToUpdateEntry: string;
    unableToDeleteEntry: string;
    unableToSubmitReport: string;
    unableToOpenTomorrowsPlan: string;
    unableToDeleteReport: string;
    unableToOpenPlan: string;
    unableToOpenReport: string;
    unableToUpdateProfile: string;
    unableToChangePassword: string;
    unableToUploadAvatar: string;
    unableToRemoveAvatar: string;
    unableToCreateUser: string;
    unableToUpdateRole: string;
    unableToUpdateUserStatus: string;
    unableToGeneratePasswordLink: string;
    unableToUpdateOrganizationSettings: string;
    nameRequired: string;
    emailRequired: string;
    invalidEmailAddress: string;
    passwordRequired: string;
    passwordMinLength: string;
    passwordsDoNotMatch: string;
    currentPasswordRequired: string;
    confirmPasswordRequired: string;
    organizationNameRequired: string;
    titleRequired: string;
    invalidDateFormat: string;
    hoursCannotBeNegative: string;
    hoursCannotExceed24: string;
    hoursMustBeGreaterThanZero: string;
    linkExpired: string;
    linkUsed: string;
    linkInactive: string;
    invalidPasswordSetLink: string;
    planItemNotFound: string;
    planCannotBeEdited: string;
    resolvedItemsCannotBeEdited: string;
    submittedPlansCannotBeEdited: string;
    addPlanItemBeforeSubmit: string;
    planNotFound: string;
    onlySubmittedPlansCanBeReopened: string;
    planItemNotOnPlan: string;
    planItemResolvedElsewhere: string;
    reportEntryNotFound: string;
    uncheckToRemoveEntry: string;
    addReportEntryBeforeSubmit: string;
    completedItemsNeedHours: string;
    entriesNeedHours: string;
    reportNotFound: string;
    submittedReportsCannotBeEdited: string;
    userNotFound: string;
    emailAlreadyExists: string;
    noPasswordSetUseLink: string;
    currentPasswordIncorrect: string;
    selectImageFile: string;
    avatarInvalidType: string;
    avatarExceedsMaxSize: string;
    fileExceedsMaxSize: string;
    fileNameRequired: string;
    fileEmpty: string;
    fileTypeNotAllowed: string;
    cannotGenerateLinkInactive: string;
    cannotChangeOwnRole: string;
    cannotDeactivateSelf: string;
    invalidWeekValue: string;
    invalidMonthValue: string;
    attachmentNotFound: string;
    tomorrowPlanOutsideWindow: string;
  };
};

export const en: Dictionary = {
  app: { title: "Status Reports" },
  header: { language: "Language", signOut: "Sign out" },
  nav: {
    home: "Home",
    myFeed: "My Feed",
    teamFeed: "Team Feed",
    users: "Users",
    settings: "Settings",
  },
  roles: { ADMIN: "Admin", MANAGER: "Manager", MEMBER: "Member" },
  auth: {
    signIn: "Sign in",
    signInDescription:
      "Enter your credentials to access the reporting platform.",
    email: "Email",
    password: "Password",
    signingIn: "Signing in…",
    loading: "Loading…",
    passwordSetSuccess: "Password set successfully. You can sign in now.",
    setPassword: {
      title: "Set your password",
      welcome: "Welcome, {name}. Create a password for {email}.",
      confirmPassword: "Confirm password",
      button: "Set password",
      unableTitle: "Unable to set password",
      tokenInvalid: "This password-set link is invalid.",
      tokenUsed: "This link has already been used.",
      tokenUsedSignIn:
        "This link has already been used. Sign in or ask your admin for a new link.",
      tokenExpired: "This link has expired. Ask your admin for a new one.",
      tokenInactive: "This account is inactive. Contact your admin.",
    },
  },
  common: {
    plan: "Plan",
    report: "Report",
    title: "Title",
    description: "Description",
    visibility: "Visibility",
    name: "Name",
    email: "Email",
    role: "Role",
    hours: "Hours",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    delete: "Delete",
    deleting: "Deleting…",
    open: "Open",
    more: "more",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    editItem: "Edit {title}",
    deleteItem: "Delete {title}",
    removeFile: "Remove {fileName}",
    expandItem: "Expand {label}",
    collapseItem: "Collapse {label}",
    fileSizeB: "{size} B",
    fileSizeKB: "{size} KB",
    fileSizeMB: "{size} MB",
  },
  periods: {
    type: { daily: "Daily", weekly: "Weekly", monthly: "Monthly" },
    picker: {
      date: "Date",
      week: "Week",
      month: "Month",
      period: "Period",
      day: "Day",
    },
    relative: {
      today: "Today",
      yesterday: "Yesterday",
      thisWeek: "This week",
    },
    weekOf: "Week {weekNum} of {monthLabel} {year} · {start} – {end}",
    weekOption: "Week {weekNum}: {start} – {end}",
  },
  badges: {
    submitted: "Submitted",
    draft: "Draft",
    completed: "Completed",
    failed: "Failed",
    cancelled: "Cancelled",
    public: "Public",
    private: "Private",
    missing: "Missing",
    open: "Open",
  },
  home: {
    welcome: "Welcome, {name}",
    subtitle: "File monthly, weekly, and daily plans and reports from here.",
    outsideEditWindow: "Outside the edit window — view only.",
    itemsCompleted: "{completed}/{total} items completed",
    noItemsYet: "No items yet.",
    noPlanFiled: "No plan filed.",
    entryCountOne: "{count} entry",
    entryCountMany: "{count} entries",
    hoursShort: "{hours} h",
    noReportFiled: "No report filed.",
    submitPlan: "Submit plan",
    viewPlan: "View plan",
    submitReport: "Submit report",
    viewReport: "View report",
    filePlan: "File plan",
    fileReport: "File report",
    continueDraftPlan: "Continue plan draft",
    continueDraftReport: "Continue report draft",
    openingPlan: "Opening plan…",
    openingReport: "Opening report…",
  },
  settings: {
    subtitle: "Manage your personal profile, password, avatar, and language.",
    languageTitle: "Language",
    languageDescription: "Choose the language used across the app interface.",
    avatarTitle: "Avatar",
    avatarDescription:
      "Upload a square image (JPEG, PNG, GIF, or WebP). Max 2 MB.",
    avatarAlt: "Your avatar",
    uploading: "Uploading…",
    upload: "Upload",
    removing: "Removing…",
    remove: "Remove",
    avatarTooLarge: "Avatar must be 2 MB or smaller.",
    avatarUpdated: "Avatar updated.",
    profileTitle: "Profile",
    profileDescription:
      "Update your display name and email. Role is managed by an admin.",
    profileSaved:
      "Profile saved. Sign out and back in if your name in the sidebar looks stale.",
    saveProfile: "Save profile",
    passwordTitle: "Password",
    passwordNoPassword:
      "No password is set yet. Ask an admin for a password-set link.",
    passwordDescription: "Choose a new password (at least 8 characters).",
    passwordCurrent: "Current password",
    passwordNew: "New password",
    passwordConfirm: "Confirm new password",
    passwordUpdated: "Password updated.",
    changePassword: "Change password",
    updating: "Updating…",
  },
  feed: {
    subtitle: "Your recent daily and weekly filings side by side.",
    dailyTitle: "Last 7 days",
    dailyDescription: "Daily plans and reports, including today.",
    weeklyTitle: "Last 5 weeks",
    weeklyDescription: "Weekly plans and reports, including this week.",
    completed: "{completed}/{total} completed",
    noPlanItems: "No plan items.",
    openPlan: "Open plan",
    noReportEntries: "No report entries.",
    openReport: "Open report",
    hoursShort: "{hours} h",
    moreCount: "{count} more",
  },
  dashboard: {
    subtitle: "Team roster for {period}.",
    period: "Period",
    members: "Members",
    filtersType: "Type",
    tableName: "Name",
    tableRole: "Role",
    tablePlan: "Plan",
    tableReport: "Report",
    tablePlanComplete: "Plan complete %",
    tableHours: "Hours",
    noMembers: "No active members in this organization.",
    noPlanFiled: "No plan filed.",
    noReportFiled: "No report filed.",
    submittedAt: "Submitted {timestamp}",
    lastChangedAt: "Last changed {timestamp}",
    backToDashboard: "← Back to Team Feed",
    planComplete: "Plan complete",
    planCompleteDescription: "Submitted plan items for this period",
    workingHours: "Working hours",
    workingHoursDescription: "Visible report hours for this period",
    noPlan: "No submitted plan for this period.",
    planTitle: "{type} plan",
    noVisibleItems: "No visible items.",
    noReport: "No submitted report for this period.",
    reportTitle: "{type} report",
    noVisibleEntries: "No visible entries.",
  },
  plans: {
    title: "{type} Plan",
    outsideEditWindow:
      "This period is outside the edit window — items can no longer be changed.",
    itemsTitle: "Plan items",
    itemsDescription:
      "Add titled work items for this period. Title is required; description and a file attachment are optional.",
    itemsEmpty: "No plan items yet. Add your first item below.",
    attachments: "Attachments",
    noAttachments: "No attachments.",
    uploadFile: "Upload file",
    uploading: "Uploading…",
    addItemTitle: "Add plan item",
    titlePlaceholder: "What do you plan to work on?",
    descriptionPlaceholder: "Additional context…",
    visibilityPublicHint: "Public — visible to teammates",
    visibilityPrivateHint: "Private — managers only",
    fileOptional: "File (optional)",
    adding: "Adding…",
    addItem: "Add item",
    submittedMessage:
      "This plan has been submitted. Use the edit icon on each item to update it within the edit window.",
    reopening: "Reopening…",
    reopenDraft: "Reopen as draft",
    draftOutsideWindow:
      "This draft is outside the edit window and cannot be submitted.",
    submitReady:
      "Submit when ready — teammates will see public items after submission.",
    submitNeedItems: "Add at least one plan item before you can submit.",
    submitting: "Submitting…",
    submit: "Submit plan",
    deleteConfirm:
      "Delete this plan? All planned tasks on it will be removed. This cannot be undone.",
    deleteAria: "Delete plan",
  },
  reports: {
    title: "{type} Report",
    totalHours: "{hours} h total",
    fromPlanTitle: "From your plan",
    fromPlanDescription:
      "Mark each plan item as completed, failed, or cancelled. Completed items need hours logged below.",
    ongoingWork: "Ongoing work (from plan)",
    fromPlanEmpty: "Your submitted plan has no items.",
    noPlanMessage:
      "No submitted plan for this period. Add unplanned work below, or file a plan first and submit it to enable check-off here.",
    entriesTitle: "Report entries",
    unplannedTitle: "Unplanned work",
    entriesDescription: "Work logged for this period. Add entries manually below.",
    unplannedDescription:
      "Work that was not on your plan, or entries you add directly.",
    entriesEmpty: "No entries yet. Add work below.",
    unplannedEmpty: "No unplanned entries yet.",
    outsideEditWindow:
      "This period is outside the edit window — this draft cannot be changed or submitted.",
    resolvedElsewhere: "Resolved in another report",
    failedNote: "Tried but did not succeed — no hours required.",
    cancelledNote: "Decided not to pursue — no hours required.",
    saved: "Saved",
    descriptionPlaceholder: "What did you accomplish?",
    attachmentsHint: "PDF, images, Office docs, or plain text. Max 10 MB.",
    addEntryTitle: "Add unplanned entry",
    addEntryPlaceholder: "What did you work on?",
    adding: "Adding…",
    addEntry: "Add entry",
    submittedMessage: "This report has been submitted and is read-only.",
    checklist: "Plan checklist: {resolved}/{total} items resolved in this report.",
    tomorrowPrompt:
      "Ready for tomorrow? File tomorrow's plan while the daily window is open.",
    tomorrowOpening: "Opening…",
    tomorrowFile: "File tomorrow's plan",
    draftOutsideWindow:
      "This draft is outside the edit window and cannot be submitted.",
    submitNeedEntries: "Add at least one report entry before you can submit.",
    submitNeedHours:
      "Completed items and unplanned entries need hours greater than zero.",
    submitReady:
      "Submit when ready — plan outcomes will be saved and public entries will be visible to your team.",
    submitting: "Submitting…",
    submit: "Submit report",
    deleteConfirm:
      "Delete this report? All entries will be removed. Plan items completed by this report will be reopened. This cannot be undone.",
    deleteAria: "Delete report",
    checkOffItem: "Check off {title}",
  },
  shell: {
    expandSidebar: "Expand sidebar",
    collapseSidebar: "Collapse sidebar",
    mainNav: "Main",
  },
  navEditor: {
    backToHome: "← Back to Home",
  },
  admin: {
    usersTitle: "User Management",
    usersDescription:
      "Create users, assign roles, and share password-set links manually.",
    createUserTitle: "Create user",
    createUserDescription:
      "New users receive a one-time password-set link to share manually.",
    creating: "Creating…",
    createUser: "Create user",
    copied: "Copied",
    copyLink: "Copy link",
    linkCreatedTitle: "Password-set link created",
    linkCreatedDescription:
      "Share this link with the new user (Slack, Teams, in person, etc.).",
    teamMembers: "Team members",
    userCountOne: "{count} user in your organization",
    userCountMany: "{count} users in your organization",
    noUsers: "No users yet. Create the first account above.",
    inactive: "Inactive",
    passwordSet: "Password set",
    awaitingPassword: "Awaiting password",
    you: "You",
    deactivate: "Deactivate",
    activate: "Activate",
    regenerate: "Regenerate",
    generateLink: "Generate password-set link",
    linkExpires: "Link expires {expiry}",
    roleFor: "Role for {name}",
    organizationTitle: "Organization",
    organizationDescription: "Display name shown across the platform.",
    slug: "Slug",
    slugFixed: "Slug is fixed in v1 single-org mode.",
    saveChanges: "Save changes",
    settingsSaved: "Settings saved.",
    appUrlTitle: "Application URL",
    appUrlDescription:
      "Base URL used when generating password-set links for new users.",
    appUrlHint:
      "Set APP_URL in your .env file (e.g. http://192.168.1.50:3000 for LAN access) and restart the app.",
  },
  errors: {
    generic: "Something went wrong. Please try again.",
    invalidInput: "Invalid input.",
    invalidEmailOrPassword: "Invalid email or password.",
    unableToSignIn: "Unable to sign in. Please try again.",
    invalidPlanParameters: "Invalid plan parameters.",
    invalidReportParameters: "Invalid report parameters.",
    invalidDate: "Invalid date.",
    invalidMonth: "Invalid month.",
    invalidWeek: "Invalid week.",
    invalidDay: "Invalid day.",
    invalidRole: "Invalid role.",
    invalidOrganizationName: "Invalid organization name.",
    unauthorized: "Unauthorized",
    noFileSelected: "No file selected.",
    notesTooLong: "Notes are too long.",
    outsideEditWindow: "This period is outside the edit window.",
    unableToSaveNotes: "Unable to save notes.",
    unableToAddItem: "Unable to add item.",
    unableToUpdateItem: "Unable to update item.",
    unableToDeleteItem: "Unable to delete item.",
    unableToSubmitPlan: "Unable to submit plan.",
    unableToReopenPlan: "Unable to reopen plan.",
    unableToDeletePlan: "Unable to delete plan.",
    unableToUploadFile: "Unable to upload file.",
    unableToDeleteAttachment: "Unable to delete attachment.",
    unableToCheckOffItem: "Unable to check off item.",
    unableToUncheckItem: "Unable to uncheck item.",
    unableToUpdatePlanItem: "Unable to update plan item.",
    unableToAddEntry: "Unable to add entry.",
    unableToUpdateEntry: "Unable to update entry.",
    unableToDeleteEntry: "Unable to delete entry.",
    unableToSubmitReport: "Unable to submit report.",
    unableToOpenTomorrowsPlan: "Unable to open tomorrow’s plan.",
    unableToDeleteReport: "Unable to delete report.",
    unableToOpenPlan: "Unable to open plan.",
    unableToOpenReport: "Unable to open report.",
    unableToUpdateProfile: "Unable to update profile.",
    unableToChangePassword: "Unable to change password.",
    unableToUploadAvatar: "Unable to upload avatar.",
    unableToRemoveAvatar: "Unable to remove avatar.",
    unableToCreateUser: "Unable to create user.",
    unableToUpdateRole: "Unable to update role.",
    unableToUpdateUserStatus: "Unable to update user status.",
    unableToGeneratePasswordLink: "Unable to generate password-set link.",
    unableToUpdateOrganizationSettings: "Unable to update organization settings.",
    nameRequired: "Name is required.",
    emailRequired: "Email is required.",
    invalidEmailAddress: "Invalid email address.",
    passwordRequired: "Password is required.",
    passwordMinLength: "Password must be at least 8 characters.",
    passwordsDoNotMatch: "Passwords do not match.",
    currentPasswordRequired: "Current password is required.",
    confirmPasswordRequired: "Confirm your new password.",
    organizationNameRequired: "Organization name is required.",
    titleRequired: "Title is required.",
    invalidDateFormat: "Invalid date format.",
    hoursCannotBeNegative: "Hours cannot be negative.",
    hoursCannotExceed24: "Hours cannot exceed 24 per entry.",
    hoursMustBeGreaterThanZero: "Hours must be greater than zero.",
    linkExpired: "This link has expired. Ask your admin for a new one.",
    linkUsed: "This link has already been used.",
    linkInactive: "This account is inactive.",
    invalidPasswordSetLink: "Invalid password-set link.",
    planItemNotFound: "Plan item not found.",
    planCannotBeEdited: "This plan cannot be edited.",
    resolvedItemsCannotBeEdited: "Resolved items cannot be edited.",
    submittedPlansCannotBeEdited: "Submitted plans cannot be edited.",
    addPlanItemBeforeSubmit: "Add at least one plan item before submitting.",
    planNotFound: "Plan not found.",
    onlySubmittedPlansCanBeReopened: "Only submitted plans can be reopened.",
    planItemNotOnPlan: "Plan item not found on your submitted plan.",
    planItemResolvedElsewhere:
      "This plan item was already resolved in another report.",
    reportEntryNotFound: "Report entry not found.",
    uncheckToRemoveEntry: "Uncheck the plan item to remove this entry.",
    addReportEntryBeforeSubmit:
      "Add at least one report entry before submitting.",
    completedItemsNeedHours:
      "Completed plan items need hours greater than zero.",
    entriesNeedHours: "Every entry must have hours greater than zero.",
    reportNotFound: "Report not found.",
    submittedReportsCannotBeEdited: "Submitted reports cannot be edited.",
    userNotFound: "User not found.",
    emailAlreadyExists: "A user with this email already exists.",
    noPasswordSetUseLink:
      "No password is set for this account. Use a password-set link from your admin.",
    currentPasswordIncorrect: "Current password is incorrect.",
    selectImageFile: "Select an image file.",
    avatarInvalidType: "Avatar must be a JPEG, PNG, GIF, or WebP image.",
    avatarExceedsMaxSize: "Avatar exceeds maximum size of {mb} MB.",
    fileExceedsMaxSize: "File exceeds maximum size of {mb} MB.",
    fileNameRequired: "File name is required.",
    fileEmpty: "File is empty.",
    fileTypeNotAllowed:
      "File type not allowed. Use PDF, images, Office documents, or plain text.",
    cannotGenerateLinkInactive: "Cannot generate a link for an inactive user.",
    cannotChangeOwnRole: "You cannot change your own role.",
    cannotDeactivateSelf: "You cannot deactivate your own account.",
    invalidWeekValue: "Invalid week value.",
    invalidMonthValue: "Invalid month value.",
    attachmentNotFound: "Attachment not found.",
    tomorrowPlanOutsideWindow:
      "Tomorrow’s plan is outside the daily edit window.",
  },
};
