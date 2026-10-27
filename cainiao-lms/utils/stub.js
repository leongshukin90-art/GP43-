/**
 * Placeholder handler for pages the team has not built yet.
 *
 * Why this exists: the route PATH and the template NAME are already correct in
 * every stub, so the team only has to fill in behaviour. Until then each
 * unfinished page answers HTTP 501 (Not Implemented) instead of pretending to
 * work, which makes "is it done?" easy to answer.
 *
 * To implement a page: delete the stubPage(...) call for that route and write
 * the real handler. Keep the path and the rendered template name.
 */
function stubPage(options) {
  const { owner, view, title, needs = [], rules = [] } = options;

  return function stubHandler(req, res) {
    res.status(501).render(view, {
      title,
      stub: {
        owner,
        title,
        path: req.originalUrl,
        method: req.method,
        needs,
        rules
      }
    });
  };
}

module.exports = {
  stubPage
};
