import { BASE, normalizeItem, SelectableRow, UsingMainModuleIcon } from '../shared'

function UsingMainContent({ page, nextRow, handleModuleNavigate }) {
  return (
              <div className="dock-page-using-main">
                {page.modules.map((module, index) => {
                  const titleRow = nextRow()
                  const linkRow = nextRow()

                  return (
                    <section key={module.title} className="dock-page-using-main-module">
                      <div className="dock-page-using-main-summary">
                        <div className="dock-page-using-main-icon-wrap">
                          <UsingMainModuleIcon icon={module.icon} />
                        </div>
                        <div className="dock-page-using-main-copy">
                          <button
                            type="button"
                            className="dock-page-using-main-title selectable"
                            data-select-x="0"
                            data-select-height={titleRow}
                            data-select-layer="0"
                            onClick={() => handleModuleNavigate(module.targetPage)}
                          >
                            {module.title}
                          </button>
                          <div className="dock-page-using-main-description">{module.description}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="dock-page-using-main-link selectable"
                        data-select-x="0"
                        data-select-height={linkRow}
                        data-select-layer="0"
                        onClick={() => handleModuleNavigate(module.targetPage)}
                      >
                        <span className="dock-page-using-main-link-bullet" aria-hidden="true">
                          •
                        </span>
                        <span className="dock-page-using-main-link-text">{module.linkText}</span>
                      </button>

                      {index < page.modules.length - 1 && <div className="dock-page-divider"></div>}
                    </section>
                  )
                })}
              </div>
  )
}

function UsingNewsletterContent({ page, nextRow, handleModuleNavigate }) {
  return (
              <div className="dock-page-using-newsletter">
                <div className="dock-page-content-title">{page.contentTitle}</div>

                <div className="dock-page-using-newsletter-feature">
                  <div className="dock-page-using-newsletter-media">
                    <img
                      className="dock-page-using-newsletter-image"
                      src={`${BASE}images/pages/${page.feature.image}`}
                      alt=""
                    />
                  </div>

                  <button
                    type="button"
                    className="dock-page-using-newsletter-feature-copy selectable"
                    data-select-x="0"
                    data-select-height={nextRow()}
                    data-select-layer="0"
                    onClick={() => handleModuleNavigate(page.feature.targetPage)}
                  >
                    <div className="dock-page-using-newsletter-feature-title">{page.feature.title}</div>
                    <div className="dock-page-using-newsletter-feature-description">{page.feature.description}</div>
                  </button>
                </div>

                <div className="dock-page-using-newsletter-links">
                  {page.links.map((item) => (
                    <SelectableRow
                      key={normalizeItem(item).label}
                      row={nextRow()}
                      x={0}
                      className="dock-page-using-newsletter-link"
                      onClick={() => handleModuleNavigate(normalizeItem(item).targetPage)}
                    >
                      <span className="dock-page-using-newsletter-link-bullet" aria-hidden="true">
                        •
                      </span>
                      <span className="dock-page-row-label">{normalizeItem(item).label}</span>
                    </SelectableRow>
                  ))}
                </div>
              </div>
  )
}

function UsingTipDetailContent({ page, nextRow, onClose, handleModuleNavigate }) {
  return (
              <div className="dock-page-using-tip">
                <div className="dock-page-content-title dock-page-using-tip-title">{page.contentTitle}</div>

                {page.byline && <div className="dock-page-using-tip-byline">{page.byline}</div>}

                {(() => {
                  let inlineLinkIndex = 0
                  const tipBodyHtml = page.tipBodyHtml.replace(
                    /<span class="dock-page-tip-inline-link">([\s\S]*?)<\/span>/g,
                    (_, linkLabel) => {
                      const inlineLinkId = `tip-inline-link-${inlineLinkIndex}`
                      inlineLinkIndex += 1
                      return `<span class="dock-page-tip-inline-link selectable" data-select-id="${inlineLinkId}" data-select-x="0" data-select-height="${nextRow()}" data-select-layer="0">${linkLabel}</span>`
                    },
                  )

                  return (
                    <div
                      className="dock-page-using-tip-body"
                      dangerouslySetInnerHTML={{ __html: tipBodyHtml }}
                    />
                  )
                })()}

                {(() => {
                  const actionRow = nextRow()
                  const actions = page.actions ?? [
                    { label: 'Other Tips', targetPage: 'tips', selectId: 'tip-detail-other' },
                    { label: 'Done', close: true, selectId: 'tip-detail-done' },
                  ]

                  return (
                    <div className="dock-page-using-tip-actions">
                      {actions.map((action, index) => (
                        <SelectableRow
                          key={action.label}
                          row={actionRow}
                          x={index}
                          className="dock-page-using-tip-action base-btn"
                          {...(action.selectId ? { 'data-select-id': action.selectId } : {})}
                          onClick={action.close ? onClose : () => handleModuleNavigate(action.targetPage)}
                        >
                          <span className="dock-page-row-label">{action.label}</span>
                        </SelectableRow>
                      ))}
                    </div>
                  )
                })()}
              </div>
  )
}

export default function UsingContent(props) {
  const { page } = props

  if (page.variant === 'usingMain') {
    return UsingMainContent(props)
  }

  if (page.variant === 'usingNewsletter') {
    return UsingNewsletterContent(props)
  }

  if (page.variant === 'usingTipDetail') {
    return UsingTipDetailContent(props)
  }

  return null
}
