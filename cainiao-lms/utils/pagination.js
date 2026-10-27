/**
 * Builds a small, URL-friendly page model for list views.
 * The route owns filtering and sorting; this helper owns page slicing and links.
 */
function paginate(items, options) {
  const pageSize = options.pageSize || 10;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const requestedPage = Number(options.page) || 1;
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const start = (page - 1) * pageSize;
  const baseQuery = options.query || {};
  const baseParams = new URLSearchParams();

  Object.entries(baseQuery).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== '') {
      baseParams.set(key, String(value));
    }
  });

  const pagination = Array.from({ length: totalPages }, (_, index) => {
    const number = index + 1;
    const params = new URLSearchParams(baseParams);
    params.set('page', String(number));
    return {
      number,
      active: number === page,
      url: `${options.path}?${params.toString()}`
    };
  });

  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    totalPages,
    pagination
  };
}

module.exports = {
  paginate
};
