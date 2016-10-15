document.getElementById('saveBtn').addEventListener('click', () => {
  let apiKey = document.getElementById('apiKey').value;
  let username = document.getElementById('username').value;
   // Save it using the Chrome extension storage API.
  chrome.storage.sync.set({apiKey, username}, () => {
    window.close();
  });
});

document.getElementById('removeBtn').addEventListener('click', () => {
  chrome.storage.sync.set({apiKey: null, username: null}, () => {
    window.close();
  });
});

chrome.storage.sync.get(null, (storage) => {
  if (storage.username && storage.apiKey) {
    document.getElementById('existingUser').innerHTML = storage.username;
    document.getElementById('reset').removeAttribute('hidden');
  } else {
    document.getElementById('update').removeAttribute('hidden');
  }
});
