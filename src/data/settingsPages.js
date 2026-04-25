export const MESSENGER_SETTINGS_PAGES = {
  'messenger-settings': {
    layout: 'settings',
    theme: 'settings',
    title: 'Messenger Settings',
    headerTitle: 'Messenger Settings',
    pageTitle: 'Messenger Settings',
    actions: [{ label: 'Done', id: 'done', action: 'exit' }],
    items: [
      {
        title: 'Delete contacts',
        description: 'Remove contacts from your contact list',
        targetPage: 'messenger-settings-delete-contacts',
      },
      {
        title: 'Edit your Allow and Block lists',
        description: "View or make changes to the lists of people you've chosen to Allow and Block",
        targetPage: 'messenger-settings-allow-block',
      },
      {
        title: 'Change your Messenger alerts',
        description: 'Turn Messenger alerts off or on',
        targetPage: 'messenger-settings-alerts',
      },
      {
        title: 'Change your display name',
        description: 'Change the name others see when they\nsend you instant messages',
        targetPage: 'messenger-settings-display-name',
      },
    ],
  },
  'messenger-settings-delete-contacts': {
    layout: 'settings',
    theme: 'settings',
    title: 'Messenger Delete contacts',
    headerTitle: 'Messenger',
    headerSubtitle: 'Delete contacts',
    pageTitle: 'Messenger Delete contacts',
    actions: [{ label: 'Done', id: 'done', action: 'settings-home' }],
    body: [{ type: 'paragraph', text: 'Your contact list is empty.' }],
  },
  'messenger-settings-allow-block': {
    layout: 'settings',
    theme: 'settings',
    title: 'Messenger Edit your Allow and Block lists',
    headerTitle: 'Messenger',
    headerSubtitle: 'Edit your Allow and Block lists',
    pageTitle: 'Messenger Edit your Allow and Block lists',
    actions: [
      { label: 'Continue', id: 'continue', action: 'navigate', targetPage: 'messenger-settings-allow-list' },
      { label: 'Cancel', id: 'cancel', action: 'settings-home' },
    ],
    body: [
      {
        type: 'paragraph',
        parts: [
          "To make changes to one of the people on your Allow list or your Block list, choose the person's name from the list, and then choose ",
          { text: 'Continue.', strong: true },
        ],
      },
      { type: 'heading', text: 'Allow List:' },
      { type: 'radio', label: 'All people except your Block list', checked: true },
      { type: 'heading', text: 'Block List:' },
      { type: 'paragraph', text: 'There is no one on your Block list' },
    ],
  },
  'messenger-settings-allow-list': {
    layout: 'settings',
    theme: 'settings',
    title: 'Messenger Edit your Allow list',
    headerTitle: 'Messenger',
    headerSubtitle: 'Edit your Allow list',
    pageTitle: 'Messenger Edit your Allow list',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'messenger-settings' },
      { label: 'Cancel', id: 'cancel', action: 'settings-home' },
    ],
    body: [
      {
        type: 'paragraph',
        parts: [
          'To block all people, except those on your Allow list, from sending you instant messages, choose ',
          { text: 'Block all', strong: true },
          ', and then choose ',
          { text: 'Save Changes.', strong: true },
        ],
      },
      {
        type: 'radioRow',
        options: [
          { label: 'Block all', checked: true },
          { label: "Don't block all", checked: false },
        ],
      },
    ],
  },
  'messenger-settings-alerts': {
    layout: 'settings',
    theme: 'settings',
    title: 'Settings Control alerts',
    headerTitle: 'Settings',
    headerSubtitle: 'Control alerts',
    pageTitle: 'Settings Control alerts',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'messenger-settings' },
      { label: 'Cancel', id: 'cancel', action: 'settings-home' },
    ],
    body: [
      {
        type: 'paragraph',
        parts: [
          'MSN TV can show you an alert each time one of your Messenger contacts comes online. Choose ',
          { text: 'Show me Messenger alerts.', strong: true },
        ],
      },
      { type: 'radio', label: 'Show me Messenger alerts', checked: true },
      { type: 'radio', label: "Don't show me Messenger alerts", checked: false },
      {
        type: 'paragraph',
        text: 'You may not want to be interrupted by alerts when you are watching full-screen videos or slideshows. Choose the link below.',
      },
      {
        type: 'link',
        label: 'Turn off alerts during videos and slideshows',
        targetPage: 'settings-control-alerts',
      },
    ],
  },
  'settings-control-alerts': {
    layout: 'settings',
    theme: 'settings',
    title: 'Settings Control alerts',
    headerTitle: 'Settings',
    headerSubtitle: 'Control alerts',
    pageTitle: 'Settings Control alerts',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'messenger-settings-alerts' },
      { label: 'Cancel', id: 'cancel', action: 'navigate', targetPage: 'messenger-settings-alerts' },
    ],
    body: [
      {
        type: 'paragraph',
        text: 'Alerts are notices that appear at the bottom of your screen when you receive a new e-mail message or when one of your Messenger contacts comes online.',
      },
      {
        type: 'paragraph',
        text: 'You may not want to be interrupted by alerts when you are watching full-screen videos or slideshows. Select the checkbox below.',
      },
      { type: 'checkbox', label: 'Turn off alerts during videos and slideshows', checked: true },
    ],
  },
  'messenger-settings-display-name': {
    layout: 'settings',
    theme: 'settings',
    variant: 'full',
    title: 'Messenger Change display name',
    headerTitle: 'Messenger',
    headerSubtitle: 'Change display name',
    pageTitle: 'Messenger Change display name',
    actions: [{ label: 'Done', id: 'done', action: 'settings-home', alignBottom: true }],
    body: [
      {
        type: 'paragraph',
        text: 'You are not connected to the Messenger Server right now. Please go to the IM panel and sign in.',
      },
    ],
  },
}
