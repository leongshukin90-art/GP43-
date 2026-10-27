// Ask for confirmation before destructive-looking POST actions.
// Find forms that explicitly ask for a confirmation before submitting.
document.querySelectorAll('form[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    // Cancel navigation when the user rejects the confirmation dialog.
    if (!window.confirm(form.dataset.confirm)) {
      event.preventDefault(); // Stop the POST from being sent.
    }
  });
});
