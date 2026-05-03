import { useCallback, useEffect, useRef, useState } from 'react'
import PhotosCenter from '../PhotosCenter'
import { BASE, noop } from './shared'

const MAIL_USER_ADDRESS = 'lounge01@msn.com'
const MAIL_SORT_OPTIONS = ['New to Old', 'Old to New', 'From (A-Z)', 'From (Z-A)', 'Subject (A-Z)']
const MAIL_TABS = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'write', label: 'Write e-mail' },
  { id: 'folders', label: 'Folders' },
  { id: 'address', label: 'Address book' },
]
const MAIL_MESSAGES = [
  {
    id: 'm1',
    from: 'Scott Crissman',
    fromAddress: 'scott.crissman@example.com',
    subject: 'Photos from Italy',
    date: '08/16',
    longDate: 'Tue, 16 Aug',
    attachment: true,
    body: [
      'Hey,',
      '',
      'Finally got around to sending these over. The trip was unforgettable - Tuscany was my favorite stop.',
      '',
      'Let me know if any of them look familiar!',
      '',
      '- Scott',
    ].join('\n'),
  },
  {
    id: 'm2',
    from: 'Scott Crissman',
    fromAddress: 'scott.crissman@example.com',
    subject: 'Italy Trip Recommendations',
    date: '08/16',
    longDate: 'Tue, 16 Aug',
    attachment: true,
    body: [
      'Joe,',
      '',
      'Here are the spots I mentioned. The little place in Florence near the river is a must-visit.',
      '',
      'Talk soon,',
      'Scott',
    ].join('\n'),
  },
  {
    id: 'm3',
    from: 'Jennifer',
    fromAddress: 'Jennifer@cohowinery.com',
    subject: 'See you at the reunion!!',
    date: '03/17',
    longDate: 'Thu, 17 Mar',
    attachment: true,
    attachmentLabel: '5 photos',
    body: [
      'Hey Joe,',
      '',
      'We are looking forward to seeing you at the family reunion next month. I am sending along some recent photos.',
      '',
      'Take care,',
      'J',
    ].join('\n'),
  },
  {
    id: 'm4',
    from: 'MSN TV',
    fromAddress: 'welcome@msntv.com',
    subject: 'Welcome to MSN TV 2',
    date: '08/01',
    longDate: 'Mon, 1 Aug',
    attachment: false,
    body: [
      'Welcome!',
      '',
      'This is your new MSN TV 2 mailbox. Use the tabs above to write e-mail, manage folders, or look up addresses.',
      '',
      'Enjoy!',
    ].join('\n'),
  },
]

