import { BASE, noop, SelectableRow } from '../shared'
import { createEmptyMoneyQuote } from '../../../utils/moneyQuoteService'
import { getMoneyWatchlistMeta } from '../../../utils/moneyWatchlist'

function MoneyCenterContent({ page, moneyLookupInputRef, nextRow, handleMoneyQuoteNavigate }) {
  return (
              <div className="dock-page-money">
                <div className="dock-page-content-title dock-page-money-title">{page.contentTitle}</div>
                <div className="dock-page-money-message">{page.message}</div>

                <div className="dock-page-divider"></div>

                <div className="dock-page-content-title dock-page-money-title">{page.lookupTitle}</div>
                {(() => {
                  const lookupRow = nextRow()

                  return (
                    <div className="dock-page-money-lookup-row">
                      <div className="dock-page-money-prompt">{page.lookupPrompt}</div>
                      <input
                        ref={moneyLookupInputRef}
                        className="dock-page-money-input search-input-stub selectable"
                        type="text"
                        aria-label="Stock symbol"
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={10}
                        data-select-x="0"
                        data-select-height={lookupRow}
                        data-select-layer="0"
                      />
                      <button
                        type="button"
                        className="dock-page-money-submit selectable"
                        data-select-x="0"
                        data-select-height={lookupRow}
                        data-select-layer="0"
                        onClick={() => handleMoneyQuoteNavigate(moneyLookupInputRef.current?.value)}
                      >
                        {page.lookupButtonLabel}
                      </button>
                    </div>
                  )
                })()}
              </div>
  )
}

function MoneyBusinessNewsContent({ page, moneyBusinessNews, nextRow }) {
  return (
              <div className="dock-page-money-business-news">
                <div className="dock-page-content-title dock-page-money-business-news-title">{page.contentTitle}</div>
                <div className="dock-page-money-business-news-list">
                  {(moneyBusinessNews.length ? moneyBusinessNews : [{ title: 'Business news is temporarily unavailable', source: 'MSNBC' }]).slice(0, 10).map((item, index) => {
                    const title = String(item.title ?? '').trim()
                    const source = String(item.source ?? '').trim()
                    const label = source && !title.endsWith(`- ${source}`) ? `${title} - ${source}` : title

                    return (
                      <SelectableRow
                        key={`${index}-${label}`}
                        row={nextRow()}
                        x={0}
                        className="dock-page-money-business-news-row"
                        data-select-id={`money-business-news-${index}`}
                      >
                        <span className="dock-page-classic-bullet"></span>
                        <span className="dock-page-row-label">{label}</span>
                      </SelectableRow>
                    )
                  })}
                </div>
              </div>
  )
}

