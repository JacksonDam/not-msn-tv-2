import { BASE } from '../shared'

function DefaultCenterContent({ page, renderSection }) {
  return (
              <>
                <div className="dock-page-promo">
                  {(page.promo?.image || page.promo?.secondaryImage) && (
                    <div className="dock-page-promo-images">
                      {page.promo?.image && (
                        <img
                          className="dock-page-promo-image dock-page-promo-image-primary"
                          src={`${BASE}images/pages/${page.promo.image}`}
                          alt=""
                        />
                      )}
                      {page.promo?.secondaryImage && (
                        <img
                          className="dock-page-promo-image dock-page-promo-image-secondary"
                          src={`${BASE}images/pages/${page.promo.secondaryImage}`}
                          alt=""
                        />
                      )}
                    </div>
                  )}
                  <div className="dock-page-promo-copy">
                    {page.promo?.eyebrow && <div className="dock-page-promo-eyebrow">{page.promo.eyebrow}</div>}
                    <div className="dock-page-promo-title">{page.promo?.title}</div>
                    <div className="dock-page-promo-body">{page.promo?.body}</div>
                  </div>
                </div>

                {page.highlights?.length > 0 && (
                  <div className="dock-page-highlight-grid">
                    {page.highlights.map((item) => (
                      <div key={item.label} className="dock-page-highlight-card">
                        <div className="dock-page-highlight-label">{item.label}</div>
                        <div className="dock-page-highlight-value">{item.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="dock-page-sections">
                  {page.sections.map((section) => renderSection(section, '', 0))}
                </div>
              </>
  )
}

export default DefaultCenterContent
