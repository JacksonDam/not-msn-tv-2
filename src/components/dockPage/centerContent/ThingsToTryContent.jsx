function ThingsToTryContent({ page, nextRow, handleCategoryClick, renderSection }) {
  return (
              <>
                <div className="dock-page-content-title">{page.contentTitle}</div>
                {(() => {
                  const categoryRows = Array.from(
                    { length: Math.max(...page.categoryColumns.map((column) => column.length)) },
                    () => nextRow(),
                  )

                  return (
                    <div className="dock-page-category-box">
                      {page.categoryColumns.map((column, columnIndex) => (
                        <div key={`category-column-${columnIndex}`} className="dock-page-category-column">
                          {column.map((category, rowIndex) => (
                            <button
                              key={category}
                              type="button"
                              className="dock-page-category-link selectable"
                              data-select-x={columnIndex}
                              data-select-height={categoryRows[rowIndex]}
                              data-select-layer="0"
                              onClick={() => handleCategoryClick(category)}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )
                })()}

                <div className="dock-page-things-columns">
                  {page.columns.map((column, columnIndex) => (
                    <div key={`things-column-${columnIndex}`} className="dock-page-things-column">
                      {column.map((section) => renderSection(section, `things-${columnIndex}-`, columnIndex))}
                    </div>
                  ))}
                </div>
              </>
  )
}

export default ThingsToTryContent
