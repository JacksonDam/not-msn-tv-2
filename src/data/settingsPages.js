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

const homeSettingsBack = (parent) => ({ label: 'Cancel', id: 'cancel', action: 'settings-home', targetPage: parent })

export const HOME_SETTINGS_PAGES = {
  'settings-forgot-password': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Forgot your password?',
    headerTitle: 'Forgot your password?',
    pageTitle: 'Forgot your password?',
    actions: [
      { label: 'Continue', id: 'continue', action: 'noop' },
      { label: 'Cancel', id: 'cancel', action: 'home-exit' },
    ],
    body: [
      {
        type: 'paragraph',
        parts: [
          'If you’ve forgotten the Passport password for ',
          { text: 'your sign-in name,', strong: true },
          ' you can create a new one after you confirm your identity by providing some information. To create a new password, you’ll need the following information:',
        ],
      },
      { type: 'paragraph', text: '•   The state and ZIP code you used when creating your Passport' },
      { type: 'paragraph', text: '•   The answer to your secret question' },
      { type: 'paragraph', text: 'Once we confirm this information, you can create a new password.' },
      {
        type: 'paragraph',
        parts: [
          'To start creating a new password, choose ',
          { text: 'Continue.', strong: true },
          ' To return to the Sign-in page without creating a new password, choose ',
          { text: 'Cancel.', strong: true },
        ],
      },
    ],
  },

  'settings-home': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    title: 'Settings',
    headerTitle: 'Settings',
    pageTitle: 'Settings',
    actions: [{ label: 'Done', id: 'done', action: 'home-exit' }],
    items: [
      {
        title: 'Choose connection settings',
        description: 'View and change settings for how your MSN TV connects to the Internet',
        targetPage: 'settings-connection',
      },
      {
        title: 'Manage your home network',
        description: 'Find computers that connect to the same broadband router as your MSN TV',
        targetPage: 'settings-home-networking',
      },
      {
        title: 'Set up automatic updates',
        description: "While you're signed out, your Player can check for new e-mail and MSN TV updates",
        targetPage: 'settings-auto-update',
      },
      {
        title: 'Adjust TV Settings',
        description: 'Adjust the position and picture quality of MSN TV content on your television',
        targetPage: 'settings-tv',
      },
      {
        title: 'Choose what to see when music plays',
        description: 'Choose what to display on screen while music is playing',
        targetPage: 'settings-music-visualization',
      },
    ],
  },

  'settings-connection': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    title: 'Settings Connection settings',
    headerTitle: 'Settings',
    headerSubtitle: 'Connection settings',
    pageTitle: 'Settings Connection settings',
    actions: [{ label: 'Done', id: 'done', action: 'settings-home', targetPage: 'settings-home' }],
    items: [
      {
        title: 'Dialing options and troubleshooting',
        description: 'Change dialing options to solve common connection problems (involving call waiting, dialing prefixes, and more)',
        targetPage: 'settings-dialing',
      },
      {
        title: 'MSN TV access numbers',
        description: 'View or change the phone numbers your MSN TV uses to connect to the MSN TV Service',
        targetPage: 'settings-access-numbers',
      },
      {
        title: 'Your ISP information',
        description: 'View or change the information about the Internet Service Provider you use to connect to MSN TV',
        targetPage: 'settings-isp-info',
      },
      {
        title: 'How you connect to MSN TV',
        description: "Switch to use your own Internet Service Provider's dial-up service or to use a broadband connection (like cable or DSL)",
        targetPage: 'settings-change-connection',
      },
      {
        title: 'Web Accelerator options for dial-up',
        description: 'Turn on/off Web Accelerator for dial-up service or change options',
        targetPage: 'settings-web-acceleration',
      },
      {
        title: 'Change broadband settings',
        description: 'Automatically detect your broadband connection settings, or enter your settings manually',
        targetPage: 'settings-broadband',
      },
      {
        title: 'Change wireless settings',
        description: 'Set up a USB wireless network adapter (sold separately)',
        targetPage: 'settings-wireless',
      },
      {
        title: 'Use proxy servers',
        description: 'View or change the information for proxy servers (this is an uncommon task)',
        targetPage: 'settings-proxy',
      },
      {
        title: 'Configure Router',
        description: "Access your router set-up screen (this is an uncommon task)",
        targetPage: 'settings-router',
      },
      {
        title: 'Check broadband status',
        description: 'Check the status of your broadband connection',
        targetPage: 'settings-broadband-status',
      },
      {
        title: 'Reset connection settings',
        description: "Return to your MSN TV's original broadband settings",
        targetPage: 'settings-reset-broadband',
      },
    ],
  },

  'settings-dialing': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    title: 'Settings Dialing options',
    headerTitle: 'Settings',
    headerSubtitle: 'Dialing options',
    pageTitle: 'Settings Dialing options',
    actions: [{ label: 'Done', id: 'done', action: 'settings-home', targetPage: 'settings-connection' }],
    items: [
      {
        title: 'Change call waiting settings',
        description: 'Block or allow call waiting',
        targetPage: 'settings-call-waiting',
      },
      {
        title: 'Choose whether to hang up if another phone is picked up',
        description: 'Choose to have MSN TV hang up or stay connected when a phone on your line is picked up',
        targetPage: 'settings-off-hook',
      },
      {
        title: 'Choose whether to listen to dialing',
        description: 'Choose whether or not to hear your MSN TV connect to MSN TV',
        targetPage: 'settings-audible-dialing',
      },
      {
        title: 'Caller ID options',
        description: 'Show on-screen caller ID notices when someone calls while you are connected',
        targetPage: 'settings-caller-id',
      },
      {
        title: 'Other dialing options',
        description: 'Choose a dialing prefix, use pulse dialing, turn off wait for dial tone',
        targetPage: 'settings-basic-dialing',
      },
      {
        title: 'Reset dialing settings',
        description: "Return to your MSN TV's original dialing settings",
        targetPage: 'settings-reset-dialing',
      },
    ],
  },

  'settings-call-waiting': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    title: 'Settings Call waiting settings',
    headerTitle: 'Settings',
    headerSubtitle: 'Call waiting settings',
    pageTitle: 'Settings Call waiting settings',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-dialing' },
      { label: 'Set Sensitivity', id: 'sensitivity', action: 'navigate', targetPage: 'settings-call-waiting-extra' },
      homeSettingsBack('settings-dialing'),
    ],
    body: [
      {
        type: 'paragraph',
        text: "If your phone line has call waiting, you can set your MSN TV to show a notice on-screen each time a call comes in while you're connected to the MSN TV Service.",
      },
      {
        type: 'paragraph',
        text: "What do you want to happen when you're connected to the Internet and someone calls you?",
      },
      { type: 'radio', label: "My phone line doesn't have call waiting", checked: true },
      { type: 'radio', label: 'Ask me before disconnecting' },
      { type: 'radio', label: "Don't ask me, always disconnect from the Internet so that my phone will ring" },
      { type: 'radio', label: 'Keep me connected and let my caller hear a busy signal' },
      { type: 'inputRow', label: 'Call waiting prefix:', defaultValue: '', maxLength: 30 },
      { type: 'paragraph', text: 'Example: *70' },
    ],
  },

  'settings-call-waiting-extra': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    title: 'Settings Call waiting sensitivity',
    headerTitle: 'Settings',
    headerSubtitle: 'Call waiting sensitivity',
    pageTitle: 'Settings Call waiting sensitivity',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-call-waiting' },
      homeSettingsBack('settings-call-waiting'),
    ],
    body: [
      {
        type: 'paragraph',
        text: 'Sometimes line noise will trigger call waiting when no one is actually calling. You can change call waiting sensitivity to make sure you are only notified when someone is calling, but that you don\'t miss any calls, either.',
      },
      {
        type: 'paragraph',
        text: 'If your MSN TV displays the notification too often when no calls are present, select a less sensitive setting.',
      },
      { type: 'radio', label: 'Normal', checked: true, group: 'sense' },
      { type: 'radio', label: 'Less Sensitive', group: 'sense' },
      { type: 'radio', label: 'Even Less Sensitive', group: 'sense' },
      { type: 'radio', label: 'Least Sensitive', group: 'sense' },
    ],
  },

  'settings-off-hook': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Off-hook detection',
    headerTitle: 'Settings',
    headerSubtitle: 'Off-hook detection',
    pageTitle: 'Settings Off-hook detection',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-dialing' },
      homeSettingsBack('settings-dialing'),
    ],
    body: [
      {
        type: 'paragraph',
        text: 'Normally, your MSN TV will disconnect from the MSN TV Service when another phone in your house is picked up. This is called off-hook detection.',
      },
      {
        type: 'paragraph',
        parts: [
          'To have your MSN TV stay connected when another phone in your house is picked up, select ',
          { text: "Don't use off-hook detection.", strong: true },
        ],
      },
      { type: 'checkbox', label: "Don't use off-hook detection", checked: false },
    ],
  },

  'settings-audible-dialing': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Listen to dialing',
    headerTitle: 'Settings',
    headerSubtitle: 'Listen to dialing',
    pageTitle: 'Settings Listen to dialing',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-dialing' },
      homeSettingsBack('settings-dialing'),
    ],
    body: [
      {
        type: 'paragraph',
        text: 'To be able to listen to your MSN TV dial and connect to the MSN TV Service, check the box below.',
      },
      {
        type: 'paragraph',
        text: 'Uncheck the box if you would like to connect silently.',
      },
      { type: 'checkbox', label: 'Listen to dialing', checked: false },
    ],
  },

  'settings-caller-id': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    title: 'Settings Caller ID options',
    headerTitle: 'Settings',
    headerSubtitle: 'Caller ID options',
    pageTitle: 'Settings Caller ID options',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-dialing' },
      homeSettingsBack('settings-dialing'),
    ],
    body: [
      {
        type: 'paragraph',
        text: "If you have caller ID service on your phone line, you can set your MSN TV to show a notice on-screen with the caller ID information of anyone who calls while you're connected to MSN TV.",
      },
      { type: 'paragraph', text: 'Choose an option below.' },
      { type: 'radio', label: "I don't have caller ID service or I want to block caller ID", checked: true },
      { type: 'radio', label: "I have caller ID service and want to see caller ID notices when I'm connected to MSN TV" },
    ],
  },

  'settings-basic-dialing': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    title: 'Settings Other dialing options',
    headerTitle: 'Settings',
    headerSubtitle: 'Other dialing options',
    pageTitle: 'Settings Other dialing options',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-dialing' },
      homeSettingsBack('settings-dialing'),
    ],
    body: [
      {
        type: 'paragraph',
        text: 'To connect to the MSN TV Service, your MSN TV must place an outside telephone call. If your phone line requires a prefix to make outside calls, type the prefix in this box.',
      },
      { type: 'inputRow', label: 'Prefix:', defaultValue: '', maxLength: 5 },
      { type: 'paragraph', text: 'Example: 9' },
      {
        type: 'paragraph',
        parts: [
          'If your phone uses pulse dialing rather than tone dialing, choose ',
          { text: 'My phone uses pulse dialing.', strong: true },
        ],
      },
      { type: 'radio', label: 'My phone uses tone dialing', checked: true, group: 'tone' },
      { type: 'radio', label: 'My phone uses pulse dialing', group: 'tone' },
      {
        type: 'paragraph',
        text: 'Normally, your MSN TV will not try to connect to the MSN TV Service until it detects a dial tone on your phone line. If you have a voice mail service on your phone line, check the box below.',
      },
      { type: 'checkbox', label: "Don't wait for a dial tone before connecting", checked: false },
    ],
  },

  'settings-reset-dialing': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Reset dialing settings',
    headerTitle: 'Settings',
    headerSubtitle: 'Reset connection settings',
    pageTitle: 'Settings Reset dialing settings',
    actions: [
      { label: 'Reset', id: 'reset', action: 'save', targetPage: 'settings-dialing' },
      homeSettingsBack('settings-dialing'),
    ],
    body: [
      {
        type: 'paragraph',
        text: "Your MSN TV's dialing options were set at the factory to work for the most common dialing situations.",
      },
      {
        type: 'paragraph',
        parts: [
          "To return your MSN TV's dialing options to their original settings, choose ",
          { text: 'Reset.', strong: true },
        ],
      },
      {
        type: 'paragraph',
        parts: [
          'Note: Choosing ',
          { text: 'Reset', strong: true },
          " will delete any changes you've made to your MSN TV's dialing options.",
        ],
      },
    ],
  },

  'settings-access-numbers': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    title: 'Settings Access numbers',
    headerTitle: 'Settings',
    headerSubtitle: 'Your MSN TV access numbers',
    pageTitle: 'Settings Access numbers',
    actions: [
      { label: 'Continue', id: 'continue', action: 'navigate', targetPage: 'settings-access-numbers-list' },
      homeSettingsBack('settings-connection'),
    ],
    body: [
      {
        type: 'paragraph',
        parts: [
          'Choose ',
          { text: 'Continue', strong: true },
          ' to view the access numbers your MSN TV dials to connect to the MSN TV Service.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Your MSN TV is dialing from the phone number (XXX)-XXX-XXXX. To change it, choose Change home phone number.',
      },
      {
        type: 'link',
        label: 'Change home phone number',
        targetPage: 'settings-home-phone-number',
      },
    ],
  },

  'settings-access-numbers-list': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    title: 'Settings Access numbers list',
    headerTitle: 'Settings',
    headerSubtitle: 'Your MSN TV access numbers',
    pageTitle: 'Settings Access numbers list',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-connection' },
      { label: 'Dialing Options', id: 'dialing', action: 'navigate', targetPage: 'settings-dialing' },
      homeSettingsBack('settings-access-numbers'),
    ],
    body: [
      {
        type: 'paragraph',
        parts: [
          'Choose all ',
          { text: 'local', strong: true },
          ' MSN TV access numbers from the list below, and then choose ',
          { text: 'Save Changes.', strong: true },
        ],
      },
      {
        type: 'paragraph',
        text: 'WARNING: The use of some of the following telephone numbers may result in long distance charges. We urge you to check with your telephone company to find out which numbers are local for you before using a number from this list.',
      },
      { type: 'checkbox', label: '1-800-555-0100   (Toll Free)', checked: true },
      { type: 'checkbox', label: '(206) 555-0150   (Seattle, WA)', checked: false },
      { type: 'checkbox', label: '(415) 555-0175   (San Francisco, CA)', checked: false },
    ],
  },

  'settings-home-phone-number': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    title: 'Settings Change home phone number',
    headerTitle: 'Settings',
    headerSubtitle: 'Change home phone number',
    pageTitle: 'Settings Change home phone number',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-access-numbers' },
      homeSettingsBack('settings-access-numbers'),
    ],
    body: [
      {
        type: 'paragraph',
        text: 'Type the phone number that your MSN TV is dialing from. Your MSN TV uses this number to find local access numbers.',
      },
      { type: 'inputRow', label: 'Phone number:', defaultValue: '', maxLength: 14 },
    ],
  },

  'settings-isp-info': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Your ISP settings',
    headerTitle: 'Settings',
    headerSubtitle: 'Your ISP settings',
    pageTitle: 'Settings Your ISP settings',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-connection' },
      homeSettingsBack('settings-connection'),
    ],
    body: [
      {
        type: 'paragraph',
        text: 'Enter the information for the Internet Service Provider (ISP) you want to use to connect to the Internet. Your ISP will provide you with this information. Enter the access numbers exactly as you would dial them on a telephone, including necessary prefixes (for example, an initial "1" and an area code).',
      },
      { type: 'inputRow', label: 'Your ISP user name:', defaultValue: '' },
      { type: 'inputRow', label: 'Your ISP password:', inputType: 'password', defaultValue: '' },
      { type: 'inputRow', label: 'ISP access phone number:', defaultValue: '' },
      { type: 'inputRow', label: 'ISP backup access number:', defaultValue: '' },
      { type: 'paragraph', text: 'Note: If you have any questions about this information, contact your ISP.' },
    ],
  },

  'settings-change-connection': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Change the way you connect',
    headerTitle: 'Settings',
    headerSubtitle: 'Change the way you connect',
    pageTitle: 'Settings Change the way you connect',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-connection' },
      homeSettingsBack('settings-connection'),
    ],
    body: [
      {
        type: 'paragraph',
        parts: [
          'Currently, your MSN TV is connecting to the MSN TV Service using ',
          { text: 'MSN Dial-up Internet Access.', strong: true },
        ],
      },
      { type: 'paragraph', text: 'Choose one of the following:' },
      { type: 'radio', label: "Don't change the way I'm connecting", checked: true },
      { type: 'radio', label: "Change my connection to use my own Internet Service Provider's dial-up service" },
      { type: 'radio', label: 'Change to use broadband (a high-speed connection like cable or DSL)' },
      {
        type: 'paragraph',
        parts: [
          'To change your service plan and fee to broadband you will need to sign-in and from the Home Page, choose ',
          { text: 'Account', strong: true },
          ' and then choose ',
          { text: 'Change Your MSN TV Service Plan.', strong: true },
        ],
      },
    ],
  },

  'settings-web-acceleration': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Web Accelerator',
    headerTitle: 'Settings',
    headerSubtitle: 'Web Accelerator for dial-up',
    pageTitle: 'Settings Web Accelerator',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-connection' },
      homeSettingsBack('settings-connection'),
    ],
    body: [
      {
        type: 'paragraph',
        text: 'For dial-up users, Web Accelerator enables faster page downloads but with reduced image quality.',
      },
      {
        type: 'paragraph',
        text: 'Note: This option does not affect broadband users.',
      },
      { type: 'checkbox', label: 'Enable Web Accelerator', checked: true },
    ],
  },

  'settings-broadband': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Broadband settings',
    headerTitle: 'Settings',
    headerSubtitle: 'Broadband settings',
    pageTitle: 'Settings Broadband settings',
    actions: [
      { label: 'Continue', id: 'save', action: 'save', targetPage: 'settings-connection' },
      homeSettingsBack('settings-connection'),
    ],
    body: [
      {
        type: 'paragraph',
        text: 'To connect to the MSN TV Service, your MSN TV needs accurate broadband settings. Most broadband service providers and home networks assign these settings automatically.',
      },
      {
        type: 'paragraph',
        parts: [
          'If you need to enter your broadband settings manually (for example, to assign a static IP address), choose ',
          { text: 'Enter settings manually', strong: true },
          ', and then choose ',
          { text: 'Continue.', strong: true },
        ],
      },
      { type: 'radio', label: 'Detect settings automatically (this means DHCP is on)', checked: true },
      { type: 'radio', label: 'Enter settings manually (this means DHCP is off)' },
      {
        type: 'link',
        label: 'Enter broadband settings manually',
        targetPage: 'settings-broadband-manual',
      },
    ],
  },

  'settings-broadband-manual': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Enter your broadband settings',
    headerTitle: 'Settings',
    headerSubtitle: 'Enter your broadband settings',
    pageTitle: 'Settings Enter your broadband settings',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-broadband' },
      homeSettingsBack('settings-broadband'),
    ],
    body: [
      {
        type: 'paragraph',
        parts: [
          'In the boxes below, type the settings for your broadband connection, and then choose ',
          { text: 'Save Changes.', strong: true },
        ],
      },
      { type: 'ipAddress', label: 'IP address:', defaultValue: '192.168.1.100' },
      { type: 'ipAddress', label: 'Subnet mask:', defaultValue: '255.255.255.0' },
      { type: 'ipAddress', label: 'Default gateway:', defaultValue: '192.168.1.1' },
      { type: 'ipAddress', label: 'Preferred DNS server:', defaultValue: '0.0.0.0' },
      { type: 'ipAddress', label: 'Alternate DNS server:', defaultValue: '0.0.0.0' },
      { type: 'paragraph', text: 'Note: If you have questions about any of these settings, contact your broadband service provider.' },
    ],
  },

  'settings-broadband-status': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Broadband connection status',
    headerTitle: 'Settings',
    headerSubtitle: 'Broadband connection status',
    pageTitle: 'Settings Broadband connection status',
    actions: [{ label: 'Done', id: 'done', action: 'settings-home', targetPage: 'settings-connection' }],
    body: [
      { type: 'strong', text: 'Connection status: Okay', selectable: true },
      { type: 'paragraph', text: 'Connection: Built-in Ethernet', selectable: true },
      { type: 'paragraph', text: 'Device name: msntv-player', selectable: true },
      { type: 'paragraph', text: 'Physical address (MACID): 00:11:22:33:44:55', selectable: true },
      { type: 'paragraph', text: 'Address type: Assigned by DHCP', selectable: true },
      { type: 'paragraph', text: 'IP address: 192.168.1.100', selectable: true },
      { type: 'paragraph', text: 'Subnet mask: 255.255.255.0', selectable: true },
      { type: 'paragraph', text: 'Default gateway: 192.168.1.1', selectable: true },
      { type: 'paragraph', text: 'Preferred DNS server: 8.8.8.8', selectable: true },
      { type: 'paragraph', text: 'Alternate DNS server: 8.8.4.4', selectable: true },
      { type: 'paragraph', text: 'Proxy: None', selectable: true },
      { type: 'paragraph', text: 'Packets: 0 sent, 0 received', selectable: true },
      { type: 'paragraph', text: 'Speed: 100 Mbps', selectable: true },
    ],
  },

  'settings-reset-broadband': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Reset connection settings',
    headerTitle: 'Settings',
    headerSubtitle: 'Reset connection settings',
    pageTitle: 'Settings Reset connection settings',
    actions: [
      { label: 'Reset', id: 'reset', action: 'save', targetPage: 'settings-connection' },
      homeSettingsBack('settings-connection'),
    ],
    body: [
      {
        type: 'paragraph',
        text: "Your MSN TV's broadband options were set at the factory to work for the most common broadband situations.",
      },
      {
        type: 'paragraph',
        parts: [
          "To return your MSN TV's broadband options to their original settings, choose ",
          { text: 'Reset.', strong: true },
        ],
      },
      {
        type: 'paragraph',
        parts: [
          'Note: Choosing ',
          { text: 'Reset', strong: true },
          " will delete any changes you've made to your MSN TV's broadband options.",
        ],
      },
    ],
  },

  'settings-wireless': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Select a wireless network to use',
    headerTitle: 'Settings',
    headerSubtitle: 'Select a wireless network to use',
    pageTitle: 'Settings Select a wireless network to use',
    actions: [{ label: 'Done', id: 'done', action: 'settings-home', targetPage: 'settings-connection' }],
    body: [
      {
        type: 'paragraph',
        text: 'Your MSN TV does not have a USB wireless adapter attached to it.',
      },
      { type: 'paragraph', text: 'If you have plugged a USB wireless adapter into your MSN TV:' },
      { type: 'paragraph', text: '• Check that the adapter (and any cable) is securely connected to a USB port.' },
      { type: 'paragraph', text: "• Verify that the adapter's power LED is illuminated. If none of the LED indicators glow or flash, the unit may need to be replaced." },
      { type: 'paragraph', text: 'If you are interested in wireless networking for MSN TV, learn more here:' },
      {
        type: 'link',
        label: 'Wireless networking',
        targetPage: 'settings-wireless-help',
      },
      {
        type: 'link',
        label: 'Set up wireless settings manually',
        targetPage: 'settings-wireless-advanced',
      },
    ],
  },

  'settings-wireless-help': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Wireless networking',
    headerTitle: 'Settings',
    headerSubtitle: 'Wireless networking',
    pageTitle: 'Settings Wireless networking',
    actions: [{ label: 'Done', id: 'done', action: 'settings-home', targetPage: 'settings-wireless' }],
    body: [
      {
        type: 'paragraph',
        text: 'A wireless network connects your MSN TV to your home network without using cables. To use a wireless network with your MSN TV, you need a USB wireless network adapter (sold separately).',
      },
      {
        type: 'paragraph',
        text: 'After plugging in a compatible USB wireless adapter, choose Change wireless settings on the previous page to select your network and enter your security key.',
      },
    ],
  },

  'settings-wireless-key': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Enter wireless network key',
    headerTitle: 'Settings',
    headerSubtitle: 'Enter wireless network key',
    pageTitle: 'Settings Enter wireless network key',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-wireless' },
      homeSettingsBack('settings-wireless'),
    ],
    body: [
      {
        type: 'paragraph',
        text: 'The network that you want to connect to requires the WEP key.',
      },
      { type: 'paragraph', text: 'The key must meet one of the following guidelines:' },
      { type: 'paragraph', text: 'Either, 5 or 13 characters (case-sensitive)\n    e.g. SeCrT or LuckyThirteen' },
      { type: 'paragraph', text: 'Or, 10 or 26 characters using 0-9 and A-F only\n    e.g. 4A81FC1654 or FA2E03688C6AD2BFD11706A9C1' },
      { type: 'inputRow', label: 'Key 1:', defaultValue: '', maxLength: 26 },
      { type: 'paragraph', text: "If you consult your wireless access point or router's documentation, look for \"Key 1\"." },
    ],
  },

  'settings-wireless-wpa': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Enter wireless network pass phrase',
    headerTitle: 'Settings',
    headerSubtitle: 'Enter wireless network pass phrase',
    pageTitle: 'Settings Enter wireless network pass phrase',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-wireless' },
      homeSettingsBack('settings-wireless'),
    ],
    body: [
      {
        type: 'paragraph',
        text: 'The network that you want to connect to requires the WPA pass phrase from your wireless access point.',
      },
      { type: 'paragraph', text: 'The pass phrase should be between 8 and 63 characters.' },
      { type: 'inputRow', label: 'Pass phrase:', defaultValue: '', maxLength: 63 },
    ],
  },

  'settings-wireless-choose': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Select wireless privacy method',
    headerTitle: 'Settings',
    headerSubtitle: 'Select wireless privacy method',
    pageTitle: 'Settings Select wireless privacy method',
    actions: [homeSettingsBack('settings-wireless')],
    body: [
      {
        type: 'paragraph',
        text: 'The network that you want to connect to is using either the WPA or WEP privacy method, but your MSN TV is not able to determine which one. Please check your wireless access point setup to find out which method is being used and choose it below:',
      },
      {
        type: 'link',
        label: 'WPA (Wireless Protected Access)',
        targetPage: 'settings-wireless-wpa',
      },
      {
        type: 'link',
        label: 'WEP (Wireless Equivalent Privacy)',
        targetPage: 'settings-wireless-key',
      },
    ],
  },

  'settings-wireless-advanced': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Advanced wireless settings',
    headerTitle: 'Settings',
    headerSubtitle: 'Advanced wireless settings',
    pageTitle: 'Settings Advanced wireless settings',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-wireless' },
      homeSettingsBack('settings-wireless'),
    ],
    body: [
      {
        type: 'paragraph',
        parts: [
          'Enter the settings, then choose ',
          { text: 'Save Changes.', strong: true },
        ],
      },
      { type: 'paragraph', text: 'MAC address: 00:11:22:33:44:55' },
      { type: 'inputRow', label: 'SSID:', defaultValue: '', maxLength: 32 },
      { type: 'paragraph', text: 'Connection state: Disconnected' },
      { type: 'heading', text: 'Privacy:' },
      { type: 'radio', label: 'None', group: 'wifi-priv' },
      { type: 'radio', label: 'WEP', group: 'wifi-priv', checked: true },
      { type: 'radio', label: 'WPA', group: 'wifi-priv' },
      { type: 'inputRow', label: 'WEP key index:', defaultValue: '1', maxLength: 1 },
      { type: 'inputRow', label: 'Key:', defaultValue: '', maxLength: 63 },
      { type: 'checkbox', label: 'Shared key authentication', checked: false },
      { type: 'checkbox', label: 'Ad hoc network', checked: false },
    ],
  },

  'settings-proxy': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    title: 'Settings Proxy server settings',
    headerTitle: 'Settings',
    headerSubtitle: 'Proxy server settings',
    pageTitle: 'Settings Proxy server settings',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-connection' },
      homeSettingsBack('settings-connection'),
    ],
    body: [
      {
        type: 'paragraph',
        text: 'If your MSN TV is part of a network that uses a Web proxy server, you need to provide some information about the proxy server so that you can connect to the MSN TV Service.',
      },
      {
        type: 'paragraph',
        parts: [
          'To use a Web proxy server, check the box labeled ',
          { text: 'Enable Web proxy server', strong: true },
          ', and then type the proxy server settings in the boxes below.',
        ],
      },
      { type: 'checkbox', label: 'Enable Web proxy server', checked: false },
      { type: 'inputRow', label: 'Proxy server address:', defaultValue: '', maxLength: 256 },
      { type: 'inputRow', label: 'Proxy port:', defaultValue: '80', maxLength: 5 },
      { type: 'paragraph', text: 'If you need to use a different proxy server to be able to use MSN Messenger, please choose this link:' },
      {
        type: 'link',
        label: 'Messenger proxy server settings',
        targetPage: 'settings-im-proxy',
      },
    ],
  },

  'settings-im-proxy': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Messenger proxy server settings',
    headerTitle: 'Settings',
    headerSubtitle: 'Messenger proxy server settings',
    pageTitle: 'Settings Messenger proxy server settings',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-proxy' },
      homeSettingsBack('settings-proxy'),
    ],
    body: [
      {
        type: 'paragraph',
        text: 'A Messenger proxy server allows you to use MSN Messenger in a place that restricts instant messaging. It is unlikely that you need this in your home network.',
      },
      {
        type: 'paragraph',
        parts: [
          'To use a Messenger proxy server, select ',
          { text: 'Enable Messenger proxy server', strong: true },
          ', and type your proxy server settings in the boxes below.',
        ],
      },
      { type: 'checkbox', label: 'Enable Messenger proxy server', checked: false },
      { type: 'paragraph', text: 'Proxy type: SOCKS4 / SOCKS5 / HTTP' },
      { type: 'inputRow', label: 'Proxy server address:', defaultValue: '', maxLength: 32 },
      { type: 'inputRow', label: 'Proxy port:', defaultValue: '' },
    ],
  },

  'settings-router': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Configure router',
    headerTitle: 'Settings',
    headerSubtitle: 'Configure router',
    pageTitle: 'Settings Configure router',
    actions: [
      { label: 'Access Router', id: 'save', action: 'save', targetPage: 'settings-connection' },
      homeSettingsBack('settings-connection'),
    ],
    body: [
      {
        type: 'paragraph',
        text: "Chances are you don't need these advanced configuration pages. However, if your Internet Service Provider requires your router to have a \"PPPoE password\", you can set it up here.",
      },
      {
        type: 'paragraph',
        parts: [
          "Enter your router's IP address and choose ",
          { text: 'Access Router', strong: true },
          ". You will be asked the user name and password for the router. The router's documentation will tell you what these are.",
        ],
      },
      { type: 'ipAddress', label: 'IP address:', defaultValue: '192.168.1.1' },
      {
        type: 'paragraph',
        parts: [
          'After you are done making changes, save your settings. Exit the configuration pages by using ',
          { text: 'Back', strong: true },
          ' or ',
          { text: 'Home.', strong: true },
        ],
      },
    ],
  },

  'settings-home-networking': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    title: 'Settings Home network settings',
    headerTitle: 'Settings',
    headerSubtitle: 'Home network',
    pageTitle: 'Settings Home network settings',
    actions: [
      { label: 'Find', id: 'find', action: 'noop' },
      { label: 'Add', id: 'add', action: 'navigate', targetPage: 'settings-home-networking-add' },
      { label: 'Done', id: 'done', action: 'settings-home', targetPage: 'settings-home' },
    ],
    items: [
      {
        title: 'Shared folder settings',
        description: 'View and change settings for how your MSN TV accesses folders from your home computer',
        targetPage: 'settings-home-networking-folders',
      },
      {
        title: 'Media server settings',
        description: 'View and change settings for how your MSN TV accesses media servers, including Windows® Media Connect, on your home network',
        targetPage: 'settings-home-networking-media',
      },
      {
        title: 'Connection settings',
        description: 'View and change settings for how your MSN TV connects to your home network',
        targetPage: 'settings-broadband',
      },
    ],
  },

  'settings-home-networking-folders': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    title: 'Settings Shared folder settings',
    headerTitle: 'Settings',
    headerSubtitle: 'Shared folder settings',
    pageTitle: 'Settings Shared folder settings',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-home-networking' },
      homeSettingsBack('settings-home-networking'),
    ],
    body: [
      {
        type: 'paragraph',
        text: 'Your MSN TV can play music and view photos from shared folders on the computers connected to your home network.',
      },
      { type: 'checkbox', label: 'Allow access to shared folders on my home network', checked: true },
    ],
  },

  'settings-home-networking-media': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    title: 'Settings Media server settings',
    headerTitle: 'Settings',
    headerSubtitle: 'Media server settings',
    pageTitle: 'Settings Media server settings',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-home-networking' },
      homeSettingsBack('settings-home-networking'),
    ],
    body: [
      {
        type: 'paragraph',
        text: 'Your MSN TV can play music and view photos from media servers on your home network, including Windows® Media Connect.',
      },
      { type: 'checkbox', label: 'Allow access to media servers on my home network', checked: true },
    ],
  },

  'settings-home-networking-add': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    title: 'Settings Add a computer',
    headerTitle: 'Settings',
    headerSubtitle: 'Add a computer',
    pageTitle: 'Settings Add a computer',
    actions: [
      { label: 'Add', id: 'save', action: 'save', targetPage: 'settings-home-networking' },
      homeSettingsBack('settings-home-networking'),
    ],
    body: [
      {
        type: 'paragraph',
        parts: [
          'Type the name of the computer that you want to add, then choose ',
          { text: 'Add.', strong: true },
        ],
      },
      { type: 'inputRow', label: 'Name:', defaultValue: '', maxLength: 15 },
    ],
  },

  'settings-auto-update': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    title: 'Settings Set up automatic updates',
    headerTitle: 'Settings',
    headerSubtitle: 'Set up automatic updates',
    pageTitle: 'Settings Set up automatic updates',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-home' },
      homeSettingsBack('settings-home'),
    ],
    body: [
      {
        type: 'paragraph',
        text: "While you're signed out, your Player can check for new e-mail messages and MSN TV updates.",
      },
      { type: 'checkbox', label: 'Check for new mail', checked: false },
      { type: 'checkbox', label: 'Check for and install updates', checked: true },
      { type: 'paragraph', text: 'Check for new mail every: 6 hours' },
      { type: 'paragraph', text: 'Begin checks at around: Midnight' },
      {
        type: 'paragraph',
        text: 'Note: If an update is available, you will not be able to use your Player while the update is being installed.',
      },
    ],
  },

  'settings-tv': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings TV Settings',
    headerTitle: 'Settings',
    headerSubtitle: 'TV Settings',
    pageTitle: 'Settings TV Settings',
    actions: [
      { label: 'Position', id: 'position', action: 'navigate', targetPage: 'settings-tv-center' },
      { label: 'Continue', id: 'continue', action: 'navigate', targetPage: 'settings-tv-contrast' },
      { label: 'Done', id: 'done', action: 'settings-home', targetPage: 'settings-home' },
    ],
    body: [
      {
        type: 'paragraph',
        text: 'Adjusting your TV settings can improve the appearance of Web pages on your TV.',
      },
      {
        type: 'paragraph',
        parts: [
          'Select ',
          { text: 'Position', strong: true },
          " to adjust the horizontal and vertical position of your television's image.",
        ],
      },
      {
        type: 'paragraph',
        parts: [
          'Select ',
          { text: 'Continue', strong: true },
          " for instructions to help you adjust your television's contrast, brightness, and sharpness settings.",
        ],
      },
    ],
  },

  'settings-tv-center': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings Center your TV display',
    headerTitle: 'Settings',
    headerSubtitle: 'Center your TV display',
    pageTitle: 'Settings Center your TV display',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-tv', selectLeft: 'tv-arrow-up' },
      homeSettingsBack('settings-tv'),
    ],
    body: [
      {
        type: 'paragraph',
        text: 'Center the display of MSN TV content by using the arrows to the right. For example, if there is black space on the screen above this page, you may want to choose the up arrow to move the whole display up. You may choose the up arrow as many times as is necessary.',
      },
      { type: 'arrowGrid' },
      {
        type: 'paragraph',
        parts: [
          'Use these controls if your TV image looks off-center. When you are done, choose ',
          { text: 'Save Changes.', strong: true },
        ],
      },
      {
        type: 'paragraph',
        parts: [
          'You can always choose ',
          { text: 'Reset', strong: true },
          ' to return the display to where it was before adjustment.',
        ],
      },
    ],
  },

  'settings-tv-contrast': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings TV contrast',
    headerTitle: 'Settings',
    headerSubtitle: 'TV contrast',
    pageTitle: 'Settings TV contrast',
    actions: [{ label: 'Continue', id: 'continue', action: 'navigate', targetPage: 'settings-tv-brightness' }],
    body: [
      {
        type: 'paragraph',
        parts: [
          'If the edge of the screen seems to bend, try lowering your TV’s ',
          { text: 'contrast', strong: true },
          ' or ',
          { text: 'picture', strong: true },
          ' setting.',
        ],
      },
      {
        type: 'paragraph',
        text: 'Usually begin with contrast and picture at medium setting.',
      },
    ],
  },

  'settings-tv-brightness': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings TV brightness',
    headerTitle: 'Settings',
    headerSubtitle: 'TV brightness',
    pageTitle: 'Settings TV brightness',
    sideImage: 'images/pages/settings/PLUGE.gif',
    sideImagePluge: true,
    actions: [{ label: 'Continue', id: 'continue', action: 'navigate', targetPage: 'settings-tv-sharpness' }],
    body: [
      {
        type: 'paragraph',
        parts: [
          'Adjust the ',
          { text: 'brightness', strong: true },
          ' control all the way up.',
        ],
      },
      {
        type: 'paragraph',
        parts: [
          'Slowly turn down the ',
          { text: 'brightness', strong: true },
          ' until the letter A in the box to the right is barely visible.',
        ],
      },
    ],
  },

  'settings-tv-sharpness': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Settings TV sharpness',
    headerTitle: 'Settings',
    headerSubtitle: 'TV sharpness',
    pageTitle: 'Settings TV sharpness',
    sideImage: 'images/pages/settings/Sharpness.gif',
    actions: [{ label: 'Continue', id: 'continue', action: 'settings-home', targetPage: 'settings-tv' }],
    body: [
      {
        type: 'paragraph',
        parts: [
          'If your TV has a ',
          { text: 'sharpness', strong: true },
          ' or ',
          { text: 'detail', strong: true },
          ' control, start with it at medium setting.',
        ],
      },
      {
        type: 'paragraph',
        parts: [
          'Adjust ',
          { text: 'sharpness', strong: true },
          ' or ',
          { text: 'detail', strong: true },
          ' so that this poem looks clear to you.',
        ],
      },
    ],
  },

  'settings-music-visualization': {
    layout: 'settings',
    theme: 'settings',
    kind: 'home-settings',
    variant: 'full',
    title: 'Media Player Visualization',
    headerTitle: 'Settings',
    headerSubtitle: 'Media Player Visualization',
    pageTitle: 'Media Player Visualization',
    actions: [
      { label: 'Save Changes', id: 'save', action: 'save', targetPage: 'settings-home' },
      homeSettingsBack('settings-home'),
    ],
    body: [
      {
        type: 'paragraph',
        text: 'The Windows Media Player lets you play and control videos and music on MSN TV.',
      },
      {
        type: 'paragraph',
        parts: [
          'When music is playing, you can show a number of different images alongside the Player control bar. Select what you would like to display from the list below, and then choose ',
          { text: 'Save Changes.', strong: true },
          ' (Please note that some radio stations always show album art.)',
        ],
      },
      { type: 'paragraph', text: 'What would you like to see when music plays?' },
      { type: 'radio', label: 'Cover art from albums' },
      { type: 'radio', label: 'Photos in your screensaver' },
      { type: 'radio', label: 'Virtual fireworks', checked: true },
    ],
  },
}