function MoneyExpertsContent({ page, nextRow }) {
  return (
              <div className="dock-page-money-experts">
                <div className="dock-page-content-title dock-page-money-experts-title">{page.contentTitle}</div>
                <div className="dock-page-money-experts-list">
                  {page.experts.map((expert, index) => (
                    <div key={`${expert.name}-${expert.headline}`} className="dock-page-money-experts-item-wrap">
                      {index > 0 && <div className="dock-page-divider"></div>}
                      <div className={`dock-page-money-experts-item ${expert.image ? 'has-image' : 'no-image'}`}>
                        {expert.image && (
                          <div className="dock-page-money-experts-image-wrap">
                            <img
                              className="dock-page-money-experts-image"
                              src={`${BASE}images/pages/${expert.image}`}
                              alt=""
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          className="dock-page-money-experts-copy selectable"
                          data-select-x="0"
                          data-select-height={nextRow()}
                          data-select-layer="0"
                          data-select-id={`money-expert-${index}`}
                          onClick={noop}
                        >
                          <span className="dock-page-money-experts-name">{expert.name}</span>
                          <span className="dock-page-money-experts-headline">{expert.headline}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
  )
}

function MoneyStocksContent({ page, moneyWatchlistSymbols, moneyWatchlistQuotes, nextRow, handleMoneyQuoteNavigate, handleModuleNavigate }) {
  return (
              (() => {
                const formatNumber = (value) => (
                  typeof value === 'number'
                    ? value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : '0.00'
                )

                const formatSigned = (value, suffix = '') => {
                  if (typeof value !== 'number') return `0.00${suffix}`
                  const absolute = Math.abs(value).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
                  return `${sign}${absolute}${suffix}`
                }

                const stockRows = moneyWatchlistSymbols.map((symbol, index) => {
                  const quote = moneyWatchlistQuotes[symbol] ?? createEmptyMoneyQuote(symbol)
                  const meta = getMoneyWatchlistMeta(symbol, quote)
                  const row = nextRow()

                  return {
                    symbol,
                    index,
                    quote,
                    meta,
                    row,
                  }
                })
                const actionRow = nextRow()

                return (
                  <div className="dock-page-money-stocks">
                    <div className="dock-page-content-title dock-page-money-stocks-title">{page.contentTitle}</div>

                    <div className="dock-page-money-stocks-table">
                      <div className="dock-page-money-stocks-header">
                        <div className="dock-page-money-stocks-header-cell dock-page-money-stocks-header-name">Name</div>
                        <div className="dock-page-money-stocks-header-cell">Last</div>
                        <div className="dock-page-money-stocks-header-cell">Change</div>
                        <div className="dock-page-money-stocks-header-cell">%Chg</div>
                      </div>

                      {stockRows.map(({ symbol, index, quote, meta, row }) => (
                        <div key={symbol}>
                          <div className="dock-page-money-stocks-row">
                            <SelectableRow
                              row={row}
                              x={0}
                              className="dock-page-money-stocks-name-button"
                              data-select-id={`money-stocks-row-${index}`}
                              onClick={() => handleMoneyQuoteNavigate(meta.quotePageSymbol)}
                            >
                              <span className="dock-page-row-label">{meta.shortLabel}</span>
                            </SelectableRow>
                            <div className="dock-page-money-stocks-value">{formatNumber(quote.price)}</div>
                            <div className={`dock-page-money-stocks-value ${quote.change >= 0 ? 'positive' : 'negative'}`}>{formatSigned(quote.change)}</div>
                            <div className={`dock-page-money-stocks-value ${quote.changePercent >= 0 ? 'positive' : 'negative'}`}>{formatSigned(quote.changePercent, '%')}</div>
                          </div>
                          <div className="dock-page-divider"></div>
                        </div>
                      ))}
                    </div>

                    <div className="dock-page-money-stocks-note">
                      Quotes supplied by MSN Money
                      <br />
                      and are delayed at least 20 minutes.
                    </div>

                    <div className="dock-page-money-stocks-actions">
                      <SelectableRow
                        row={actionRow}
                        x={0}
                        className="dock-page-money-stocks-action dock-page-money-stocks-action-add"
                        data-select-id="money-stocks-add"
                        onClick={() => handleModuleNavigate(page.addPageId)}
                      >
                        <span className="dock-page-row-label">Add Stock</span>
                      </SelectableRow>
                      <SelectableRow
                        row={actionRow}
                        x={1}
                        className="dock-page-money-stocks-action dock-page-money-stocks-action-remove"
                        data-select-id="money-stocks-remove"
                        onClick={() => handleModuleNavigate(page.removePageId)}
                      >
                        <span className="dock-page-row-label">Remove Stocks</span>
                      </SelectableRow>
                    </div>
                  </div>
                )
              })()
  )
}

function MoneyStocksAddContent({ page, moneyWatchlistInputRef, nextRow, handleModuleNavigate, handleMoneyWatchlistAdd }) {
  return (
              (() => {
                const inputRow = nextRow()
                const actionRow = nextRow()

                return (
                  <div className="dock-page-money-stocks dock-page-money-stocks-form">
                    <div className="dock-page-content-title dock-page-money-stocks-title">{page.contentTitle}</div>
                    <div className="dock-page-money-stocks-instruction">{page.instruction}</div>

                    <input
                      ref={moneyWatchlistInputRef}
                      className="dock-page-money-stocks-input search-input-stub selectable"
                      type="text"
                      aria-label="Add stock"
                      autoComplete="off"
                      spellCheck={false}
                      data-select-x="0"
                      data-select-height={inputRow}
                      data-select-layer="0"
                      data-select-id="money-stocks-add-input"
                    />

                    <div className="dock-page-money-stocks-actions dock-page-money-stocks-form-actions">
                      <SelectableRow
                        row={actionRow}
                        x={0}
                        className="dock-page-money-stocks-action dock-page-money-stocks-action-cancel"
                        data-select-id="money-stocks-add-cancel"
                        onClick={() => handleModuleNavigate(page.cancelPageId)}
                      >
                        <span className="dock-page-row-label">Cancel</span>
                      </SelectableRow>
                      <SelectableRow
                        row={actionRow}
                        x={1}
                        className="dock-page-money-stocks-action dock-page-money-stocks-action-add"
                        data-select-id="money-stocks-add-confirm"
                        onClick={handleMoneyWatchlistAdd}
                      >
                        <span className="dock-page-row-label">Add Stock</span>
                      </SelectableRow>
                    </div>
                  </div>
                )
              })()
  )
}

function MoneyStocksRemoveContent({ page, moneyWatchlistSymbols, moneyWatchlistQuotes, moneyWatchlistSelection, nextRow, toggleMoneyWatchlistSelection, handleModuleNavigate, handleMoneyWatchlistRemove }) {
  return (
              (() => {
                const removeRows = moneyWatchlistSymbols.map((symbol, index) => {
                  const quote = moneyWatchlistQuotes[symbol] ?? createEmptyMoneyQuote(symbol)
                  const meta = getMoneyWatchlistMeta(symbol, quote)
                  const checked = Boolean(moneyWatchlistSelection[symbol])
                  const row = nextRow()

                  return {
                    symbol,
                    index,
                    meta,
                    checked,
                    row,
                  }
                })
                const actionRow = nextRow()

                return (
                  <div className="dock-page-money-stocks dock-page-money-stocks-remove">
                    <div className="dock-page-content-title dock-page-money-stocks-title">{page.contentTitle}</div>
                    <div className="dock-page-money-stocks-instruction">
                      To delete stocks, check the box next to the name of the company, then choose <b>Remove</b>.
                    </div>

                    <div className="dock-page-money-stocks-remove-list">
                      <div className="dock-page-divider"></div>
                      {removeRows.map(({ symbol, index, meta, checked, row }) => (
                        <div key={symbol}>
                          <div className={`dock-page-money-stocks-remove-row ${checked ? 'checked' : ''}`}>
                            <SelectableRow
                              row={row}
                              x={0}
                              className="dock-page-money-stocks-remove-check custom-checkbox"
                              data-select-id={`money-stocks-remove-row-${index}`}
                              onClick={() => toggleMoneyWatchlistSelection(symbol)}
                            >
                              <img
                                className="dock-page-money-stocks-checkbox-image"
                                src={checked ? `${BASE}images/checked.png` : `${BASE}images/unchecked.png`}
                                alt=""
                              />
                            </SelectableRow>
                            <div className="dock-page-money-stocks-remove-short">{meta.shortLabel}</div>
                            <div className="dock-page-money-stocks-remove-full">{meta.fullLabel}</div>
                          </div>
                          {index < moneyWatchlistSymbols.length - 1 && <div className="dock-page-divider"></div>}
                        </div>
                      ))}
                      <div className="dock-page-divider"></div>
                    </div>

                    <div className="dock-page-money-stocks-actions dock-page-money-stocks-remove-actions">
                      <SelectableRow
                        row={actionRow}
                        x={0}
                        className="dock-page-money-stocks-action dock-page-money-stocks-action-cancel"
                        data-select-id="money-stocks-remove-cancel"
                        onClick={() => handleModuleNavigate(page.cancelPageId)}
                      >
                        <span className="dock-page-row-label">Cancel</span>
                      </SelectableRow>
                      <SelectableRow
                        row={actionRow}
                        x={1}
                        className="dock-page-money-stocks-action dock-page-money-stocks-action-confirm"
                        data-select-id="money-stocks-remove-confirm"
                        onClick={handleMoneyWatchlistRemove}
                      >
                        <span className="dock-page-row-label">Remove</span>
                      </SelectableRow>
                    </div>
                  </div>
                )
              })()
  )
}

export default function MoneyContent(props) {
  const { page } = props

  if (page.variant === 'moneyCenter') {
    return MoneyCenterContent(props)
  }

  if (page.variant === 'moneyBusinessNews') {
    return MoneyBusinessNewsContent(props)
  }

  if (page.variant === 'moneyExperts') {
    return MoneyExpertsContent(props)
  }

  if (page.variant === 'moneyStocks') {
    return MoneyStocksContent(props)
  }

  if (page.variant === 'moneyStocksAdd') {
    return MoneyStocksAddContent(props)
  }

  if (page.variant === 'moneyStocksRemove') {
    return MoneyStocksRemoveContent(props)
  }

  return null
}
