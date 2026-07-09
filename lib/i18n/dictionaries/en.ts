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
  },
};