export default function MailCenterPage({ pageRef, selection, audio, subPageBackRef }) {
  const rootRef = useRef(null)
  const [mailScreen, setMailScreen] = useState('inbox')
  const [mailReadIndex, setMailReadIndex] = useState(0)
  const [mailSelectedIds, setMailSelectedIds] = useState({})
  const [mailSortIndex, setMailSortIndex] = useState(0)
  const [mailSortOpen, setMailSortOpen] = useState(false)
  const [mailWriteSaveCopy, setMailWriteSaveCopy] = useState(true)
  const [mailSendCount, setMailSendCount] = useState(0)
  const [mailInitialReady, setMailInitialReady] = useState(false)
  const [mailComposeAttachmentIds, setMailComposeAttachmentIds] = useState([])
  const [mailPhotoSelectorOpen, setMailPhotoSelectorOpen] = useState(false)
  const mailWriteResetKeyRef = useRef(0)
  const mailFocusTrackRef = useRef({ layout: null, screen: null, sortOpen: null })

  const setRootRef = useCallback((node) => {
    rootRef.current = node
    pageRef(node)
  }, [pageRef])

  useEffect(() => {
    if (!subPageBackRef || mailPhotoSelectorOpen) return undefined
    let handler = null
    if (mailSortOpen) {
      handler = () => {
        setMailSortOpen(false)
        return true
      }
    } else if (mailScreen !== 'inbox') {
      handler = () => {
        setMailScreen('inbox')
        return true
      }
    }

    if (!handler) {
      subPageBackRef.current = null
      return undefined
    }

    subPageBackRef.current = handler
    return () => {
      if (subPageBackRef.current === handler) {
        subPageBackRef.current = null
      }
    }
  }, [subPageBackRef, mailScreen, mailSortOpen, mailPhotoSelectorOpen])

  useEffect(() => {
    if (mailScreen !== 'sent') return undefined
    const timer = window.setTimeout(() => {
      mailWriteResetKeyRef.current += 1
      setMailWriteSaveCopy(true)
      setMailComposeAttachmentIds([])
      setMailScreen('inbox')
    }, 3200)
    return () => window.clearTimeout(timer)
  }, [mailScreen])

  useEffect(() => {
    if (mailScreen === 'write' || mailScreen === 'sent') return
    if (mailComposeAttachmentIds.length > 0) setMailComposeAttachmentIds([])
    if (mailPhotoSelectorOpen) setMailPhotoSelectorOpen(false)
  }, [mailComposeAttachmentIds.length, mailPhotoSelectorOpen, mailScreen])

  useEffect(() => {
    const timer = window.setTimeout(() => setMailInitialReady(true), 500)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!rootRef.current || !selection) return undefined
    if (mailPhotoSelectorOpen) return undefined

    const prev = mailFocusTrackRef.current
    const screenChanged = prev.screen !== mailScreen
    const sortToggled = prev.sortOpen !== mailSortOpen
    const layoutEntered = prev.layout !== 'mailCenter'
    mailFocusTrackRef.current = { layout: 'mailCenter', screen: mailScreen, sortOpen: mailSortOpen }

    const frame = window.requestAnimationFrame(() => {
      selection.initSelectables(rootRef.current)
      if (sortToggled && !screenChanged && !layoutEntered) {
        if (mailSortOpen) {
          selection.goToSpecific(0, 30, 0)
        } else {
          selection.goToSpecific(0, 2, 0)
        }
      } else {
        selection.goToSpecific(0, 1, 0)
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [mailScreen, mailSortOpen, mailInitialReady, mailPhotoSelectorOpen, selection])

    const sortedMessages = (() => {
      const list = MAIL_MESSAGES.map((m, i) => ({ ...m, _i: i }))
      switch (mailSortIndex) {
        case 1:
          return list.slice().reverse()
        case 2:
          return list.slice().sort((a, b) => a.from.localeCompare(b.from))
        case 3:
          return list.slice().sort((a, b) => b.from.localeCompare(a.from))
        case 4:
          return list.slice().sort((a, b) => a.subject.localeCompare(b.subject))
        default:
          return list
      }
    })()

    const headerSubtitle = mailScreen === 'read'
      ? 'Read e-mail'
      : mailScreen === 'write' || mailScreen === 'sent'
        ? 'Write e-mail'
        : mailScreen === 'folders'
          ? 'Folders'
          : mailScreen === 'address'
            ? 'Address book'
            : 'Inbox'
    const activeTabId = mailScreen === 'read' ? 'inbox' : mailScreen === 'sent' ? 'write' : mailScreen
    const currentMessage = MAIL_MESSAGES[mailReadIndex] ?? MAIL_MESSAGES[0]
    const prevMessageIndex = mailReadIndex > 0 ? mailReadIndex - 1 : null
    const nextMessageIndex = mailReadIndex < MAIL_MESSAGES.length - 1 ? mailReadIndex + 1 : null

    const goToTab = (tabId) => {
      setMailSortOpen(false)
      if (tabId === 'inbox') {
        setMailScreen('inbox')
      } else {
        setMailScreen(tabId)
      }
    }

    const openMessage = (index) => {
      setMailReadIndex(index)
      setMailScreen('read')
      setMailSortOpen(false)
    }

    const toggleSelected = (id) => {
      setMailSelectedIds((current) => ({ ...current, [id]: !current[id] }))
    }

    const allSelected = sortedMessages.length > 0 && sortedMessages.every((m) => mailSelectedIds[m.id])
    const toggleSelectAll = () => {
      if (allSelected) {
        setMailSelectedIds({})
      } else {
        const next = {}
        sortedMessages.forEach((m) => { next[m.id] = true })
        setMailSelectedIds(next)
      }
    }

    const tabDownTarget = mailScreen === 'read'
      ? 'mail-content-first'
      : mailScreen === 'write'
        ? 'mail-content-first'
        : mailScreen === 'inbox'
          ? 'mail-sort-button'
          : 'mail-content-first'

    const tabRow = (
      <div className="mail-center-tabs">
        {MAIL_TABS.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            className={`mail-center-tab selectable${activeTabId === tab.id ? ' is-active' : ''}`}
            data-select-x={index}
            data-select-height="1"
            data-select-layer="0"
            data-select-down={tabDownTarget}
            {...(index === 0 ? { 'data-select-id': 'mail-tab-first' } : {})}
            onClick={() => goToTab(tab.id)}
          >
            <span className={`mail-center-tab-icon mail-center-tab-icon-${tab.id}`} aria-hidden="true"></span>
            <span className="mail-center-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    )

    return (
      <div ref={setRootRef} className="dock-page-shell mail-center-shell theme-mail">
        <div className="mail-center-banner">
          <div className="mail-center-header">
            <div className="mail-center-title">
              <span className="mail-center-title-app">Mail</span>
              <span className="mail-center-title-screen">{headerSubtitle}</span>
            </div>
            <div className="mail-center-header-actions">
              <button
                type="button"
                className="mail-center-header-link selectable"
                data-select-x="5"
                data-select-height="0"
                data-select-layer="0"
                data-select-down="mail-tab-first"
                onClick={noop}
              >
                Settings
              </button>
              <button
                type="button"
                className="mail-center-help selectable"
                data-select-x="6"
                data-select-height="0"
                data-select-layer="0"
                data-select-down="mail-tab-first"
                onClick={noop}
              >
                Help
                <img className="mail-center-help-icon" src={`${BASE}images/helpicon.png`} alt="" />
              </button>
            </div>
          </div>

          {tabRow}
        </div>

        {mailScreen === 'read' ? (
          <main className="mail-center-body mail-center-body-read">
            <section className="mail-center-read-pane">
              <dl className="mail-center-read-meta">
                <div><dt>To:</dt><dd>lounge01@msn.com</dd></div>
                <div><dt>From:</dt><dd>{currentMessage.fromAddress}</dd></div>
                <div><dt>Subject:</dt><dd>{currentMessage.subject}</dd></div>
                <div><dt>Date:</dt><dd>{currentMessage.longDate}</dd></div>
                {currentMessage.attachment && (
                  <div>
                    <dt>Attachment:</dt>
                    <dd className="mail-center-read-attachment">
                      <span className="mail-center-attachment-icon" aria-hidden="true"></span>
                      {currentMessage.attachmentLabel ?? '1 attachment'}
                    </dd>
                  </div>
                )}
              </dl>
              <pre className="mail-center-read-body">{currentMessage.body}</pre>
            </section>

            <aside className="mail-center-side mail-center-side-read">
              <div className="mail-center-prevnext">
                <button
                  type="button"
                  className="mail-center-prevnext-button selectable"
                  data-select-id="mail-content-first"
                  data-select-x="0"
                  data-select-height="2"
                  data-select-layer="0"
                  data-select-down="mail-read-reply"
                  disabled={prevMessageIndex === null}
                  onClick={() => prevMessageIndex !== null && setMailReadIndex(prevMessageIndex)}
                >
                  Prev
                </button>
                <span className="mail-center-prevnext-divider" aria-hidden="true">|</span>
                <button
                  type="button"
                  className="mail-center-prevnext-button selectable"
                  data-select-id="mail-read-next"
                  data-select-x="1"
                  data-select-height="2"
                  data-select-layer="0"
                  data-select-down="mail-read-reply"
                  disabled={nextMessageIndex === null}
                  onClick={() => nextMessageIndex !== null && setMailReadIndex(nextMessageIndex)}
                >
                  Next
                </button>
              </div>

              {[
                { label: 'Reply', row: 3, id: 'mail-read-reply' },
                { label: 'Reply All', row: 4 },
                { label: 'Forward', row: 5 },
                { label: 'Delete', row: 6 },
                { label: 'Move to Folder', row: 7 },
                { label: 'Save Address', row: 8 },
              ].map(({ label, row, id }) => (
                <button
                  key={label}
                  type="button"
                  className="mail-center-side-button selectable"
                  data-select-x="0"
                  data-select-height={row}
                  data-select-layer="0"
                  {...(id ? { 'data-select-id': id } : {})}
                  onClick={label === 'Delete' ? () => setMailScreen('inbox') : noop}
                >
                  {label}
                </button>
              ))}
            </aside>
          </main>
        ) : mailScreen === 'inbox' ? (
          <main className="mail-center-body mail-center-body-inbox">
            <section className={`mail-center-list-pane${mailInitialReady ? '' : ' is-loading'}`}>
              <div className="mail-center-username">{MAIL_USER_ADDRESS}</div>

              <div className="mail-center-list-controls">
                <div className="mail-center-sort">
                  <span className="mail-center-sort-label">Sort by:</span>
                  <span className="mail-center-sort-wrap">
                    <button
                      type="button"
                      className="mail-center-sort-button selectable"
                      data-select-id="mail-sort-button"
                      data-select-x="0"
                      data-select-height="2"
                      data-select-layer="0"
                      {...(mailSortOpen ? { 'data-select-down': 'mail-sort-option-0' } : {})}
                      onClick={() => setMailSortOpen((open) => !open)}
                    >
                      <span className="mail-center-sort-label-inner">{MAIL_SORT_OPTIONS[mailSortIndex]}</span>
                      <span className="mail-center-sort-arrow" aria-hidden="true"></span>
                    </button>
                    {mailSortOpen && (
                      <div className="mail-center-sort-menu" role="listbox">
                        {MAIL_SORT_OPTIONS.map((label, i) => (
                          <button
                            key={label}
                            type="button"
                            className={`mail-center-sort-option selectable${i === mailSortIndex ? ' is-active' : ''}`}
                            data-select-id={`mail-sort-option-${i}`}
                            data-select-x="0"
                            data-select-height={30 + i}
                            data-select-layer="0"
                            data-select-left={`mail-sort-option-${i}`}
                            data-select-right={`mail-sort-option-${i}`}
                            data-select-up={i === 0 ? 'mail-sort-button' : `mail-sort-option-${i - 1}`}
                            data-select-down={i === MAIL_SORT_OPTIONS.length - 1 ? `mail-sort-option-${i}` : `mail-sort-option-${i + 1}`}
                            onClick={() => { setMailSortIndex(i); setMailSortOpen(false) }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  className="mail-center-select-all settings-control-feedback selectable"
                  data-select-x="1"
                  data-select-height="2"
                  data-select-layer="0"
                  onClick={toggleSelectAll}
                >
                  <span>Select all</span>
                  <img className="mail-center-checkbox-img" src={`${BASE}images/${allSelected ? 'checked.png' : 'unchecked.png'}`} alt="" />
                </button>
              </div>

              <ul className="mail-center-list">
                {sortedMessages.map((message, index) => {
                  const realIndex = MAIL_MESSAGES.findIndex((m) => m.id === message.id)
                  return (
                    <li key={message.id} className="mail-center-list-row">
                      <button
                        type="button"
                        className="mail-center-list-message selectable"
                        data-select-x="0"
                        data-select-height={3 + index}
                        data-select-layer="0"
                        onClick={() => openMessage(realIndex)}
                      >
                        <span className="mail-center-list-from">{message.from}</span>
                        <span className="mail-center-list-subject">{message.subject}</span>
                      </button>
                      <div className="mail-center-list-meta">
                        <div className="mail-center-list-meta-top">
                          {message.attachment && <span className="mail-center-attachment-icon" aria-hidden="true"></span>}
                          <button
                            type="button"
                            className="mail-center-list-checkbox settings-control-feedback selectable"
                            data-select-x="1"
                            data-select-height={3 + index}
                            data-select-layer="0"
                            onClick={() => toggleSelected(message.id)}
                          >
                            <img src={`${BASE}images/${mailSelectedIds[message.id] ? 'checked.png' : 'unchecked.png'}`} alt="" />
                          </button>
                        </div>
                        <span className="mail-center-list-date">{message.date}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>

            <aside className="mail-center-side mail-center-side-inbox">
              <button
                type="button"
                className="mail-center-side-button selectable"
                data-select-x="2"
                data-select-height="3"
                data-select-layer="0"
                onClick={noop}
              >
                Delete
              </button>
              <button
                type="button"
                className="mail-center-side-button selectable"
                data-select-x="2"
                data-select-height="4"
                data-select-layer="0"
                onClick={noop}
              >
                Report Junk
              </button>
              <button
                type="button"
                className="mail-center-side-button selectable"
                data-select-x="2"
                data-select-height="5"
                data-select-layer="0"
                onClick={noop}
              >
                Move to Folder
              </button>
              <p className="mail-center-tip">
                Tip: To read an e-mail message, choose its name from the list.
              </p>
            </aside>
          </main>
        ) : mailScreen === 'sent' ? (
          <main className="mail-center-body mail-center-body-sent">
            <img
              key={`mail-sent-${mailSendCount}`}
              className="mail-center-sent-anim"
              src={`${BASE}images/pages/mail/MailSent2.gif?v=${mailSendCount}`}
              alt="Sending e-mail"
            />
          </main>
        ) : mailScreen === 'write' ? (
          <main className="mail-center-body mail-center-body-write" key={`mail-write-${mailWriteResetKeyRef.current}`}>
            <section className="mail-center-write-pane">
              <div className="mail-center-write-row">
                <span className="mail-center-write-label-box">To:</span>
                <span className="mail-center-write-field">
                  <input
                    className="mail-center-write-input selectable"
                    type="text"
                    defaultValue=""
                    autoComplete="off"
                    spellCheck={false}
                    data-select-id="mail-content-first"
                    data-select-x="0"
                    data-select-height="2"
                    data-select-layer="0"
                  />
                </span>
              </div>
              <div className="mail-center-write-row">
                <span className="mail-center-write-label-box">Cc:</span>
                <span className="mail-center-write-field">
                  <input
                    className="mail-center-write-input selectable"
                    type="text"
                    defaultValue=""
                    autoComplete="off"
                    spellCheck={false}
                    data-select-x="0"
                    data-select-height="3"
                    data-select-layer="0"
                  />
                </span>
              </div>
              <div className="mail-center-write-row">
                <span className="mail-center-write-label-plain">Subject:</span>
                <span className="mail-center-write-field mail-center-write-field-subject">
                  <input
                    className="mail-center-write-input selectable"
                    type="text"
                    defaultValue=""
                    autoComplete="off"
                    spellCheck={false}
                    data-select-x="0"
                    data-select-height="4"
                    data-select-layer="0"
                  />
                </span>
              </div>
              {mailComposeAttachmentIds.length > 0 && (
                <div className="mail-center-write-row photos-mail-attachments-row">
                  <span className="mail-center-write-label-plain">Attached:</span>
                  <span className="photos-mail-attachments">
                    <span className="mail-center-attachment-icon" aria-hidden="true"></span>
                    {mailComposeAttachmentIds.length} {mailComposeAttachmentIds.length === 1 ? 'attachment' : 'attachments'}
                  </span>
                </div>
              )}
              <textarea
                className="mail-center-write-body selectable"
                placeholder="Type your message here"
                defaultValue=""
                data-select-x="0"
                data-select-height="5"
                data-select-layer="0"
              />
              <button
                type="button"
                className="mail-center-write-savecopy settings-control-feedback selectable"
                data-select-x="0"
                data-select-height="6"
                data-select-layer="0"
                onClick={() => setMailWriteSaveCopy((current) => !current)}
              >
                <img
                  className="mail-center-checkbox-img"
                  src={`${BASE}images/${mailWriteSaveCopy ? 'checked.png' : 'unchecked.png'}`}
                  alt=""
                />
                <span>Save a copy of this e-mail to my Sent messages folder</span>
              </button>
            </section>

            <aside className="mail-center-side mail-center-side-write">
              <button
                type="button"
                className="mail-center-side-button selectable"
                data-select-x="1"
                data-select-height="2"
                data-select-layer="0"
                onClick={() => {
                  audio?.play?.('emailSent')
                  setMailSendCount((c) => c + 1)
                  setMailScreen('sent')
                }}
              >
                Send
              </button>
              <button
                type="button"
                className="mail-center-side-button selectable"
                data-select-x="1"
                data-select-height="3"
                data-select-layer="0"
                onClick={() => setMailPhotoSelectorOpen(true)}
              >
                Insert Photos
              </button>
              <button
                type="button"
                className="mail-center-side-button selectable"
                data-select-x="1"
                data-select-height="4"
                data-select-layer="0"
                onClick={() => {
                  audio?.play?.('emailDraft')
                  mailWriteResetKeyRef.current += 1
                  setMailWriteSaveCopy(true)
                  setMailComposeAttachmentIds([])
                  setMailScreen('inbox')
                }}
              >
                Save as Draft
              </button>
              <button
                type="button"
                className="mail-center-side-button selectable"
                data-select-x="1"
                data-select-height="5"
                data-select-layer="0"
                onClick={() => setMailScreen('inbox')}
              >
                Cancel
              </button>
              <p className="mail-center-tip mail-center-tip-write">
                Tip: To save your work, choose <b>Save as Draft</b>.
              </p>
            </aside>
          </main>
        ) : (
          <main className="mail-center-body mail-center-body-stub">
            <section className="mail-center-stub-pane">
              <h2 className="mail-center-stub-title">{MAIL_TABS.find((t) => t.id === mailScreen)?.label}</h2>
              <p className="mail-center-stub-text">This area isn't available in this preview yet.</p>
              <button
                type="button"
                className="mail-center-side-button selectable"
                data-select-id="mail-content-first"
                data-select-x="0"
                data-select-height="2"
                data-select-layer="0"
                onClick={() => setMailScreen('inbox')}
              >
                Back to Inbox
              </button>
            </section>
          </main>
        )}
        {mailPhotoSelectorOpen && (
          <div className="mail-photo-selector-overlay">
            <PhotosCenter
              selection={selection}
              audio={audio}
              selectionMode
              initialSelectedIds={mailComposeAttachmentIds}
              onSelectionDone={(ids) => {
                setMailComposeAttachmentIds(ids)
                setMailPhotoSelectorOpen(false)
              }}
              onSelectionCancel={() => setMailPhotoSelectorOpen(false)}
              subPageBackRef={subPageBackRef}
            />
          </div>
        )}
      </div>
    )
}
